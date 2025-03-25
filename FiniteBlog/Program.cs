using FiniteBlog.Data;
using FiniteBlog.Services;
using FiniteBlog.Repositories;
using FiniteBlog.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.AspNetCore.CookiePolicy;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));

// Register the SlugGeneratorService
builder.Services.AddSingleton<SlugGeneratorService>();

// Register the repository
builder.Services.AddScoped<IPostRepository, PostRepository>();

// Register the PostService
builder.Services.AddScoped<IPostService, PostService>();

// Add SignalR
builder.Services.AddSignalR();

// Register the ConnectionManager
builder.Services.AddSingleton<FiniteBlog.Hubs.ConnectionManager>();

// Add CORS to allow React frontend to communicate with API
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any origin
              .AllowAnyHeader()
              .AllowAnyMethod()
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

// Comment out SPA middleware
//app.UseSpa(spa =>
//{
//    spa.Options.SourcePath = "ClientApp";
//
//    if (app.Environment.IsDevelopment())
//    {
//        spa.UseReactDevelopmentServer(npmScript: "start");
//    }
//});

app.Run();
