using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Animation;
using System.Windows.Threading;
using PlantWidget.Models;
using PlantWidget.Services;
using PlantWidget.ViewModels;

namespace PlantWidget;

public partial class MainWindow : Window
{
    private readonly PlantStore _store = new();
    private readonly SettingsStore _settingsStore = new();
    private readonly ObservableCollection<PlantItem> _plants = new();

    /// <summary>
    /// Deleted plants, kept around (not shown in the UI) purely so their tombstone
    /// (Deleted=true, UpdatedAt) can round-trip through Save()/sync instead of the plant
    /// silently reappearing once the other device syncs its still-alive copy back.
    /// </summary>
    private List<Plant> _tombstones = new();

    private readonly DispatcherTimer _refreshTimer;
    private readonly DispatcherTimer _reminderTimer;
    private readonly LocalSyncServer _syncServer;

    public bool AllowClose { get; set; } = false;

    public MainWindow()
    {
        InitializeComponent();
        PlantsList.ItemsSource = _plants;

        var loaded = _store.Load();
        foreach (var plant in loaded.Where(p => !p.Deleted))
            _plants.Add(new PlantItem(plant));
        _tombstones = loaded.Where(p => p.Deleted).ToList();

        _syncServer = new LocalSyncServer(_store, () => Dispatcher.Invoke(ReloadPlantsFromStore));
        _syncServer.Start();

        var initialSettings = _settingsStore.Load();
        Topmost = initialSettings.AlwaysOnTop;
        ApplyResizable(initialSettings.AllowResize);
        RestorePosition();

        // Recheck day-rollover status text periodically.
        _refreshTimer = new DispatcherTimer { Interval = TimeSpan.FromMinutes(5) };
        _refreshTimer.Tick += (_, _) => RefreshStatuses();
        _refreshTimer.Start();

        // Check for due plants and notify.
        _reminderTimer = new DispatcherTimer { Interval = TimeSpan.FromMinutes(30) };
        _reminderTimer.Tick += (_, _) => CheckReminders();
        _reminderTimer.Start();

        Loaded += (_, _) => CheckReminders();
    }

    private void RestorePosition()
    {
        var settings = _settingsStore.Load();

        if (settings.WindowWidth is double w && settings.WindowHeight is double h &&
            w >= MinWidth && h >= MinHeight)
        {
            Width = w;
            Height = h;
        }

        if (settings.WindowLeft is double left && settings.WindowTop is double top &&
            left >= 0 && top >= 0 &&
            left + Width <= SystemParameters.VirtualScreenWidth &&
            top + Height <= SystemParameters.VirtualScreenHeight)
        {
            Left = left;
            Top = top;
        }
        else
        {
            Left = SystemParameters.WorkArea.Right - Width - 20;
            Top = SystemParameters.WorkArea.Bottom - Height - 20;
        }
    }

    public void SavePosition()
    {
        var settings = _settingsStore.Load();
        settings.WindowLeft = Left;
        settings.WindowTop = Top;
        settings.WindowWidth = Width;
        settings.WindowHeight = Height;
        _settingsStore.Save(settings);
    }

    public bool AlwaysOnTop => Topmost;

    public void SetAlwaysOnTop(bool value)
    {
        Topmost = value;
        var settings = _settingsStore.Load();
        settings.AlwaysOnTop = value;
        _settingsStore.Save(settings);
    }

    public bool AllowResize => ResizeMode != ResizeMode.NoResize;

    public void SetAllowResize(bool value)
    {
        ApplyResizable(value);
        var settings = _settingsStore.Load();
        settings.AllowResize = value;
        _settingsStore.Save(settings);
    }

    private void ApplyResizable(bool enabled)
    {
        MinWidth = 220;
        MinHeight = 260;
        ResizeMode = enabled ? ResizeMode.CanResize : ResizeMode.NoResize;
        ResizeGrips.Visibility = enabled ? Visibility.Visible : Visibility.Collapsed;
    }

    private string? _resizeDirection;
    private Point _resizeStartPoint;
    private double _resizeStartWidth, _resizeStartHeight, _resizeStartLeft, _resizeStartTop;

