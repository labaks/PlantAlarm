using System;

namespace PlantWidget.Models;

public class Plant
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public int IntervalDays { get; set; } = 7;
    public DateTime LastWatered { get; set; } = DateTime.Today;
    public DateTime? LastNotified { get; set; }

    /// <summary>UTC timestamp of the last edit, used to resolve conflicts when syncing with the phone.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft-delete tombstone: deleting sets this instead of removing the record outright, so the
    /// deletion itself has an UpdatedAt and can propagate through sync instead of the plant just
    /// reappearing from whichever side hasn't deleted it yet.
    /// </summary>
    public bool Deleted { get; set; } = false;

    /// <summary>
    /// Local file path to a copy of the plant's photo (see Services/PhotoStore.cs). Device-local
    /// only — deliberately excluded from PlantDto/sync, since a desktop file path is meaningless
    /// on the phone and vice versa.
    /// </summary>
    public string? PhotoPath { get; set; }

    /// <summary>Free-form care notes ("by the window", "doesn't like overwatering", fertilizer type, etc.).</summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Manual sort position (ascending). Nullable so PlantStore.Load can tell legacy rows apart
    /// and migrate them once; a real value is always assigned before the plant reaches the UI.
    /// Uses gaps (multiples of 1000) so dragging one plant between two others only needs to
    /// touch that one plant's value, not renumber the whole list.
    /// </summary>
    public double? SortOrder { get; set; }

    public DateTime NextWaterDate => LastWatered.Date.AddDays(IntervalDays);
    public int DaysLeft => (NextWaterDate - DateTime.Today).Days;
}
