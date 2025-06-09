using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class AddFileAttachmentColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachedFileContentType",
                table: "AnonymousPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachedFileName",
                table: "AnonymousPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AttachedFileSizeBytes",
                table: "AnonymousPosts",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachedFileUrl",
                table: "AnonymousPosts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttachedFileContentType",
                table: "AnonymousPosts");

            migrationBuilder.DropColumn(
                name: "AttachedFileName",
                table: "AnonymousPosts");

            migrationBuilder.DropColumn(
                name: "AttachedFileSizeBytes",
                table: "AnonymousPosts");

            migrationBuilder.DropColumn(
                name: "AttachedFileUrl",
                table: "AnonymousPosts");
        }
    }
}
