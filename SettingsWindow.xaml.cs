using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using PlantWidget.Services;

namespace PlantWidget;

public partial class SettingsWindow : Window
{
    private readonly MainWindow _mainWindow;
    private readonly SettingsStore _settingsStore = new();
    private bool _initializing = true;

    public SettingsWindow(MainWindow mainWindow)
    {
        InitializeComponent();
        _mainWindow = mainWindow;

        AlwaysOnTopBox.IsChecked = _mainWindow.AlwaysOnTop;
        AutostartBox.IsChecked = AutostartService.IsEnabled;
        AllowResizeBox.IsChecked = _mainWindow.AllowResize;

        var ip = LocalSyncServer.GetLocalIPv4();
        SyncAddressBox.Text = ip == null ? Strings.T("sync_address_unknown") : $"{ip}:{LocalSyncServer.Port}";

        ApplyLocalization();
        Strings.LanguageChanged += ApplyLocalization;
        Closed += (_, _) => Strings.LanguageChanged -= ApplyLocalization;

        _initializing = false;
    }

    private void ApplyLocalization()
    {
        Title = Strings.T("settings_title");
        TitleText.Text = Strings.T("settings_title");
        AlwaysOnTopBox.Content = Strings.T("opt_always_on_top");
        AutostartBox.Content = Strings.T("opt_autostart");
        AllowResizeBox.Content = Strings.T("opt_allow_resize");
        LanguageLabel.Text = Strings.T("language_label");
        SyncAddressLabel.Text = Strings.T("sync_address_label");
        SyncAddressHint.Text = Strings.T("sync_address_hint");
        CloseButtonElement.Content = Strings.T("close_button");

        var version = Assembly.GetExecutingAssembly().GetName().Version;
        VersionText.Text = version == null ? "" : Strings.T("version_label", $"{version.Major}.{version.Minor}.{version.Build}");

        LanguageComboBox.SelectedItem = Strings.Language == "ru" ? LanguageRuItem : LanguageEnItem;
    }

    private void LanguageComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (_initializing) return;
        if (LanguageComboBox.SelectedItem is not ComboBoxItem item) return;

        var lang = (string)item.Tag;
        Strings.SetLanguage(lang);
        var settings = _settingsStore.Load();
        settings.Language = lang;
        _settingsStore.Save(settings);
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
