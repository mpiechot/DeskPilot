# Persist Display And Touch Preferences

DeskPilot stores Standard/Touch layout, optional target display and optional kiosk-like mode together in the recoverable window settings file. Electron owns monitor discovery and safe work-area placement; the renderer receives only display descriptions and validated preferences.

This keeps operating-system display details out of React, preserves the existing window bounds when possible and moves the window onto the chosen display only when its saved position is outside that display.
