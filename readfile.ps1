$content = Get-Content "c:\Users\USER\Desktop\Do not Open\SaaS Backend Build\backend\src\index.js" -Raw
$lines = $content -split "`n"
$lines[150..179] | ForEach-Object { Write-Host $_ }
