using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class InitialSqlServerMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnonymousPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ViewLimit = table.Column<int>(type: "int", nullable: false),
                    CurrentViews = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AttachedFileName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachedFileUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachedFileContentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachedFileSizeBytes = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnonymousPosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PostDrawings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PositionX = table.Column<double>(type: "float", nullable: false),
                    PositionY = table.Column<double>(type: "float", nullable: false),
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

            migrationBuilder.CreateTable(
                name: "PostViewers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisitorId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BrowserFingerprint = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostViewers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostViewers_AnonymousPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "AnonymousPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostDrawings_PostId",
                table: "PostDrawings",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostViewers_PostId",
                table: "PostViewers",
                column: "PostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostDrawings");

            migrationBuilder.DropTable(
                name: "PostViewers");

            migrationBuilder.DropTable(
                name: "AnonymousPosts");
        }
    }
}
