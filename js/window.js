// File System Initialization
if (!window.mockFS) {
    const storedFS = localStorage.getItem('macOSTahoe_FS');
    if (storedFS) {
        try {
            window.mockFS = JSON.parse(storedFS);
        } catch (e) {
            console.error("Failed to parse stored FS", e);
        }
    }
    
    if (!window.mockFS) {
        window.mockFS = {
            '~': ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures'],
            '~/Desktop': [],
            '~/Documents': [],
            '~/Downloads': [],
            '~/Music': [],
            '~/Pictures': [],
            '/': ['Applications', 'Library', 'System', 'Users'],
            '/Users': ['guest'],
            '/Applications': ['Safari.app', 'Terminal.app', 'Finder.app', 'Messages.app', 'System Settings.app', 'App Store.app']
        };
    }
    window.currentDir = '~';
    
    window.fsHelper = {
        save: () => {
            localStorage.setItem('macOSTahoe_FS', JSON.stringify(window.mockFS));
        },
        normalize: (p) => p.replace(/\/+$/, '') || '/',
        createDir: (parentPath, name) => {
            let p = window.fsHelper.normalize(parentPath);
            if (!window.mockFS[p]) window.mockFS[p] = [];
            if (!window.mockFS[p].includes(name)) {
                window.mockFS[p].push(name);
                window.mockFS[`${p === '/' ? '' : p}/${name}`] = [];
                window.fsHelper.save();
                return true;
            }
            return false;
        },
        rename: (parentPath, oldName, newName) => {
            let p = window.fsHelper.normalize(parentPath);
            if (!window.mockFS[p]) return false;
            const idx = window.mockFS[p].indexOf(oldName);
            if (idx !== -1) {
                window.mockFS[p][idx] = newName;
                const oldFullPath = `${p === '/' ? '' : p}/${oldName}`;
                const newFullPath = `${p === '/' ? '' : p}/${newName}`;
                const keys = Object.keys(window.mockFS);
                for (let key of keys) {
                    if (key === oldFullPath || key.startsWith(oldFullPath + '/')) {
                        const newKey = newFullPath + key.substring(oldFullPath.length);
                        window.mockFS[newKey] = window.mockFS[key];
                        delete window.mockFS[key];
                    }
                }
                window.fsHelper.save();
                return true;
            }
            return false;
        }
    };
}

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

    // Resizing state
    let isResizing = false;
    let activeResizeHandle = null;
    let resizeStartRect = null;
    let resizeStartX = 0;
    let resizeStartY = 0;

    // Global drag listeners
    document.addEventListener('mousemove', (e) => {
        if (isResizing && activeWindow && !activeWindow.classList.contains('maximized')) {
            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;
            
            let newWidth = resizeStartRect.width;
            let newHeight = resizeStartRect.height;
            let newLeft = resizeStartRect.left;
            let newTop = resizeStartRect.top;

            if (activeResizeHandle.includes('n')) {
                newHeight = resizeStartRect.height - dy;
                newTop = resizeStartRect.top + dy;
            }
            if (activeResizeHandle.includes('s')) {
                newHeight = resizeStartRect.height + dy;
            }
            if (activeResizeHandle.includes('e')) {
                newWidth = resizeStartRect.width + dx;
            }
            if (activeResizeHandle.includes('w')) {
                newWidth = resizeStartRect.width - dx;
                newLeft = resizeStartRect.left + dx;
            }
            
            const minW = 300;
            const minH = 200;
            
            if (newWidth >= minW) {
                activeWindow.style.width = `${newWidth}px`;
                activeWindow.style.left = `${newLeft}px`;
            }
            if (newHeight >= minH) {
                activeWindow.style.height = `${newHeight}px`;
                activeWindow.style.top = `${newTop}px`;
            }
            
            e.preventDefault();
        } else if (isDragging && activeWindow && !activeWindow.classList.contains('maximized')) {
            activeWindow.style.left = `${e.clientX - dragOffsetX}px`;
            activeWindow.style.top = `${e.clientY - dragOffsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            activeResizeHandle = null;
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

        // Setup Resize Handles
        const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        handles.forEach(dir => {
            const handle = macWindow.querySelector(`.resize-${dir}`);
            if (handle) {
                handle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    activeWindow = macWindow;
                    activeResizeHandle = dir;
                    resizeStartRect = macWindow.getBoundingClientRect();
                    resizeStartX = e.clientX;
                    resizeStartY = e.clientY;
                    document.body.style.userSelect = 'none';
                    bringToFront(macWindow);
                    e.stopPropagation();
                });
            }
        });

        // Setup content
        const windowTitle = macWindow.querySelector('.window-title');
        const windowBody = macWindow.querySelector('.window-body');
        const sidebarItem = macWindow.querySelector('.sidebar-item.active');

        if (appName === 'Finder') {
            macWindow.classList.add('finder-window');
            windowBody.style.alignItems = 'stretch';
            windowBody.style.justifyContent = 'flex-start';
            windowBody.style.padding = '0';
            
            let currentPath = '/Applications';
            let history = [currentPath];
            let historyIdx = 0;
            let viewMode = 'grid';
            
            const titleBarLeft = macWindow.querySelector('.title-bar-left');
            const titleBarRight = macWindow.querySelector('.title-bar-right');
            
            titleBarLeft.innerHTML = `
                <div class="finder-nav-btns">
                    <button class="finder-btn nav-back disabled"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="finder-btn nav-fwd disabled"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <span class="window-title">Applications</span>
            `;
            
            titleBarRight.innerHTML = `
                <div class="finder-view-btns">
                    <button class="finder-btn view-grid active"><i class="fa-solid fa-border-all"></i></button>
                    <button class="finder-btn view-list"><i class="fa-solid fa-list"></i></button>
                </div>
                <button class="finder-btn new-folder-btn" title="New Folder"><i class="fa-solid fa-folder-plus"></i></button>
                <i class="fa-solid fa-magnifying-glass"></i>
            `;
            
            const btnBack = titleBarLeft.querySelector('.nav-back');
            const btnFwd = titleBarLeft.querySelector('.nav-fwd');
            const btnGrid = titleBarRight.querySelector('.view-grid');
            const btnList = titleBarRight.querySelector('.view-list');
            const btnNewFolder = titleBarRight.querySelector('.new-folder-btn');
            const titleSpan = titleBarLeft.querySelector('.window-title');
            
            const contentContainer = document.createElement('div');
            windowBody.innerHTML = '';
            windowBody.appendChild(contentContainer);
            
            const render = () => {
                const pathParts = currentPath.split('/');
                let displayTitle = pathParts[pathParts.length - 1] || '/';
                if (currentPath === '~') displayTitle = 'guest';
                else if (currentPath === '~/Desktop') displayTitle = 'Desktop';
                else if (currentPath.startsWith('~/')) displayTitle = currentPath.substring(2);
                
                titleSpan.textContent = displayTitle;
                
                btnBack.classList.toggle('disabled', historyIdx <= 0);
                btnFwd.classList.toggle('disabled', historyIdx >= history.length - 1);
                
                const sidebarItems = macWindow.querySelectorAll('.sidebar-item');
                sidebarItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.textContent.trim() === displayTitle) item.classList.add('active');
                });
                
                contentContainer.innerHTML = '';
                contentContainer.className = `finder-content ${viewMode}-view`;
                
                const items = window.mockFS[window.fsHelper.normalize(currentPath)] || [];
                
                items.forEach(name => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'finder-item';
                    
                    const isApp = name.endsWith('.app');
                    let iconSrc = 'icons/folders/Folder.png';
                    if (isApp) {
                        const appName = name.replace('.app', '');
                        iconSrc = `icons/apple/${appName}.png`;
                    } else if (name.endsWith('.txt')) {
                        iconSrc = 'icons/apple/Notes.png';
                    }
                    
                    itemDiv.innerHTML = `
                        <img src="${iconSrc}" alt="${name}" onerror="this.src='icons/folders/Folder.png'" draggable="false">
                        <span class="finder-item-name">${name}</span>
                    `;
                    
                    if (isApp) {
                        itemDiv.addEventListener('dblclick', () => {
                            const appName = name.replace('.app', '');
                            const dockIcon = document.querySelector(`.dock-icon-wrapper[data-name="${appName}"]`);
                            if (dockIcon) dockIcon.click();
                            else if (typeof createWindow === 'function') createWindow(appName, `icons/apple/${appName}.png`, null);
                        });
                    } else if (!name.includes('.')) {
                        itemDiv.addEventListener('dblclick', () => {
                            let newPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
                            history = history.slice(0, historyIdx + 1);
                            history.push(newPath);
                            historyIdx++;
                            currentPath = newPath;
                            render();
                        });
                    }
                    
                    contentContainer.appendChild(itemDiv);
                });
            };
            
            const initiateRename = (itemDiv, oldName) => {
                const nameSpan = itemDiv.querySelector('.finder-item-name');
                if (!nameSpan) return;
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'finder-rename-input';
                input.value = oldName;
                
                itemDiv.replaceChild(input, nameSpan);
                input.focus();
                input.select();
                
                const saveRename = () => {
                    const newName = input.value.trim() || oldName;
                    if (newName !== oldName && !(window.mockFS[window.fsHelper.normalize(currentPath)] || []).includes(newName)) {
                        window.fsHelper.rename(currentPath, oldName, newName);
                    }
                    render();
                };
                
                input.addEventListener('blur', saveRename);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') input.blur();
                    else if (e.key === 'Escape') { input.value = oldName; input.blur(); }
                });
            };
            
            btnBack.addEventListener('click', () => { if (historyIdx > 0) { historyIdx--; currentPath = history[historyIdx]; render(); } });
            btnFwd.addEventListener('click', () => { if (historyIdx < history.length - 1) { historyIdx++; currentPath = history[historyIdx]; render(); } });
            
            btnGrid.addEventListener('click', () => { viewMode = 'grid'; btnGrid.classList.add('active'); btnList.classList.remove('active'); render(); });
            btnList.addEventListener('click', () => { viewMode = 'list'; btnList.classList.add('active'); btnGrid.classList.remove('active'); render(); });
            
            btnNewFolder.addEventListener('click', () => {
                let baseName = 'untitled folder';
                let newName = baseName;
                let counter = 1;
                const items = window.mockFS[window.fsHelper.normalize(currentPath)] || [];
                while (items.includes(newName)) {
                    counter++;
                    newName = `${baseName} ${counter}`;
                }
                if (window.fsHelper.createDir(currentPath, newName)) {
                    render();
                    setTimeout(() => {
                        const allItems = contentContainer.querySelectorAll('.finder-item');
                        const newItem = Array.from(allItems).find(el => el.querySelector('.finder-item-name').textContent === newName);
                        if (newItem) initiateRename(newItem, newName);
                    }, 50);
                }
            });
            
            const sidebarNav = macWindow.querySelectorAll('.sidebar-item');
            sidebarNav.forEach(item => {
                item.addEventListener('click', () => {
                    const text = item.textContent.trim();
                    let newPath = '~';
                    if (text === 'Applications') newPath = '/Applications';
                    else if (text === 'Downloads') newPath = '~/Downloads';
                    else if (text === 'Desktop') newPath = '~/Desktop';
                    
                    if (currentPath !== newPath) {
                        history = history.slice(0, historyIdx + 1);
                        history.push(newPath);
                        historyIdx++;
                        currentPath = newPath;
                        render();
                    }
                });
            });
            
            contentContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                
                const existingMenu = document.getElementById('dynamic-finder-context');
                if (existingMenu) existingMenu.remove();

                const itemDiv = e.target.closest('.finder-item');
                const isItem = !!itemDiv;
                let itemName = isItem ? itemDiv.querySelector('.finder-item-name').textContent : null;
                const isApp = itemName && itemName.endsWith('.app');

                const menu = document.createElement('div');
                menu.id = 'dynamic-finder-context';
                menu.className = 'desktop-context-menu';
                menu.style.display = 'flex';
                menu.style.position = 'fixed';
                menu.style.zIndex = '10000';
                
                let x = e.clientX;
                let y = e.clientY;
                const menuWidth = 150;
                const menuHeight = isItem ? 120 : 40;
                if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
                if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
                menu.style.left = `${x}px`;
                menu.style.top = `${y}px`;
                
                if (isItem) {
                    const openItem = document.createElement('div');
                    openItem.className = 'cm-item';
                    openItem.textContent = 'Open';
                    openItem.onclick = () => {
                        menu.remove();
                        if (isApp) {
                            const appName = itemName.replace('.app', '');
                            const dockIcon = document.querySelector(`.dock-icon-wrapper[data-name="${appName}"]`);
                            if (dockIcon) dockIcon.click();
                            else if (typeof createWindow === 'function') createWindow(appName, `icons/apple/${appName}.png`, null);
                        } else if (!itemName.includes('.')) {
                            let newPath = currentPath === '/' ? `/${itemName}` : `${currentPath}/${itemName}`;
                            history = history.slice(0, historyIdx + 1);
                            history.push(newPath);
                            historyIdx++;
                            currentPath = newPath;
                            render();
                        }
                    };
                    menu.appendChild(openItem);

                    const renameItem = document.createElement('div');
                    renameItem.className = 'cm-item';
                    renameItem.textContent = 'Rename';
                    renameItem.onclick = () => {
                        menu.remove();
                        initiateRename(itemDiv, itemName);
                    };
                    menu.appendChild(renameItem);
                    
                    const deleteItem = document.createElement('div');
                    deleteItem.className = 'cm-item';
                    deleteItem.style.color = '#ff3b30';
                    deleteItem.textContent = 'Delete';
                    deleteItem.onclick = () => {
                        menu.remove();
                        if (window.mockFS[window.fsHelper.normalize(currentPath)]) {
                            window.mockFS[window.fsHelper.normalize(currentPath)] = window.mockFS[window.fsHelper.normalize(currentPath)].filter(n => n !== itemName);
                            window.fsHelper.save();
                            render();
                        }
                    };
                    menu.appendChild(deleteItem);
                } else {
                    const newItem = document.createElement('div');
                    newItem.className = 'cm-item';
                    newItem.textContent = 'New Folder';
                    newItem.onclick = () => {
                        menu.remove();
                        btnNewFolder.click();
                    };
                    menu.appendChild(newItem);
                }
                
                document.body.appendChild(menu);
                
                setTimeout(() => {
                    const closeMenu = (evt) => {
                        if (!menu.contains(evt.target)) {
                            menu.remove();
                            document.removeEventListener('click', closeMenu);
                            document.removeEventListener('contextmenu', closeMenu);
                        }
                    };
                    document.addEventListener('click', closeMenu);
                    document.addEventListener('contextmenu', closeMenu);
                }, 10);
            });
            
            render();

        } else if (appName === 'Terminal') {
            macWindow.classList.add('terminal-window');
            
            // Hide sidebar and move traffic lights to the title bar
            const sidebar = macWindow.querySelector('.sidebar');
            const titleBarLeft = macWindow.querySelector('.title-bar-left');
            const titleBarRight = macWindow.querySelector('.title-bar-right');
            const trafficLights = macWindow.querySelector('.traffic-lights');
            
            if (sidebar) sidebar.style.display = 'none';
            if (titleBarLeft) titleBarLeft.querySelectorAll('i').forEach(i => i.remove());
            if (titleBarRight) titleBarRight.innerHTML = '';
            
            if (trafficLights && titleBarLeft) {
                trafficLights.style.padding = '0 16px 0 0'; // Adjust padding for titlebar
                titleBarLeft.insertBefore(trafficLights, titleBarLeft.firstChild);
            }
            
            windowBody.style.alignItems = 'stretch';
            windowBody.style.justifyContent = 'flex-start';
            windowBody.style.padding = '0';
            if (sidebarItem) sidebarItem.innerHTML = `<i class="fa-solid fa-terminal"></i> Terminal`;
            
            const terminalContainer = document.createElement('div');
            terminalContainer.className = 'terminal-container';
            
            const printLine = (text) => {
                const line = document.createElement('div');
                line.className = 'terminal-line terminal-output';
                line.textContent = text;
                terminalContainer.insertBefore(line, terminalContainer.lastChild);
                terminalContainer.scrollTop = terminalContainer.scrollHeight;
            };

            const executeCommand = (cmdStr) => {
                const args = cmdStr.trim().split(/\s+/);
                const cmd = args[0];
                if (!cmd) return;
                
                switch(cmd) {
                    case 'echo':
                        printLine(args.slice(1).join(' '));
                        break;
                    case 'clear':
                        const lines = terminalContainer.querySelectorAll('.terminal-line:not(.terminal-input-wrapper)');
                        lines.forEach(l => l.remove());
                        break;
                    case 'pwd':
                        printLine(window.currentDir === '~' ? '/Users/guest' : window.currentDir);
                        break;
                    case 'ls':
                        const contents = window.mockFS[window.currentDir] || [];
                        printLine(contents.join('  '));
                        break;
                    case 'mkdir':
                        const newDir = args[1];
                        if (newDir) {
                            if (!window.mockFS[window.currentDir]) window.mockFS[window.currentDir] = [];
                            
                            if (!window.mockFS[window.currentDir].includes(newDir)) {
                                window.mockFS[window.currentDir].push(newDir);
                                window.mockFS[`${window.currentDir}/${newDir}`] = [];
                                
                                // Sync with Desktop UI
                                if (window.currentDir === '~/Desktop' || window.currentDir === '/Users/guest/Desktop') {
                                    if (window.createDesktopFolder) {
                                        window.createDesktopFolder(newDir);
                                    }
                                }
                            } else {
                                printLine(`mkdir: ${newDir}: File exists`);
                            }
                        } else {
                            printLine(`usage: mkdir <directory>`);
                        }
                        break;
                    case 'help':
                        printLine('Available commands:');
                        printLine('  ls       List directory contents');
                        printLine('  cd       Change the shell working directory');
                        printLine('  pwd      Print working directory');
                        printLine('  mkdir    Make directories');
                        printLine('  echo     Write arguments to the standard output');
                        printLine('  clear    Clear the terminal screen');
                        printLine('  help     Display this help message');
                        break;
                    case 'cd':
                        const target = args[1] || '~';
                        if (target === '..') {
                            if (window.currentDir !== '/') {
                                if (window.currentDir.startsWith('~/')) {
                                    const parts = window.currentDir.split('/');
                                    parts.pop();
                                    window.currentDir = parts.join('/') || '~';
                                } else {
                                    window.currentDir = '/';
                                }
                            }
                        } else if (window.mockFS[target] || window.mockFS[`${window.currentDir}/${target}`]) {
                            if (window.mockFS[target]) window.currentDir = target;
                            else window.currentDir = `${window.currentDir}/${target}`;
                        } else {
                            printLine(`bash: cd: ${target}: No such file or directory`);
                        }
                        break;
                    default:
                        printLine(`bash: ${cmd}: command not found`);
                }
            };
            
            const createInputLine = () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'terminal-line terminal-input-wrapper';
                
                const prompt = document.createElement('span');
                prompt.className = 'terminal-prompt';
                
                const displayDir = window.currentDir === '/Users/guest' ? '~' : window.currentDir.split('/').pop() || '~';
                prompt.textContent = `guest@MacBook-Pro ${displayDir} $ `;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'terminal-input';
                input.autocomplete = 'off';
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const cmd = input.value;
                        const staticText = document.createElement('div');
                        staticText.className = 'terminal-output';
                        staticText.textContent = cmd;
                        
                        wrapper.replaceChild(staticText, input);
                        wrapper.classList.remove('terminal-input-wrapper');
                        
                        executeCommand(cmd);
                        createInputLine();
                    }
                });
                
                wrapper.appendChild(prompt);
                wrapper.appendChild(input);
                terminalContainer.appendChild(wrapper);
                
                setTimeout(() => input.focus(), 10);
            };
            
            const dateStr = new Date().toString().split(' GMT')[0];
            const cleanDate = dateStr.replace(/ \d{4} /, ' '); // simplify date
            printLine(`Last login: ${cleanDate} on console`);
            createInputLine();
            
            terminalContainer.addEventListener('click', () => {
                const activeInput = terminalContainer.querySelector('.terminal-input');
                if (activeInput) activeInput.focus();
            });
            
            windowBody.innerHTML = '';
            windowBody.appendChild(terminalContainer);
            
            // Dynamic resize for title bar
            const updateTerminalTitle = () => {
                const charWidth = 8;
                const charHeight = 16;
                const cols = Math.max(10, Math.floor(terminalContainer.clientWidth / charWidth));
                const rows = Math.max(5, Math.floor(terminalContainer.clientHeight / charHeight));
                windowTitle.innerHTML = `<i class="fa-solid fa-folder" style="color: #61A9F4; font-size: 13px; margin-right: 4px;"></i> guest — bash — ${cols}x${rows}`;
            };
            
            const resizeObserver = new ResizeObserver(() => {
                updateTerminalTitle();
            });
            resizeObserver.observe(terminalContainer);
            
        } else {
            windowTitle.textContent = appName;
            windowBody.style.alignItems = 'center';
            windowBody.style.justifyContent = 'center';
            windowBody.innerHTML = `<img src="${iconImg}" alt="${appName}" class="window-app-icon">`;
            if (sidebarItem) {
                sidebarItem.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${appName}`;
            }
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
            if (e.target.closest('.traffic-lights') || e.target.closest('.title-bar-left i') || e.target.closest('.title-bar-right i') || e.target.closest('.finder-btn') || e.target.closest('button')) return;

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
