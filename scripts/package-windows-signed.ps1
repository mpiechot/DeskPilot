$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:CSC_LINK) -or [string]::IsNullOrWhiteSpace($env:CSC_KEY_PASSWORD)) {
  Write-Error "Signed packaging requires CSC_LINK and CSC_KEY_PASSWORD. No unsigned installer was labeled as signed."
  exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

npx electron-builder --win nsis
exit $LASTEXITCODE
