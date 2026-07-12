Add-Type -AssemblyName System.Drawing

function Draw-PlantGlyph([System.Drawing.Graphics]$g, [double]$cx, [double]$cy, [double]$scale, [System.Drawing.Color]$potColor, [System.Drawing.Color]$potShadow, [System.Drawing.Color]$leafDark, [System.Drawing.Color]$leafLight) {
    # All coordinates below are authored against a 100-unit design box, then scaled+translated.
    function P([double]$x, [double]$y) {
        return New-Object System.Drawing.PointF (($cx + ($x - 50) * $scale), ($cy + ($y - 50) * $scale))
    }

    $potTop = 56.0; $potBottom = 92.0
    $potLeftTop = 28.0; $potRightTop = 72.0
    $potLeftBottom = 20.0; $potRightBottom = 80.0

    $potPoints = @( (P $potLeftTop $potTop), (P $potRightTop $potTop), (P $potRightBottom $potBottom), (P $potLeftBottom $potBottom) )
    $potBrush = New-Object System.Drawing.SolidBrush $potColor
    $g.FillPolygon($potBrush, $potPoints)

    $rimW = ($potRightTop - $potLeftTop) + 6
    $rimRect = New-Object System.Drawing.RectangleF ($cx + ($potLeftTop - 3 - 50) * $scale), ($cy + ($potTop - 5 - 50) * $scale), ($rimW * $scale), (7 * $scale)
    $rimBrush = New-Object System.Drawing.SolidBrush $potShadow
    $g.FillRectangle($rimBrush, $rimRect)

    $leaf1 = New-Object System.Drawing.SolidBrush $leafDark
    $leafRect1 = New-Object System.Drawing.RectangleF ($cx + (45 - 50) * $scale), ($cy + (10 - 50) * $scale), (12 * $scale), (42 * $scale)
    $g.FillEllipse($leaf1, $leafRect1)

    $leaf2 = New-Object System.Drawing.SolidBrush $leafLight
    $state = $g.Save()
    $g.TranslateTransform(($cx + (50 - 50) * $scale), ($cy + (34 - 50) * $scale))
    $g.RotateTransform(-38)
    $g.FillEllipse($leaf2, (-5 * $scale), (-30 * $scale), (11 * $scale), (30 * $scale))
    $g.Restore($state)

    $state2 = $g.Save()
    $g.TranslateTransform(($cx + (50 - 50) * $scale), ($cy + (34 - 50) * $scale))
    $g.RotateTransform(38)
    $g.FillEllipse($leaf2, (-6 * $scale), (-30 * $scale), (11 * $scale), (30 * $scale))
    $g.Restore($state2)
}

function Draw-PlantSilhouette([System.Drawing.Graphics]$g, [double]$cx, [double]$cy, [double]$scale, [System.Drawing.Color]$color) {
    Draw-PlantGlyph -g $g -cx $cx -cy $cy -scale $scale -potColor $color -potShadow $color -leafDark $color -leafLight $color
}

$outDir = "d:/Work/PlantWidget/mobile/assets"
$potColor = [System.Drawing.Color]::FromArgb(255, 0xB0, 0x6A, 0x3A)
$potShadow = [System.Drawing.Color]::FromArgb(255, 0x8F, 0x53, 0x2B)
$leafDark = [System.Drawing.Color]::FromArgb(255, 0x38, 0x8E, 0x3C)
$leafLight = [System.Drawing.Color]::FromArgb(255, 0x66, 0xBB, 0x6A)
$bgColor = [System.Drawing.Color]::FromArgb(255, 0x1E, 0x2B, 0x1C)

# 1. icon.png - 1024x1024, opaque dark-green background, glyph filling most of the canvas
$size = 1024
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($bgColor)
Draw-PlantGlyph -g $g -cx ($size/2) -cy ($size/2) -scale ($size/100.0*0.9) -potColor $potColor -potShadow $potShadow -leafDark $leafDark -leafLight $leafLight
$g.Dispose()
$bmp.Save("$outDir/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 2. android-icon-foreground.png - 1024x1024, transparent, glyph within the ~66% safe zone
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
Draw-PlantGlyph -g $g -cx ($size/2) -cy ($size/2) -scale ($size/100.0*0.55) -potColor $potColor -potShadow $potShadow -leafDark $leafDark -leafLight $leafLight
$g.Dispose()
$bmp.Save("$outDir/android-icon-foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 3. android-icon-background.png - 1024x1024, solid fill, no glyph
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear($bgColor)
$g.Dispose()
$bmp.Save("$outDir/android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 4. android-icon-monochrome.png - 1024x1024, transparent, white silhouette within safe zone
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
Draw-PlantSilhouette -g $g -cx ($size/2) -cy ($size/2) -scale ($size/100.0*0.55) -color ([System.Drawing.Color]::White)
$g.Dispose()
$bmp.Save("$outDir/android-icon-monochrome.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 5. favicon.png - 48x48, downsized icon.png
$src = [System.Drawing.Image]::FromFile("$outDir/icon.png")
$fav = New-Object System.Drawing.Bitmap 48, 48
$gf = [System.Drawing.Graphics]::FromImage($fav)
$gf.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gf.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gf.DrawImage($src, 0, 0, 48, 48)
$gf.Dispose()
$fav.Save("$outDir/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fav.Dispose()
$src.Dispose()

# 6. splash-icon.png - reuse icon at a moderate size on transparent bg for splash screen
$size2 = 400
$bmp = New-Object System.Drawing.Bitmap $size2, $size2
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
Draw-PlantGlyph -g $g -cx ($size2/2) -cy ($size2/2) -scale ($size2/100.0*0.8) -potColor $potColor -potShadow $potShadow -leafDark $leafDark -leafLight $leafLight
$g.Dispose()
$bmp.Save("$outDir/splash-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Icons written to $outDir"
