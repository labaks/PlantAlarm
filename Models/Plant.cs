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

    public DateTime NextWaterDate => LastWatered.Date.AddDays(IntervalDays);
    public int DaysLeft => (NextWaterDate - DateTime.Today).Days;
}
