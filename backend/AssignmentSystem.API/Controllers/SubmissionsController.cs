using AssignmentSystem.API.Data;
using AssignmentSystem.API.DTOs;
using AssignmentSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AssignmentSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SubmissionsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Student: Assignment Submit করার API
        [HttpPost("assignment/{assignmentId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitAssignment(int assignmentId, [FromBody] CreateSubmissionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            int studentId = int.Parse(userIdClaim);

            // স্টুডেন্টের তথ্য নিয়ে আসা
            var student = await _context.Users.FindAsync(studentId);
            if (student == null) return Unauthorized();

            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) return NotFound(new { message = "Assignment not found." });

            // 🔒 COURSE RESTRICTION CHECK (অন্য ক্লাসের অ্যাসাইনমেন্ট ব্লক করা)
            if (!string.IsNullOrEmpty(assignment.CourseName) &&
                !string.Equals(student.CourseName, assignment.CourseName, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = $"You are not enrolled in '{assignment.CourseName}'. Submission not allowed." });
            }

            var now = DateTime.UtcNow;
            var gracePeriodEnd = assignment.DueDate.AddHours(3); // ৩ ঘণ্টার Grace Period

            // ৩ ঘণ্টা পার হয়ে গেলে পুরোপুরি ব্লক
            if (now > gracePeriodEnd)
            {
                return BadRequest(new { message = "Submission deadline (including 3-hour grace period) has passed." });
            }

            // আগে ইতোমধ্যে সাবমিট করেছে কিনা চেক করা
            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);

            if (existingSubmission != null)
            {
                return BadRequest(new { message = "You have already submitted this assignment. Use the update option if you wish to edit." });
            }

            string submissionStatus = (now <= assignment.DueDate) ? "On-Time" : "Late Submitted";

            var submission = new Submission
            {
                AssignmentId = assignmentId,
                StudentId = studentId,
                Content = dto.Content,
                SubmittedAt = now,
                Status = submissionStatus
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Assignment submitted successfully ({submissionStatus}).", submissionId = submission.Id });
        }

        // 2. Student: জমানো উত্তর আপডেট/Resubmit করার API (ডেডলাইনের আগে)
        [HttpPut("{id}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> UpdateSubmission(int id, [FromBody] UpdateSubmissionDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            int studentId = int.Parse(userIdClaim);

            var student = await _context.Users.FindAsync(studentId);
            if (student == null) return Unauthorized();

            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .FirstOrDefaultAsync(s => s.Id == id && s.StudentId == studentId);

            if (submission == null)
            {
                return NotFound(new { message = "Submission not found or unauthorized." });
            }

            // 🔒 COURSE RESTRICTION CHECK
            if (!string.IsNullOrEmpty(submission.Assignment.CourseName) &&
                !string.Equals(student.CourseName, submission.Assignment.CourseName, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = $"You are not enrolled in '{submission.Assignment.CourseName}'." });
            }

            // Security Check: Graded হয়ে গেলে আর আপডেট করা যাবে না
            if (submission.Status == "Graded")
            {
                return BadRequest(new { message = "This submission has already been graded and cannot be modified." });
            }

            var now = DateTime.UtcNow;
            var gracePeriodEnd = submission.Assignment.DueDate.AddHours(3);

            if (now > gracePeriodEnd)
            {
                return BadRequest(new { message = "Submission deadline has passed. You cannot edit your submission now." });
            }

            submission.Content = dto.Content;
            submission.SubmittedAt = now;
            submission.Status = (now <= submission.Assignment.DueDate) ? "On-Time" : "Late Submitted";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Submission updated successfully." });
        }

        // 3. Teacher/Admin: নির্দিষ্ট Assignment-এর সব Submissions দেখার API
        [HttpGet("assignment/{assignmentId}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetSubmissionsByAssignment(int assignmentId)
        {
            var submissions = await _context.Submissions
                .Where(s => s.AssignmentId == assignmentId)
                .Select(s => new
                {
                    s.Id,
                    s.AssignmentId,
                    s.StudentId,
                    StudentName = s.Student != null ? s.Student.Username : "Unknown",
                    s.Content,
                    s.SubmittedAt,
                    s.Status,
                    s.Marks,
                    s.Feedback
                })
                .ToListAsync();

            return Ok(submissions);
        }

        // 4. Student: নিজের জমা দেওয়া Submissions দেখার API
        [HttpGet("my-submissions")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMySubmissions()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            int studentId = int.Parse(userIdClaim);

            var submissions = await _context.Submissions
                .Where(s => s.StudentId == studentId)
                .Select(s => new
                {
                    s.Id,
                    s.AssignmentId,
                    s.Content,
                    s.SubmittedAt,
                    s.Status,
                    s.Marks,
                    s.Feedback
                })
                .ToListAsync();

            return Ok(submissions);
        }

        // 5. Teacher/Admin: Student-কে Marks & Feedback দেওয়ার (Grading) API
        [HttpPut("{submissionId}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeSubmission(int submissionId, [FromBody] GradeSubmissionDto dto)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .FirstOrDefaultAsync(s => s.Id == submissionId);

            if (submission == null) return NotFound(new { message = "Submission not found." });

            // MaxMarks Validation Check
            if (submission.Assignment != null && dto.Marks > submission.Assignment.MaxMarks)
            {
                return BadRequest(new { message = $"Marks cannot exceed maximum marks ({submission.Assignment.MaxMarks})." });
            }

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback;
            submission.Status = "Graded";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Submission graded successfully." });
        }
    }
}