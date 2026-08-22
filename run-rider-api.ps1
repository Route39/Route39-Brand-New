# Run Rider API locally

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
$env:RIDER_API_PORT     = "4000"
$env:NODE_ENV           = "development"
$env:FORCE_SYNC_DB      = "false"
$env:STORAGE_DRIVER     = "local"
$env:ENCRYPTION_KEY     = "lPw3ethAy4WqnWa3b484bCdXUQCRifEH"
$env:PASSWORD_REQUIRED  = "true"
$env:DEMO_MODE          = "false"
$env:PASSKEY_RP_ID      = "localhost"
$env:PASSKEY_ORIGIN     = "http://localhost:4000"
$env:GOOGLE_MAPS_API_KEY = "AIzaSyBGf_LU9A72EG-JeG9jrPHn0lo66Nhc5Ig"
$env:GOOGLE_ROUTES_API_KEY = "AIzaSyBGf_LU9A72EG-JeG9jrPHn0lo66Nhc5Ig"

Write-Host "Starting Rider API on http://localhost:4000 ..." -ForegroundColor Cyan
node apps/rider-api/dist/main.js
