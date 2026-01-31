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
    Write-Host "Login failed: $_" -ForegroundColor Red
    exit
}

$headers = @{
    'x-auth-token' = $token
}

# 2. Create Dummy Tournament
Write-Host "`nCreating Test Tournament..." -ForegroundColor Cyan
$createBody = @{
    title                 = "DELETE ME PRO"
    description           = "Temporary match for deletion test"
    format                = "Solo"
    registration_deadline = "2025-12-31"
    start_date            = "2026-01-01"
    scoring_params        = @{ kill_points = 1 }
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/tournaments/create" -Method Post -Headers $headers -Body $createBody -ContentType "application/json"
    $tournamentId = $createResponse.id
    Write-Host "Tournament Created. ID: $tournamentId" -ForegroundColor Green
}
catch {
    Write-Host "Create failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $msg = $reader.ReadToEnd()
            Write-Host "Body: $msg" -ForegroundColor Red
        }
    }
    exit
}

# 3. Delete Tournament
Write-Host "`nDeleting Tournament $tournamentId..." -ForegroundColor Cyan
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/tournaments/$tournamentId" -Method Delete -Headers $headers
    Write-Host "Delete Response: $($deleteResponse.message)" -ForegroundColor Green
}
catch {
    Write-Host "Delete failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $msg = $reader.ReadToEnd()
            Write-Host "Body: $msg" -ForegroundColor Red
        }
    }
}
