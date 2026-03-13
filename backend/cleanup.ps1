$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "9041983812781227"
$env:DB_NAME = "esteetade"

cd "c:\Users\USER\Desktop\Do not Open\SaaS Backend Build\backend"
node migrations/cleanup.js

