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

    // --- Desktop Context Menu ---
    const desktop = document.querySelector('.desktop');
    const contextMenu = document.getElementById('context-menu');

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

        contextMenu.style.display = 'flex';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
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

    function setupMenuToggle(toggle, menu) {
        if (!toggle || !menu) return;
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = menu.style.display === 'flex';
            closeAllOverlays();
            if (!wasActive) {
                toggle.classList.add('active');
                menu.style.display = 'flex';
                const rect = toggle.getBoundingClientRect();
                menu.style.left = `${rect.left}px`;
            }
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
});
