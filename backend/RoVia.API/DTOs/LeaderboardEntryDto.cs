using System;

namespace RoVia.API.DTOs;

public class LeaderboardEntryDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int TotalPoints { get; set; }
    public int Level { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public double LevelProgress { get; set; }
    public int PointsToNextLevel { get; set; }
    public int Rank { get; set; }
    public int QuizzesCompleted { get; set; }
    public DateTime? LastCompletedAt { get; set; }
    public DateTime JoinedAt { get; set; }
}
