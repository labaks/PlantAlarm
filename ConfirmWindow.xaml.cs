using System.Windows;
using System.Windows.Input;

namespace PlantWidget;

public partial class ConfirmWindow : Window
{
    public ConfirmWindow(string message, string title = "Подтверждение", string confirmText = "Удалить")
    {
        InitializeComponent();
        TitleText.Text = title;
        MessageText.Text = message;
        ConfirmButtonText.Content = confirmText;
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
