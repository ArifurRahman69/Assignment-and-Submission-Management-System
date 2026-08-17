using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AssignmentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserModelAndAddCourseSubject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubjectName",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CourseSubjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SubjectName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseSubjects", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseSubjects");

            migrationBuilder.DropColumn(
                name: "SubjectName",
                table: "Users");
        }
    }
}
