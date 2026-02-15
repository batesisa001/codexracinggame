# Codex Racing 3D

A lightweight 3D racing game built with vanilla JavaScript + Three.js, split into small files and runnable with no build tools.

## Run
1. Double-click `index.html` to play immediately.
2. For service-worker offline caching (recommended), serve over localhost:
   - `python3 -m http.server 8000`
   - open `http://localhost:8000`

## Controls
- **W/S**: throttle / brake
- **A/D**: steer
- **Space**: handbrake / drift
- **C**: toggle chase cam / hood cam
- **R**: reset to last checkpoint
- **Esc**: pause / resume

## Troubleshooting
- If the start button appears unresponsive, hard refresh (Ctrl/Cmd+Shift+R) to clear stale service-worker cache.
- If audio is silent, press any key once (browser autoplay policy).
