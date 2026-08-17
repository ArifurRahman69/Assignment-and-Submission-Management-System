using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.DTOs
{
    public class CreateUserDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Student"; // "Admin", "Teacher", "Student"

        public string? CourseName { get; set; }
        public string? SubjectName { get; set; }
    }
}