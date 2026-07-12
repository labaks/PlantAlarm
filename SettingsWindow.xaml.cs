using System.Reflection;
using System.Windows;
using System.Windows.Input;
using PlantWidget.Services;

namespace PlantWidget;

public partial class SettingsWindow : Window
{
    private readonly MainWindow _mainWindow;
    private bool _initializing = true;

    public SettingsWindow(MainWindow mainWindow)
    {
        InitializeComponent();
        _mainWindow = mainWindow;

        AlwaysOnTopBox.IsChecked = _mainWindow.AlwaysOnTop;
        AutostartBox.IsChecked = AutostartService.IsEnabled;
        AllowResizeBox.IsChecked = _mainWindow.AllowResize;

        var version = Assembly.GetExecutingAssembly().GetName().Version;
        VersionText.Text = version == null ? "" : $"Версия {version.Major}.{version.Minor}.{version.Build}";

        var ip = LocalSyncServer.GetLocalIPv4();
        SyncAddressBox.Text = ip == null ? "не удалось определить IP" : $"{ip}:{LocalSyncServer.Port}";

        _initializing = false;
    }

    private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
            DragMove();
    }

    private void AlwaysOnTopBox_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing) return;
        _mainWindow.SetAlwaysOnTop(AlwaysOnTopBox.IsChecked == true);
    }

    private void AutostartBox_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing) return;
        AutostartService.SetEnabled(AutostartBox.IsChecked == true);
    }

    private void AllowResizeBox_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing) return;
        _mainWindow.SetAllowResize(AllowResizeBox.IsChecked == true);
    }

    private void Close_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
