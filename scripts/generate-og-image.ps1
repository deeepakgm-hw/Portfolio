Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Dark Background
$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 18, 15))
$g.FillRectangle($bgBrush, 0, 0, 1200, 630)

# Subtle Vignette / Gradient
$glowBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 1200, 630), ([System.Drawing.Color]::FromArgb(35, 26, 60)), ([System.Drawing.Color]::FromArgb(20, 18, 15))
$g.FillRectangle($glowBrush, 0, 0, 1200, 630)

# Palette
$violet = [System.Drawing.Color]::FromArgb(108, 92, 231)
$cream = [System.Drawing.Color]::FromArgb(240, 235, 224)
$muted = [System.Drawing.Color]::FromArgb(163, 155, 139)
$ember = [System.Drawing.Color]::FromArgb(184, 69, 31)

$violetPen = New-Object System.Drawing.Pen $violet, 2
$creamBrush = New-Object System.Drawing.SolidBrush $cream
$violetBrush = New-Object System.Drawing.SolidBrush $violet
$mutedBrush = New-Object System.Drawing.SolidBrush $muted

# Typography with explicit [float] size
$fontMonoSmall = [System.Drawing.Font]::new('Consolas', [float]13, [System.Drawing.FontStyle]::Bold)
$fontMonoKicker = [System.Drawing.Font]::new('Consolas', [float]18, [System.Drawing.FontStyle]::Bold)
$fontHeadline = [System.Drawing.Font]::new('Arial', [float]44, [System.Drawing.FontStyle]::Bold)

# Availability Badge
$badgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(60, 240, 235, 224)), 1
$g.DrawRectangle($badgePen, 80, 70, 340, 34)
$greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(46, 204, 113))
$g.FillEllipse($greenBrush, 96, 82, 10, 10)
$g.DrawString('AVAILABLE FOR SELECT PROJECTS', $fontMonoSmall, $mutedBrush, [float]116, [float]78)

# Kicker
$g.DrawString('DEEPAK GM // SOFTWARE ENGINEER', $fontMonoKicker, $violetBrush, [float]80, [float]150)

# Main Headline
$g.DrawString('BUILDING SYSTEMS', $fontHeadline, $creamBrush, [float]80, [float]215)
$g.DrawString('THAT SCALE,', $fontHeadline, $violetBrush, [float]80, [float]285)
$g.DrawString('FROM DATABASE TO PIXEL.', $fontHeadline, $creamBrush, [float]80, [float]355)

# Separator Line
$sepBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 80, 470), (New-Object System.Drawing.Point 1120, 470), $violet, $ember
$sepPen = New-Object System.Drawing.Pen $sepBrush, 2
$g.DrawLine($sepPen, 80, 470, 1120, 470)

# Footer info
$g.DrawString('BASED IN BENGALURU, INDIA - WORKING WORLDWIDE', $fontMonoSmall, $mutedBrush, [float]80, [float]500)

# Right Geometric Wireframe Polygon
$cx = 950
$cy = 280
$r = 130
$pts = @()
for ($i = 0; $i -lt 6; $i++) {
    $angle = [Math]::PI / 3 * $i - [Math]::PI / 6
    $px = $cx + $r * [Math]::Cos($angle)
    $py = $cy + $r * [Math]::Sin($angle)
    $pts += New-Object System.Drawing.PointF $px, $py
}
$g.DrawPolygon($violetPen, $pts)

for ($i = 0; $i -lt 3; $i++) {
    $g.DrawLine($violetPen, $pts[$i], $pts[$i + 3])
}

$r2 = 75
$pts2 = @()
for ($i = 0; $i -lt 6; $i++) {
    $angle = [Math]::PI / 3 * $i - [Math]::PI / 6
    $px = $cx + $r2 * [Math]::Cos($angle)
    $py = $cy + $r2 * [Math]::Sin($angle)
    $pts2 += New-Object System.Drawing.PointF $px, $py
}
$emberPen = New-Object System.Drawing.Pen $ember, 1.5
$g.DrawPolygon($emberPen, $pts2)
$g.FillEllipse($creamBrush, [float]($cx - 4), [float]($cy - 4), [float]8, [float]8)

$outDir = 'client/assets'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir }
$bmp.Save('client/assets/og-image.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Output 'client/assets/og-image.png generated successfully.'
