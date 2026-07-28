# macOS Tahoe (Web Replica)

This project is a browser-based replica of a modern macOS UI. It uses HTML, CSS, and vanilla JavaScript to recreate frosted glass aesthetics, window management, and interactive components.

---

## Key Features & Updates

### About This Mac
- **macOS Tahoe Styling**: Specification modal representing the latest macOS build.
- **Hardware Specs**: Shows Apple M5 Max chip, 32 GB Memory, 1 TB SSD storage, and custom MacBook Pro icon.
- **Window Behavior**: Draggable window that closes via the red traffic light button without background fade.

### Functional Finder & File System
- **Mock File System (`window.mockFS`)**: Directory tree shared between Finder and Terminal.
- **Navigation**: History tracking with back (`<`) and forward (`>`) arrows, clickable sidebar locations, and double-click folder opening.
- **Folder Management**: **New Folder** button and right-click context menu to create and rename directories.
- **View Modes**: Toggle between **Large Icons (Grid View)** and **Compact List View**.

### Interactive Terminal App
- **Bash Shell Simulator**: Operates with a `guest@MacBook-Pro` prompt.
- **Supported Commands**: `ls`, `cd`, `mkdir`, `pwd`, `echo`, `clear`, `help`.
- **Dynamic Resize Header**: Header updates column/row grid scale (e.g., `guest — bash — 80x24`) using a `ResizeObserver`.

### Window & Dock Management
- **8-Handle Window Resizing**: App windows have 8-direction resizing handles (`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`) with a 300x200 minimum constraint.
- **Dock Indicator Dots**: Indicator dots beneath active dock icons persist when windows are minimized and vanish when closed.
- **Hover Top Bar**: Menu bar reveals after 500ms hover.

---

## Project Structure

- `index.html` - HTML structure with the Desktop, Menu Bar, Dock, Control Center, and Window Templates.
- `style.css` - Design tokens, layout styles, custom cursors, Dock magnification, and component styles.
- `css/window.css` - Window management styles, resizing handles, dark terminal theme, and Finder grid/list views.
- `js/main.js` - Interaction handlers, clock timer, control center logic, and dock magnification.
- `js/window.js` - Window lifecycle manager, dragging/resizing, Finder file browser, Terminal logic, and `mockFS` state.

---

## Fonts

This project defaults to `SF Pro Display`. 
If font files are missing from the `/fonts/` directory, the UI falls back to system fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
