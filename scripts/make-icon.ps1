Add-Type -AssemblyName System.Drawing

function New-PlantBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $potColor = [System.Drawing.Color]::FromArgb(255, 0xB0, 0x6A, 0x3A)
    $potShadow = [System.Drawing.Color]::FromArgb(255, 0x8F, 0x53, 0x2B)
    $leafDark = [System.Drawing.Color]::FromArgb(255, 0x38, 0x8E, 0x3C)
    $leafLight = [System.Drawing.Color]::FromArgb(255, 0x66, 0xBB, 0x6A)

    # Pot (trapezoid), bottom ~42% of the canvas
    $potTop = $size * 0.56
    $potBottom = $size * 0.92
    $potLeftTop = $size * 0.28
    $potRightTop = $size * 0.72
    $potLeftBottom = $size * 0.20
    $potRightBottom = $size * 0.80

    $potPoints = @(
        (New-Object System.Drawing.PointF $potLeftTop, $potTop),
        (New-Object System.Drawing.PointF $potRightTop, $potTop),
        (New-Object System.Drawing.PointF $potRightBottom, $potBottom),
        (New-Object System.Drawing.PointF $potLeftBottom, $potBottom)
    )
    $potBrush = New-Object System.Drawing.SolidBrush $potColor
    $g.FillPolygon($potBrush, $potPoints)

    # Pot rim
    $rimRect = New-Object System.Drawing.RectangleF ($potLeftTop - $size*0.03), ($potTop - $size*0.05), (($potRightTop - $potLeftTop) + $size*0.06), ($size*0.07)
    $rimBrush = New-Object System.Drawing.SolidBrush $potShadow
    $g.FillRectangle($rimBrush, $rimRect)

    # Leaves: three overlapping ellipses forming a sprout
    $cx = $size * 0.5
    $leafTopY = $size * 0.10

    $leaf1 = New-Object System.Drawing.SolidBrush $leafDark
    $g.FillEllipse($leaf1, ($cx - $size*0.05), $leafTopY, ($size*0.12), ($size*0.42))

    $leaf2 = New-Object System.Drawing.SolidBrush $leafLight
    $state = $g.Save()
    $g.TranslateTransform($cx, $size*0.34)
    $g.RotateTransform(-38)
    $g.FillEllipse($leaf2, (-$size*0.05), (-$size*0.30), ($size*0.11), ($size*0.30))
    $g.Restore($state)

    $state2 = $g.Save()
    $g.TranslateTransform($cx, $size*0.34)
    $g.RotateTransform(38)
    $g.FillEllipse($leaf2, (-$size*0.06), (-$size*0.30), ($size*0.11), ($size*0.30))
    $g.Restore($state2)

    $g.Dispose()
    return $bmp
}

function ConvertTo-PngBytes([System.Drawing.Bitmap]$bmp) {
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    return $ms.ToArray()
}

$sizes = @(16, 32, 48, 256)
$images = @()
foreach ($s in $sizes) {
    $bmp = New-PlantBitmap $s
    $png = ConvertTo-PngBytes $bmp
    $images += [PSCustomObject]@{ Size = $s; Bytes = $png }
    $bmp.Dispose()
}

$outPath = "d:/Work/PlantWidget/Assets/app.ico"

$buffer = New-Object System.Collections.Generic.List[byte]
function Add-Bytes([System.Collections.Generic.List[byte]]$list, [byte[]]$bytes) {
    for ($i = 0; $i -lt $bytes.Length; $i++) { $list.Add($bytes[$i]) }
}

# ICONDIR (6 bytes)
Add-Bytes $buffer ([BitConverter]::GetBytes([UInt16]0))          # reserved
Add-Bytes $buffer ([BitConverter]::GetBytes([UInt16]1))          # type = icon
Add-Bytes $buffer ([BitConverter]::GetBytes([UInt16]$images.Count))

$headerSize = 6
$entrySize = 16
$offset = $headerSize + ($entrySize * $images.Count)

foreach ($img in $images) {
    $sizeByte = if ($img.Size -ge 256) { 0 } else { $img.Size }
    $buffer.Add([byte]$sizeByte)   # width
    $buffer.Add([byte]$sizeByte)   # height
    $buffer.Add([byte]0)           # color count
    $buffer.Add([byte]0)           # reserved
    Add-Bytes $buffer ([BitConverter]::GetBytes([UInt16]1))            # planes
    Add-Bytes $buffer ([BitConverter]::GetBytes([UInt16]32))           # bit count
    Add-Bytes $buffer ([BitConverter]::GetBytes([UInt32]$img.Bytes.Length))
    Add-Bytes $buffer ([BitConverter]::GetBytes([UInt32]$offset))
    $offset += $img.Bytes.Length
}

foreach ($img in $images) {
    Add-Bytes $buffer $img.Bytes
}

[System.IO.File]::WriteAllBytes($outPath, $buffer.ToArray())

Write-Output "Icon written to $outPath ($($buffer.Count) bytes)"
