# Separate Unsigned And Signed Installers

DeskPilot uses electron-builder with NSIS for local Windows installer generation. `package:windows` produces an explicitly unsigned test installer. `package:windows:signed` requires `CSC_LINK` and `CSC_KEY_PASSWORD` and stops before packaging when either credential is absent.

The application defaults to the Productive data profile when running as an installed Electron application. Signing readiness is implemented, but a real Authenticode-signed artifact cannot exist until a code-signing certificate is supplied.
