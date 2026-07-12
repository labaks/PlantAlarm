using System;
using System.Globalization;
using PlantWidget.Models;

namespace PlantWidget.Services;

/// <summary>
/// Wire format for local-network sync with the mobile app. Field names and shapes (camelCase,
/// date-only strings, epoch-millisecond timestamp) are chosen to match mobile/src/types.ts exactly.
/// </summary>
public class PlantDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int IntervalDays { get; set; }
    public string LastWatered { get; set; } = "";
    public string? LastNotifiedDate { get; set; }
    public long UpdatedAt { get; set; }
    public bool Deleted { get; set; }
}

public static class PlantMapper
{
    private const string DateFormat = "yyyy-MM-dd";

    public static PlantDto ToDto(Plant plant) => new()
    {
        Id = plant.Id,
        Name = plant.Name,
        IntervalDays = plant.IntervalDays,
        LastWatered = plant.LastWatered.ToString(DateFormat, CultureInfo.InvariantCulture),
        LastNotifiedDate = plant.LastNotified?.ToString(DateFormat, CultureInfo.InvariantCulture),
        UpdatedAt = new DateTimeOffset(DateTime.SpecifyKind(plant.UpdatedAt, DateTimeKind.Utc)).ToUnixTimeMilliseconds(),
        Deleted = plant.Deleted,
    };

    public static Plant FromDto(PlantDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        IntervalDays = dto.IntervalDays,
        LastWatered = DateTime.ParseExact(dto.LastWatered, DateFormat, CultureInfo.InvariantCulture),
        LastNotified = dto.LastNotifiedDate == null
            ? null
            : DateTime.ParseExact(dto.LastNotifiedDate, DateFormat, CultureInfo.InvariantCulture),
        UpdatedAt = DateTimeOffset.FromUnixTimeMilliseconds(dto.UpdatedAt).UtcDateTime,
        Deleted = dto.Deleted,
    };

    /// <summary>Overwrites an existing Plant's mutable fields with values from a newer DTO.</summary>
    public static void ApplyDto(Plant target, PlantDto dto)
    {
        target.Name = dto.Name;
        target.IntervalDays = dto.IntervalDays;
        target.LastWatered = DateTime.ParseExact(dto.LastWatered, DateFormat, CultureInfo.InvariantCulture);
        target.LastNotified = dto.LastNotifiedDate == null
            ? null
            : DateTime.ParseExact(dto.LastNotifiedDate, DateFormat, CultureInfo.InvariantCulture);
        target.UpdatedAt = DateTimeOffset.FromUnixTimeMilliseconds(dto.UpdatedAt).UtcDateTime;
        target.Deleted = dto.Deleted;
    }
}
