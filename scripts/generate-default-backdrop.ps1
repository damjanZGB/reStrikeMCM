# Generates a 1920x1080 dark gradient JPG used as the fallback ceremony backdrop.
# Run once from the project root:
#   pwsh scripts/generate-default-backdrop.ps1
# Output: assets/backgrounds/default-backdrop.jpg
#
# The colours match the operator's CSS palette so the projector and the
# operator UI share a visual language.

Add-Type -AssemblyName System.Drawing

$width  = 1920
$height = 1080
$top    = [System.Drawing.Color]::FromArgb(255, 10, 10, 20)    # #0a0a14
$bot    = [System.Drawing.Color]::FromArgb(255, 26, 26, 46)    # #1a1a2e

$bmp = New-Object System.Drawing.Bitmap $width, $height
$g   = [System.Drawing.Graphics]::FromImage($bmp)

$rect  = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect, $top, $bot,
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)

$g.FillRectangle($brush, $rect)
$g.Dispose()

$outDir = Join-Path $PSScriptRoot ".." "assets" "backgrounds"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outPath = Join-Path $outDir "default-backdrop.jpg"

# JPEG quality 85
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]85
)

$bmp.Save($outPath, $jpegCodec, $encParams)
$bmp.Dispose()
$brush.Dispose()

Write-Host "Wrote $outPath ($([math]::Round((Get-Item $outPath).Length / 1KB, 1)) KB)"
