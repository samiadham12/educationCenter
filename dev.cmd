@echo off
cd /d "%~dp0"
echo Using Node from .tools\node\
call ".tools\node\npm.cmd" run dev
