# macOS Tahoe (Web Replica)

This project is a browser-based replica of a modern macOS UI (tentatively named "Tahoe"). It focuses on fluid animations, frosted glass (glassmorphism) aesthetics, and interactive components that mimic the native Apple experience using pure HTML, CSS, and vanilla JavaScript.

> **Note:** This project is built using modern web standards (HTML5, Vanilla CSS, Vanilla JavaScript).

---

## 🌟 Key Features & Updates

### 🖥️ About This Mac
- **macOS Tahoe Styling**: Tailored specification modal representing the latest macOS Tahoe build.
- **Hardware Specs**: Shows Apple M5 Max chip, 36 GB Memory, 1 TB SSD storage, and custom MacBook Pro icon.
- **Window Behavior**: Draggable window layout that strictly closes via the red traffic light button without fading background side-effects.

### 📁 Functional Finder & File System
- **Global Mock File System (`window.mockFS`)**: Shared directory tree structure synced between Finder and Terminal.
- **Directory Traversal & Navigation**: Full history tracking with back (`<`) and forward (`>`) navigation arrows, clickable sidebar locations (*Applications*, *Downloads*, *Desktop*), and double-click folder opening.
- **Folder Creation & Inline Renaming**: Dedicated **New Folder** button and right-click context menu options to instantly create and rename directories inline.
- **View Modes**: Toggle seamlessly between **Large Icons (Grid View)** and **Compact List View**.

### 💻 Interactive Terminal App
- **Bash Shell Simulator**: Operates with a `guest@MacBook-Pro` prompt.
- **Supported Commands**: `ls`, `cd`, `mkdir`, `pwd`, `echo`, `clear`, `help`.
- **Dynamic Resize Header**: Dynamic header title bar updates column/row grid scale (e.g., `guest — bash — 80x24`) using a `ResizeObserver`.

### 🪟 Universal Window & Dock Management
- **8-Handle Window Resizing**: Every app window features active 8-direction resizing handles (`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`) with standard constraints (300x200 minimum).
- **Dock Indicator Dots**: Active running indicator dots beneath dock icons that persist when windows are minimized and vanish when closed.
- **Hover Top Bar**: Menu bar configured to gracefully reveal when hovered over for 500ms.
---

## 🛠️ Project Structure

- `index.html` - Base HTML structure containing the Desktop, Top Menu Bar, Dock, Control Center, and Window Templates.
- `style.css` - Global design tokens, layout styles, custom cursors, Dock magnification, and component styling.
- `css/window.css` - Window management styles, resizing handles, dark terminal theme, and Finder grid/list views.
- `js/main.js` - Global interaction handlers, clock timer, control center logic, and dock magnification.
- `js/window.js` - Window lifecycle manager, window dragging/resizing, Finder file browser, Terminal logic, and `mockFS` state.

---

## 🎨 Fonts

This project defaults to `SF Pro Display` for an authentic Apple aesthetic. 
If font files are missing from the `/fonts/` directory, the UI automatically falls back to native system fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
