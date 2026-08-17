using AssignmentSystem.API.Data;
using AssignmentSystem.API.DTOs;
using AssignmentSystem.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // USER MANAGEMENT ENDPOINTS
        // ==========================================

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.CourseName,
                    u.SubjectName,
                    u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        // POST: api/admin/users
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Email duplicate check
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email already exists!" });
            }

            // Simple Hash (Production-এ BCrypt.Net ব্যবহার করবেন)
            string hashedPassword = Convert.ToBase64String(
                System.Security.Cryptography.SHA256.HashData(
                    System.Text.Encoding.UTF8.GetBytes(dto.Password)
                )
            );

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                Role = dto.Role,
                CourseName = dto.CourseName,
                SubjectName = dto.Role == "Teacher" ? dto.SubjectName : null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User created successfully", userId = user.Id });
        }

        // DELETE: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }

        // ==========================================
        // COURSE & SUBJECT MANAGEMENT ENDPOINTS
        // ==========================================

        // GET: api/admin/courses
        [HttpGet("courses")]
        public async Task<IActionResult> GetCourses()
        {
            var courses = await _context.CourseSubjects
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(courses);
        }

        // POST: api/admin/courses
        [HttpPost("courses")]
        public async Task<IActionResult> CreateCourse([FromBody] CourseSubject course)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            course.CourseName = course.CourseName.ToUpper();
            _context.CourseSubjects.Add(course);
            await _context.SaveChangesAsync();

            return Ok(course);
        }

        // DELETE: api/admin/courses/{id}
        [HttpDelete("courses/{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.CourseSubjects.FindAsync(id);
            if (course == null) return NotFound(new { message = "Course record not found" });

            _context.CourseSubjects.Remove(course);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Course record deleted successfully" });
        }
    }
}