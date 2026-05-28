@echo off
cd /d "%~dp0"
echo Installing dependencies...
call ".tools\node\npm.cmd" install
echo.
echo Seeding database...
call ".tools\node\npm.cmd" run seed:indexes
call ".tools\node\npm.cmd" run seed:admin
call ".tools\node\npm.cmd" run seed:academic
echo.
echo Done. Run dev.cmd to start the server.
