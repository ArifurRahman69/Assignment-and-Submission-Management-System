using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.Models
{
    public class CourseSubject
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string CourseName { get; set; } = string.Empty; // e.g., "CLASS 8"

        [Required]
        [MaxLength(100)]
        public string SubjectName { get; set; } = string.Empty; // e.g., "Mathematics"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}