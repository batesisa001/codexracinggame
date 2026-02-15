# Codex Racing 3D

A lightweight 3D racing game built with vanilla JavaScript + Three.js, split into small modules and runnable with no build tools.

## Run
1. Open `index.html` in a modern browser for instant play.
2. For service-worker offline caching, serve the folder over localhost (required by browsers):
   - `python3 -m http.server 8000`
   - then visit `http://localhost:8000`

## Controls
- **W/S**: throttle / brake
- **A/D**: steer
- **Space**: handbrake / drift
- **C**: toggle chase cam / hood cam
- **R**: reset to last checkpoint
- **Esc**: pause / resume

## Features
- Title screen with **2 tracks**, **2 car presets**, and **AI difficulty**.
- 3-lap race flow with checkpoint validation, countdown, and results.
- Arcade handling physics: speed-sensitive steering, grip, drift behavior, and barrier collision.
- 3 AI opponents following the racing line with turn-speed control and separation behavior.
- HUD with speed, lap, race position, timer, lap splits, and minimap.
- Procedural environment (road mesh, guardrails, trees, sky gradient).
- Engine audio synthesized with WebAudio.
- Service Worker caches local files and fetched CDN assets for offline use after first run.

## Troubleshooting
- **Black screen / modules blocked**: use a localhost server instead of `file://`.
- **No audio**: browsers require a keypress before audio starts.
- **Service worker not active**: refresh once after first load on localhost.
