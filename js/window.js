// --- Window Management ---
document.addEventListener('DOMContentLoaded', () => {
    const dockIcons = document.querySelectorAll('.dock-icon-wrapper');
    const template = document.getElementById('window-template');
    const desktop = document.querySelector('.desktop');
    
    let highestZIndex = 50;
    const runningApps = {}; 
    
    // Dragging state
    let activeWindow = null;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Global drag listeners
    document.addEventListener('mousemove', (e) => {
        if (isDragging && activeWindow && !activeWindow.classList.contains('maximized')) {
            activeWindow.style.left = `${e.clientX - dragOffsetX}px`;
            activeWindow.style.top = `${e.clientY - dragOffsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            activeWindow = null;
            document.body.style.userSelect = '';
        }
    });

    function bringToFront(winElement) {
        highestZIndex++;
        winElement.style.zIndex = highestZIndex;
    }

    function createWindow(appName, iconImg, dockWrapper) {
        // Clone template
        const winNode = template.content.cloneNode(true);
        const macWindow = winNode.querySelector('.macos-window');
        
        // Setup content
        const windowTitle = macWindow.querySelector('.window-title');
        const windowBody = macWindow.querySelector('.window-body');
        const sidebarItem = macWindow.querySelector('.sidebar-item.active');
        
        windowTitle.textContent = appName;
        windowBody.innerHTML = `<img src="${iconImg}" alt="${appName}" class="window-app-icon">`;
        if (sidebarItem) {
            sidebarItem.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${appName}`;
        }
        
        // Random cascading offset for new windows
        const offset = (Object.keys(runningApps).length * 30) % 200;
        macWindow.style.left = `${150 + offset}px`;
        macWindow.style.top = `${100 + offset}px`;
        
        bringToFront(macWindow);
        
        // Setup controls
        const btnClose = macWindow.querySelector('.btn-close');
        const btnMinimize = macWindow.querySelector('.btn-minimize');
        const btnMaximize = macWindow.querySelector('.btn-maximize');
        const titleBar = macWindow.querySelector('.title-bar');
        
        // Bring to front on click anywhere
        macWindow.addEventListener('mousedown', () => bringToFront(macWindow));
        
        // Drag logic on title bar
        titleBar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking buttons
            if (e.target.closest('.traffic-lights') || e.target.closest('.title-bar-left i') || e.target.closest('.title-bar-right i')) return;
            
            isDragging = true;
            activeWindow = macWindow;
            bringToFront(macWindow);
            
            const rect = macWindow.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            document.body.style.userSelect = 'none';
        });

        // Window actions
        btnClose.addEventListener('click', () => {
            macWindow.style.opacity = '0';
            macWindow.style.transform = 'scale(0.8)';
            setTimeout(() => {
                macWindow.remove();
                runningApps[appName]--;
                if (runningApps[appName] <= 0) {
                    delete runningApps[appName];
                    dockWrapper.classList.remove('running');
                }
            }, 300);
        });

        btnMinimize.addEventListener('click', () => {
            macWindow.classList.add('minimized');
            macWindow.classList.remove('maximized');
        });

        btnMaximize.addEventListener('click', () => {
            macWindow.classList.toggle('maximized');
        });
        
        // Add to DOM
        desktop.appendChild(macWindow);
        
        // Track running state
        if (!runningApps[appName]) runningApps[appName] = 0;
        runningApps[appName]++;
        dockWrapper.classList.add('running');
        
        if (!dockWrapper.appWindows) dockWrapper.appWindows = [];
        dockWrapper.appWindows.push(macWindow);
    }

    // Handle clicking on dock icons
    dockIcons.forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            const appName = wrapper.getAttribute('data-name');
            const iconImg = wrapper.querySelector('img').src;
            
            // Un-minimize existing windows if they exist
            if (runningApps[appName] && wrapper.appWindows) {
                wrapper.appWindows = wrapper.appWindows.filter(win => document.body.contains(win));
                
                let minimizedFound = false;
                wrapper.appWindows.forEach(win => {
                    if (win.classList.contains('minimized')) {
                        win.classList.remove('minimized');
                        bringToFront(win);
                        minimizedFound = true;
                    }
                });
                // If there were minimized windows, just restore them. 
                // Otherwise, create a new window so multiple can exist.
                if (minimizedFound) return;
            }
            
            createWindow(appName, iconImg, wrapper);
        });
    });
});
