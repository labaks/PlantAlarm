using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace PlantWidget.Converters;

public class FillClipConverter : IValueConverter
{
    private const double IconSize = 15;

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var fraction = value is double d ? Math.Clamp(d, 0.0, 1.0) : 0.0;
        var fillHeight = IconSize * fraction;
        return new RectangleGeometry(new Rect(0, IconSize - fillHeight, IconSize, fillHeight));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotSupportedException();
    }
}
