Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Lenovo\antigravity\evoscan-\public\assets\evofranklin_logo.png"
$img = [System.Drawing.Image]::FromFile($src)

function Make-Icon($size, $destPath) {
    $parent = Split-Path -Parent $destPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    $thumb = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($thumb)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    $thumb.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $thumb.Dispose()
    Write-Host "Created: $destPath ($size x $size)"
}

Make-Icon 48 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-mdpi\ic_launcher.png"
Make-Icon 48 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png"
Make-Icon 72 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-hdpi\ic_launcher.png"
Make-Icon 72 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png"
Make-Icon 96 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xhdpi\ic_launcher.png"
Make-Icon 96 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png"
Make-Icon 144 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
Make-Icon 144 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png"
Make-Icon 192 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
Make-Icon 192 "C:\Users\Lenovo\antigravity\evoscan-\android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png"
Make-Icon 512 "C:\Users\Lenovo\antigravity\evoscan-\android\playstore-assets\playstore_icon_512.png"

$img.Dispose()
Write-Host "All icons generated successfully!"
