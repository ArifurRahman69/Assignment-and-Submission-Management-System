using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.DTOs
{
    public class UpdateAssignmentDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string CourseName { get; set; } = string.Empty;

        [Range(1, 1000, ErrorMessage = "Max marks must be between 1 and 1000.")]
        public decimal MaxMarks { get; set; } = 100;

        [Required]
        public DateTime DueDate { get; set; }
    }
}