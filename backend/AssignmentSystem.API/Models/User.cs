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
        [MaxLength(20)]
        public string Role { get; set; } = "Student";

        // Student-এর জন্য নির্ধারিত ক্লাস বা কোর্স (যেমন: "CLASS 8")
        [MaxLength(100)]
        public string? CourseName { get; set; }

        // Teacher-এর জন্য নির্ধারিত সাবজেক্ট (যেমন: "Mathematics")
        [MaxLength(100)]
        public string? SubjectName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}