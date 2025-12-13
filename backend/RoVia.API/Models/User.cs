namespace RoVia.API.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public int TotalPoints { get; set; }
    public int RoleId { get; set; }
    public DateTime CreatedAt { get; set; }
}
