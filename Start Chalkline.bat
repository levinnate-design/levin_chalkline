@echo off
rem Windows: double-click this file to open the site at http://localhost:4100
rem The first time, it sets up Python packages (a few minutes). Close this window to stop the site.

cd /d "%~dp0"

where quarto >nul 2>nul
if errorlevel 1 (
  echo Quarto isn't installed. Get it from https://quarto.org/docs/get-started/ and try again.
  pause & exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo First run: setting up Python packages. This takes a few minutes...
  python -m venv .venv && ".venv\Scripts\python.exe" -m pip install -q -r requirements.txt
  if errorlevel 1 (
    echo Setup failed. Is Python 3 installed, with "Add python.exe to PATH" ticked?
    rmdir /s /q .venv & pause & exit /b 1
  )
)

set "QUARTO_PYTHON=%CD%\.venv\Scripts\python.exe"
rem Full build first if anything changed, so pages open fast
"%QUARTO_PYTHON%" chalkline.py build --profile teacher
echo Starting Chalkline (teacher version) at http://localhost:4100
echo Leave this window open while you work. Close it to stop the site.
rem The teacher version: answer keys and notes included
quarto preview --profile teacher
