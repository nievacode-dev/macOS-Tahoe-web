// --- Main Interactions ---
document.addEventListener('DOMContentLoaded', () => {
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

    if (lockInput) {
        lockInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // Unlock!
                lockscreen.classList.add('unlocked');
                lockInput.value = '';
                lockBottom.classList.remove('active');
                // Remove focus to prevent ghost typing
                lockInput.blur();
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
                setTimeout(() => spotlightInput.focus(), 100);
            }
        });
    }

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

    // Find "About This Mac" and "Log Out Guest..." items in apple menu
    const appleMenuItems = document.querySelectorAll('#apple-menu .cm-item');
    appleMenuItems.forEach(item => {
        const text = item.textContent.trim();
        if (text === 'About This Mac') {
            item.addEventListener('click', () => {
                closeAllOverlays();
                aboutOverlay.classList.add('show');
                centerAboutDialog();
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
