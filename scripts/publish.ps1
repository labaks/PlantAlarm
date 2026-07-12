# Builds a single self-contained PlantWidget.exe that runs on any Windows PC
# without requiring .NET to be installed. Output goes to .\publish.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

dotnet publish PlantWidget.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o publish

Write-Output ""
Write-Output "Готово: publish\PlantWidget.exe"
