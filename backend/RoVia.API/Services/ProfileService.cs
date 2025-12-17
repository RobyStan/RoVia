using System;
using System.Collections.Generic;
using System.Linq;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace RoVia.API.Services;

public class ProfileService
{
    private readonly AppDbContext _context;

    public ProfileService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<dynamic> GetUserProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var quizzesCompleted = await _context.UserProgresses
            .Where(up => up.UserId == userId && up.IsCompleted)
            .CountAsync();

        var badges = await _context.UserBadges
            .Where(ub => ub.UserId == userId)
            .Include(ub => ub.Badge)
            .ToListAsync();
        var unlockedBadgeIds = badges.Select(b => b.BadgeId).ToHashSet();

        var nextBadge = await _context.Badges
            .Where(b => !unlockedBadgeIds.Contains(b.Id))
            .OrderBy(b => b.RequiredPoints)
            .FirstOrDefaultAsync();

        var recentProgress = await _context.UserProgresses
            .Where(up => up.UserId == userId)
            .OrderByDescending(up => up.CompletedAt)
            .Take(5)
            .Include(up => up.Quiz)
            .ThenInclude(q => q.Attraction)
            .ToListAsync();

        var levelInfo = CalculateLevel(user.TotalPoints);
        var nextBadgeInfo = nextBadge == null ? null : new
        {
            nextBadge.Id,
            nextBadge.Name,
            nextBadge.Description,
            nextBadge.IconUrl,
            nextBadge.RequiredPoints,
            PointsRemaining = Math.Max(0, nextBadge.RequiredPoints - user.TotalPoints)
        };

        return new
        {
            user.Id,
            user.Username,
            user.Email,
            user.TotalPoints,
            Level = levelInfo.Level,
            LevelName = levelInfo.Name,
            LevelProgress = levelInfo.Progress,
            PointsToNextLevel = levelInfo.PointsToNextLevel,
            QuizzesCompleted = quizzesCompleted,
            Badges = badges.Select(b => new
            {
                b.Badge.Id,
                b.Badge.Name,
                b.Badge.Description,
                b.Badge.IconUrl,
                UnlockedAt = b.UnlockedAt
            }),
            NextBadge = nextBadgeInfo,
            RecentProgress = recentProgress.Select(p => new
            {
                p.Quiz.Title,
                p.Quiz.Attraction.Name,
                p.PointsEarned,
                p.CorrectAnswers,
                p.TotalQuestions,
                p.CompletedAt
            })
        };
    }

    public async Task CheckAndUnlockBadgesAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        var allBadges = await _context.Badges.ToListAsync();

        foreach (var badge in allBadges)
        {
            var alreadyUnlocked = await _context.UserBadges
                .AnyAsync(ub => ub.UserId == userId && ub.BadgeId == badge.Id);

            if (alreadyUnlocked) continue;

            var criteria = System.Text.Json.JsonDocument.Parse(badge.Criteria);
            bool shouldUnlock = true;

            if (criteria.RootElement.TryGetProperty("totalPoints", out var pointsReq))
            {
                if (user.TotalPoints < pointsReq.GetInt32())
                    shouldUnlock = false;
            }

            if (criteria.RootElement.TryGetProperty("quizzesCompleted", out var quizzesReq))
            {
                var completed = await _context.UserProgresses
                    .Where(up => up.UserId == userId && up.IsCompleted)
                    .CountAsync();
                
                if (completed < quizzesReq.GetInt32())
                    shouldUnlock = false;
            }

            if (shouldUnlock)
            {
                _context.UserBadges.Add(new UserBadge
                {
                    UserId = userId,
                    BadgeId = badge.Id,
                    UnlockedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(int take = 50)
    {
        var cappedTake = Math.Clamp(take, 1, 100);

        var topUsers = await _context.Users
            .OrderByDescending(u => u.TotalPoints)
            .ThenBy(u => u.CreatedAt)
            .Take(cappedTake)
            .Select(u => new { u.Id, u.Username, u.TotalPoints, u.CreatedAt })
            .ToListAsync();

        if (topUsers.Count == 0)
        {
            return Array.Empty<LeaderboardEntryDto>();
        }

        var userIds = topUsers.Select(u => u.Id).ToList();

        var completionLookup = await _context.UserProgresses
            .Where(up => userIds.Contains(up.UserId) && up.IsCompleted)
            .GroupBy(up => up.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Count = g.Count(),
                LastCompletedAt = g.Max(x => x.CompletedAt)
            })
            .ToDictionaryAsync(x => x.UserId, x => (x.Count, x.LastCompletedAt));

        var leaderboard = new List<LeaderboardEntryDto>(topUsers.Count);

        for (var index = 0; index < topUsers.Count; index++)
        {
            var user = topUsers[index];
            var levelInfo = CalculateLevel(user.TotalPoints);
            completionLookup.TryGetValue(user.Id, out var progressSnapshot);

            leaderboard.Add(new LeaderboardEntryDto
            {
                UserId = user.Id,
                Username = user.Username,
                TotalPoints = user.TotalPoints,
                Level = levelInfo.Level,
                LevelName = levelInfo.Name,
                LevelProgress = levelInfo.Progress,
                PointsToNextLevel = levelInfo.PointsToNextLevel,
                Rank = index + 1,
                QuizzesCompleted = progressSnapshot.Count,
                LastCompletedAt = progressSnapshot.LastCompletedAt,
                JoinedAt = user.CreatedAt
            });
        }

        return leaderboard;
    }

    private static LevelInfo CalculateLevel(int totalPoints)
    {
        const int pointsPerLevel = 250;
        var level = Math.Max(1, (totalPoints / pointsPerLevel) + 1);
        var currentLevelFloor = (level - 1) * pointsPerLevel;
        var progressPoints = totalPoints - currentLevelFloor;
        var progress = pointsPerLevel == 0 ? 0 : Math.Clamp((double)progressPoints / pointsPerLevel, 0, 1);
        var nextLevelTarget = currentLevelFloor + pointsPerLevel;

        return new LevelInfo
        {
            Level = level,
            Name = level switch
            {
                1 => "Începător",
                2 => "Explorer",
                3 => "Călător",
                4 => "Legendă",
                _ => "Maestru"
            },
            Progress = Math.Round(progress, 3),
            PointsToNextLevel = Math.Max(0, nextLevelTarget - totalPoints)
        };
    }

    private sealed class LevelInfo
    {
        public int Level { get; init; }
        public string Name { get; init; }
        public double Progress { get; init; }
        public int PointsToNextLevel { get; init; }
    }
}
