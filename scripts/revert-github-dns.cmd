@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0revert-github-dns.ps1"
pause
