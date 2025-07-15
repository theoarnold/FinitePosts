using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePostDrawingsToTextAnnotations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DrawingData",
                table: "PostDrawings",
                newName: "Text");

            migrationBuilder.AddColumn<double>(
                name: "PositionX",
                table: "PostDrawings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PositionY",
                table: "PostDrawings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PositionX",
                table: "PostDrawings");

            migrationBuilder.DropColumn(
                name: "PositionY",
                table: "PostDrawings");

            migrationBuilder.RenameColumn(
                name: "Text",
                table: "PostDrawings",
                newName: "DrawingData");
        }
    }
}
