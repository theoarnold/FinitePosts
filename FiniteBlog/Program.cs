using FiniteBlog.Data;
using FiniteBlog.Services;
using FiniteBlog.Repositories;
using FiniteBlog.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("AZURE_MYSQL_CONNECTIONSTRING"),
        ServerVersion.Create(new Version(8, 0, 29), Pomelo.EntityFrameworkCore.MySql.Infrastructure.ServerType.MySql),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));

builder.Services.AddScoped<VisitorCookie>();

builder.Services.AddScoped<IPostRepository, PostRepository>();

builder.Services.AddScoped<IPostService, PostService>();

builder.Services.AddScoped<IBlobStorageService, AzureBlobStorageService>();

builder.Services.AddSignalR();

builder.Services.AddSingleton<FiniteBlog.Hubs.ConnectionManager>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",  // React dev server
                "http://localhost:5206",  // API domain
                "https://your-static-web-app-url.azurestaticapps.net",  // Your Static Web App URL
                "https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net"  // Your API domain
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add cookie policy configuration
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => false;
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
});

// Comment out SPA services
//builder.Services.AddSpaStaticFiles(configuration =>
//{
//    configuration.RootPath = "ClientApp/build";
//});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Comment out HTTPS redirection for development
// app.UseHttpsRedirection();
app.UseStaticFiles();
//app.UseSpaStaticFiles();
app.UseCors("CorsPolicy");
app.UseAuthorization();

app.MapControllers();
app.MapHub<PostHub>("/posthub");

app.Run();
