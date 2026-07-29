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
    // --- Dock Positions Persistence ---
    const DOCK_POSITIONS_KEY = 'macOSTahoe_Dock_Positions';

    function saveDockPositions() {
        const dockApps = document.querySelector('.dock-apps');
        const dockFolders = document.querySelector('.dock-folders');
        const appOrder = [];
        const folderOrder = [];

        if (dockApps) {
            dockApps.querySelectorAll('.dock-icon-wrapper').forEach(wrapper => {
                const appName = wrapper.getAttribute('data-name');
                if (appName) appOrder.push(appName);
            });
        }
        if (dockFolders) {
            dockFolders.querySelectorAll('.dock-icon-wrapper').forEach(wrapper => {
                const folderName = wrapper.getAttribute('data-name');
                if (folderName) folderOrder.push(folderName);
            });
        }

        const dockData = { apps: appOrder, folders: folderOrder };
        localStorage.setItem(DOCK_POSITIONS_KEY, JSON.stringify(dockData));
    }

    function loadDockPositions() {
        const saved = localStorage.getItem(DOCK_POSITIONS_KEY);
        if (!saved) return;

        try {
            const dockData = JSON.parse(saved);
            if (dockData.apps && Array.isArray(dockData.apps)) {
                const dockApps = document.querySelector('.dock-apps');
                if (dockApps) {
                    const existingAppNodes = Array.from(dockApps.querySelectorAll('.dock-icon-wrapper'));
                    const nodeMap = new Map();
                    existingAppNodes.forEach(node => {
                        nodeMap.set(node.getAttribute('data-name'), node);
                    });

                    dockData.apps.forEach(appName => {
                        const node = nodeMap.get(appName);
                        if (node) {
                            dockApps.appendChild(node);
                            nodeMap.delete(appName);
                        }
                    });
                    nodeMap.forEach(node => dockApps.appendChild(node));
                }
            }

            if (dockData.folders && Array.isArray(dockData.folders)) {
                const dockFolders = document.querySelector('.dock-folders');
                if (dockFolders) {
                    const existingFolderNodes = Array.from(dockFolders.querySelectorAll('.dock-icon-wrapper'));
                    const folderMap = new Map();
                    existingFolderNodes.forEach(node => {
                        folderMap.set(node.getAttribute('data-name'), node);
                    });

                    dockData.folders.forEach(folderName => {
                        const node = folderMap.get(folderName);
                        if (node) {
                            dockFolders.appendChild(node);
                            folderMap.delete(folderName);
                        }
                    });
                    folderMap.forEach(node => dockFolders.appendChild(node));
                }
            }
        } catch (e) {
            console.error("Failed to parse dock positions from localStorage", e);
        }
    }

    // Restore saved dock order on launch
    loadDockPositions();

    // --- Smoother macOS Dock Magnification ---
    const dock = document.querySelector('.dock');
    const getWrappers = () => Array.from(document.querySelectorAll('.dock-icon-wrapper'));

    // Lowered scale and height based on user request
    const maxScale = 1.8;
    const maxDistance = 200;
    const baseWidth = 52;

    dock.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            getWrappers().forEach(wrapper => {
                const icon = wrapper.querySelector('.dock-icon');
                const rect = wrapper.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const distance = Math.abs(e.clientX - x);

                if (distance < maxDistance) {
                    const curve = (Math.cos((distance / maxDistance) * Math.PI) + 1) / 2;
                    const scale = 1 + (maxScale - 1) * curve;
                    wrapper.style.width = `${baseWidth * scale}px`;
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
            getWrappers().forEach(wrapper => {
                const icon = wrapper.querySelector('.dock-icon');
                wrapper.style.width = `${baseWidth}px`;
                icon.style.transform = 'scale(1) translateY(0)';
                icon.style.zIndex = 1;
            });
        });
    });

    // --- Dock Icon Dragging ---
    let draggedDockIcon = null;

    getWrappers().forEach(wrapper => {
        wrapper.draggable = true;

        wrapper.addEventListener('dragstart', function (e) {
            draggedDockIcon = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        wrapper.addEventListener('dragend', function () {
            setTimeout(() => this.style.opacity = '1', 0);
            draggedDockIcon = null;
            saveDockPositions();
        });

        wrapper.addEventListener('dragover', function (e) {
            e.preventDefault();
        });

        wrapper.addEventListener('drop', function (e) {
            e.preventDefault();
            saveDockPositions();
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

    // ==========================================================
    // Control Center Manager — data-driven, persistent, customizable
    // ==========================================================
    const CC_STORAGE_KEY = 'macOSTahoe_CC_Widgets';
    const CC_TOGGLES_KEY = 'macOSTahoe_CC_Toggles';

    // Widget registry — every possible CC widget
    const WIDGET_REGISTRY = [
        // --- Connectivity group (top-left) ---
        { id: 'wifi', label: 'Wi-Fi', subtitle: 'Home', icon: 'fa-solid fa-wifi', category: 'Connectivity', type: 'pill', section: 'connectivity', defaultActive: true, toggleable: true },
        { id: 'bluetooth', label: 'Bluetooth', icon: 'fa-brands fa-bluetooth-b', category: 'Connectivity', type: 'circle', section: 'connectivity', defaultActive: true, toggleable: true },
        { id: 'airdrop', label: 'AirDrop', icon: 'fa-solid fa-satellite-dish', category: 'Connectivity', type: 'circle', section: 'connectivity', defaultActive: true, toggleable: true },
        // --- Now Playing (top-right) ---
        { id: 'now-playing', label: 'Now Playing', icon: 'fa-solid fa-music', category: 'Media', type: 'now-playing', section: 'media', defaultActive: true },
        // --- Focus group (mid) ---
        { id: 'focus', label: 'Focus', icon: 'fa-solid fa-moon', category: 'Productivity', type: 'pill-focus', section: 'focus', defaultActive: true, toggleable: true },
        { id: 'stage-manager', label: 'Stage Manager', icon: 'fa-solid fa-layer-group', category: 'Desktop & Finder', type: 'circle-outline', section: 'focus', defaultActive: true, toggleable: true },
        { id: 'mirroring', label: 'Screen Mirroring', icon: 'fa-regular fa-rectangle-list', category: 'Desktop & Finder', type: 'circle-outline', section: 'focus', defaultActive: true, toggleable: true },
        // --- Sliders ---
        { id: 'display', label: 'Display', icon: 'fa-solid fa-sun', category: 'Display & Brightness', type: 'slider', section: 'slider', defaultActive: true, sliderValue: 70 },
        { id: 'sound', label: 'Sound', icon: 'fa-solid fa-volume-low', category: 'Media', type: 'slider', section: 'slider', defaultActive: true, sliderValue: 50 },
        { id: 'keyboard-brightness', label: 'Keyboard Brightness', icon: 'fa-regular fa-keyboard', category: 'Display & Brightness', type: 'slider', section: 'slider', defaultActive: false, sliderValue: 60 },
        // --- Bottom tools ---
        { id: 'dark-mode', label: 'Dark Mode', icon: 'fa-solid fa-circle-half-stroke', category: 'Appearance', type: 'circle-bottom', section: 'bottom', defaultActive: true, toggleable: true },
        { id: 'calculator', label: 'Calculator', icon: 'fa-solid fa-calculator', category: 'Utilities', type: 'circle-bottom', section: 'bottom', defaultActive: true },
        { id: 'timer', label: 'Timer', icon: 'fa-solid fa-stopwatch', category: 'Utilities', type: 'circle-bottom', section: 'bottom', defaultActive: true },
        { id: 'screenshot', label: 'Screenshot', icon: 'fa-solid fa-camera', category: 'Utilities', type: 'circle-bottom', section: 'bottom', defaultActive: true },
        // --- Additional widgets (not active by default) ---
        { id: 'battery', label: 'Battery', icon: 'fa-solid fa-battery-three-quarters', category: 'Battery', type: 'battery', section: 'module', defaultActive: false },
        { id: 'music-recognition', label: 'Music Recognition', icon: 'fa-solid fa-waveform', category: 'Media', type: 'circle-bottom', section: 'bottom', defaultActive: false },
        { id: 'screen-recording', label: 'Screen Recording', icon: 'fa-solid fa-record-vinyl', category: 'Utilities', type: 'circle-bottom', section: 'bottom', defaultActive: false },
        { id: 'do-not-disturb', label: 'Do Not Disturb', icon: 'fa-solid fa-bell-slash', category: 'Productivity', type: 'circle-bottom', section: 'bottom', defaultActive: false, toggleable: true },
        { id: 'hearing', label: 'Hearing', icon: 'fa-solid fa-ear-listen', category: 'Accessibility', type: 'circle-bottom', section: 'bottom', defaultActive: false, toggleable: true },
        { id: 'accessibility', label: 'Accessibility', icon: 'fa-solid fa-universal-access', category: 'Accessibility', type: 'circle-bottom', section: 'bottom', defaultActive: false },
    ];

    // Gallery category definitions
    const GALLERY_CATEGORIES = [
        { id: 'all', label: 'All Controls', icon: 'fa-solid fa-grip' },
        { id: 'Connectivity', label: 'Connectivity', icon: 'fa-solid fa-wifi' },
        { id: 'Media', label: 'Media', icon: 'fa-solid fa-music' },
        { id: 'Productivity', label: 'Productivity', icon: 'fa-solid fa-moon' },
        { id: 'Display & Brightness', label: 'Display & Brightness', icon: 'fa-solid fa-sun' },
        { id: 'Desktop & Finder', label: 'Desktop & Finder', icon: 'fa-solid fa-desktop' },
        { id: 'Utilities', label: 'Utilities', icon: 'fa-solid fa-wrench' },
        { id: 'Appearance', label: 'Appearance', icon: 'fa-solid fa-circle-half-stroke' },
        { id: 'Battery', label: 'Battery', icon: 'fa-solid fa-battery-half' },
        { id: 'Accessibility', label: 'Accessibility', icon: 'fa-solid fa-universal-access' },
    ];

    class ControlCenterManager {
        constructor() {
            this.ccEl = document.getElementById('control-center');
            this.galleryEl = document.getElementById('controls-gallery');
            this.ccToggleBtn = document.getElementById('cc-toggle');
            this.isEditing = false;
            this.activeFilter = 'all';
            this.searchQuery = '';

            // Load persisted active widget IDs, or use defaults
            this.activeWidgetIds = this._loadActiveWidgets();
            // Load toggle states
            this.toggleStates = this._loadToggleStates();

            this.render();
            this.renderGallery();
            this._bindToggle();
        }

        // --- Persistence ---
        _loadActiveWidgets() {
            const saved = localStorage.getItem(CC_STORAGE_KEY);
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* fallback */ }
            }
            return WIDGET_REGISTRY.filter(w => w.defaultActive).map(w => w.id);
        }

        _saveActiveWidgets() {
            localStorage.setItem(CC_STORAGE_KEY, JSON.stringify(this.activeWidgetIds));
        }

        _loadToggleStates() {
            const saved = localStorage.getItem(CC_TOGGLES_KEY);
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* fallback */ }
            }
            // Default: wifi, bluetooth, airdrop are active
            return { wifi: true, bluetooth: true, airdrop: true };
        }

        _saveToggleStates() {
            localStorage.setItem(CC_TOGGLES_KEY, JSON.stringify(this.toggleStates));
        }

        // --- Get widget by ID ---
        _getWidget(id) {
            return WIDGET_REGISTRY.find(w => w.id === id);
        }

        // --- Active widgets list ---
        _getActiveWidgets() {
            return this.activeWidgetIds.map(id => this._getWidget(id)).filter(Boolean);
        }

        // --- Inactive widgets list (for gallery) ---
        _getInactiveWidgets() {
            return WIDGET_REGISTRY.filter(w => !this.activeWidgetIds.includes(w.id));
        }

        // --- Toggle CC panel ---
        _bindToggle() {
            this.ccToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.ccEl.classList.toggle('show');
                this.ccToggleBtn.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!this.ccEl.contains(e.target) && !this.ccToggleBtn.contains(e.target) && !this.galleryEl.contains(e.target)) {
                    this.ccEl.classList.remove('show');
                    this.ccToggleBtn.classList.remove('active');
                    if (this.isEditing) this._exitEditMode();
                }
            });
        }

        // --- Render the full CC ---
        render() {
            const active = this._getActiveWidgets();
            const connectivity = active.filter(w => w.section === 'connectivity');
            const media = active.filter(w => w.section === 'media');
            const focus = active.filter(w => w.section === 'focus');
            const sliders = active.filter(w => w.section === 'slider');
            const bottom = active.filter(w => w.section === 'bottom');
            const modules = active.filter(w => w.section === 'module');

            let html = '';

            // --- Top grid: connectivity left, now-playing right ---
            if (connectivity.length > 0 || media.length > 0) {
                html += '<div class="cc-section cc-top-grid">';
                // Left column
                html += '<div class="cc-col-left">';
                const pill = connectivity.find(w => w.type === 'pill');
                const circles = connectivity.filter(w => w.type === 'circle');
                if (pill) {
                    const isOn = this.toggleStates[pill.id] !== false;
                    html += `<div class="cc-module cc-pill cc-${pill.id}" data-widget-id="${pill.id}">
                        <div class="cc-icon-circle ${isOn ? 'active' : ''}"><i class="${pill.icon}"></i></div>
                        <div class="cc-text">
                            <span class="cc-title">${pill.label}</span>
                            ${pill.subtitle ? `<span class="cc-subtitle">${pill.subtitle}</span>` : ''}
                        </div>
                    </div>`;
                }
                if (circles.length > 0) {
                    html += '<div class="cc-row-2">';
                    circles.forEach(c => {
                        const isOn = this.toggleStates[c.id] !== false;
                        html += `<div class="cc-icon-circle large ${isOn ? 'active' : ''}" data-widget-id="${c.id}"><i class="${c.icon}"></i></div>`;
                    });
                    html += '</div>';
                }
                html += '</div>';
                // Right column
                html += '<div class="cc-col-right">';
                const np = media.find(w => w.type === 'now-playing');
                if (np) {
                    html += `<div class="cc-module cc-now-playing" data-widget-id="${np.id}">
                        <div class="np-header">
                            <img src="icons/apple/Podcasts.png" alt="Art" class="np-art">
                            <div class="np-info">
                                <span class="np-title">Besties</span>
                                <span class="np-subtitle">Black Country, New R...</span>
                            </div>
                        </div>
                        <div class="np-controls">
                            <i class="fa-solid fa-backward-step"></i>
                            <i class="fa-solid fa-play fa-lg"></i>
                            <i class="fa-solid fa-forward-step"></i>
                        </div>
                    </div>`;
                }
                html += '</div>';
                html += '</div>';
            }

            // --- Focus grid ---
            if (focus.length > 0) {
                html += '<div class="cc-section cc-focus-grid">';
                const focusPill = focus.find(w => w.type === 'pill-focus');
                const focusCircles = focus.filter(w => w.type === 'circle-outline');
                html += '<div class="cc-col-left">';
                if (focusPill) {
                    const isOn = this.toggleStates[focusPill.id] === true;
                    html += `<div class="cc-module cc-pill cc-focus" data-widget-id="${focusPill.id}">
                        <div class="cc-icon-circle focus-icon ${isOn ? 'active' : ''}"><i class="${focusPill.icon}"></i></div>
                        <div class="cc-text"><span class="cc-title">${focusPill.label}</span></div>
                    </div>`;
                }
                html += '</div>';
                html += '<div class="cc-col-right">';
                if (focusCircles.length > 0) {
                    html += '<div class="cc-row-2">';
                    focusCircles.forEach(c => {
                        const isOn = this.toggleStates[c.id] === true;
                        html += `<div class="cc-icon-circle large outline ${isOn ? 'active' : ''}" data-widget-id="${c.id}"><i class="${c.icon}"></i></div>`;
                    });
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';
            }

            // --- Battery module ---
            modules.forEach(w => {
                if (w.type === 'battery') {
                    html += `<div class="cc-module cc-battery" data-widget-id="${w.id}">
                        <i class="${w.icon} cc-battery-icon"></i>
                        <div class="cc-battery-info">
                            <span class="cc-battery-pct">100%</span>
                            <div class="cc-battery-bar"><div class="cc-battery-fill" style="width: 100%"></div></div>
                            <span class="cc-battery-status">Fully Charged</span>
                        </div>
                    </div>`;
                }
            });

            // --- Sliders ---
            sliders.forEach(s => {
                const val = s.sliderValue || 50;
                html += `<div class="cc-module cc-slider-box" data-widget-id="${s.id}">
                    <span class="cc-title">${s.label}</span>
                    <div class="cc-slider-wrapper">
                        <div class="cc-slider-fill" id="${s.id}-fill" style="width: ${val}%"></div>
                        <i class="${s.icon} cc-slider-icon"></i>
                        <input type="range" class="cc-slider" id="${s.id}-slider" min="0" max="100" value="${val}">
                    </div>
                </div>`;
            });

            // --- Bottom tools ---
            if (bottom.length > 0) {
                html += '<div class="cc-bottom-tools">';
                bottom.forEach(b => {
                    const isOn = this.toggleStates[b.id] === true;
                    html += `<div class="cc-icon-circle large ${isOn ? 'active' : ''}" data-widget-id="${b.id}"><i class="${b.icon}"></i></div>`;
                });
                html += '</div>';
            }

            // --- Edit button ---
            html += '<div class="cc-edit-btn">Edit Controls</div>';

            this.ccEl.innerHTML = html;
            this._bindSliders();
            this._bindToggles();
            this._bindEditBtn();
        }

        // --- Bind slider fills ---
        _bindSliders() {
            this.ccEl.querySelectorAll('.cc-slider').forEach(slider => {
                const id = slider.id.replace('-slider', '');
                const fill = document.getElementById(`${id}-fill`);
                if (!fill) return;
                const updateFill = () => { fill.style.width = slider.value + '%'; };
                slider.addEventListener('input', updateFill);
                updateFill();
            });
        }

        // --- Bind toggle interactions ---
        _bindToggles() {
            // Pill toggles
            this.ccEl.querySelectorAll('.cc-pill[data-widget-id]').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (this.isEditing) return;
                    const wid = el.dataset.widgetId;
                    const w = this._getWidget(wid);
                    if (!w || !w.toggleable) return;
                    const circle = el.querySelector('.cc-icon-circle');
                    if (circle) {
                        circle.classList.toggle('active');
                        this.toggleStates[wid] = circle.classList.contains('active');
                        this._saveToggleStates();
                    }
                });
            });
            // Circle toggles
            this.ccEl.querySelectorAll('.cc-icon-circle.large[data-widget-id]').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (this.isEditing) return;
                    const wid = el.dataset.widgetId;
                    const w = this._getWidget(wid);
                    if (!w || !w.toggleable) return;
                    el.classList.toggle('active');
                    this.toggleStates[wid] = el.classList.contains('active');
                    this._saveToggleStates();
                });
            });
        }

        // --- Edit mode ---
        _bindEditBtn() {
            const btn = this.ccEl.querySelector('.cc-edit-btn');
            if (!btn) return;
            btn.addEventListener('click', () => {
                if (this.isEditing) {
                    this._exitEditMode();
                } else {
                    this._enterEditMode();
                }
            });
        }

        _enterEditMode() {
            this.isEditing = true;
            document.body.classList.add('edit-mode');
            const btn = this.ccEl.querySelector('.cc-edit-btn');
            if (btn) { btn.textContent = 'Done'; btn.classList.add('editing'); }

            // Inject remove badges on all widget elements
            this.ccEl.querySelectorAll('[data-widget-id]').forEach(el => {
                if (el.querySelector('.remove-badge')) return;
                const badge = document.createElement('div');
                badge.className = 'gw-badge remove-badge';
                badge.innerHTML = '<i class="fa-solid fa-minus"></i>';
                if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
                el.appendChild(badge);

                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wid = el.dataset.widgetId;
                    this._removeWidget(wid);
                });
            });

            // Force badges visible (CSS already handles this via body.edit-mode)
            this.renderGallery();
        }

        _exitEditMode() {
            this.isEditing = false;
            document.body.classList.remove('edit-mode');
            const btn = this.ccEl.querySelector('.cc-edit-btn');
            if (btn) { btn.textContent = 'Edit Controls'; btn.classList.remove('editing'); }
            // Remove badges
            this.ccEl.querySelectorAll('.remove-badge').forEach(b => b.remove());
            this._saveActiveWidgets();
        }

        _removeWidget(widgetId) {
            this.activeWidgetIds = this.activeWidgetIds.filter(id => id !== widgetId);
            this._saveActiveWidgets();
            this.render();
            if (this.isEditing) {
                this._enterEditMode(); // re-inject badges
                this.renderGallery();
            }
        }

        _addWidget(widgetId) {
            if (this.activeWidgetIds.includes(widgetId)) return;
            this.activeWidgetIds.push(widgetId);
            this._saveActiveWidgets();
            this.render();
            if (this.isEditing) {
                this._enterEditMode();
                this.renderGallery();
            }
            // Animate the newly added widget
            const newEl = this.ccEl.querySelector(`[data-widget-id="${widgetId}"]`);
            if (newEl) newEl.classList.add('cc-widget-enter');
        }

        // --- Render Gallery ---
        renderGallery() {
            const inactive = this._getInactiveWidgets();
            let filtered = inactive;

            // Apply category filter
            if (this.activeFilter !== 'all') {
                filtered = filtered.filter(w => w.category === this.activeFilter);
            }

            // Apply search filter
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(w => w.label.toLowerCase().includes(q) || w.category.toLowerCase().includes(q));
            }

            // Group by category
            const grouped = {};
            filtered.forEach(w => {
                if (!grouped[w.category]) grouped[w.category] = [];
                grouped[w.category].push(w);
            });

            let html = '';

            // Sidebar
            html += '<div class="gallery-sidebar">';
            html += '<div class="gallery-search"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search Controls" id="gallery-search-input"></div>';
            html += '<div class="gallery-nav">';
            GALLERY_CATEGORIES.forEach(cat => {
                const activeClass = this.activeFilter === cat.id ? 'active' : '';
                html += `<div class="gallery-item ${activeClass}" data-category="${cat.id}"><i class="${cat.icon}"></i> ${cat.label}</div>`;
            });
            html += '</div></div>';

            // Main area
            html += '<div class="gallery-main">';
            if (Object.keys(grouped).length === 0) {
                if (inactive.length === 0) {
                    html += `<div class="gallery-empty">
                        <i class="fa-solid fa-check-circle"></i>
                        <span>All Controls Added</span>
                        <div class="gallery-empty-sub">Every available control is already in your Control Center.</div>
                    </div>`;
                } else {
                    html += `<div class="gallery-empty">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <span>No Results</span>
                        <div class="gallery-empty-sub">Try a different search term or category.</div>
                    </div>`;
                }
            } else {
                for (const [category, widgets] of Object.entries(grouped)) {
                    html += `<div class="gallery-section">`;
                    html += `<span class="gallery-header">${category}</span>`;
                    html += `<div class="gallery-widgets">`;
                    widgets.forEach(w => {
                        const previewColor = this._getCategoryColor(w.category);
                        html += `<div class="gallery-widget-slot" data-widget="${w.id}">
                            <div class="gw-preview gw-preview-standard">
                                <i class="${w.icon}" style="color: ${previewColor}"></i>
                                <span>${w.label}</span>
                            </div>
                            <div class="gw-badge add-badge"><i class="fa-solid fa-plus"></i></div>
                            <span class="gw-label">${w.label}</span>
                        </div>`;
                    });
                    html += '</div></div>';
                }
            }
            html += '</div>';

            this.galleryEl.innerHTML = html;
            this._bindGalleryEvents();
        }

        _getCategoryColor(category) {
            const colors = {
                'Connectivity': '#0A78F2',
                'Media': '#FF2D55',
                'Productivity': '#A855F7',
                'Display & Brightness': '#FF9500',
                'Desktop & Finder': '#64748B',
                'Utilities': '#6B7280',
                'Appearance': '#8B5CF6',
                'Battery': '#34C759',
                'Accessibility': '#0EA5E9',
            };
            return colors[category] || '#0A78F2';
        }

        _bindGalleryEvents() {
            // Category sidebar clicks
            this.galleryEl.querySelectorAll('.gallery-item[data-category]').forEach(item => {
                item.addEventListener('click', () => {
                    this.activeFilter = item.dataset.category;
                    this.renderGallery();
                });
            });

            // Search input
            const searchInput = document.getElementById('gallery-search-input');
            if (searchInput) {
                searchInput.value = this.searchQuery;
                searchInput.addEventListener('input', () => {
                    this.searchQuery = searchInput.value;
                    this.renderGallery();
                    // Re-focus after re-render
                    const newInput = document.getElementById('gallery-search-input');
                    if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = newInput.value.length; }
                });
            }

            // Add badges
            this.galleryEl.querySelectorAll('.gallery-widget-slot').forEach(slot => {
                const badge = slot.querySelector('.add-badge');
                if (badge) {
                    badge.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const wid = slot.dataset.widget;
                        this._addWidget(wid);
                    });
                }
            });
        }
    }

    // Initialize Control Center Manager
    const ccManager = new ControlCenterManager();


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
            // Don't auto-activate password input if typing inside an interactive menu or input
            if (e.target.tagName !== 'INPUT') {
                lockBottom.classList.add('active');
                lockInput.focus();
            }
        }
    });

    if (lockBottom) {
        lockBottom.addEventListener('click', (e) => {
            if (!e.target.closest('#lock-header-bar')) {
                lockBottom.classList.add('active');
                lockInput.focus();
            }
        });
    }

    // --- Lock Screen Top Bar Interactions ---
    const lockInputSourceToggle = document.getElementById('lock-input-source-toggle');
    const lockInputSourceLabel = document.getElementById('lock-input-source-label');
    const lockInputMenu = document.getElementById('lock-input-menu');
    const lockWifiToggle = document.getElementById('lock-wifi-toggle');
    const lockBatteryToggle = document.getElementById('lock-battery-toggle');
    const lockBatteryPopup = document.getElementById('lock-battery-popup');

    function closeLockPopups() {
        if (lockInputMenu) lockInputMenu.style.display = 'none';
        if (lockBatteryPopup) lockBatteryPopup.style.display = 'none';
        if (lockInputSourceToggle) lockInputSourceToggle.classList.remove('active');
        if (lockBatteryToggle) lockBatteryToggle.classList.remove('active');
        if (lockWifiToggle) lockWifiToggle.classList.remove('active');
    }

    if (lockInputSourceToggle && lockInputMenu) {
        lockInputSourceToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = lockInputMenu.style.display === 'block';
            closeLockPopups();
            if (!isOpen) {
                lockInputMenu.style.display = 'block';
                lockInputSourceToggle.classList.add('active');
            }
        });

        lockInputMenu.querySelectorAll('.lock-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const source = item.getAttribute('data-source');
                if (source && lockInputSourceLabel) {
                    lockInputSourceLabel.textContent = source;
                }
                lockInputMenu.querySelectorAll('.lock-menu-item').forEach(mi => {
                    const check = mi.querySelector('.check-icon');
                    if (mi === item) {
                        mi.classList.add('active');
                        if (check) check.style.opacity = '1';
                    } else {
                        mi.classList.remove('active');
                        if (check) check.style.opacity = '0';
                    }
                });
                closeLockPopups();
            });
        });
    }

    if (lockBatteryToggle && lockBatteryPopup) {
        lockBatteryToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = lockBatteryPopup.style.display === 'block';
            closeLockPopups();
            if (!isOpen) {
                lockBatteryPopup.style.display = 'block';
                lockBatteryToggle.classList.add('active');
            }
        });
    }

    if (lockWifiToggle) {
        lockWifiToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const wifiMenu = document.getElementById('wifi-menu');
            if (wifiMenu) {
                const isOpen = wifiMenu.style.display === 'flex';
                if (typeof closeAllOverlays === 'function') closeAllOverlays();
                closeLockPopups();
                if (!isOpen) {
                    lockWifiToggle.classList.add('active');
                    wifiMenu.style.display = 'flex';
                    const rect = lockWifiToggle.getBoundingClientRect();
                    wifiMenu.style.top = `${rect.bottom + 8}px`;
                    wifiMenu.style.right = `${window.innerWidth - rect.right}px`;
                    wifiMenu.style.zIndex = '10000';
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#lock-header-bar') && !e.target.closest('#lock-input-menu') && !e.target.closest('#lock-battery-popup')) {
            closeLockPopups();
        }
    });

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

            // Show reset warning dialog
            lockForgot.addEventListener('click', () => {
                const resetWarningOverlay = document.getElementById('reset-warning-overlay');
                const resetWarningDialog = document.getElementById('reset-warning-dialog');
                const resetCancelBtn = document.getElementById('reset-cancel-btn');
                const resetConfirmBtn = document.getElementById('reset-confirm-btn');

                if (resetWarningOverlay && resetWarningDialog) {
                    resetWarningOverlay.classList.add('show');

                    const dialogWidth = resetWarningDialog.offsetWidth || 280;
                    const dialogHeight = resetWarningDialog.offsetHeight || 200;
                    resetWarningDialog.style.left = `${(window.innerWidth - dialogWidth) / 2}px`;
                    resetWarningDialog.style.top = `${(window.innerHeight - dialogHeight) / 2}px`;

                    if (resetCancelBtn && !resetCancelBtn.dataset.initialized) {
                        resetCancelBtn.dataset.initialized = 'true';
                        resetCancelBtn.addEventListener('click', () => {
                            resetWarningOverlay.classList.remove('show');
                        });
                    }

                    if (resetConfirmBtn && !resetConfirmBtn.dataset.initialized) {
                        resetConfirmBtn.dataset.initialized = 'true';
                        resetConfirmBtn.addEventListener('click', () => {
                            localStorage.removeItem('macOSTahoe_Password');
                            localStorage.removeItem('macOSTahoe_FS');
                            localStorage.removeItem('macOSTahoe_DesktopIcons');
                            window.location.reload();
                        });
                    }
                }
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


    // --- Desktop Context Menu & Drag Logic ---
    const desktop = document.querySelector('.desktop');
    const contextMenu = document.getElementById('context-menu');

    let snapToGridEnabled = false;
    const snapBtn = document.getElementById('snap-to-grid-btn');
    const snapCheck = document.getElementById('snap-check');

    window.saveDesktopIconPositions = function () {
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


    function closeAppWindows(appName) {
        const windows = Array.from(document.querySelectorAll('.macos-window'));
        windows.forEach(win => {
            if (win.dataset && win.dataset.appName === appName) {
                win.remove();
            }
        });
        const dockIcon = document.querySelector(`.dock-icon-wrapper[data-name="${appName}"]`);
        if (dockIcon) dockIcon.classList.remove('running');
        if (typeof updateTopmostActiveApp === 'function') updateTopmostActiveApp();
    }

    function showAppContextMenu(appName, x, y, isFolder = false, folderElement = null) {
        const oldMenu = document.getElementById('dynamic-app-context-menu');
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'dynamic-app-context-menu';
        menu.className = 'desktop-context-menu';
        menu.style.display = 'flex';
        menu.style.position = 'fixed';
        menu.style.zIndex = '10000';

        let menuItems = [];

        if (isFolder || appName === 'Folder' || appName === 'Downloads' || appName === 'Trash') {
            if (appName === 'Trash') {
                menuItems = [
                    { label: 'Open Trash', bold: true, action: () => { if (typeof createWindow === 'function') createWindow('Finder', 'icons/apple/Finder.png', null); } },
                    { type: 'divider' },
                    {
                        label: 'Empty Trash', color: '#ff3b30', action: () => {
                            if (window.mockFS) {
                                window.mockFS['~/Downloads'] = [];
                                if (window.fsHelper) window.fsHelper.save();
                            }
                            alert('Trash Emptied');
                        }
                    }
                ];
            } else {
                menuItems = [
                    {
                        label: 'Open', bold: true, action: () => {
                            if (typeof createWindow === 'function') {
                                window.currentDir = '~/Desktop';
                                createWindow('Finder', 'icons/apple/Finder.png', null);
                            }
                        }
                    },
                    { label: 'Get Info', action: () => alert(`Folder Info: ${appName}`) },
                    { type: 'divider' },
                    {
                        label: 'Rename', action: () => {
                            if (folderElement) {
                                const span = folderElement.querySelector('.folder-name');
                                const input = folderElement.querySelector('.folder-name-input');
                                if (span && input) {
                                    span.classList.add('editing');
                                    input.classList.add('active');
                                    input.focus();
                                    input.select();
                                }
                            }
                        }
                    },
                    {
                        label: 'Move to Trash', color: '#ff3b30', action: () => {
                            if (folderElement) folderElement.remove();
                        }
                    }
                ];
            }
        } else if (appName === 'Safari') {
            menuItems = [
                { label: 'Open Safari', bold: true, action: () => createWindow('Safari', 'icons/apple/Safari.png', null) },
                { type: 'divider' },
                { label: 'New Window', action: () => createWindow('Safari', 'icons/apple/Safari.png', null) },
                { label: 'New Private Window', action: () => createWindow('Safari', 'icons/apple/Safari.png', null) },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows('Safari') }
            ];
        } else if (appName === 'Terminal') {
            menuItems = [
                { label: 'Open Terminal', bold: true, action: () => createWindow('Terminal', 'icons/apple/Terminal.png', null) },
                { type: 'divider' },
                { label: 'New Window', action: () => createWindow('Terminal', 'icons/apple/Terminal.png', null) },
                { label: 'New Tab', action: () => createWindow('Terminal', 'icons/apple/Terminal.png', null) },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows('Terminal') }
            ];
        } else if (appName === 'Messages') {
            menuItems = [
                { label: 'Open Messages', bold: true, action: () => createWindow('Messages', 'icons/apple/Messages.png', null) },
                { type: 'divider' },
                { label: 'New Message', action: () => createWindow('Messages', 'icons/apple/Messages.png', null) },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows('Messages') }
            ];
        } else if (appName === 'Mail') {
            menuItems = [
                { label: 'Open Mail', bold: true, action: () => createWindow('Mail', 'icons/apple/Mail.png', null) },
                { type: 'divider' },
                { label: 'Compose New Mail', action: () => createWindow('Mail', 'icons/apple/Mail.png', null) },
                { label: 'Get New Mail', action: () => alert('Checking for new mail...') },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows('Mail') }
            ];
        } else if (appName === 'Music' || appName === 'Podcasts' || appName === 'Apple TV') {
            menuItems = [
                { label: `Open ${appName}`, bold: true, action: () => createWindow(appName, `icons/apple/${appName}.png`, null) },
                { type: 'divider' },
                { label: 'Play / Pause', action: () => alert('Playback toggled') },
                { label: 'Next Track', action: () => alert('Next track') },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows(appName) }
            ];
        } else if (appName === 'Finder') {
            menuItems = [
                { label: 'New Finder Window', bold: true, action: () => createWindow('Finder', 'icons/apple/Finder.png', null) },
                { type: 'divider' },
                { label: 'Connect to Server...', action: () => alert('Connect to Server...') },
                { label: 'Go to Folder...', action: () => alert('Go to Folder...') }
            ];
        } else {
            menuItems = [
                { label: `Open ${appName}`, bold: true, action: () => createWindow(appName, `icons/apple/${appName}.png`, null) },
                { type: 'divider' },
                { label: 'Options', action: () => { } },
                { label: 'Show All Windows', action: () => { if (typeof updateTopmostActiveApp === 'function') updateTopmostActiveApp(); } },
                { type: 'divider' },
                { label: 'Quit', color: '#ff3b30', action: () => closeAppWindows(appName) }
            ];
        }

        menuItems.forEach(item => {
            if (item.type === 'divider') {
                const div = document.createElement('div');
                div.className = 'cm-divider';
                menu.appendChild(div);
            } else {
                const el = document.createElement('div');
                el.className = 'cm-item';
                el.textContent = item.label;
                if (item.bold) el.style.fontWeight = '600';
                if (item.color) el.style.color = item.color;
                el.onclick = (evt) => {
                    evt.stopPropagation();
                    menu.remove();
                    if (item.action) item.action();
                };
                menu.appendChild(el);
            }
        });

        const menuWidth = 190;
        const menuHeight = menuItems.length * 28;
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

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
    }

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        closeAllOverlays();

        const dockWrapper = e.target.closest('.dock-icon-wrapper');
        const desktopFolder = e.target.closest('.desktop-folder');
        const openWindow = e.target.closest('.macos-window');

        if (dockWrapper) {
            const appName = dockWrapper.getAttribute('data-name');
            showAppContextMenu(appName, e.clientX, e.clientY, false, null);
            return;
        }

        if (desktopFolder) {
            const folderName = desktopFolder.querySelector('.folder-name').textContent;
            showAppContextMenu(folderName, e.clientX, e.clientY, true, desktopFolder);
            return;
        }

        if (openWindow && !e.target.closest('.finder-content')) {
            const appName = openWindow.dataset.appName || 'App';
            showAppContextMenu(appName, e.clientX, e.clientY, false, openWindow);
            return;
        }

        // Standard desktop background context menu
        let x = e.clientX;
        let y = e.clientY;
        const menuWidth = 240;
        const menuHeight = 260;

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

        desktop.dataset.contextX = e.clientX;
        desktop.dataset.contextY = e.clientY;

        contextMenu.style.display = 'flex';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    });

    // --- New Folder Logic ---
    window.createDesktopFolder = function (folderName = 'untitled folder', x = null, y = null, isNew = false) {
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

        function cancelOrDeleteFolder() {
            folder.remove();
            if (window.mockFS && window.mockFS['~/Desktop']) {
                window.mockFS['~/Desktop'] = window.mockFS['~/Desktop'].filter(n => n !== folderName);
                if (window.fsHelper) window.fsHelper.save();
            }
            window.saveDesktopIconPositions();
        }

        function finishRename() {
            const oldName = nameSpan.textContent;
            const newName = nameInput.value.trim();

            if (!newName && isNew) {
                cancelOrDeleteFolder();
                return;
            }

            const finalName = newName || oldName;
            nameSpan.textContent = finalName;
            nameSpan.classList.remove('editing');
            nameInput.classList.remove('active');

            if (window.fsHelper && window.mockFS['~/Desktop']) {
                if (!window.mockFS['~/Desktop'].includes(finalName)) {
                    window.fsHelper.createDir('~/Desktop', finalName);
                } else if (oldName !== finalName) {
                    window.fsHelper.rename('~/Desktop', oldName, finalName);
                }
            }
            window.saveDesktopIconPositions();
        }

        nameInput.addEventListener('blur', finishRename);
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishRename();
            } else if (e.key === 'Escape') {
                if (isNew) {
                    cancelOrDeleteFolder();
                } else {
                    nameInput.value = nameSpan.textContent;
                    nameSpan.classList.remove('editing');
                    nameInput.classList.remove('active');
                }
            }
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

            const { nameSpan, nameInput } = window.createDesktopFolder(folderName, null, null, true);

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
        const dynamicAppMenu = document.getElementById('dynamic-app-context-menu');
        if (dynamicAppMenu) dynamicAppMenu.remove();

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
        } catch (e) { }

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
