# Script khoi dong nhanh Backend BovSmart Farm
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Tao junction ASCII neu chua co de tranh loi duong dan co dau tieng Viet tren Windows
if (-not (Test-Path "D:\bovsmart-farm")) {
    cmd /c mklink /J "D:\bovsmart-farm" (Resolve-Path "$currentDir\..").Path | Out-Null
}

if (Test-Path "D:\bovsmart-farm\backend") {
    Set-Location "D:\bovsmart-farm\backend"
}

Write-Host ">>> Dang khoi dong BovSmart Farm Spring Boot (Port 8081)..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run

