param([string]$CompilerPath = '')
$ErrorActionPreference = 'Stop'
if (-not $CompilerPath) {
    $CompilerPath = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
}
if (-not (Test-Path -LiteralPath $CompilerPath -PathType Leaf)) {
    throw '未找到 .NET Framework C# 编译器。指定 -CompilerPath，或继续使用随源码提供的 IMO_Launcher.exe。'
}
$launcherSource = Join-Path $PSScriptRoot 'LocalLauncher.cs'
$launcherOutput = Join-Path $PSScriptRoot 'IMO_Launcher.exe'
& $CompilerPath /nologo /target:winexe /optimize+ /codepage:65001 /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll "/out:$launcherOutput" $launcherSource
if ($LASTEXITCODE -ne 0) { throw '启动器编译失败。' }
Write-Output "启动器已生成：$launcherOutput"
