using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        // "Teacher" or "Student"
        public string Role { get; set; } = "Student";
        public string? CourseName { get; set; }
    }
}