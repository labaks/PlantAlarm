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

    /// <summary>Writes raw photo bytes (received from a synced device) into app data and returns the new path.</summary>
    public static string SaveFromBytes(byte[] bytes, string ext)
    {
        Directory.CreateDirectory(PhotosDir);
        if (!ext.StartsWith('.')) ext = "." + ext;
        var destPath = Path.Combine(PhotosDir, $"{Guid.NewGuid()}{ext}");
        File.WriteAllBytes(destPath, bytes);
        return destPath;
    }

    /// <summary>Best-effort delete of a plant photo that's being replaced or removed.</summary>
    public static void Delete(string? path)
    {
        if (string.IsNullOrEmpty(path)) return;
        try { File.Delete(path); }
        catch { /* orphaned file cleanup is best-effort, not worth failing the caller over */ }
    }
}
