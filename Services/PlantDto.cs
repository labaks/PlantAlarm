using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.Json;
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

    /// <summary>
    /// Base64-encoded photo bytes. Only populated when the plant's photo may have changed since
    /// the sender's last successful sync (see PlantMapper.ToDto) — omitted otherwise so the
    /// receiving side knows to leave its own local photo alone instead of erasing it.
    /// </summary>
    public string? Photo { get; set; }

    /// <summary>File extension (no leading dot) for <see cref="Photo"/>, e.g. "jpg".</summary>
    public string? PhotoExt { get; set; }

    /// <summary>True if the photo was deliberately removed since the sender's last successful sync.</summary>
    public bool PhotoRemoved { get; set; }
}

/// <summary>Root shape of a backup file — same as the /sync wire payload, so a backup is also importable on the other platform.</summary>
public class PlantBackup
{
    public List<PlantDto> Plants { get; set; } = new();
}

public static class PlantMapper
{
    private const string DateFormat = "yyyy-MM-dd";

    /// <summary>Options for serializing/deserializing a <see cref="PlantBackup"/> file.</summary>
    public static readonly JsonSerializerOptions BackupJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    /// <param name="lastSyncAt">
    /// Epoch ms of our last successful sync with the other device, or null if we've never
    /// synced. Photo bytes are only included when this plant changed since then (or on the very
    /// first sync), so routine syncs don't re-transfer unchanged photos every time.
    /// </param>
    public static PlantDto ToDto(Plant plant, long? lastSyncAt)
    {
        var updatedAtMs = new DateTimeOffset(DateTime.SpecifyKind(plant.UpdatedAt, DateTimeKind.Utc)).ToUnixTimeMilliseconds();
        var dto = new PlantDto
        {
            Id = plant.Id,
            Name = plant.Name,
            IntervalDays = plant.IntervalDays,
            LastWatered = plant.LastWatered.ToString(DateFormat, CultureInfo.InvariantCulture),
            LastNotifiedDate = plant.LastNotified?.ToString(DateFormat, CultureInfo.InvariantCulture),
            UpdatedAt = updatedAtMs,
            Deleted = plant.Deleted,
        };

        var changedSinceLastSync = lastSyncAt == null || updatedAtMs > lastSyncAt;
        if (plant.PhotoPath != null && File.Exists(plant.PhotoPath))
        {
            // A photo we have is safe to (re-)send on the first sync too — worst case the
            // other side re-saves bytes it already had.
            if (changedSinceLastSync)
            {
                dto.Photo = Convert.ToBase64String(File.ReadAllBytes(plant.PhotoPath));
                dto.PhotoExt = Path.GetExtension(plant.PhotoPath).TrimStart('.');
            }
        }
        else if (lastSyncAt != null && changedSinceLastSync)
        {
            // Only claim "removed" once we've synced before — on a first-ever sync, having no
            // local photo just means we've never had one to give, not that one was deleted.
            // Confusing the two here previously wiped out real photos on the other device.
            dto.PhotoRemoved = true;
        }

        return dto;
    }

    public static Plant FromDto(PlantDto dto)
    {
        var plant = new Plant
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

        if (dto.Photo != null)
            plant.PhotoPath = PhotoStore.SaveFromBytes(Convert.FromBase64String(dto.Photo), dto.PhotoExt ?? "jpg");

        return plant;
    }

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

        // Absent Photo/PhotoRemoved means "unchanged since the sender's last sync" — leave
        // target.PhotoPath exactly as-is in that case rather than erasing it.
        if (dto.Photo != null)
        {
            var newPath = PhotoStore.SaveFromBytes(Convert.FromBase64String(dto.Photo), dto.PhotoExt ?? "jpg");
            PhotoStore.Delete(target.PhotoPath);
            target.PhotoPath = newPath;
        }
        else if (dto.PhotoRemoved)
        {
            PhotoStore.Delete(target.PhotoPath);
            target.PhotoPath = null;
        }
    }
}
