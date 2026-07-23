using System;
using System.ComponentModel;
using System.Windows.Media;
using PlantWidget.Models;
using PlantWidget.Services;

namespace PlantWidget.ViewModels;

public class PlantItem : INotifyPropertyChanged
{
    public Plant Plant { get; }

    public PlantItem(Plant plant)
    {
        Plant = plant;
    }

    public string Id => Plant.Id;

    public string Name
    {
        get => Plant.Name;
        set { Plant.Name = value; Plant.UpdatedAt = DateTime.UtcNow; OnPropertyChanged(nameof(Name)); }
    }

    public int IntervalDays
    {
        get => Plant.IntervalDays;
        set { Plant.IntervalDays = value; Plant.UpdatedAt = DateTime.UtcNow; OnPropertyChanged(nameof(IntervalDays)); Refresh(); }
    }

    public DateTime LastWatered => Plant.LastWatered;

    public string? PhotoPath => Plant.PhotoPath;

    public void SetPhotoPath(string? path)
    {
        Plant.PhotoPath = path;
        Plant.UpdatedAt = DateTime.UtcNow;
        OnPropertyChanged(nameof(PhotoPath));
    }

    public string? Notes => Plant.Notes;

    public void SetNotes(string? notes)
    {
        Plant.Notes = notes;
        Plant.UpdatedAt = DateTime.UtcNow;
        OnPropertyChanged(nameof(Notes));
    }

    public string StatusText
    {
        get
        {
            var days = Plant.DaysLeft;
            if (days < 0) return Strings.StatusOverdue(-days);
            if (days == 0) return Strings.T("status_due_today");
            if (days == 1) return Strings.T("status_tomorrow");
            return Strings.StatusInDays(days);
        }
    }

    public string WaterTooltip => Strings.T("water_tooltip");

    public Brush StatusBrush
    {
        get
        {
            var days = Plant.DaysLeft;
            if (days <= 0) return new SolidColorBrush(Color.FromRgb(0xE0, 0x5A, 0x47));
            if (days <= 1) return new SolidColorBrush(Color.FromRgb(0xE0, 0xA8, 0x30));
            return new SolidColorBrush(Color.FromRgb(0x4C, 0xAF, 0x50));
        }
    }

    public bool IsWaterable => Plant.DaysLeft <= 0;

    public double FillFraction
    {
        get
        {
            if (Plant.IntervalDays <= 0) return 0.0;
            var elapsedDays = (DateTime.Today - Plant.LastWatered.Date).TotalDays;
            return Math.Clamp(1 - elapsedDays / Plant.IntervalDays, 0.0, 1.0);
        }
    }

    public void MarkWatered()
    {
        Plant.LastWatered = DateTime.Today;
        Plant.LastNotified = null;
        Plant.UpdatedAt = DateTime.UtcNow;
        OnPropertyChanged(nameof(LastWatered));
        Refresh();
    }

    public void SetLastWatered(DateTime date)
    {
        Plant.LastWatered = date;
        Plant.UpdatedAt = DateTime.UtcNow;
        OnPropertyChanged(nameof(LastWatered));
        Refresh();
    }

    public void Refresh()
    {
        OnPropertyChanged(nameof(StatusText));
        OnPropertyChanged(nameof(StatusBrush));
        OnPropertyChanged(nameof(IsWaterable));
        OnPropertyChanged(nameof(FillFraction));
        OnPropertyChanged(nameof(WaterTooltip));
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged(string name) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
