using System.Windows;
using System.Windows.Input;

namespace PlantWidget;

public partial class AddPlantWindow : Window
{
    private readonly bool _isNewPlant;

    public string PlantName { get; private set; } = "";
    public int IntervalDays { get; private set; } = 7;
    public int DaysSinceWatered { get; private set; } = 0;

    public AddPlantWindow(string? name = null, int? intervalDays = null)
    {
        InitializeComponent();
        _isNewPlant = name == null;
        TitleText.Text = _isNewPlant ? "Новый цветок" : "Редактировать цветок";
        NameBox.Text = name ?? "";
        IntervalBox.Text = (intervalDays ?? 7).ToString();
        DaysAgoBox.Text = "0";
        DaysAgoPanel.Visibility = _isNewPlant ? Visibility.Visible : Visibility.Collapsed;
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
            ShowError("Введите название растения.");
            return;
        }

        if (!int.TryParse(IntervalBox.Text.Trim(), out var interval) || interval <= 0)
        {
            ShowError("Интервал должен быть положительным числом дней.");
            return;
        }

        var daysAgo = 0;
        if (_isNewPlant && (!int.TryParse(DaysAgoBox.Text.Trim(), out daysAgo) || daysAgo < 0))
        {
            ShowError("Дней с последнего полива — число 0 или больше.");
            return;
        }

        PlantName = name;
        IntervalDays = interval;
        DaysSinceWatered = daysAgo;
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
}
