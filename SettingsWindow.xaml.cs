using System;
using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using Microsoft.Win32;
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
        SoundBox.IsChecked = _mainWindow.SoundEnabled;

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
        SoundBox.Content = Strings.T("opt_notification_sound");
        LanguageLabel.Text = Strings.T("language_label");
        SyncAddressLabel.Text = Strings.T("sync_address_label");
        SyncAddressHint.Text = Strings.T("sync_address_hint");
        BackupLabel.Text = Strings.T("backup_label");
        ExportButtonElement.Content = Strings.T("export_button");
        ImportButtonElement.Content = Strings.T("import_button");
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

    private void SoundBox_Changed(object sender, RoutedEventArgs e)
    {
        if (_initializing) return;
        _mainWindow.SetSoundEnabled(SoundBox.IsChecked == true);
    }

    private void ExportButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SaveFileDialog
        {
            Filter = Strings.T("backup_filter"),
            FileName = $"plantwidget-backup-{DateTime.Now:yyyy-MM-dd}.json",
        };
        if (dialog.ShowDialog(this) != true) return;

        try
        {
            _mainWindow.ExportBackup(dialog.FileName);
            ShowBackupStatus(Strings.T("export_success"));
        }
        catch
        {
            ShowBackupStatus(Strings.T("export_error"));
        }
    }

    private void ImportButton_Click(object sender, RoutedEventArgs e)
    {
        var openDialog = new OpenFileDialog { Filter = Strings.T("backup_filter") };
        if (openDialog.ShowDialog(this) != true) return;

        var confirm = new ConfirmWindow(Strings.T("import_confirm_message"), confirmText: Strings.T("import_confirm_button")) { Owner = this };
        if (confirm.ShowDialog() != true) return;

        try
        {
            _mainWindow.ImportBackup(openDialog.FileName);
            ShowBackupStatus(Strings.T("import_success"));
        }
        catch
        {
            ShowBackupStatus(Strings.T("import_error"));
        }
    }

    private void ShowBackupStatus(string message)
    {
        BackupStatusText.Text = message;
        BackupStatusText.Visibility = Visibility.Visible;
    }

    private void Close_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
