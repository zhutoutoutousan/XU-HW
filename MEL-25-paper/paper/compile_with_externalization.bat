@echo off
echo Compiling LaTeX document with TikZ externalization...
echo.

REM Clean previous externalized files
if exist "*.dpth" del *.dpth
if exist "*.log" del *.log
if exist "*.aux" del *.aux
if exist "*.fdb_latexmk" del *.fdb_latexmk
if exist "*.fls" del *.fls
if exist "*.synctex.gz" del *.synctex.gz

REM Compile with shell-escape for TikZ externalization
echo First compilation...
pdflatex -shell-escape -interaction=nonstopmode main.tex

echo Second compilation...
pdflatex -shell-escape -interaction=nonstopmode main.tex

echo Third compilation...
pdflatex -shell-escape -interaction=nonstopmode main.tex

echo.
echo Compilation complete! Check main.pdf for the result.
pause 