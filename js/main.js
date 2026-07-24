// --- Main Interactions ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Boot Screen Animation ---
    const bootScreen = document.getElementById('boot-screen');
    const bootProgressBar = document.getElementById('boot-progress-bar');
    
    if (bootScreen && bootProgressBar) {
        // Start progress bar animation after a short delay
        setTimeout(() => {
            bootProgressBar.style.width = '100%';
        }, 100);

        // Wait 10 seconds, then fade out boot screen
        setTimeout(() => {
            bootScreen.style.opacity = '0';
            setTimeout(() => {
                bootScreen.style.display = 'none';
            }, 500); // Wait for fade transition (0.5s matching CSS)
        }, 10000);
    }
    // --- Smoother macOS Dock Magnification ---
    const dock = document.querySelector('.dock');
    const wrappers = Array.from(document.querySelectorAll('.dock-icon-wrapper'));

    // Lowered scale and height based on user request
    const maxScale = 1.8;
    const maxDistance = 200;
    const baseWidth = 52;

    dock.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            wrappers.forEach(wrapper => {
                const icon = wrapper.querySelector('.dock-icon');
                const rect = wrapper.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const distance = Math.abs(e.clientX - x);

                if (distance < maxDistance) {
                    const curve = (Math.cos((distance / maxDistance) * Math.PI) + 1) / 2;
                    const scale = 1 + (maxScale - 1) * curve;
                    // Push apart dynamically by expanding wrapper width
                    wrapper.style.width = `${baseWidth * scale}px`;
                    // Lift up vertically (Lowered height)
                    const translateY = -12 * curve;
                    icon.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                    icon.style.zIndex = Math.round(scale * 10);
                } else {
                    wrapper.style.width = `${baseWidth}px`;
                    icon.style.transform = 'scale(1) translateY(0)';
                    icon.style.zIndex = 1;
                }
            });
        });
    });

    dock.addEventListener('mouseleave', () => {
        requestAnimationFrame(() => {
            wrappers.forEach(wrapper => {
                const icon = wrapper.querySelector('.dock-icon');
                wrapper.style.width = `${baseWidth}px`;
                icon.style.transform = 'scale(1) translateY(0)';
                icon.style.zIndex = 1;
            });
        });
    });

    // --- Dock Icon Dragging ---
    let draggedDockIcon = null;

    wrappers.forEach(wrapper => {
        wrapper.draggable = true;

        wrapper.addEventListener('dragstart', function (e) {
            draggedDockIcon = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        wrapper.addEventListener('dragend', function () {
            setTimeout(() => this.style.opacity = '1', 0);
            draggedDockIcon = null;
        });

        wrapper.addEventListener('dragover', function (e) {
            e.preventDefault();
        });

        wrapper.addEventListener('drop', function (e) {
            e.preventDefault();
        });

        wrapper.addEventListener('dragenter', function (e) {
            e.preventDefault();
            if (this !== draggedDockIcon && this.parentNode === draggedDockIcon.parentNode) {
                const allIcons = Array.from(this.parentNode.children);
                const draggedIndex = allIcons.indexOf(draggedDockIcon);
                const thisIndex = allIcons.indexOf(this);

                if (draggedIndex < thisIndex) {
                    this.parentNode.insertBefore(draggedDockIcon, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedDockIcon, this);
                }
            }
        });
    });


    // --- Clock ---
    const timeDisplay = document.querySelector('.date-time');
    function updateTime() {
        const now = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
        timeDisplay.textContent = now.toLocaleDateString('en-US', options).replace(/,/g, '');
    }
    updateTime(); setInterval(updateTime, 60000);

    // --- Control Center Toggle ---
    const ccToggleBtn = document.getElementById('cc-toggle');
    const controlCenter = document.getElementById('control-center');

    ccToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        controlCenter.classList.toggle('show');
        ccToggleBtn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!controlCenter.contains(e.target) && !ccToggleBtn.contains(e.target)) {
            controlCenter.classList.remove('show');
            ccToggleBtn.classList.remove('active');
        }
    });

    // --- Sliders logic ---
    const displaySlider = document.getElementById('display-slider');
    const displayFill = document.getElementById('display-fill');
    const soundSlider = document.getElementById('sound-slider');
    const soundFill = document.getElementById('sound-fill');

    function updateSliderFill(slider, fill) { fill.style.width = slider.value + '%'; }
    displaySlider.addEventListener('input', () => updateSliderFill(displaySlider, displayFill));
    soundSlider.addEventListener('input', () => updateSliderFill(soundSlider, soundFill));
    updateSliderFill(displaySlider, displayFill);
    updateSliderFill(soundSlider, soundFill);

    // --- Lock Screen ---
    const lockscreen = document.getElementById('lockscreen');
    const lockInput = document.getElementById('lock-input');
    const lockBottom = document.querySelector('.lock-bottom');
    const lockDate = document.getElementById('lock-date');
    const lockTime = document.getElementById('lock-time');

    function updateLockTime() {
        const now = new Date();
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        lockDate.textContent = now.toLocaleDateString('en-US', dateOptions).replace(/,/g, '');

        let hours = now.getHours();
        let minutes = now.getMinutes().toString().padStart(2, '0');
        hours = hours % 12 || 12;
        lockTime.textContent = `${hours}:${minutes}`;
    }
    updateLockTime();
    setInterval(updateLockTime, 1000);

    // Unlock interactions
    document.addEventListener('keydown', (e) => {
        if (lockscreen && !lockscreen.classList.contains('unlocked')) {
            lockBottom.classList.add('active');
            lockInput.focus();
        }
    });

    if (lockBottom) {
        lockBottom.addEventListener('click', () => {
            lockBottom.classList.add('active');
            lockInput.focus();
        });
    }

    const lockHint = document.getElementById('lock-hint');
    const lockForgot = document.getElementById('lock-forgot');

    function initLockScreen() {
        const savedPassword = localStorage.getItem('macOSTahoe_Password');
        if (savedPassword) {
            lockInput.placeholder = "Enter Password";
            if (lockHint) lockHint.textContent = "Touch ID or Enter Password";
            if (lockForgot) lockForgot.style.display = "block";
        } else {
            lockInput.placeholder = "Create Password";
            if (lockHint) lockHint.textContent = "Enter a new password to use";
            if (lockForgot) lockForgot.style.display = "none";
        }
        
        // Setup forgot password hover and click
        if (lockForgot && !lockForgot.dataset.initialized) {
            lockForgot.dataset.initialized = 'true';
            lockForgot.addEventListener('mouseenter', () => lockForgot.style.color = '#ffffff');
            lockForgot.addEventListener('mouseleave', () => lockForgot.style.color = '#a1a1a6');
            
            // Wipe data
            lockForgot.addEventListener('click', () => {
                localStorage.removeItem('macOSTahoe_Password');
                localStorage.removeItem('macOSTahoe_FS');
                localStorage.removeItem('macOSTahoe_DesktopIcons');
                window.location.reload();
            });
        }
    }

    function unlockScreen() {
        lockscreen.classList.add('unlocked');
        lockInput.value = '';
        lockBottom.classList.remove('active');
        lockInput.blur();
    }
    
    if (lockInput) {
        initLockScreen();
        
        lockInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const inputValue = lockInput.value;
                if (!inputValue) return;

                const savedPassword = localStorage.getItem('macOSTahoe_Password');
                
                if (!savedPassword) {
                    // Create new password
                    localStorage.setItem('macOSTahoe_Password', inputValue);
                    unlockScreen();
                    initLockScreen(); // Update UI for next lock
                } else {
                    // Check password
                    if (inputValue === savedPassword) {
                        unlockScreen();
                    } else {
                        // Wrong password animation/hint
                        lockInput.value = '';
                        if (lockHint) {
                            lockHint.textContent = "Incorrect password";
                            lockHint.style.color = "#ff3b30";
                        }
                        lockInput.classList.add('shake');
                        
                        setTimeout(() => {
                            lockInput.classList.remove('shake');
                            if (lockHint) {
                                lockHint.textContent = "Touch ID or Enter Password";
                                lockHint.style.color = "";
                            }
                        }, 1000);
                    }
                }
            }
        });
    }

    // --- Control Center Edit Mode ---
    const editBtn = document.querySelector('.cc-edit-btn');
    // Select all widgets that can be removed
    const editableWidgets = document.querySelectorAll('.control-center .cc-module, .control-center .cc-bottom-tools .cc-icon-circle.large, .control-center .cc-row-2 .cc-icon-circle.large');

    // Inject remove badges into all editable widgets
    editableWidgets.forEach(widget => {
        const badge = document.createElement('div');
        badge.className = 'gw-badge remove-badge';
        badge.innerHTML = '<i class="fa-solid fa-minus"></i>';

        // Ensure widget is positioned relatively for the absolute badge
        if (getComputedStyle(widget).position === 'static') {
            widget.style.position = 'relative';
        }

        widget.appendChild(badge);

        // Handle removal (hide the widget)
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.style.display = 'none';
        });
    });

    // Handle Edit Mode Toggle
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            document.body.classList.toggle('edit-mode');

            if (document.body.classList.contains('edit-mode')) {
                editBtn.textContent = 'Done';
                editBtn.classList.add('editing');
            } else {
                editBtn.textContent = 'Edit Controls';
                editBtn.classList.remove('editing');
            }
        });
    }

    // Handle adding from gallery
    const addBadges = document.querySelectorAll('.gallery-widget-slot .add-badge');
    addBadges.forEach(badge => {
        badge.addEventListener('click', (e) => {
            e.stopPropagation();

            // For the replica, just find any hidden widget and bring it back to simulate adding
            const hiddenWidgets = Array.from(editableWidgets).filter(w => w.style.display === 'none');
            if (hiddenWidgets.length > 0) {
                // Flash animation for adding
                hiddenWidgets[0].style.display = '';
                hiddenWidgets[0].animate([
                    { transform: 'scale(0.8)', opacity: 0 },
                    { transform: 'scale(1.05)', opacity: 1 },
                    { transform: 'scale(1)', opacity: 1 }
                ], { duration: 300, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
            }
        });
    });

    // --- Desktop Context Menu & Drag Logic ---
    const desktop = document.querySelector('.desktop');
    const contextMenu = document.getElementById('context-menu');

    let snapToGridEnabled = false;
    const snapBtn = document.getElementById('snap-to-grid-btn');
    const snapCheck = document.getElementById('snap-check');

    window.saveDesktopIconPositions = function() {
        const positions = {};
        document.querySelectorAll('.desktop-folder').forEach(folder => {
            const name = folder.querySelector('.folder-name').textContent;
            positions[name] = {
                x: parseInt(folder.style.left) || 0,
                y: parseInt(folder.style.top) || 0
            };
        });
        localStorage.setItem('macOSTahoe_DesktopIcons', JSON.stringify(positions));
    };

    if (snapBtn) {
        snapBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            snapToGridEnabled = !snapToGridEnabled;
            if (snapCheck) snapCheck.style.opacity = snapToGridEnabled ? '1' : '0';
            closeAllOverlays();

            if (snapToGridEnabled) {
                document.querySelectorAll('.desktop-folder').forEach(folder => {
                    const gridSizeX = 90;
                    const gridSizeY = 110;
                    let currentLeft = parseInt(folder.style.left) || 0;
                    let currentTop = parseInt(folder.style.top) || 0;
                    const targetLeft = Math.round(currentLeft / gridSizeX) * gridSizeX + 10;
                    const targetTop = Math.round(currentTop / gridSizeY) * gridSizeY + 10;
                    
                    folder.animate([
                        { left: `${currentLeft}px`, top: `${currentTop}px` },
                        { left: `${targetLeft}px`, top: `${targetTop}px` }
                    ], { duration: 300, easing: 'ease-out' });
                    
                    folder.style.left = `${targetLeft}px`;
                    folder.style.top = `${targetTop}px`;
                });
                setTimeout(window.saveDesktopIconPositions, 350);
            }
        });
    }

    // Helper to make an element draggable on the desktop
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        element.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on the input
            if (e.target.tagName === 'INPUT') return;
            if (e.button !== 0) return; // Only left click

            isDragging = true;

            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(element.style.left) || element.offsetLeft;
            initialTop = parseInt(element.style.top) || element.offsetTop;

            // Bring to front
            element.style.zIndex = 1000;

            function onMouseMove(moveEvent) {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                element.style.left = `${initialLeft + dx}px`;
                element.style.top = `${initialTop + dy}px`;
            }

            function onMouseUp(upEvent) {
                if (!isDragging) return;
                isDragging = false;
                element.style.zIndex = 50; // reset

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                if (snapToGridEnabled) {
                    const gridSizeX = 90;
                    const gridSizeY = 110;
                    let currentLeft = parseInt(element.style.left) || 0;
                    let currentTop = parseInt(element.style.top) || 0;

                    const targetLeft = Math.round(currentLeft / gridSizeX) * gridSizeX + 10;
                    const targetTop = Math.round(currentTop / gridSizeY) * gridSizeY + 10;

                    element.animate([
                        { left: `${currentLeft}px`, top: `${currentTop}px` },
                        { left: `${targetLeft}px`, top: `${targetTop}px` }
                    ], { duration: 300, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)' });

                    element.style.left = `${targetLeft}px`;
                    element.style.top = `${targetTop}px`;
                }
                setTimeout(window.saveDesktopIconPositions, 350);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }


    desktop.addEventListener('contextmenu', (e) => {
        // Prevent default browser right-click menu
        e.preventDefault();

        // Calculate position
        let x = e.clientX;
        let y = e.clientY;

        // Ensure menu doesn't go off-screen
        const menuWidth = 240;
        const menuHeight = 260; // approximate

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

        desktop.dataset.contextX = e.clientX;
        desktop.dataset.contextY = e.clientY;

        contextMenu.style.display = 'flex';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    });

    // --- New Folder Logic ---
    window.createDesktopFolder = function (folderName = 'untitled folder', x = null, y = null) {
        if (x === null) {
            x = parseInt(desktop.dataset.contextX) || 100;
            x = x - 40;
        }
        if (y === null) {
            y = parseInt(desktop.dataset.contextY) || 100;
            y = y - 40;
        }

        const folder = document.createElement('div');
        folder.className = 'desktop-folder';
        folder.style.left = `${x}px`;
        folder.style.top = `${y}px`;

        const img = document.createElement('img');
        img.src = 'icons/folders/Folder.png';
        img.alt = 'Folder';
        img.draggable = false;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'folder-name';
        nameSpan.textContent = folderName;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'folder-name-input';
        nameInput.value = folderName;

        folder.appendChild(img);
        folder.appendChild(nameSpan);
        folder.appendChild(nameInput);
        desktop.appendChild(folder);

        makeDraggable(folder);

        if (snapToGridEnabled) {
            const gridSizeX = 90;
            const gridSizeY = 110;
            let currentLeft = parseInt(folder.style.left) || 0;
            let currentTop = parseInt(folder.style.top) || 0;
            folder.style.left = `${Math.round(currentLeft / gridSizeX) * gridSizeX + 10}px`;
            folder.style.top = `${Math.round(currentTop / gridSizeY) * gridSizeY + 10}px`;
        }

        function finishRename() {
            const oldName = nameSpan.textContent;
            const newName = nameInput.value.trim() || 'untitled folder';
            nameSpan.textContent = newName;
            nameSpan.classList.remove('editing');
            nameInput.classList.remove('active');

            if (oldName !== newName && window.fsHelper && window.mockFS['~/Desktop'].includes(oldName)) {
                window.fsHelper.rename('~/Desktop', oldName, newName);
            }
            window.saveDesktopIconPositions();
        }

        nameInput.addEventListener('blur', finishRename);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishRename();
        });

        folder.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-folder').forEach(f => f.classList.remove('selected'));
            folder.classList.add('selected');
        });

        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            if (folder.classList.contains('selected')) {
                nameSpan.classList.add('editing');
                nameInput.classList.add('active');
                nameInput.value = nameSpan.textContent;
                nameInput.focus();
                nameInput.select();
            }
        });

        // Double click to open in Finder
        folder.addEventListener('dblclick', () => {
            if (typeof createWindow === 'function') {
                window.currentDir = '~/Desktop';
                createWindow('Finder', 'icons/apple/Finder.png', null);
            }
        });

        return { folder, nameSpan, nameInput };
    };

    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contextMenu.style.display = 'none';

            let baseName = 'untitled folder';
            let folderName = baseName;
            let counter = 1;
            const items = (window.mockFS && window.mockFS['~/Desktop']) ? window.mockFS['~/Desktop'] : [];
            while (items.includes(folderName)) {
                counter++;
                folderName = `${baseName} ${counter}`;
            }

            if (window.fsHelper) {
                window.fsHelper.createDir('~/Desktop', folderName);
            }

            const { nameSpan, nameInput } = window.createDesktopFolder(folderName);
            window.saveDesktopIconPositions();

            nameSpan.classList.add('editing');
            nameInput.classList.add('active');

            setTimeout(() => {
                nameInput.focus();
                nameInput.select();
            }, 50);
        });
    }

    const openTerminalBtn = document.getElementById('open-terminal-btn');
    if (openTerminalBtn) {
        openTerminalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contextMenu.style.display = 'none';
            const terminalDockIcon = document.querySelector('.dock-icon-wrapper[data-name="Terminal"]');
            if (terminalDockIcon) terminalDockIcon.click();
        });
    }

    // Deselect folders when clicking on desktop
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('desktop') || e.target.classList.contains('main-content')) {
            document.querySelectorAll('.desktop-folder').forEach(f => f.classList.remove('selected'));
        }
    });

    // --- Top Menu Bar Interactions ---
    const wifiToggle = document.getElementById('wifi-toggle');
    const wifiMenu = document.getElementById('wifi-menu');

    const spotlightToggle = document.getElementById('spotlight-toggle');
    const spotlightSearch = document.getElementById('spotlight-search');
    const spotlightInput = document.getElementById('spotlight-input');

    const siriToggle = document.getElementById('siri-toggle');
    const siriOrb = document.getElementById('siri-orb');

    const datetimeToggle = document.getElementById('datetime-toggle');
    const notificationCenter = document.getElementById('notification-center');

    // --- Top Left Interactions ---
    const appleToggle = document.getElementById('apple-menu-toggle');
    const appleMenu = document.getElementById('apple-menu');
    const finderToggle = document.getElementById('finder-menu-toggle');
    const finderMenu = document.getElementById('finder-menu');
    const dummyMenu = document.getElementById('dummy-menu');

    const otherLeftToggles = [
        document.getElementById('file-menu-toggle'),
        document.getElementById('edit-menu-toggle'),
        document.getElementById('view-menu-toggle'),
        document.getElementById('go-menu-toggle'),
        document.getElementById('window-menu-toggle'),
        document.getElementById('help-menu-toggle')
    ];

    // Helper to close all overlays
    function closeAllOverlays() {
        contextMenu.style.display = 'none';

        if (wifiMenu) wifiMenu.style.display = 'none';
        if (spotlightSearch) spotlightSearch.classList.remove('active');
        if (siriOrb) siriOrb.classList.remove('active');
        if (notificationCenter) notificationCenter.classList.remove('active');
        if (appleMenu) appleMenu.style.display = 'none';
        if (finderMenu) finderMenu.style.display = 'none';
        if (dummyMenu) dummyMenu.style.display = 'none';

        if (wifiToggle) wifiToggle.classList.remove('active');
        if (spotlightToggle) spotlightToggle.classList.remove('active');
        if (siriToggle) siriToggle.classList.remove('active');
        if (datetimeToggle) datetimeToggle.classList.remove('active');

        if (appleToggle) appleToggle.classList.remove('active');
        if (finderToggle) finderToggle.classList.remove('active');
        otherLeftToggles.forEach(t => t && t.classList.remove('active'));
    }

    let menuOpenTimeout;
    let menuCloseTimeout;

    function setupMenuToggle(toggle, menu) {
        if (!toggle || !menu) return;

        toggle.addEventListener('mouseenter', (e) => {
            clearTimeout(menuCloseTimeout);
            clearTimeout(menuOpenTimeout);

            const isAnyMenuOpen = Array.from(document.querySelectorAll('.top-dropdown')).some(m => m.style.display === 'flex');
            const hoverDelay = isAnyMenuOpen ? 0 : 500;

            menuOpenTimeout = setTimeout(() => {
                const wasActive = menu.style.display === 'flex';
                if (!wasActive) {
                    closeAllOverlays();
                    toggle.classList.add('active');
                    menu.style.display = 'flex';
                    const rect = toggle.getBoundingClientRect();
                    menu.style.left = `${rect.left}px`;
                }
            }, hoverDelay);
        });

        toggle.addEventListener('mouseleave', () => {
            clearTimeout(menuOpenTimeout);
            menuCloseTimeout = setTimeout(() => {
                menu.style.display = 'none';
                toggle.classList.remove('active');
            }, 300);
        });

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(menuOpenTimeout);
            clearTimeout(menuCloseTimeout);
            const wasActive = menu.style.display === 'flex';
            closeAllOverlays();
            if (!wasActive) {
                toggle.classList.add('active');
                menu.style.display = 'flex';
                const rect = toggle.getBoundingClientRect();
                menu.style.left = `${rect.left}px`;
            }
        });

        menu.addEventListener('mouseenter', () => {
            clearTimeout(menuCloseTimeout);
            clearTimeout(menuOpenTimeout);
        });

        menu.addEventListener('mouseleave', () => {
            clearTimeout(menuOpenTimeout);
            menuCloseTimeout = setTimeout(() => {
                menu.style.display = 'none';
                toggle.classList.remove('active');
            }, 300);
        });
    }

    setupMenuToggle(appleToggle, appleMenu);
    setupMenuToggle(finderToggle, finderMenu);
    otherLeftToggles.forEach(toggle => {
        setupMenuToggle(toggle, dummyMenu);
    });

    if (wifiToggle && wifiMenu) {
        wifiToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = wifiMenu.style.display === 'flex';
            closeAllOverlays();

            if (!wasActive) {
                wifiToggle.classList.add('active');
                wifiMenu.style.display = 'flex';
                // Position it exactly under the icon
                const rect = wifiToggle.getBoundingClientRect();
                wifiMenu.style.top = `${rect.bottom + 8}px`;
                wifiMenu.style.right = `${window.innerWidth - rect.right - 20}px`;
            }
        });
    }

    if (spotlightToggle && spotlightSearch) {
        spotlightToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = spotlightSearch.classList.contains('active');
            closeAllOverlays();

            if (!wasActive) {
                spotlightToggle.classList.add('active');
                spotlightSearch.classList.add('active');
                setTimeout(() => {
                    spotlightInput.focus();
                    spotlightInput.select();
                }, 100);
            }
        });
    }

    // --- Spotlight Search Engine ---
    const spotlightResults = document.getElementById('spotlight-results');
    const allApps = ['Safari', 'Terminal', 'Finder', 'Messages', 'System Settings', 'App Store', 'Maps', 'Photos', 'FaceTime', 'Calendar', 'Contacts', 'Reminders', 'Notes', 'Apple TV', 'Music', 'Podcasts'];
    let currentResults = [];
    let selectedIndex = -1;

    function renderSpotlightResults() {
        if (!spotlightResults) return;
        spotlightResults.innerHTML = '';
        if (currentResults.length === 0) {
            spotlightResults.classList.remove('show');
            return;
        }
        spotlightResults.classList.add('show');
        
        currentResults.forEach((result, idx) => {
            const item = document.createElement('div');
            item.className = 'spotlight-result-item' + (idx === selectedIndex ? ' selected' : '');
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'spotlight-result-icon';
            if (result.type === 'math') {
                iconDiv.innerHTML = '<i class="fa-solid fa-calculator" style="font-size: 20px;"></i>';
            } else {
                const img = document.createElement('img');
                img.src = result.icon;
                img.onerror = () => { img.src = 'icons/folders/Folder.png'; };
                iconDiv.appendChild(img);
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'spotlight-result-info';
            
            const title = document.createElement('span');
            title.className = 'spotlight-result-title';
            title.textContent = result.title;
            
            const subtitle = document.createElement('span');
            subtitle.className = 'spotlight-result-subtitle';
            subtitle.textContent = result.subtitle;

            infoDiv.appendChild(title);
            if (result.subtitle) infoDiv.appendChild(subtitle);

            item.appendChild(iconDiv);
            item.appendChild(infoDiv);

            item.addEventListener('mouseenter', () => {
                selectedIndex = idx;
                renderSpotlightResults();
            });
            item.addEventListener('click', () => {
                executeSpotlightResult(result);
            });

            spotlightResults.appendChild(item);
        });
    }

    function executeSpotlightResult(result) {
        closeAllOverlays();
        if (spotlightInput) {
            spotlightInput.value = '';
            searchSpotlight('');
        }

        if (result.type === 'app') {
            const dockIcon = document.querySelector(`.dock-icon-wrapper[data-name="${result.title}"]`);
            if (dockIcon) dockIcon.click();
            else if (typeof createWindow === 'function') createWindow(result.title, result.icon, null);
        } else if (result.type === 'file') {
            if (typeof createWindow === 'function') {
                const parentPath = result.path.substring(0, result.path.lastIndexOf('/')) || '/';
                window.currentDir = parentPath;
                createWindow('Finder', 'icons/apple/Finder.png', null);
            }
        }
    }

    function searchSpotlight(query) {
        query = query.trim().toLowerCase();
        currentResults = [];
        selectedIndex = -1;
        if (!query) {
            renderSpotlightResults();
            return;
        }

        try {
            if (/^[0-9+\-*/().\s]+$/.test(query)) {
                const res = new Function('return ' + query)();
                if (typeof res === 'number' && !isNaN(res)) {
                    currentResults.push({
                        title: res.toString(),
                        subtitle: 'Calculator',
                        type: 'math'
                    });
                }
            }
        } catch (e) {}

        allApps.forEach(app => {
            if (app.toLowerCase().includes(query)) {
                currentResults.push({
                    title: app,
                    subtitle: 'Application',
                    icon: `icons/apple/${app}.png`,
                    type: 'app'
                });
            }
        });

        if (window.mockFS) {
            const traverseFS = (path) => {
                const items = window.mockFS[path] || [];
                items.forEach(item => {
                    if (item.toLowerCase().includes(query)) {
                        const isApp = item.endsWith('.app');
                        if (!isApp) {
                            currentResults.push({
                                title: item,
                                subtitle: path === '/' ? '/' : path + '/' + item,
                                icon: item.includes('.') ? 'icons/apple/Notes.png' : 'icons/folders/Folder.png',
                                type: 'file',
                                path: path === '/' ? '/' + item : path + '/' + item
                            });
                        }
                    }
                    const subPath = window.fsHelper ? window.fsHelper.normalize(path + '/' + item) : path + '/' + item;
                    if (window.mockFS[subPath]) {
                        traverseFS(subPath);
                    }
                });
            };
            traverseFS('~');
            traverseFS('/');
        }
        
        const seen = new Set();
        currentResults = currentResults.filter(r => {
            const key = r.title + r.subtitle;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (currentResults.length > 0) selectedIndex = 0;
        renderSpotlightResults();
    }

    if (spotlightInput) {
        spotlightInput.addEventListener('input', (e) => {
            searchSpotlight(e.target.value);
        });

        spotlightInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (selectedIndex < currentResults.length - 1) selectedIndex++;
                renderSpotlightResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (selectedIndex > 0) selectedIndex--;
                renderSpotlightResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
                    executeSpotlightResult(currentResults[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                closeAllOverlays();
                spotlightInput.value = '';
                searchSpotlight('');
            }
        });
    }

    // Global shortcut Cmd+Space or Ctrl+Space
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (spotlightSearch && spotlightSearch.classList.contains('active')) {
                closeAllOverlays();
            } else if (spotlightToggle) {
                spotlightToggle.click();
            }
        }
    });

    if (siriToggle && siriOrb) {
        siriToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = siriOrb.classList.contains('active');
            closeAllOverlays();

            if (!wasActive) {
                siriToggle.classList.add('active');
                siriOrb.classList.add('active');
            }
        });
    }

    if (datetimeToggle && notificationCenter) {
        datetimeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = notificationCenter.classList.contains('active');
            closeAllOverlays();

            if (!wasActive) {
                datetimeToggle.classList.add('active');
                notificationCenter.classList.add('active');
            }
        });
    }

    // Close overlays on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#context-menu') &&
            !e.target.closest('#wifi-menu') &&
            !e.target.closest('#spotlight-search') &&
            !e.target.closest('#siri-orb') &&
            !e.target.closest('#notification-center') &&
            !e.target.closest('#apple-menu') &&
            !e.target.closest('#finder-menu') &&
            !e.target.closest('#dummy-menu') &&
            !e.target.closest('.menu-right') &&
            !e.target.closest('.menu-left')) {
            closeAllOverlays();
        }
    });

    // --- About This Mac (macOS Tahoe) ---
    const aboutOverlay = document.getElementById('about-mac-overlay');
    const aboutDialog = document.getElementById('about-mac-dialog');
    const aboutCloseBtn = document.getElementById('about-mac-close');

    function centerAboutDialog() {
        if (!aboutDialog) return;
        const dialogWidth = aboutDialog.offsetWidth || 310;
        const dialogHeight = aboutDialog.offsetHeight || 380;
        aboutDialog.style.left = `${(window.innerWidth - dialogWidth) / 2}px`;
        aboutDialog.style.top = `${(window.innerHeight - dialogHeight) / 2}px`;
    }

    // Find "About This Mac", "Restart...", "Lock Screen", and "Log Out Guest..." items in apple menu
    const appleMenuItems = document.querySelectorAll('#apple-menu .cm-item');
    appleMenuItems.forEach(item => {
        const text = item.textContent.trim();
        if (text === 'About This Mac') {
            item.addEventListener('click', () => {
                closeAllOverlays();
                aboutOverlay.classList.add('show');
                centerAboutDialog();
            });
        } else if (text === 'Restart...') {
            item.addEventListener('click', () => {
                window.location.reload();
            });
        } else if (text === 'Lock Screen') {
            item.addEventListener('click', () => {
                closeAllOverlays();
                const lockscreen = document.getElementById('lockscreen');
                if (lockscreen) {
                    lockscreen.classList.remove('unlocked');
                    const lockInput = document.getElementById('lock-input');
                    if (lockInput) {
                        lockInput.value = '';
                    }
                }
            });
        } else if (text === 'Log Out Guest...') {
            item.addEventListener('click', () => {
                localStorage.removeItem('macOSTahoe_FS');
                localStorage.removeItem('macOSTahoe_DesktopIcons');
                window.location.reload();
            });
        }
    });

    // Make About This Mac window draggable
    if (aboutDialog) {
        let isDraggingAbout = false;
        let aboutDragOffsetX = 0;
        let aboutDragOffsetY = 0;

        aboutDialog.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('.traffic-light') || e.target.closest('.about-mac-regulatory')) {
                return;
            }
            if (e.button !== 0) return;

            isDraggingAbout = true;
            const rect = aboutDialog.getBoundingClientRect();
            aboutDragOffsetX = e.clientX - rect.left;
            aboutDragOffsetY = e.clientY - rect.top;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingAbout && aboutOverlay && aboutOverlay.classList.contains('show')) {
                aboutDialog.style.left = `${e.clientX - aboutDragOffsetX}px`;
                aboutDialog.style.top = `${e.clientY - aboutDragOffsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDraggingAbout) {
                isDraggingAbout = false;
                document.body.style.userSelect = '';
            }
        });
    }

    // Close via traffic light
    if (aboutCloseBtn) {
        aboutCloseBtn.addEventListener('click', () => {
            aboutOverlay.classList.remove('show');
        });
    }

    // --- Load Desktop Icons on Startup ---
    setTimeout(() => {
        if (window.mockFS && window.mockFS['~/Desktop']) {
            const savedPositions = JSON.parse(localStorage.getItem('macOSTahoe_DesktopIcons')) || {};
            window.mockFS['~/Desktop'].forEach(itemName => {
                const pos = savedPositions[itemName] || { x: null, y: null };
                window.createDesktopFolder(itemName, pos.x, pos.y);
            });
        }
    }, 100);
});
