namespace PlantWidget.Models;

public class AppSettings
{
    public double? WindowLeft { get; set; }
    public double? WindowTop { get; set; }
    public double? WindowWidth { get; set; }
    public double? WindowHeight { get; set; }
    public bool AlwaysOnTop { get; set; } = true;
    public bool AllowResize { get; set; } = false;
    public bool SoundEnabled { get; set; } = true;
    public string? Language { get; set; }

    /// <summary>
    /// Epoch milliseconds of the last successful /sync exchange, null if never synced.
    /// Used to avoid re-sending a plant's photo bytes on every sync when they haven't changed.
    /// </summary>
    public long? LastSyncAt { get; set; }
}
