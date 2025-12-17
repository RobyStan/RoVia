using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using System.Security.Claims;

namespace RoVia.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttractionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AttractionsController(AppDbContext context)
    {
        _context = context;
    }

    private int ResolveUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var id) ? id : 0;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttractionDto>>> GetAttractions([FromQuery] AttractionFilterRequest filter)
    {
        var query = _context.Attractions
            .Where(a => a.IsApproved)
            .AsQueryable();

        if (filter.Type.HasValue)
            query = query.Where(a => a.Type == filter.Type.Value);

        if (!string.IsNullOrWhiteSpace(filter.Region))
        {
            var normalizedRegion = filter.Region.Trim().ToLower();
            query = query.Where(a => a.Region != null && a.Region.ToLower() == normalizedRegion);
        }

        if (filter.MinRating.HasValue)
            query = query.Where(a => a.Rating >= filter.MinRating.Value);

        var attractions = await query
            .Select(a => new AttractionDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Type = a.Type,
                TypeName = a.Type.ToString(),
                Region = a.Region,
                ImageUrl = a.ImageUrl,
                Rating = a.Rating
            })
            .ToListAsync();

        return Ok(attractions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AttractionDto>> GetAttraction(int id)
    {
        var attraction = await _context.Attractions
            .Where(a => a.Id == id && a.IsApproved)
            .Select(a => new AttractionDto
            {
                Id = a.Id,
                Name = a.Name,
                Description = a.Description,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Type = a.Type,
                TypeName = a.Type.ToString(),
                Region = a.Region,
                ImageUrl = a.ImageUrl,
                Rating = a.Rating
            })
            .FirstOrDefaultAsync();

        if (attraction == null)
            return NotFound();

        return Ok(attraction);
    }

    [Authorize(Roles = "Administrator")]
    [HttpPost]
    public async Task<IActionResult> CreateAttraction([FromBody] AttractionUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var attraction = new Attraction
        {
            Name = request.Name,
            Description = request.Description,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Type = request.Type,
            Region = request.Region,
            ImageUrl = request.ImageUrl,
            Rating = request.Rating,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = ResolveUserId(),
            IsApproved = true
        };

        _context.Attractions.Add(attraction);
        await _context.SaveChangesAsync();
        return Ok(new { attraction.Id });
    }

    [Authorize(Roles = "Administrator")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAttraction(int id, [FromBody] AttractionUpsertRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == id);
        if (attraction == null)
        {
            return NotFound();
        }

        attraction.Name = request.Name;
        attraction.Description = request.Description;
        attraction.Latitude = request.Latitude;
        attraction.Longitude = request.Longitude;
        attraction.Type = request.Type;
        attraction.Region = request.Region;
        attraction.ImageUrl = request.ImageUrl;
        attraction.Rating = request.Rating;
        attraction.UpdatedAt = DateTime.UtcNow;
        attraction.IsApproved = true;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Administrator")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAttraction(int id)
    {
        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == id);
        if (attraction == null)
        {
            return NotFound();
        }

        _context.Attractions.Remove(attraction);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
