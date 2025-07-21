using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class InitialMySql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AnonymousPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Slug = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ViewLimit = table.Column<int>(type: "int", nullable: false),
                    CurrentViews = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AttachedFileName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttachedFileUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttachedFileContentType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttachedFileSizeBytes = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnonymousPosts", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PostDrawings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PostId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Text = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PositionX = table.Column<double>(type: "double", nullable: false),
                    PositionY = table.Column<double>(type: "double", nullable: false),
                    CreatedByFingerprint = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PostViewers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PostId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    VisitorId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BrowserFingerprint = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ViewedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
