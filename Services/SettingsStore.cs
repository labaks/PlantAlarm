using System;
using System.IO;
using System.Text.Json;
using PlantWidget.Models;

namespace PlantWidget.Services;

public class SettingsStore
{
    private static readonly string DataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PlantWidget");

    private static readonly string DataFile = Path.Combine(DataDir, "settings.json");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public AppSettings Load()
    {
        if (!File.Exists(DataFile))
            return new AppSettings();

        try
        {
            var json = File.ReadAllText(DataFile);
            return JsonSerializer.Deserialize<AppSettings>(json, JsonOptions) ?? new AppSettings();
        }
        catch
        {
            return new AppSettings();
        }
    }

    public void Save(AppSettings settings)
    {
        Directory.CreateDirectory(DataDir);
        var json = JsonSerializer.Serialize(settings, JsonOptions);
        File.WriteAllText(DataFile, json);
    }
}
