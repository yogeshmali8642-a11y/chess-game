@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
  if errorlevel 1 goto failed
)
echo Installing or checking dependencies...
.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto failed
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto failed
echo.
echo Knightfall Chess will open at http://127.0.0.1:8000
echo Keep this window open while playing. Press Ctrl+C to stop the server.
echo.
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
if errorlevel 1 goto failed
goto end
:failed
echo.
echo Setup failed. Check that Python is installed and that you have an internet connection.
pause
:end
endlocal
