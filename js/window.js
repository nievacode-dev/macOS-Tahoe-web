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

        if (appName === 'Finder') {
            windowTitle.textContent = 'Applications';
            if (sidebarItem) {
                sidebarItem.innerHTML = `<i class="fa-solid fa-layer-group"></i> Applications`;
            }

            const grid = document.createElement('div');
            grid.className = 'app-drawer-grid';

            const allApps = document.querySelectorAll('.dock-apps .dock-icon-wrapper');
            allApps.forEach(app => {
                const name = app.getAttribute('data-name');
                const src = app.querySelector('img').src;

                const item = document.createElement('div');
                item.className = 'app-drawer-item';

                const img = document.createElement('img');
                img.src = src;
                img.alt = name;
                img.draggable = false;

                const span = document.createElement('span');
                span.textContent = name;
                span.title = name; // Tooltip for long names

                item.appendChild(img);
                item.appendChild(span);

                // Double click to launch the app
                item.addEventListener('dblclick', () => {
                    app.click(); // Trigger dock icon click logic
                });

                grid.appendChild(item);
            });

            windowBody.style.alignItems = 'flex-start';
            windowBody.style.justifyContent = 'flex-start';
            windowBody.style.padding = '0'; // Let grid handle padding
            windowBody.innerHTML = '';
            windowBody.appendChild(grid);

        } else if (appName === 'Terminal') {
            windowTitle.textContent = 'guest@macbook: ~';
            windowBody.style.alignItems = 'stretch';
            windowBody.style.justifyContent = 'flex-start';
            windowBody.style.padding = '0';
            if (sidebarItem) sidebarItem.innerHTML = `<i class="fa-solid fa-terminal"></i> Terminal`;
            
            const terminalContainer = document.createElement('div');
            terminalContainer.className = 'terminal-container';
            
            if (!window.mockFS) {
                window.mockFS = {
                    '~': ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures'],
                    '~/Desktop': ['untitled folder'],
                    '/': ['Applications', 'Library', 'System', 'Users'],
                    '/Users': ['guest'],
                    '/Applications': ['Safari.app', 'Terminal.app']
                };
                window.currentDir = '~';
            }
            
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
                            printLine(`cd: no such file or directory: ${target}`);
                        }
                        windowTitle.textContent = `guest@macbook: ${window.currentDir}`;
                        break;
                    default:
                        printLine(`zsh: command not found: ${cmd}`);
                }
            };
            
            const createInputLine = () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'terminal-line terminal-input-wrapper';
                
                const prompt = document.createElement('span');
                prompt.className = 'terminal-prompt';
                prompt.textContent = `guest@macbook ${window.currentDir.split('/').pop()} %`;
                
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
            
            printLine('Last login: ' + new Date().toString().split(' GMT')[0] + ' on ttys000');
            createInputLine();
            
            terminalContainer.addEventListener('click', () => {
                const activeInput = terminalContainer.querySelector('.terminal-input');
                if (activeInput) activeInput.focus();
            });
            
            windowBody.innerHTML = '';
            windowBody.appendChild(terminalContainer);
            
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
