using System.ComponentModel.DataAnnotations;

namespace AssignmentSystem.API.DTOs
{
    public class UpdateSubmissionDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;
    }
}