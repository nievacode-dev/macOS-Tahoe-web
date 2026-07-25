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
            if (activeWindow) {
                const iframe = activeWindow.querySelector('iframe');
                if (iframe) iframe.style.pointerEvents = 'auto';
            }
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
                    const iframe = macWindow.querySelector('iframe');
                    if (iframe) iframe.style.pointerEvents = 'none';
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

                switch (cmd) {
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

        } else if (appName === 'Safari') {
            macWindow.classList.add('safari-window');

            // Hide sidebar and adjust layout
            const sidebar = macWindow.querySelector('.sidebar');
            const titleBarLeft = macWindow.querySelector('.title-bar-left');
            const titleBarRight = macWindow.querySelector('.title-bar-right');
            const titleBar = macWindow.querySelector('.title-bar');
            const trafficLights = macWindow.querySelector('.traffic-lights');

            if (sidebar) sidebar.style.display = 'none';

            if (titleBarLeft) {
                titleBarLeft.innerHTML = '';
                if (trafficLights) {
                    trafficLights.style.padding = '0 16px 0 0';
                    titleBarLeft.appendChild(trafficLights);
                }
                titleBarLeft.innerHTML += `
                    <div class="finder-nav-btns" style="margin-left: 10px;">
                        <button class="finder-btn nav-back" style="opacity: 0.5;"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="finder-btn nav-fwd" style="opacity: 0.5;"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <button class="finder-btn" style="margin-left: 10px;"><i class="fa-solid fa-sidebar"></i></button>
                `;
            }

            const titleBarCenter = document.createElement('div');
            titleBarCenter.className = 'title-bar-center safari-address-container';
            titleBarCenter.style.flex = '1';
            titleBarCenter.style.display = 'flex';
            titleBarCenter.style.justifyContent = 'center';
            titleBarCenter.style.padding = '0 20px';

            titleBarCenter.innerHTML = `
                <div class="safari-address-bar" style="width: 100%; max-width: 450px; display: flex; align-items: center; background: var(--bg-color, rgba(0,0,0,0.05)); border-radius: 6px; padding: 4px 10px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 1px 2px rgba(0,0,0,0.05) inset;">
                    <i class="fa-solid fa-lock" style="font-size: 10px; color: #888; margin-right: 8px;"></i>
                    <input type="text" class="safari-url-input" placeholder="Search or enter website name" style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px; color: var(--text-color, #333);" value="https://www.google.com/">
                    <i class="fa-solid fa-rotate-right safari-refresh" title="Reload Page" style="font-size: 11px; color: #888; cursor: pointer; margin-left: 8px;"></i>
                </div>
            `;

            titleBar.insertBefore(titleBarCenter, titleBarRight);

            if (titleBarRight) {
                titleBarRight.innerHTML = `
                    <i class="fa-solid fa-arrow-up-right-from-square safari-open-external" title="Open in real browser tab" style="margin-right: 15px; cursor: pointer;"></i>
                    <i class="fa-solid fa-plus" style="cursor: pointer;"></i>
                `;
            }

            windowBody.style.alignItems = 'stretch';
            windowBody.style.justifyContent = 'flex-start';
            windowBody.style.padding = '0';
            windowBody.style.backgroundColor = '#fff';
            windowBody.style.position = 'relative';

            const iframe = document.createElement('iframe');
            iframe.className = 'safari-iframe';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.backgroundColor = '#fff';
            iframe.src = 'https://www.google.com/webhp?igu=1';

            // macOS Safari Refused to Connect Error Overlay
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'safari-error-overlay';
            errorOverlay.style.cssText = 'position: absolute; inset: 0; background: #f8f9fa; display: none; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; z-index: 10; color: #1d1d1f;';
            errorOverlay.innerHTML = `
                <div style="font-size: 44px; margin-bottom: 16px; color: #86868b;"><i class="fa-solid fa-compass"></i></div>
                <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #1d1d1f;">Safari Can’t Open the Page</h2>
                <p class="safari-error-msg" style="font-size: 13px; color: #6e6e73; max-width: 420px; margin: 0 0 24px 0; line-height: 1.5;">This site prevents inline embedding due to browser security restrictions (<code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px;">X-Frame-Options</code>).</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                    <button class="safari-btn-external" style="background: #0071e3; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                        <i class="fa-solid fa-arrow-up-right-from-square" style="margin-right: 6px;"></i> Open in New Tab
                    </button>
                    <button class="safari-btn-proxy" style="background: rgba(0,0,0,0.06); color: #1d1d1f; border: 1px solid rgba(0,0,0,0.1); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                        <i class="fa-solid fa-shield-halved" style="margin-right: 6px;"></i> Try Proxy Mode
                    </button>
                    <button class="safari-btn-google" style="background: rgba(0,0,0,0.06); color: #1d1d1f; border: 1px solid rgba(0,0,0,0.1); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                        <i class="fa-brands fa-google" style="margin-right: 6px;"></i> Google Search
                    </button>
                </div>
            `;

            windowBody.innerHTML = '';
            windowBody.appendChild(iframe);
            windowBody.appendChild(errorOverlay);

            const urlInput = titleBarCenter.querySelector('.safari-url-input');
            const btnRefresh = titleBarCenter.querySelector('.safari-refresh');
            const btnExternalHeader = titleBarRight ? titleBarRight.querySelector('.safari-open-external') : null;

            const btnExternal = errorOverlay.querySelector('.safari-btn-external');
            const btnProxy = errorOverlay.querySelector('.safari-btn-proxy');
            const btnGoogle = errorOverlay.querySelector('.safari-btn-google');

            let currentRawUrl = 'https://www.google.com/';
            let proxyIndex = 0;
            const proxies = [
                (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)
            ];

            const isDirectProtocol = (urlStr) => {
                return (
                    urlStr.startsWith('file:') ||
                    urlStr.startsWith('data:') ||
                    urlStr.startsWith('blob:') ||
                    urlStr.startsWith('about:') ||
                    urlStr.startsWith('ftp:') ||
                    urlStr.startsWith('ws:') ||
                    urlStr.startsWith('wss:')
                );
            };

            const isLocalhostUrl = (urlStr) => {
                try {
                    const parsed = new URL(urlStr);
                    const host = parsed.hostname;
                    return (
                        host === 'localhost' ||
                        host === '127.0.0.1' ||
                        host === '0.0.0.0' ||
                        host === '::1' ||
                        host.endsWith('.local') ||
                        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
                        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
                        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
                    );
                } catch (e) {
                    return false;
                }
            };

            const navigate = (url, proxyOverrideIndex = null) => {
                let targetUrl = url.trim();

                // Check if targetUrl already has a valid protocol/scheme (e.g. file:, data:, blob:, http:, https:, etc.)
                const hasScheme = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/i.test(targetUrl);

                if (!hasScheme) {
                    if (targetUrl.startsWith('/') || targetUrl.startsWith('~/')) {
                        targetUrl = 'file://' + (targetUrl.startsWith('/') ? targetUrl : targetUrl.substring(1));
                    } else if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:[0-9]+)?(\/.*)?$/i.test(targetUrl)) {
                        targetUrl = 'http://' + targetUrl;
                    } else if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                        targetUrl = 'https://' + targetUrl;
                    } else {
                        // Default to Google Search
                        targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(targetUrl) + '&igu=1';
                    }
                }

                currentRawUrl = targetUrl;
                urlInput.value = targetUrl;
                errorOverlay.style.display = 'none';

                let finalIframeUrl = targetUrl;

                // Handle file:/// for virtual filesystem (window.mockFS)
                if (targetUrl.startsWith('file://')) {
                    let localPath = targetUrl.replace(/^file:\/\//, '');
                    if (!localPath.startsWith('/') && !localPath.startsWith('~')) localPath = '/' + localPath;
                    const normPath = window.fsHelper ? window.fsHelper.normalize(localPath) : localPath;
                    const mockItems = window.mockFS ? window.mockFS[normPath] : null;

                    if (mockItems) {
                        const htmlContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <style>
                                    body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 24px; color: #1d1d1f; background: #fff; margin: 0; }
                                    h2 { font-size: 18px; margin-top: 0; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
                                    ul { list-style: none; padding: 0; margin: 0; }
                                    li { padding: 10px 12px; border-bottom: 1px solid #f5f5f7; display: flex; align-items: center; gap: 10px; font-size: 14px; }
                                    li:hover { background: #f5f5f7; cursor: pointer; border-radius: 6px; }
                                </style>
                            </head>
                            <body>
                                <h2>📁 Directory Index of ${normPath}</h2>
                                <ul>
                                    ${mockItems.length === 0 ? '<li style="color:#86868b;">Folder is empty</li>' : mockItems.map(item => `<li>${item.endsWith('.app') ? '🚀' : item.includes('.') ? '📄' : '📁'} ${item}</li>`).join('')}
                                </ul>
                            </body>
                            </html>
                        `;
                        iframe.srcdoc = htmlContent;
                        return;
                    } else {
                        iframe.removeAttribute('srcdoc');
                    }
                } else {
                    iframe.removeAttribute('srcdoc');
                }

                if (isDirectProtocol(targetUrl) || isLocalhostUrl(targetUrl)) {
                    // Direct loading for local files, data URIs, blob URIs, about:blank, localhost, etc.
                    finalIframeUrl = targetUrl;
                } else if (targetUrl.includes('google.com')) {
                    if (targetUrl.includes('google.com/search') && !targetUrl.includes('igu=1')) {
                        finalIframeUrl = targetUrl + (targetUrl.includes('?') ? '&igu=1' : '?igu=1');
                    } else if (!targetUrl.includes('igu=1')) {
                        finalIframeUrl = 'https://www.google.com/webhp?igu=1';
                    }
                } else {
                    // Automatically proxy external non-Google sites to bypass X-Frame-Options & CSP headers
                    const pIdx = proxyOverrideIndex !== null ? proxyOverrideIndex : proxyIndex;
                    finalIframeUrl = proxies[pIdx % proxies.length](targetUrl);
                }

                iframe.src = finalIframeUrl;
            };

            if (btnExternalHeader) {
                btnExternalHeader.addEventListener('click', () => {
                    window.open(currentRawUrl, '_blank');
                });
            }

            btnExternal.addEventListener('click', () => {
                window.open(currentRawUrl, '_blank');
            });

            btnProxy.addEventListener('click', () => {
                proxyIndex = (proxyIndex + 1) % proxies.length;
                navigate(currentRawUrl, proxyIndex);
            });

            btnGoogle.addEventListener('click', () => {
                const domain = currentRawUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                navigate('https://www.google.com/search?q=' + encodeURIComponent(domain) + '&igu=1');
            });

            urlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    navigate(urlInput.value.trim());
                    urlInput.blur();
                }
            });

            urlInput.addEventListener('click', () => {
                urlInput.select();
            });

            btnRefresh.addEventListener('click', () => {
                navigate(urlInput.value.trim());
            });

        } else if (appName === 'System Settings') {
            macWindow.classList.add('settings-window');
            
            // Adjust sidebar and main structure
            const sidebar = macWindow.querySelector('.sidebar');
            const titleBar = macWindow.querySelector('.title-bar');
            const trafficLights = macWindow.querySelector('.traffic-lights');
            
            // Move traffic lights to the sidebar top
            sidebar.innerHTML = '';
            sidebar.appendChild(trafficLights);
            
            // Add search and navigation to sidebar
            const sidebarContent = document.createElement('div');
            sidebarContent.innerHTML = `
                <div class="settings-search-container">
                    <div class="settings-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search">
                    </div>
                </div>
                <div class="settings-sidebar-group">
                    <div class="settings-sidebar-item" data-tab="wi-fi">
                        <div class="settings-icon" style="background: #007aff;"><i class="fa-solid fa-wifi"></i></div>
                        Wi-Fi
                    </div>
                    <div class="settings-sidebar-item" data-tab="bluetooth">
                        <div class="settings-icon" style="background: #007aff;"><i class="fa-brands fa-bluetooth-b"></i></div>
                        Bluetooth
                    </div>
                    <div class="settings-sidebar-item" data-tab="network">
                        <div class="settings-icon" style="background: #007aff;"><i class="fa-solid fa-network-wired"></i></div>
                        Network
                    </div>
                </div>
                <div class="settings-sidebar-group">
                    <div class="settings-sidebar-item active" data-tab="general">
                        <div class="settings-icon" style="background: #8e8e93;"><i class="fa-solid fa-gear"></i></div>
                        General
                    </div>
                    <div class="settings-sidebar-item" data-tab="appearance">
                        <div class="settings-icon" style="background: #5856d6;"><i class="fa-solid fa-circle-half-stroke"></i></div>
                        Appearance
                    </div>
                    <div class="settings-sidebar-item" data-tab="control-center">
                        <div class="settings-icon" style="background: #8e8e93;"><i class="fa-solid fa-sliders"></i></div>
                        Control Center
                    </div>
                    <div class="settings-sidebar-item" data-tab="siri">
                        <div class="settings-icon" style="background: #34c759;"><img src="icons/apple/Siri.png" style="width:14px; filter: brightness(0) invert(1);"></div>
                        Siri & Spotlight
                    </div>
                </div>
            `;
            sidebar.appendChild(sidebarContent);
            
            // Reconfigure main content
            const mainContent = macWindow.querySelector('.main-content');
            mainContent.innerHTML = `
                <div class="settings-main-header">General</div>
                <div class="settings-main-body"></div>
            `;
            
            const settingsBody = mainContent.querySelector('.settings-main-body');
            const settingsHeader = mainContent.querySelector('.settings-main-header');
            
            // Tab content templates
            const tabContents = {
                'wi-fi': `
                    <div class="settings-section">
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">Wi-Fi</div>
                            </div>
                            <div class="settings-row-right">
                                <label class="switch settings-toggle">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div>
                                    <div class="settings-row-title">Home Network</div>
                                    <div class="settings-row-subtitle">Connected</div>
                                </div>
                            </div>
                            <div class="settings-row-right">
                                <i class="fa-solid fa-lock"></i>
                                <i class="fa-solid fa-circle-info" style="color: #007aff; font-size: 16px;"></i>
                            </div>
                        </div>
                    </div>
                `,
                'general': `
                    <div class="settings-section">
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">About</div>
                            </div>
                            <div class="settings-row-right">
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">Software Update</div>
                            </div>
                            <div class="settings-row-right">
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">AirDrop & Handoff</div>
                            </div>
                            <div class="settings-row-right">
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">Login Items</div>
                            </div>
                            <div class="settings-row-right">
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                `,
                'appearance': `
                    <div class="settings-section">
                        <div class="settings-row" style="padding: 20px;">
                            <div style="display: flex; gap: 20px; justify-content: center; width: 100%;">
                                <div style="text-align: center; cursor: pointer;">
                                    <div style="width: 80px; height: 50px; background: #f0f0f0; border-radius: 6px; border: 2px solid #007aff; margin-bottom: 8px;"></div>
                                    <span style="font-size: 12px;">Light</span>
                                </div>
                                <div style="text-align: center; cursor: pointer;">
                                    <div style="width: 80px; height: 50px; background: #222; border-radius: 6px; border: 2px solid transparent; margin-bottom: 8px;"></div>
                                    <span style="font-size: 12px;">Dark</span>
                                </div>
                                <div style="text-align: center; cursor: pointer;">
                                    <div style="width: 80px; height: 50px; background: linear-gradient(to right, #f0f0f0 50%, #222 50%); border-radius: 6px; border: 2px solid transparent; margin-bottom: 8px;"></div>
                                    <span style="font-size: 12px;">Auto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <div class="settings-row">
                            <div class="settings-row-left">
                                <div class="settings-row-title">Accent color</div>
                            </div>
                            <div class="settings-row-right" style="gap: 4px;">
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #007aff; border: 2px solid rgba(0,0,0,0.2);"></div>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #ff3b30;"></div>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #ff9500;"></div>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #ffcc00;"></div>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #28cd41;"></div>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: #af52de;"></div>
                            </div>
                        </div>
                    </div>
                `
            };

            // Set default tab
            settingsBody.innerHTML = tabContents['general'];
            
            // Tab switching logic
            const tabs = sidebar.querySelectorAll('.settings-sidebar-item');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    const tabName = tab.getAttribute('data-tab');
                    const titleText = tab.textContent.trim();
                    settingsHeader.textContent = titleText;
                    
                    if (tabContents[tabName]) {
                        settingsBody.innerHTML = tabContents[tabName];
                    } else {
                        settingsBody.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888;">
                                <div style="font-size: 40px; margin-bottom: 16px;"><i class="fa-solid fa-hammer"></i></div>
                                <div>This settings pane is under construction.</div>
                            </div>
                        `;
                    }
                });
            });

            // Make sure the header allows drag
            settingsHeader.addEventListener('mousedown', (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                isDragging = true;
                activeWindow = macWindow;
                bringToFront(macWindow);
                const rect = macWindow.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
            });

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
        if (titleBar) {
            titleBar.addEventListener('mousedown', (e) => {
                // Don't drag if clicking buttons or inputs
                if (e.target.closest('.traffic-lights') || e.target.closest('.title-bar-left i') || e.target.closest('.title-bar-right i') || e.target.closest('.finder-btn') || e.target.closest('button') || e.target.closest('input')) return;

                isDragging = true;
                activeWindow = macWindow;
                bringToFront(macWindow);

                const rect = macWindow.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;

                document.body.style.userSelect = 'none';
                const iframe = macWindow.querySelector('iframe');
                if (iframe) iframe.style.pointerEvents = 'none';
            });
        }

        // Window actions
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                macWindow.style.opacity = '0';
                macWindow.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    macWindow.remove();
                    runningApps[appName]--;
                    if (runningApps[appName] <= 0) {
                        delete runningApps[appName];
                        if (dockWrapper) dockWrapper.classList.remove('running');
                    }
                }, 300);
            });
        }

        if (btnMinimize) {
            btnMinimize.addEventListener('click', () => {
                macWindow.classList.add('minimized');
                macWindow.classList.remove('maximized');
            });
        }

        if (btnMaximize) {
            btnMaximize.addEventListener('click', () => {
                macWindow.classList.toggle('maximized');
            });
        }

        // Add to DOM
        desktop.appendChild(macWindow);

        // Track running state
        if (!runningApps[appName]) runningApps[appName] = 0;
        runningApps[appName]++;
        if (dockWrapper) dockWrapper.classList.add('running');

        if (dockWrapper) {
            if (!dockWrapper.appWindows) dockWrapper.appWindows = [];
            dockWrapper.appWindows.push(macWindow);
        }
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
