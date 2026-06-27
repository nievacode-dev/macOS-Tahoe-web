# macOS Tahoe (Web Replica)

This project is an early-stage, browser-based replica of a modern macOS UI (tentatively named "Tahoe"). It focuses on fluid animations, frosted glass (glassmorphism) aesthetics, and interactive components that mimic the native Apple experience using pure HTML, CSS, and vanilla JavaScript.

> **Note:** This project is still in early development.

## Features

- **Dynamic macOS Dock**: Features incredibly smooth, Bezier-curve based magnification and bounce animations when hovering over icons.
- **Universal Window Management**: Click any app in the dock to open a draggable, translucent macOS window. Supports multiple overlapping windows with proper Z-index focus and real-time Dock active indicators.
- **Lock Screen**: A fully functional lock screen featuring a live clock, dynamic blurred background, and password unlock mechanism.
- **Hardware Notch**: A sleek, centered camera notch blending perfectly into the top menu bar.
- **Interactive Menu Bar**: 
  - **Apple & Finder Menus**: Fully styled drop-down context menus on the top left.
  - **Spotlight Search**: A large, centered search overlay summoned from the magnifying glass icon.
  - **Wi-Fi Menu**: A styled dropdown for network selection.
  - **Siri**: A glowing, animated Siri orb overlay.
  - **Notification Center**: A massive right-side panel that slides in, complete with Calendar and Weather widgets.
- **Control Center & Edit Mode**: A stunning, modular Control Center. Includes an advanced "Edit Mode" featuring widget jiggle animations, remove badges `(-)`, and a massive sliding Controls Gallery for adding new widgets `(+)`.
- **Desktop Context Menu**: Right-click anywhere on the desktop to summon a native-feeling context menu right at your cursor.

## Fonts

This project defaults to `SF Pro Display` for an authentic Apple look. 
If the font files are not present in the `/fonts/` directory, the UI will gracefully fall back to native system fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
