using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssignmentSystem.API.Models
{
    public class Submission
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AssignmentId { get; set; }

        [ForeignKey("AssignmentId")]
        public Assignment? Assignment { get; set; }

        [Required]
        public int StudentId { get; set; }

        [ForeignKey("StudentId")]
        public User? Student { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty; // জমা দেওয়া লিংক বা উত্তর

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "On-Time"; // "On-Time", "Late Submitted", "Graded"

        // Teacher's Review & Grading Fields
        public decimal? Marks { get; set; } // e.g. 85.50

        public string? Feedback { get; set; } // শিক্ষকের মতামত বা মন্তব্য
    }
}