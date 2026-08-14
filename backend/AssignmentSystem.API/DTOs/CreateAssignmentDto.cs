using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.DTOs
{
    public class CreateAssignmentDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime DueDate { get; set; }
    }
}