    private void ResizeGrip_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (ResizeMode == ResizeMode.NoResize) return;
        var grip = (FrameworkElement)sender;
        _resizeDirection = (string)grip.Tag;
        _resizeStartPoint = PointToScreen(e.GetPosition(this));
        _resizeStartWidth = Width;
        _resizeStartHeight = Height;
        _resizeStartLeft = Left;
        _resizeStartTop = Top;
        grip.CaptureMouse();
        grip.MouseMove += ResizeGrip_MouseMove;
        grip.MouseLeftButtonUp += ResizeGrip_MouseLeftButtonUp;
    }

    private void ResizeGrip_MouseMove(object sender, MouseEventArgs e)
    {
        if (_resizeDirection == null) return;
        var current = PointToScreen(e.GetPosition(this));
        var dx = current.X - _resizeStartPoint.X;
        var dy = current.Y - _resizeStartPoint.Y;

        if (_resizeDirection.Contains("Right"))
        {
            Width = Math.Max(MinWidth, _resizeStartWidth + dx);
        }
        if (_resizeDirection.Contains("Left"))
        {
            var newWidth = Math.Max(MinWidth, _resizeStartWidth - dx);
            Left = _resizeStartLeft + (_resizeStartWidth - newWidth);
            Width = newWidth;
        }
        if (_resizeDirection.Contains("Bottom"))
        {
            Height = Math.Max(MinHeight, _resizeStartHeight + dy);
        }
        if (_resizeDirection.Contains("Top"))
        {
            var newHeight = Math.Max(MinHeight, _resizeStartHeight - dy);
            Top = _resizeStartTop + (_resizeStartHeight - newHeight);
            Height = newHeight;
        }
    }

    private void ResizeGrip_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        var grip = (FrameworkElement)sender;
        grip.ReleaseMouseCapture();
        grip.MouseMove -= ResizeGrip_MouseMove;
        grip.MouseLeftButtonUp -= ResizeGrip_MouseLeftButtonUp;
        _resizeDirection = null;
        SavePosition();
    }

    private void RefreshStatuses()
    {
        foreach (var item in _plants)
            item.Refresh();
    }

    private void CheckReminders()
    {
        var today = DateTime.Today;
        foreach (var item in _plants)
        {
            var plant = item.Plant;
            if (plant.DaysLeft <= 0 && plant.LastNotified != today)
            {
                var text = plant.DaysLeft < 0
                    ? $"{plant.Name}: просрочен полив на {-plant.DaysLeft} дн."
                    : $"{plant.Name}: пора полить!";
                App.ShowNotification("Полив цветов", text);
                plant.LastNotified = today;
            }
        }
        Save();
    }

    private void Save() => _store.Save(_plants.Select(p => p.Plant).Concat(_tombstones));

    /// <summary>Called after the phone pushes a sync merge, to reflect the merged data in the UI.</summary>
    private void ReloadPlantsFromStore()
    {
        var loaded = _store.Load();
        _plants.Clear();
        foreach (var plant in loaded.Where(p => !p.Deleted))
            _plants.Add(new PlantItem(plant));
        _tombstones = loaded.Where(p => p.Deleted).ToList();
        RefreshStatuses();
    }

    private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
            DragMove();
    }

    private void HideButton_Click(object sender, RoutedEventArgs e)
    {
        SavePosition();
        Hide();
    }

    private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
    {
        SavePosition();
        if (!AllowClose)
        {
            e.Cancel = true;
            Hide();
        }
        else
        {
            _syncServer.Stop();
        }
    }

    private void ToggleActionsButton_Click(object sender, RoutedEventArgs e)
    {
        var isOpen = ActionsPanel.Visibility == Visibility.Visible;
        var duration = TimeSpan.FromMilliseconds(160);
        var easing = new CubicEase { EasingMode = EasingMode.EaseOut };

        ArrowRotateTransform.BeginAnimation(System.Windows.Media.RotateTransform.AngleProperty,
            new DoubleAnimation(isOpen ? 0 : 180, duration) { EasingFunction = easing });

        if (isOpen)
        {
            var fadeOut = new DoubleAnimation(0, duration) { EasingFunction = easing };
            var slideOut = new DoubleAnimation(8, duration) { EasingFunction = easing };
            fadeOut.Completed += (_, _) => ActionsPanel.Visibility = Visibility.Collapsed;
            ActionsPanel.BeginAnimation(OpacityProperty, fadeOut);
            ActionsPanelTransform.BeginAnimation(System.Windows.Media.TranslateTransform.YProperty, slideOut);
        }
        else
        {
            ActionsPanel.Visibility = Visibility.Visible;
            ActionsPanel.BeginAnimation(OpacityProperty, new DoubleAnimation(1, duration) { EasingFunction = easing });
            ActionsPanelTransform.BeginAnimation(System.Windows.Media.TranslateTransform.YProperty,
                new DoubleAnimation(0, duration) { EasingFunction = easing });
        }
    }

    private void SettingsButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SettingsWindow(this) { Owner = this };
        dialog.ShowDialog();
    }

    private void AddButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new AddPlantWindow { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            var plant = new Plant
            {
                Name = dialog.PlantName,
                IntervalDays = dialog.IntervalDays,
                LastWatered = DateTime.Today.AddDays(-dialog.DaysSinceWatered),
            };
            _plants.Add(new PlantItem(plant));
            Save();
        }
    }

    private void EditButton_Click(object sender, RoutedEventArgs e)
    {
        if (((FrameworkElement)sender).DataContext is not PlantItem item) return;

        var dialog = new AddPlantWindow(item.Name, item.IntervalDays) { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            item.Name = dialog.PlantName;
            item.IntervalDays = dialog.IntervalDays;
            Save();
        }
    }

    private void DeleteButton_Click(object sender, RoutedEventArgs e)
    {
        if (((FrameworkElement)sender).DataContext is not PlantItem item) return;

        var dialog = new ConfirmWindow($"Удалить «{item.Name}» из списка?") { Owner = this };
        if (dialog.ShowDialog() == true)
        {
            item.Plant.Deleted = true;
            item.Plant.UpdatedAt = DateTime.UtcNow;
            _tombstones.Add(item.Plant);
            _plants.Remove(item);
            Save();
        }
    }

    private void WaterButton_Click(object sender, RoutedEventArgs e)
    {
        if (((FrameworkElement)sender).DataContext is not PlantItem item) return;

        item.MarkWatered();
        Save();
    }
}
