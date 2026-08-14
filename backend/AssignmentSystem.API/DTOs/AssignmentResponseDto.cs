namespace AssignmentSystem.API.DTOs
{
    public class AssignmentResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
    }
}