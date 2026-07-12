using System;
using System.Windows;
using WF = System.Windows.Forms;

namespace PlantWidget;

public partial class App : Application
{
    private static WF.NotifyIcon? _trayIcon;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _trayIcon = new WF.NotifyIcon
        {
            Icon = LoadTrayIcon(),
            Visible = true,
            Text = "Полив цветов"
        };

        var menu = new WF.ContextMenuStrip();
        menu.Items.Add("Показать виджет", null, (_, _) => ShowMainWindow());
        menu.Items.Add(new WF.ToolStripSeparator());
        menu.Items.Add("Выход", null, (_, _) => ExitApp());
        _trayIcon.ContextMenuStrip = menu;
        _trayIcon.DoubleClick += (_, _) => ShowMainWindow();
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
