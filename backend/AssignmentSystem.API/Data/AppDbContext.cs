using AssignmentSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
    }
}