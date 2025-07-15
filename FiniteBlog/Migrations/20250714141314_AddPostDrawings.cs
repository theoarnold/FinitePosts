using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddPostDrawings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FallbackFingerprint",
                table: "PostViewers");

            migrationBuilder.CreateTable(
                name: "PostDrawings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DrawingData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByFingerprint = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostDrawings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostDrawings_AnonymousPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "AnonymousPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostDrawings_PostId",
                table: "PostDrawings",
                column: "PostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostDrawings");

            migrationBuilder.AddColumn<string>(
                name: "FallbackFingerprint",
                table: "PostViewers",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
