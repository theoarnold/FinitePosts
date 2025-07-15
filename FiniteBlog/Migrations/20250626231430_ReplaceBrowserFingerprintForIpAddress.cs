using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FiniteBlog.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceBrowserFingerprintForIpAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IpAddress",
                table: "PostViewers",
                newName: "BrowserFingerprint");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BrowserFingerprint",
                table: "PostViewers",
                newName: "IpAddress");
        }
    }
}
