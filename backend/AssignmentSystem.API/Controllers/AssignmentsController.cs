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
    [Authorize] // সব এন্ডপয়েন্টের জন্য JWT Token বাধ্যতামূলক
    public class AssignmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssignmentsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Assignments (সবাই দেখতে পাবে)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssignmentResponseDto>>> GetAssignments()
        {
            var assignments = await _context.Assignments
                .Include(a => a.CreatedBy)
                .Select(a => new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    CourseName = a.CourseName,
                    MaxMarks = a.MaxMarks, // MaxMarks ম্যাপ করা হলো
                    DueDate = a.DueDate,
                    CreatedAt = a.CreatedAt,
                    CreatedById = a.CreatedById,
                    CreatedByName = a.CreatedBy != null ? a.CreatedBy.Username : "Unknown"
                })
                .ToListAsync();

            return Ok(assignments);
        }

        // GET: api/Assignments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AssignmentResponseDto>> GetAssignment(int id)
        {
            var assignment = await _context.Assignments
                .Include(a => a.CreatedBy)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found." });
            }

            return Ok(new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                CourseName = assignment.CourseName,
                MaxMarks = assignment.MaxMarks, // MaxMarks অন্তর্ভুক্ত করা হলো
                DueDate = assignment.DueDate,
                CreatedAt = assignment.CreatedAt,
                CreatedById = assignment.CreatedById,
                CreatedByName = assignment.CreatedBy != null ? assignment.CreatedBy.Username : "Unknown"
            });
        }

        // POST: api/Assignments (শুধু Teacher/Admin তৈরি করতে পারবে)
        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<AssignmentResponseDto>> CreateAssignment(CreateAssignmentDto dto)
        {
            // Past Date Validation Check
            if (dto.DueDate < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Due date cannot be in the past." });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdClaim);

            var assignment = new Assignment
            {
                Title = dto.Title,
                Description = dto.Description,
                CourseName = dto.CourseName,
                MaxMarks = dto.MaxMarks, // MaxMarks সেভ করা হচ্ছে
                DueDate = DateTime.SpecifyKind(dto.DueDate, DateTimeKind.Utc),
                CreatedById = userId
            };

            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAssignment), new { id = assignment.Id }, assignment);
        }

        // PUT: api/Assignments/5 (Teacher/Admin অ্যাসাইনমেন্ট এডিট করতে পারবে)
        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> UpdateAssignment(int id, UpdateAssignmentDto dto)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found." });
            }

            assignment.Title = dto.Title;
            assignment.Description = dto.Description;
            assignment.CourseName = dto.CourseName;
            assignment.MaxMarks = dto.MaxMarks;
            assignment.DueDate = DateTime.SpecifyKind(dto.DueDate, DateTimeKind.Utc);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Assignment updated successfully." });
        }

        // DELETE: api/Assignments/5 (শুধু Teacher/Admin ডিলিট করতে পারবে)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> DeleteAssignment(int id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found." });
            }

            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Assignment deleted successfully." });
        }
    }
}