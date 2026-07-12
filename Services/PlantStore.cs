using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using PlantWidget.Models;

namespace PlantWidget.Services;

public class PlantStore
{
    private static readonly string DataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PlantWidget");

    private static readonly string DataFile = Path.Combine(DataDir, "plants.json");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public List<Plant> Load()
    {
        if (!File.Exists(DataFile))
            return new List<Plant>();

        try
        {
            var json = File.ReadAllText(DataFile);
            return JsonSerializer.Deserialize<List<Plant>>(json, JsonOptions) ?? new List<Plant>();
        }
        catch
        {
            return new List<Plant>();
        }
    }

    public void Save(IEnumerable<Plant> plants)
    {
        Directory.CreateDirectory(DataDir);
        var json = JsonSerializer.Serialize(plants, JsonOptions);
        File.WriteAllText(DataFile, json);
    }
}
