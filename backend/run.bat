@echo off
title BovSmart Farm Backend (Port 8081)
cd /d "%~dp0"

REM Kiem tra hoac tao junction ASCII de tranh loi duong dan tieng Viet tren Windows
if not exist "D:\bovsmart-farm" (
    mklink /J "D:\bovsmart-farm" "%~dp0.." >nul 2>&1
)

if exist "D:\bovsmart-farm\backend" (
    cd /d "D:\bovsmart-farm\backend"
)

echo Dang khoi dong BovSmart Farm Spring Boot tren cong 8081...
call .\mvnw.cmd spring-boot:run
pause

