Write-Host "Compiling LaTeX document with TikZ externalization..." -ForegroundColor Green
Write-Host ""

# Clean previous externalized files
$filesToClean = @("*.dpth", "*.log", "*.aux", "*.fdb_latexmk", "*.fls", "*.synctex.gz")
foreach ($pattern in $filesToClean) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Force
}

# Compile with shell-escape for TikZ externalization
Write-Host "First compilation..." -ForegroundColor Yellow
pdflatex -shell-escape -interaction=nonstopmode main.tex

Write-Host "Second compilation..." -ForegroundColor Yellow
pdflatex -shell-escape -interaction=nonstopmode main.tex

Write-Host "Third compilation..." -ForegroundColor Yellow
pdflatex -shell-escape -interaction=nonstopmode main.tex

Write-Host ""
Write-Host "Compilation complete! Check main.pdf for the result." -ForegroundColor Green
Read-Host "Press Enter to continue" 