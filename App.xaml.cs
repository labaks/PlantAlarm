using System;
using System.Windows;
using PlantWidget.Services;
using WF = System.Windows.Forms;

namespace PlantWidget;

public partial class App : Application
{
    private static WF.NotifyIcon? _trayIcon;
    private static WF.ToolStripMenuItem? _trayShowItem;
    private static WF.ToolStripMenuItem? _trayExitItem;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        Strings.Init(new SettingsStore().Load().Language);

        _trayIcon = new WF.NotifyIcon
        {
            Icon = LoadTrayIcon(),
            Visible = true,
            Text = Strings.T("tray_text")
        };

        _trayShowItem = new WF.ToolStripMenuItem(Strings.T("tray_show"), null, (_, _) => ShowMainWindow());
        _trayExitItem = new WF.ToolStripMenuItem(Strings.T("tray_exit"), null, (_, _) => ExitApp());
        var menu = new WF.ContextMenuStrip();
        menu.Items.Add(_trayShowItem);
        menu.Items.Add(new WF.ToolStripSeparator());
        menu.Items.Add(_trayExitItem);
        _trayIcon.ContextMenuStrip = menu;
        _trayIcon.DoubleClick += (_, _) => ShowMainWindow();

        Strings.LanguageChanged += () =>
        {
            _trayIcon.Text = Strings.T("tray_text");
            _trayShowItem.Text = Strings.T("tray_show");
            _trayExitItem.Text = Strings.T("tray_exit");
        };
    }

    private static System.Drawing.Icon LoadTrayIcon()
    {
        try
        {
            var uri = new Uri("pack://application:,,,/Assets/app.ico");
            var streamInfo = GetResourceStream(uri);
            if (streamInfo != null)
                return new System.Drawing.Icon(streamInfo.Stream);
        }
        catch
        {
            // Fall through to the default system icon below.
        }
        return System.Drawing.SystemIcons.Application;
    }

    private void ShowMainWindow()
    {
        if (MainWindow == null) return;
        MainWindow.Show();
        MainWindow.WindowState = WindowState.Normal;
        MainWindow.Activate();
    }

    private void ExitApp()
    {
        if (MainWindow is MainWindow mw) mw.AllowClose = true;
        if (_trayIcon != null)
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
        }
        Shutdown();
    }

    public static void ShowNotification(string title, string text)
    {
        _trayIcon?.ShowBalloonTip(5000, title, text, WF.ToolTipIcon.Info);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _trayIcon?.Dispose();
        base.OnExit(e);
    }
}
