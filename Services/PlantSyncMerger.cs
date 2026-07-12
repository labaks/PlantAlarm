using System;
using System.Collections.Generic;
using System.Linq;
using PlantWidget.Models;

namespace PlantWidget.Services;

/// <summary>
/// Merges the desktop's local plant list with a list received from the phone.
/// Per-plant conflicts are resolved by keeping whichever side has the newer UpdatedAt.
/// Note: this does not sync deletions — a plant removed on one side reappears from the other,
/// which is an accepted trade-off of the temporary LAN-sync solution (see TODO.md).
/// </summary>
public static class PlantSyncMerger
{
    public static List<Plant> Merge(List<Plant> local, List<PlantDto> incoming)
    {
        var result = new List<Plant>(local);
        var byId = result.ToDictionary(p => p.Id);

        foreach (var dto in incoming)
        {
            if (byId.TryGetValue(dto.Id, out var existing))
            {
                var incomingUpdatedAt = DateTimeOffset.FromUnixTimeMilliseconds(dto.UpdatedAt).UtcDateTime;
                if (incomingUpdatedAt > existing.UpdatedAt)
                    PlantMapper.ApplyDto(existing, dto);
            }
            else
            {
                var newPlant = PlantMapper.FromDto(dto);
                result.Add(newPlant);
                byId[newPlant.Id] = newPlant;
            }
        }

        return result;
    }
}
