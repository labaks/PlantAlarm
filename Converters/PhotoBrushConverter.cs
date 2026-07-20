using System;
using System.Globalization;
using System.IO;
using System.Windows.Data;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace PlantWidget.Converters;

/// <summary>Plant photo path -> Brush for an Ellipse.Fill; transparent (so the placeholder glyph shows through) when there's no photo.</summary>
public class PhotoBrushConverter : IValueConverter
{
    public static Brush ToBrush(string? path)
    {
        if (string.IsNullOrEmpty(path) || !File.Exists(path))
            return Brushes.Transparent;

        try
        {
            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.UriSource = new Uri(path, UriKind.Absolute);
            bitmap.EndInit();
            bitmap.Freeze();
            return new ImageBrush(bitmap) { Stretch = Stretch.UniformToFill };
        }
        catch
        {
            return Brushes.Transparent;
        }
    }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture) =>
        ToBrush(value as string);

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
