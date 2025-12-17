using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RoVia.API.Services;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _profileService;

    public ProfileController(ProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var profile = await _profileService.GetUserProfileAsync(userId);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUserProfile(int userId)
    {
        var profile = await _profileService.GetUserProfileAsync(userId);
        if (profile == null) return NotFound();

        return Ok(profile);
    }

    [AllowAnonymous]
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int take = 50)
    {
        var leaderboard = await _profileService.GetLeaderboardAsync(take);
        return Ok(leaderboard);
    }
}
