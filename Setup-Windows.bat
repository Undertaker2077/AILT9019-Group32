@echo off
cd /d "%~dp0"
py -3 -m venv .venv
if errorlevel 1 goto failed
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed
echo Setup complete. Double-click Start-Windows.bat.
pause
exit /b 0
:failed
echo Setup failed. Install Python 3.11 or newer with the Python launcher, then retry.
pause
exit /b 1
