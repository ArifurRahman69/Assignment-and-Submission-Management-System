using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxMarksToAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MaxMarks",
                table: "Assignments",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxMarks",
                table: "Assignments");
        }
    }
}
