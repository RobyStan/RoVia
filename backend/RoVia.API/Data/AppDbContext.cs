using Microsoft.EntityFrameworkCore;
using RoVia.API.Models;
using System.Collections.Generic;

namespace RoVia.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Attraction> Attractions { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
}
