namespace PlantWidget.Models;

public class AppSettings
{
    public double? WindowLeft { get; set; }
    public double? WindowTop { get; set; }
    public double? WindowWidth { get; set; }
    public double? WindowHeight { get; set; }
    public bool AlwaysOnTop { get; set; } = true;
    public bool AllowResize { get; set; } = false;
    public string? Language { get; set; }
}
