#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$hostsPath = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
$keep = Get-Content -LiteralPath $hostsPath | Where-Object {
  $_ -notmatch '^\s*# github-dns-fix' -and
  $_ -notmatch '^\s*140\.82\.121\.(3|6|10)\s+(github\.com|api\.github\.com|codeload\.github\.com)\s*$'
}
$keep | Set-Content -LiteralPath $hostsPath -Encoding ASCII
ipconfig /flushdns | Out-Null
Write-Host 'Removed GitHub hosts overrides and flushed DNS cache.'
