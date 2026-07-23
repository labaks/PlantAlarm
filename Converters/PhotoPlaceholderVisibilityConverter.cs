using System;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Data;

namespace PlantWidget.Converters;

/// <summary>Plant photo path -> Visibility for the placeholder sprout glyph, shown only when there's no photo.</summary>
public class PhotoPlaceholderVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var path = value as string;
        return string.IsNullOrEmpty(path) || !File.Exists(path) ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
