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

            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment == null) return NotFound(new { message = "Assignment not found." });

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
                return BadRequest(new { message = "You have already submitted this assignment." });
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

            return Ok(new { message = $"Assignment submitted successfully ({submissionStatus}).", submission });
        }

        // 2. Teacher/Admin: নির্দিষ্ট Assignment-এর সব Submissions দেখার API
        [HttpGet("assignment/{assignmentId}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetSubmissionsByAssignment(int assignmentId)
        {
            var submissions = await _context.Submissions
                .Where(s => s.AssignmentId == assignmentId)
                .Include(s => s.Student)
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

        // 3. Student: নিজের জমা দেওয়া Submissions দেখার API
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

        // 4. Teacher/Admin: Student-কে Marks & Feedback দেওয়ার (Grading) API
        [HttpPut("{submissionId}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeSubmission(int submissionId, [FromBody] GradeSubmissionDto dto)
        {
            var submission = await _context.Submissions.FindAsync(submissionId);
            if (submission == null) return NotFound(new { message = "Submission not found." });

            submission.Marks = dto.Marks;
            submission.Feedback = dto.Feedback;
            submission.Status = "Graded";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Submission graded successfully.", submission });
        }
    }
}