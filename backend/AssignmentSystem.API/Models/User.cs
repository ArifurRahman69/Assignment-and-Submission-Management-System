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
        [PasswordHash]
        public string PasswordHash { get; set; } = string.Empty;

        // Role: "Admin", "Teacher", or "Student"
        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "Student";

        // Student/User-এর নির্ধারিত কোর্স বা ক্লাস (যেমন: "CLASS 8", "CSE101")
        // Teacher/Admin-দের ক্ষেত্রে এটি null হতে পারে
        [MaxLength(100)]
        public string? CourseName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}