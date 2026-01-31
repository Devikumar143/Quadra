$baseUrl = "http://localhost:5001/api"
$email = "player@university.edu"
$password = "password123"

# 1. Login
Write-Host "Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Successful. Token received." -ForegroundColor Green
}
catch {
    Write-Error "Login failed: $_"
    exit
}

$headers = @{
    Authorization = "Bearer $token"
}

# 2. Archive Season (Admin Action - assuming player is admin or middleware allows for test)
Write-Host "`nArchiving Season 0: BETA..." -ForegroundColor Cyan
$archiveBody = @{
    seasonLabel = "SEASON 0: BETA"
    topCount    = 10
} | ConvertTo-Json

try {
    $archiveResponse = Invoke-RestMethod -Uri "$baseUrl/seasons/archive" -Method Post -Headers $headers -Body $archiveBody -ContentType "application/json"
    Write-Host "Archival Success: $($archiveResponse.message)" -ForegroundColor Green
}
catch {
    Write-Error "Archival failed: $_"
}

# 3. Fetch History
Write-Host "`nFetching Season History..." -ForegroundColor Cyan
try {
    $historyResponse = Invoke-RestMethod -Uri "$baseUrl/seasons/history" -Method Get -Headers $headers
    Write-Host "History Fetched: $($historyResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Green
}
catch {
    Write-Error "Fetch History failed: $_"
}

# 4. Fetch Specific Season Legends
Write-Host "`nFetching Legends for SEASON 0: BETA..." -ForegroundColor Cyan
try {
    $legendsResponse = Invoke-RestMethod -Uri "$baseUrl/seasons/SEASON%200%3A%20BETA" -Method Get -Headers $headers
    Write-Host "Legends Count: $($legendsResponse.Count)" -ForegroundColor Green
}
catch {
    Write-Error "Fetch Legends failed: $_"
}
