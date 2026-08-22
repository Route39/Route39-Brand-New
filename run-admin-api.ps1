# Run Admin API locally (after building with: npx nx build admin-api --skip-nx-cache)
# Run this from: E:\Route39-Brand-New

$env:MYSQL_HOST         = "localhost"
$env:MYSQL_DB           = "bettersuite"
$env:MYSQL_USER         = "root"
$env:MYSQL_PASS         = "defaultpassword"
$env:MYSQL_PORT         = "3306"
$env:REDIS_HOST         = "localhost"
$env:REDIS_PORT         = "6380"
$env:REDIS_DB           = "0"
$env:REDIS_PASS         = ""
$env:REDIS_URL          = "redis://localhost:6380"
$env:ADMIN_API_PORT     = "3004"
$env:NODE_ENV           = "development"
$env:FORCE_SYNC_DB      = "true"
$env:STORAGE_DRIVER     = "local"
$env:ENCRYPTION_KEY     = "lPw3ethAy4WqnWa3b484bCdXUQCRifEH"
$env:PASSWORD_REQUIRED  = "true"
$env:DEMO_MODE          = "true"
$env:PASSKEY_RP_ID      = "localhost"
$env:PASSKEY_ORIGIN     = "http://localhost:3004"

Write-Host "Starting Admin API on http://localhost:3004 ..." -ForegroundColor Cyan
node apps/admin-api/dist/main.js
