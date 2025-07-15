using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFallbackFingerprintColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FallbackFingerprint",
                table: "PostViewers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FallbackFingerprint",
                table: "PostViewers",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
} 