using System;
using System.IO;

namespace PlantWidget.Services;

/// <summary>Copies user-picked plant photos into app data so they survive the source file moving/deleting.</summary>
public static class PhotoStore
{
    private static readonly string PhotosDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PlantWidget", "photos");

    /// <summary>Copies the file at sourcePath into app data and returns the new path.</summary>
    public static string Save(string sourcePath)
    {
        Directory.CreateDirectory(PhotosDir);
        var ext = Path.GetExtension(sourcePath);
        var destPath = Path.Combine(PhotosDir, $"{Guid.NewGuid()}{ext}");
        File.Copy(sourcePath, destPath, overwrite: true);
        return destPath;
    }
}
