using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using PlantWidget.Services;

namespace PlantWidget;

public partial class AddPlantWindow : Window
{
    private readonly bool _isNewPlant;
    private string? _photoPath;

    public string PlantName { get; private set; } = "";
    public int IntervalDays { get; private set; } = 7;
    public int DaysSinceWatered { get; private set; } = 0;
    public string? PhotoPath { get; private set; }
    public string? Notes { get; private set; }

    public AddPlantWindow(string? name = null, int? intervalDays = null, int? daysSinceWatered = null, string? photoPath = null, string? notes = null)
    {
        InitializeComponent();
        _isNewPlant = name == null;
        TitleText.Text = Strings.T(_isNewPlant ? "add_title" : "edit_title");
        NameLabel.Text = Strings.T("name_label");
        IntervalLabel.Text = Strings.T("interval_label");
        DaysAgoLabel.Text = Strings.T("days_ago_label");
        NotesLabel.Text = Strings.T("notes_label");
        ChoosePhotoButton.Content = Strings.T("choose_photo_button");
        RemovePhotoButton.Content = Strings.T("remove_photo_button");
        CancelButtonElement.Content = Strings.T("cancel_button");
        SaveButtonElement.Content = Strings.T("save_button");
        NameBox.Text = name ?? "";
        IntervalBox.Text = (intervalDays ?? 7).ToString();
        DaysAgoBox.Text = (daysSinceWatered ?? 0).ToString();
        NotesBox.Text = notes ?? "";
        _photoPath = photoPath;
        ApplyPhotoPreview();
        NameBox.Focus();
    }

    private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
            DragMove();
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        var name = NameBox.Text.Trim();
        if (string.IsNullOrEmpty(name))
        {
            ShowError(Strings.T("err_name_required"));
            return;
        }

        if (!int.TryParse(IntervalBox.Text.Trim(), out var interval) || interval <= 0)
        {
            ShowError(Strings.T("err_interval_invalid"));
            return;
        }

        if (!int.TryParse(DaysAgoBox.Text.Trim(), out var daysAgo) || daysAgo < 0)
        {
            ShowError(Strings.T("err_days_ago_invalid"));
            return;
        }

        PlantName = name;
        IntervalDays = interval;
        DaysSinceWatered = daysAgo;
        PhotoPath = _photoPath;
        Notes = string.IsNullOrWhiteSpace(NotesBox.Text) ? null : NotesBox.Text.Trim();
        DialogResult = true;
    }

    private void ShowError(string message)
    {
        ErrorText.Text = message;
        ErrorText.Visibility = Visibility.Visible;
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
    }

    private void ChoosePhoto_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog { Filter = Strings.T("photo_filter") };
        if (dialog.ShowDialog(this) != true) return;

        _photoPath = PhotoStore.Save(dialog.FileName);
        ApplyPhotoPreview();
    }

    private void RemovePhoto_Click(object sender, RoutedEventArgs e)
    {
        _photoPath = null;
        ApplyPhotoPreview();
    }

    private void ApplyPhotoPreview()
    {
        PhotoCircle.Fill = Converters.PhotoBrushConverter.ToBrush(_photoPath);
        PhotoPlaceholder.Visibility = _photoPath == null ? Visibility.Visible : Visibility.Collapsed;
        RemovePhotoButton.Visibility = _photoPath == null ? Visibility.Collapsed : Visibility.Visible;
    }
}
