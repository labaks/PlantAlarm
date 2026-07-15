using System.Windows;
using System.Windows.Input;
using PlantWidget.Services;

namespace PlantWidget;

public partial class ConfirmWindow : Window
{
    public ConfirmWindow(string message, string? title = null, string? confirmText = null)
    {
        InitializeComponent();
        TitleText.Text = title ?? Strings.T("confirm_title");
        MessageText.Text = message;
        ConfirmButtonText.Content = confirmText ?? Strings.T("delete_button");
        CancelButtonText.Content = Strings.T("cancel_button");
    }

    private void Header_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
            DragMove();
    }

    private void Yes_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
    }

    private void No_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
    }
}
