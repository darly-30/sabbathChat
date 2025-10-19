# Script PowerShell para iniciar Backend + Frontend
# Uso: .\scripts\dev.ps1

# Configuración de colores
$colors = @{
    Reset  = "`e[0m"
    Bright = "`e[1m"
    Cyan   = "`e[36m"
    Green  = "`e[32m"
    Yellow = "`e[33m"
    Blue   = "`e[34m"
    Red    = "`e[31m"
    Magenta = "`e[35m"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("$($colors.Cyan)" + ("=" * 60) + "$($colors.Reset)")
    Write-Host "$($colors.Bright)$($colors.Cyan)$Title$($colors.Reset)"
    Write-Host ("$($colors.Cyan)" + ("=" * 60) + "$($colors.Reset)")
    Write-Host ""
}

function Write-Colored {
    param([string]$Color, [string]$Message)
    Write-Host "$($colors[$Color])$Message$($colors.Reset)"
}

function Check-Backend-Ready {
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Backend no está listo aún
        }
        
        $attempt++
        Start-Sleep -Milliseconds 500
    }
    
    return $false
}

# Main Script
Clear-Host
Write-Section "🌟 Iniciando aplicación completa..."
Write-Colored "Magenta" "   Backend → Frontend`n"

# Iniciar Backend Python
Write-Section "🚀 Iniciando Backend Python..."
Write-Colored "Blue" "   Comando: python backend/app.py"
Write-Colored "Blue" "   Puerto: 5000"
Write-Colored "Blue" "   URL: http://localhost:5000`n"

$backendProcess = Start-Process -FilePath "python" -ArgumentList "backend/app.py" -WorkingDirectory $PSScriptRoot\.. -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\backend-stdout.log" -RedirectStandardError "$env:TEMP\backend-stderr.log"

Write-Colored "Yellow" "   ⏳ Esperando a que el backend esté listo...`n"

# Esperar a que backend esté listo
if (Check-Backend-Ready) {
    Write-Colored "Green" "   ✅ Backend listo en http://localhost:5000`n"
} else {
    Write-Colored "Red" "   ❌ No se pudo conectar al backend"
    $backendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    exit 1
}

# Iniciar Frontend Next.js
Write-Section "🎨 Iniciando Frontend Next.js..."
Write-Colored "Blue" "   Puerto: 3000"
Write-Colored "Blue" "   URL: http://localhost:3000`n"

$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev:frontend" -WorkingDirectory $PSScriptRoot\.. -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\frontend-stdout.log" -RedirectStandardError "$env:TEMP\frontend-stderr.log"

Write-Section "✨ Aplicación completamente iniciada"
Write-Colored "Green" "   Backend:  http://localhost:5000"
Write-Colored "Green" "   Frontend: http://localhost:3000`n"
Write-Colored "Cyan" "   Presiona Ctrl+C para detener`n"
Write-Colored "Cyan" "   Mostrando logs en tiempo real...`n"

# Job para mostrar logs del backend
$backendJob = Start-Job -ScriptBlock {
    param($logPath, $colors)
    $lastPosition = 0
    
    while ($true) {
        if (Test-Path $logPath) {
            $currentContent = Get-Content $logPath -Raw
            if ($currentContent.Length -gt $lastPosition) {
                $newContent = $currentContent.Substring($lastPosition)
                $newContent -split "`n" | ForEach-Object {
                    if ($_.Trim()) {
                        Write-Host "$($colors.Cyan)[BACKEND] $_$($colors.Reset)"
                    }
                }
                $lastPosition = $currentContent.Length
            }
        }
        Start-Sleep -Milliseconds 100
    }
} -ArgumentList "$env:TEMP\backend-stdout.log", $colors

# Job para mostrar logs del frontend
$frontendJob = Start-Job -ScriptBlock {
    param($logPath, $colors)
    $lastPosition = 0
    
    while ($true) {
        if (Test-Path $logPath) {
            $currentContent = Get-Content $logPath -Raw
            if ($currentContent.Length -gt $lastPosition) {
                $newContent = $currentContent.Substring($lastPosition)
                $newContent -split "`n" | ForEach-Object {
                    if ($_.Trim()) {
                        Write-Host "$($colors.Magenta)[FRONTEND] $_$($colors.Reset)"
                    }
                }
                $lastPosition = $currentContent.Length
            }
        }
        Start-Sleep -Milliseconds 100
    }
} -ArgumentList "$env:TEMP\frontend-stdout.log", $colors

# Mantener los procesos corriendo
try {
    while ($true) {
        if (!$backendProcess.HasExited) {
            # Backend sigue corriendo
        } else {
            Write-Colored "Yellow" "⚠️  Backend terminó inesperadamente"
            break
        }
        
        if (!$frontendProcess.HasExited) {
            # Frontend sigue corriendo
        } else {
            Write-Colored "Yellow" "⚠️  Frontend terminó inesperadamente"
            break
        }
        
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Section "🛑 Deteniendo aplicación..."
    Write-Colored "Yellow" "   Cerrando backend y frontend...`n"
    
    $backendJob | Stop-Job -PassThru | Remove-Job -Force -ErrorAction SilentlyContinue
    $frontendJob | Stop-Job -PassThru | Remove-Job -Force -ErrorAction SilentlyContinue
    
    $backendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    $frontendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
    
    # Limpiar archivos temporales de logs
    Remove-Item "$env:TEMP\backend-stdout.log" -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\backend-stderr.log" -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\frontend-stdout.log" -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\frontend-stderr.log" -Force -ErrorAction SilentlyContinue
    
    Write-Colored "Green" "   ✅ Aplicación detenida`n"
}
