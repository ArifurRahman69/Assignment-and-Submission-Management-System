using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        // Role: "Admin", "Teacher", or "Student"
        [Required]
        public string Role { get; set; } = "Student";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}