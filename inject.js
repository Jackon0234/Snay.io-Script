(function () {
    'use strict';
    if (window.__JACKON_SNAY_INJECTED_PAGE) return;
    window.__JACKON_SNAY_INJECTED_PAGE = true;

    const STORAGE_KEY = 'jackon_snay_ui_v1';

    const defaultState = {
        left: null,
        top: 20,
        collapsed: false,
        fps: 60,
        qualityPercent: 100,
        menuWidth: 350,
        soundEffects: true,
        notifications: true,
        comboFastFeedKey: "G",
        leftClickMacroEnabled: false,
        spamFastFeedKey: "H",
        spamFastFeedMode: "toggle",
        spamFastFeedInterval: 1000,
        quickRespawnKey: "4",
        autoRespawnEnabled: false,
        quadFeedKey: "R",
        spamQuadFeedMode: "toggle",
        quadFeedInterval: 500,
        spamWKey: "",
        spamWMode: "toggle",
        spamWInterval: 100,
        uiOpacity: 100,
        theme: 'dark',
        accentColor: '#3498db',
        rgbModeEnabled: false,
        customBackgroundUrl: "",
        customThemeEnabled: false,
        customBgColor: '#0C0C0C',
        customTextColor: '#FFFFFF',
        customBorderColor: '#222222',
        quickChat1: "",
        quickChatKey1: "F1",
        quickChat2: "",
        quickChatKey2: "F2",
        quickChat3: "",
        quickChatKey3: "F3",
        quickChat4: "",
        quickChatKey4: "F4",
        smartRGBGameColors: true,
        killChainControlEnabled: true,
        sequenceMacroDelay: 500,
        sequenceMacroKey: "E",
        sequenceSplitKey: "SPACE",
        sequenceDoubleSplitKey: "D",
        sequenceQuadSplitKey: "F",
        sequenceTriggerKey: "F",
        sequenceModeToggleKey: "G",
        sequencePreSplitTriggerKey: "P",
        sequenceOptionMode: "A",
        selectedSequence: "Macro",
        selectedPreSequence: "Split -> Double Split -> Double Split",

        // Sequence presets
        sequencePresets: [
            "Macro",
            "Split",
            "Double Split",
            "Quad Split",
            "Macro -> Macro -> Quad Split -> Pause -> Macro",
            "Macro -> Quad Split -> Pause -> Double Split -> Pause -> Macro",
            "Macro -> Pause -> Quad Split -> Pause -> Macro -> Double Split",
            "Quad Split -> Pause -> Macro -> Pause -> Split",
            "Double Split -> Pause -> Macro -> Pause -> Quad Split",
            "Macro -> Split -> Pause -> Double Split -> Pause -> Quad Split",
            "Macro -> Pause -> Macro -> Pause -> Split",
            "Pause -> Macro -> Split -> Pause -> Double Split -> Quad Split",
            "Pause -> Macro -> Pause -> Split -> Quad Split",
            "Macro -> Split -> Quad Split -> Pause -> Double Split",
            "Pause -> Macro -> Quad Split -> Double Split -> Pause",
            "Macro -> Double Split -> Pause -> Quad Split -> Macro",
            "Split -> Pause -> Macro -> Quad Split -> Pause -> Split",
            "Macro -> Pause -> Split -> Pause -> Double Split -> Quad Split",
            "Quad Split -> Pause -> Macro -> Pause -> Double Split -> Split",
            "Double Split -> Pause -> Quad Split -> Pause -> Macro",
            "Pause -> Split -> Macro -> Quad Split -> Pause -> Double Split",
            "Macro -> Pause -> Quad Split -> Split -> Pause -> Double Split",
            "Macro -> Split -> Pause -> Macro -> Quad Split -> Pause",
            "Double Split -> Pause -> Macro -> Split -> Pause -> Quad Split"
        ],

        preSequencePresets: [
            "Split -> Double Split -> Double Split",
            "Quad Split"
        ]
    };

    let savedState = defaultState;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let parsed = raw ? JSON.parse(raw) : {};
        delete parsed.perfBoost;
        delete parsed.smoothPhysics;
        savedState = Object.assign({}, defaultState, parsed);
    } catch (e) {
        console.error('Failed to load saved state:', e);
        savedState = defaultState;
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const ui = document.createElement('div');
    ui.id = 'jackon-ui';

    let rgbFrameId = null;
    let currentHue = 0;
    let lastKillChainTime = 0;

    let sequenceKeysPressed = {};
    let isSequenceRunning = false;
    let isPreSequenceRunning = false;
    let sequenceModeIndicator = null;

    function isChatActive() {
        const el = document.activeElement;
        if (!el || el === document.body) return false;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
        if (el.closest('[data-stop-game-input="true"]')) return true;
        if (el.closest('#chat_input_container')) return true;
        if (el.closest('.chat-input-wrapper')) return true;
        return false;
    }

    function setupChatInputListener() { }

    function createSequenceModeIndicator() {
        sequenceModeIndicator = document.createElement('div');
        Object.assign(sequenceModeIndicator.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'yellow',
            background: 'rgba(0,0,0,0.8)',
            padding: '5px 15px',
            borderRadius: '8px',
            zIndex: 9999,
            fontFamily: "'Inter', sans-serif",
            border: '2px solid var(--accent-color)',
            boxShadow: '0 0 15px rgba(255,255,0,0.5)',
            textAlign: 'center',
            minWidth: '250px'
        });
        updateSequenceModeIndicator();
        document.body.appendChild(sequenceModeIndicator);
    }

    function updateSequenceModeIndicator() {
        if (sequenceModeIndicator) {
            sequenceModeIndicator.innerText = savedState.sequenceOptionMode === "A"
                ? "🔴 MODE A: Trigger runs Macro"
                : "🔵 MODE B: Manual Macro";
            sequenceModeIndicator.style.color = savedState.sequenceOptionMode === "A" ? '#ff6b6b' : '#4dabf7';
            sequenceModeIndicator.style.borderColor = savedState.sequenceOptionMode === "A" ? '#ff6b6b' : '#4dabf7';
        }
    }

    function updateGameColorsWithRGB(color) {
        if (!savedState.smartRGBGameColors || !savedState.rgbModeEnabled) return;

        try {
            const hitMarkerColorInput = document.getElementById('hitMarkerColor');
            if (hitMarkerColorInput) {
                hitMarkerColorInput.value = color;
                hitMarkerColorInput.dispatchEvent(new Event('input', { bubbles: true }));
                hitMarkerColorInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const massGainColorInput = document.getElementById('massGainColor');
            if (massGainColorInput) {
                massGainColorInput.value = color;
                massGainColorInput.dispatchEvent(new Event('input', { bubbles: true }));
                massGainColorInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const hitMarkerLastColorInput = document.getElementById('hitMarkerLastColor');
            if (hitMarkerLastColorInput) {
                const complementaryColor = getComplementaryColor(color);
                hitMarkerLastColorInput.value = complementaryColor;
                hitMarkerLastColorInput.dispatchEvent(new Event('input', { bubbles: true }));
                hitMarkerLastColorInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } catch (e) {
            console.error('Game colors sync error:', e);
        }
    }

    function getComplementaryColor(hexColor) {
        if (!hexColor.startsWith('#')) return '#ff0000';

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const compR = (255 - r).toString(16).padStart(2, '0');
        const compG = (255 - g).toString(16).padStart(2, '0');
        const compB = (255 - b).toString(16).padStart(2, '0');

        return `#${compR}${compG}${compB}`;
    }

    function setupKillChainListener() {
        if (!savedState.killChainControlEnabled) return;

        const killChainCheckbox = document.getElementById('showKillChains');
        if (killChainCheckbox && !killChainCheckbox.checked) {
            killChainCheckbox.checked = true;
            killChainCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const text = node.textContent || node.innerText;
                            if (text && (
                                text.includes('KILL CHAIN') ||
                                text.includes('MULTI KILL') ||
                                text.includes('MEGA KILL') ||
                                text.includes('RAMPAGE') ||
                                text.includes('DOMINATING') ||
                                text.includes('UNSTOPPABLE') ||
                                text.includes('GODLIKE')
                            )) {
                                const now = Date.now();
                                if (now - lastKillChainTime > 1000) {
                                    lastKillChainTime = now;
                                    showKillChainNotification(text);
                                }
                            }
                        }
                    });
                }
            });
        });

        const gameScreen = document.getElementById('game-screen') || document.querySelector('.game-container');
        if (gameScreen) {
            observer.observe(gameScreen, { childList: true, subtree: true });
        }
    }

    function showKillChainNotification(killChainText) {
        if (!savedState.killChainControlEnabled || !savedState.notifications) return;

        const notification = document.createElement('div');
        Object.assign(notification.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.85)',
            color: savedState.rgbModeEnabled ? 'var(--accent-color)' : '#ff0000',
            padding: '20px 30px',
            borderRadius: '12px',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 2147483646,
            border: '3px solid var(--accent-color)',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.7)',
            animation: 'pulse 0.5s infinite alternate',
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '2px'
        });

        notification.innerText = killChainText;
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                to { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
            }
        `;
        document.head.appendChild(style);

        playClick();

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    function startRGBLoop() {
        if (rgbFrameId) cancelAnimationFrame(rgbFrameId);

        function loop() {
            if (!savedState.rgbModeEnabled) return;

            currentHue = (currentHue + 1) % 360;
            const hexColor = hslToHex(currentHue, 100, 50);

            ui.style.setProperty('--accent-color', hexColor);
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            ui.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);

            const picker = document.getElementById('accentColorPickerInput');
            if (picker) picker.value = hexColor;

            if (savedState.smartRGBGameColors) {
                updateGameColorsWithRGB(hexColor);
            }

            rgbFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    function stopRGBLoop() {
        if (rgbFrameId) cancelAnimationFrame(rgbFrameId);
        rgbFrameId = null;
        applyAccentColor(savedState.accentColor, false);
    }

    function toggleRGBMode(enabled) {
        savedState.rgbModeEnabled = enabled;
        persist();

        if (enabled) {
            startRGBLoop();
            showToast('RGB Mode ON 🌈');
        } else {
            stopRGBLoop();
            showToast('RGB Mode OFF');
        }
    }

    function applyCustomColorOverrides(doPersist = false) {
        if (!savedState.customThemeEnabled) return;

        ui.style.setProperty('--bg-primary', savedState.customBgColor);
        ui.style.setProperty('--text-primary', savedState.customTextColor);
        ui.style.setProperty('--border-primary', savedState.customBorderColor);
    }

    function defineCSSVariables() {
        if (savedState.rgbModeEnabled) {
            startRGBLoop();
        } else {
            ui.style.setProperty('--accent-color', savedState.accentColor);
            applyAccentColor(savedState.accentColor, false);
        }
        applyTheme(savedState.theme, false);

        if (savedState.customThemeEnabled) {
            applyCustomColorOverrides(false);
        }
    }

    function applyTheme(themeName, doPersist = true) {
        if (themeName === 'transparent') {
            ui.style.setProperty('--bg-primary', 'rgba(12, 12, 12, 0.1)');
            ui.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.03)');
            ui.style.setProperty('--bg-tertiary', 'rgba(255, 255, 255, 0.1)');
            ui.style.setProperty('--bg-input', 'rgba(255, 255, 255, 0.1)');
            ui.style.setProperty('--bg-toast', 'rgba(0,0,0,0.6)');
            ui.style.setProperty('--text-primary', '#FFFFFF');
            ui.style.setProperty('--text-secondary', '#b0b0b0');
            ui.style.setProperty('--border-primary', 'rgba(255, 255, 255, 0.1)');
            ui.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.05)');
        } else if (themeName === 'light') {
            ui.style.setProperty('--bg-primary', 'rgba(245, 245, 245, 0.92)');
            ui.style.setProperty('--bg-secondary', 'rgba(0, 0, 0, 0.03)');
            ui.style.setProperty('--bg-tertiary', 'rgba(0, 0, 0, 0.06)');
            ui.style.setProperty('--bg-input', 'rgba(0, 0, 0, 0.05)');
            ui.style.setProperty('--bg-toast', 'rgba(255, 255, 255, 0.9)');
            ui.style.setProperty('--text-primary', '#111111');
            ui.style.setProperty('--text-secondary', '#555555');
            ui.style.setProperty('--border-primary', 'rgba(0, 0, 0, 0.1)');
            ui.style.setProperty('--border-secondary', 'rgba(0, 0, 0, 0.05)');
        } else {
            ui.style.setProperty('--bg-primary', 'linear-gradient(180deg, rgba(20, 20, 22, 0.94), rgba(10, 10, 12, 0.94))');
            ui.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.01)');
            ui.style.setProperty('--bg-tertiary', 'rgba(255, 255, 255, 0.06)');
            ui.style.setProperty('--bg-input', 'rgba(255, 255, 255, 0.08)');
            ui.style.setProperty('--bg-toast', 'rgba(20, 20, 22, 0.85)');
            ui.style.setProperty('--text-primary', '#FFFFFF');
            ui.style.setProperty('--text-secondary', '#a0a0a0');
            ui.style.setProperty('--border-primary', 'rgba(255, 255, 255, 0.08)');
            ui.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.04)');
        }

        const logoEl = document.querySelector('#jackon-ui img');
        if (logoEl) {
            logoEl.style.border = '2px solid var(--border-secondary)';
        }

        if (savedState.customThemeEnabled) {
            applyCustomColorOverrides(false);
        }

        if (doPersist) {
            savedState.theme = themeName;
            persist();
        }
    }

    function applyAccentColor(color, doPersist = true) {
        if (doPersist && savedState.rgbModeEnabled) {
            savedState.rgbModeEnabled = false;
            stopRGBLoop();
            const rgbCheck = document.getElementById('rgbModeSwitch');
            if (rgbCheck) rgbCheck.checked = false;
            showToast('RGB Mode Disabled (Manual Color Selected)');
        }

        ui.style.setProperty('--accent-color', color);
        const rgb = color.match(/\w\w/g).map(x => parseInt(x, 16));
        ui.style.setProperty('--accent-color-rgb', rgb.join(', '));

        if (doPersist) {
            savedState.accentColor = color;
            persist();
        }
    }

    function applyCustomBackground(url, doPersist = true) {
        const bodyEl = document.body;
        const overlaysEl = document.getElementById('overlays');

        try {
            if (!url) {
                bodyEl.style.setProperty('background-image', 'none', 'important');
                bodyEl.style.setProperty('background-size', '');
                bodyEl.style.setProperty('background-position', '');
                bodyEl.style.setProperty('background-repeat', '');

                if (overlaysEl) {
                    overlaysEl.style.setProperty('background-image', 'none', 'important');
                    overlaysEl.style.setProperty('background-size', '');
                    overlaysEl.style.setProperty('background-position', '');
                    overlaysEl.style.setProperty('background-repeat', '');
                }

                showToast('Background reset.');
                if (doPersist) {
                    savedState.customBackgroundUrl = "";
                    persist();
                }
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
                const bgValue = `url(${url})`;
                const bgSize = 'cover';
                const bgPos = 'center center';
                const bgRepeat = 'no-repeat';

                bodyEl.style.setProperty('background-image', bgValue, 'important');
                bodyEl.style.setProperty('background-size', bgSize, 'important');
                bodyEl.style.setProperty('background-position', bgPos, 'important');
                bodyEl.style.setProperty('background-repeat', bgRepeat, 'important');

                if (overlaysEl) {
                    overlaysEl.style.setProperty('background-image', bgValue, 'important');
                    overlaysEl.style.setProperty('background-size', bgSize, 'important');
                    overlaysEl.style.setProperty('background-position', bgPos, 'important');
                    overlaysEl.style.setProperty('background-repeat', bgRepeat, 'important');
                }

                showToast('Custom background set!');
                if (doPersist) {
                    savedState.customBackgroundUrl = url;
                    persist();
                }
            } else {
                showToast('Error: Invalid URL. Must start with "https://" or "http://".');
            }
        } catch (e) {
            console.error('Could not set background', e);
            showToast('Error: Could not set background.');
        }
    }

    const originalUIRAF = window.requestAnimationFrame.bind(window);

    const toastContainer = document.createElement('div');
    Object.assign(toastContainer.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '300px',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
    });
    document.body.appendChild(toastContainer);

    function playClick() {
        if (!savedState.soundEffects) return;
        try {
            const audio = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');
            audio.volume = 0.2;
            audio.play().catch(() => { });
        } catch (e) {
        }
    }

    function showToast(msg, duration = 3000) {
        if (!savedState.notifications) return;

        const t = document.createElement('div');
        Object.assign(t.style, {
            background: 'var(--bg-toast)',
            color: 'var(--text-primary)',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            opacity: '0',
            transform: 'translateX(30px)',
            transition: 'all 320ms cubic-bezier(.2,.8,.2,1)',
            pointerEvents: 'auto',
            border: '1px solid var(--border-primary)'
        });

        t.innerText = msg;
        toastContainer.appendChild(t);

        originalUIRAF(() => {
            t.style.opacity = '1';
            t.style.transform = 'translateX(0)';
        });

        playClick();

        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateX(30px)';
            setTimeout(() => t.remove(), 320);
        }, duration);
    }

    let macroStatusContainer = null;

    function initializeMacroStatusUI() {
        macroStatusContainer = document.createElement('div');
        Object.assign(macroStatusContainer.style, {
            position: 'fixed',
            bottom: '60px',
            right: '20px',
            zIndex: 2147483646,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
            pointerEvents: 'none',
            fontFamily: "'Inter', sans-serif"
        });
        document.body.appendChild(macroStatusContainer);
    }

    function updateMacroStatus(id, text, isActive) {
        if (!macroStatusContainer) initializeMacroStatusUI();

        const elId = 'macro-status-' + id;
        const el = document.getElementById(elId);

        if (isActive) {
            if (el) return;

            const newEl = document.createElement('div');
            newEl.id = elId;
            newEl.innerText = text;
            Object.assign(newEl.style, {
                background: 'var(--bg-toast)',
                color: 'var(--accent-color)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                opacity: '0',
                transform: 'translateX(20px)',
                transition: 'all 300ms cubic-bezier(.2,.8,.2,1)',
                border: '1px solid var(--border-primary)'
            });

            macroStatusContainer.appendChild(newEl);
            originalUIRAF(() => {
                newEl.style.opacity = '1';
                newEl.style.transform = 'translateX(0)';
            });
        } else {
            if (!el) return;

            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
            setTimeout(() => el.remove(), 300);
        }
    }

    let qualitySlider = null;
    let qualityLabel = null;

    function translatePercentToGameLevel(percent) {
        const p = parseInt(percent);
        if (p <= 20) return 0;
        if (p <= 40) return 1;
        if (p <= 60) return 2;
        if (p <= 80) return 3;
        if (p <= 99) return 4;
        return 5;
    }

    function setGameQuality(percent, isUserAction = false) {
        const level = translatePercentToGameLevel(percent);
        const gameSlider = document.getElementById('quality');

        if (gameSlider) {
            gameSlider.value = level;
            gameSlider.dispatchEvent(new Event('change', { bubbles: true }));
            gameSlider.dispatchEvent(new Event('input', { bubbles: true }));

            if (isUserAction) {
                showToast(`Quality set to ${percent}% (Level ${level}/5)`);
            }
        } else {
            if (isUserAction) {
                showToast('Please open the game\'s "Settings" menu first.');
            }
            setTimeout(() => setGameQuality(percent, false), 1500);
        }

        if (qualitySlider) qualitySlider.value = percent;
        if (qualityLabel) qualityLabel.innerText = `Quality`;

        if (savedState.qualityPercent !== percent) {
            savedState.qualityPercent = percent;
            persist();
        }
    }

    function createSettingCategory(title) {
        const t = document.createElement('div');
        t.innerText = title;
        Object.assign(t.style, {
            color: 'var(--text-secondary)',
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: '600',
            marginTop: '15px',
            marginBottom: '8px',
            borderBottom: '1px solid var(--border-secondary)',
            paddingBottom: '4px',
            opacity: '0.8'
        });
        return t;
    }

    function createSettingRow(label) {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            minHeight: '30px'
        });

        const lbl = document.createElement('div');
        lbl.innerText = label;
        lbl.style.color = 'var(--text-primary)';
        lbl.style.fontSize = '14px';
        lbl.style.fontWeight = '400';

        row.appendChild(lbl);
        return row;
    }

    function makeSocial(name, url) {
        const b = document.createElement('button');
        b.innerText = name;
        b.style.padding = '6px 10px';
        b.onclick = () => window.open(url, '_blank');
        return b;
    }

    function createColorPickerRow(label, stateKey, cssVar) {
        const row = createSettingRow(label);
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.value = savedState[stateKey];

        picker.addEventListener('input', () => {
            savedState[stateKey] = picker.value;
            if (cssVar && savedState.customThemeEnabled) {
                ui.style.setProperty(cssVar, picker.value);
            }
        });

        picker.addEventListener('change', () => {
            savedState[stateKey] = picker.value;
            persist();
            if (savedState.customThemeEnabled) {
                showToast(`${label} updated.`);
            }
        });

        row.appendChild(picker);
        return row;
    }

    function createModeSwitch(stateKey, toastPrefix) {
        const modeBtnContainer = document.createElement('div');
        Object.assign(modeBtnContainer.style, { display: 'flex', gap: '6px' });

        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = 'Toggle';
        Object.assign(toggleBtn.style, { padding: '5px 10px', flex: '1', fontSize: '12px' });

        const holdBtn = document.createElement('button');
        holdBtn.innerText = 'Hold';
        Object.assign(holdBtn.style, { padding: '5px 10px', flex: '1', fontSize: '12px' });

        function updateButtons(mode) {
            if (mode === 'hold') {
                holdBtn.style.background = 'var(--accent-color)';
                holdBtn.style.color = 'white';
                toggleBtn.style.background = 'var(--bg-tertiary)';
                toggleBtn.style.color = 'var(--text-primary)';
            } else {
                toggleBtn.style.background = 'var(--accent-color)';
                toggleBtn.style.color = 'white';
                holdBtn.style.background = 'var(--bg-tertiary)';
                holdBtn.style.color = 'var(--text-primary)';
            }
        }

        toggleBtn.onclick = () => {
            savedState[stateKey] = 'toggle';
            persist();
            updateButtons('toggle');
            showToast(toastPrefix + ' mode set to Toggle.');
        };

        holdBtn.onclick = () => {
            savedState[stateKey] = 'hold';
            persist();
            updateButtons('hold');
            showToast(toastPrefix + ' mode set to Hold.');
        };

        updateButtons(savedState[stateKey]);
        modeBtnContainer.appendChild(toggleBtn);
        modeBtnContainer.appendChild(holdBtn);

        return modeBtnContainer;
    }

    function createQuickChatRow(index, keybindBtnStyle) {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px'
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Message ${index}`;
        input.value = savedState[`quickChat${index}`];
        Object.assign(input.style, {
            flex: '1',
            minWidth: '0'
        });
        input.onchange = () => {
            savedState[`quickChat${index}`] = input.value;
            persist();
        };

        const keybindBtn = document.createElement('button');
        Object.assign(keybindBtn.style, keybindBtnStyle);
        keybindBtn.style.minWidth = '60px';
        keybindBtn.innerText = savedState[`quickChatKey${index}`] || 'NONE';
        keybindBtn.onclick = () => setupKeybindListener(keybindBtn, `quickChatKey${index}`, `Quick Chat ${index}`);

        row.appendChild(input);
        row.appendChild(keybindBtn);
        return row;
    }

    function triggerKeyEvent(type, key) {
        let keyCode = 0;
        let code = '';

        if (/^[A-Z0-9]$/.test(key)) {
            keyCode = key.charCodeAt(0);
            code = (key >= '0' && key <= '9') ? `Digit${key}` : `Key${key}`;
        } else if (key === 'SPACE') {
            keyCode = 32; code = 'Space'; key = ' ';
        } else if (key === 'SHIFT') {
            keyCode = 16; code = 'ShiftLeft'; key = 'Shift';
        } else if (key === 'W') {
            keyCode = 87; code = 'KeyW'; key = 'w';
        } else if (key === 'ENTER') {
            keyCode = 13; code = 'Enter'; key = 'Enter';
        } else {
            keyCode = key.charCodeAt(0);
            if (keyCode >= 65 && keyCode <= 90) {
                code = `Key${key}`;
            } else {
                console.warn("Unhandled key in triggerKeyEvent:", key);
                return;
            }
        }

        try {
            const event = new KeyboardEvent(type, {
                key: key,
                code: code,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        } catch (e) {
            try {
                const event = document.createEvent('KeyboardEvent');
                event.initKeyEvent(type, true, true, window, false, false, false, false, keyCode, 0);
                window.dispatchEvent(event);
            } catch (err) {
                console.error('Could not trigger key event:', err);
            }
        }
    }

    let isWaitingForKeybind = false;

    function setupKeybindListener(buttonEl, stateKey, toastMsgPrefix) {
        if (isWaitingForKeybind) return;
        isWaitingForKeybind = true;

        const originalText = buttonEl.innerText;
        buttonEl.innerText = '...';
        buttonEl.style.background = 'var(--accent-color)';
        buttonEl.style.filter = 'brightness(1.2)';

        const onKeydown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            let newKey = e.key ? e.key.toUpperCase() : '';

            if (e.code && e.code.startsWith('F') && e.keyCode >= 112 && e.keyCode <= 123) {
                newKey = e.code;
            } else if (newKey === ' ') {
                newKey = 'SPACE';
            } else if (newKey === 'DELETE' || newKey === 'BACKSPACE' || newKey === '') {
                newKey = 'UNASSIGNED';
            }

            savedState[stateKey] = (newKey === 'UNASSIGNED') ? '' : newKey;
            persist();

            buttonEl.innerText = (newKey === 'UNASSIGNED') ? 'NONE' : newKey;
            buttonEl.style.background = 'var(--accent-color)';
            buttonEl.style.filter = 'brightness(1)';

            document.removeEventListener('keydown', onKeydown, true);
            document.removeEventListener('mousedown', onCancel, true);
            isWaitingForKeybind = false;

            showToast(`${toastMsgPrefix} key set to '${newKey}'.`);
        };

        const onCancel = (e) => {
            if (e.target !== buttonEl) {
                buttonEl.innerText = originalText;
                buttonEl.style.background = 'var(--accent-color)';
                buttonEl.style.filter = 'brightness(1)';
                document.removeEventListener('keydown', onKeydown, true);
                document.removeEventListener('mousedown', onCancel, true);
                isWaitingForKeybind = false;
            }
        };

        document.addEventListener('keydown', onKeydown, true);
        document.addEventListener('mousedown', onCancel, true);
    }

    function sendChatMessage(message) {
        if (!message) return;

        try {
            const chatInput = document.getElementById('chat_textbox') ||
                document.getElementById('chat-input') ||
                document.getElementById('chat_input') ||
                document.getElementById('chat-message');

            if (!chatInput) {
                showToast("Error: Chat input not found.");
                return;
            }

            const gameCanvas = document.querySelector('canvas');
            const wasChatHidden = chatInput.offsetParent === null;

            if (wasChatHidden) {
                const openChatEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                window.dispatchEvent(openChatEvent);
            }

            setTimeout(() => {
                chatInput.focus();
                chatInput.value = message;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));

                const sendChatEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                chatInput.dispatchEvent(sendChatEvent);

                chatInput.value = "";
                chatInput.blur();
                if (gameCanvas) gameCanvas.focus();

            }, wasChatHidden ? 50 : 0);

        } catch (e) {
            console.error('Quick Chat Error:', e);
            showToast("Error: Could not send chat message.");
        }
    }

    function getGameKeybind(actionName) {
        try {
            const keyRows = document.querySelectorAll('#settings-body .key-row');
            if (!keyRows || keyRows.length === 0) {
                return null;
            }

            const actionNameLower = actionName.toLowerCase();

            for (const row of keyRows) {
                const actionEl = row.querySelector('.key-row__action');
                if (actionEl && actionEl.innerText.trim().toLowerCase() === actionNameLower) {
                    const keyButton = row.querySelector('.key-row__binding[data-binding-type="keyboard"]');
                    if (keyButton) {
                        const key = keyButton.innerText.trim().toUpperCase();
                        return (key === 'UNBOUND') ? null : key;
                    }
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    const setComboKeybind = (btn) => setupKeybindListener(btn, 'comboFastFeedKey', 'Fast Feed (Macro+Quad)');
    const setSpamKeybind = (btn) => setupKeybindListener(btn, 'spamFastFeedKey', 'Spam Fast Feed');
    const setRespawnKeybind = (btn) => setupKeybindListener(btn, 'quickRespawnKey', 'Quick Respawn');
    const setQuadFeedKeybind = (btn) => setupKeybindListener(btn, 'quadFeedKey', 'Only Quad Feed');
    const setSpamWKeybind = (btn) => setupKeybindListener(btn, 'spamWKey', 'Spam W (Feed)');

    function doComboFastFeed() {
        const macroKey = getGameKeybind("Macro");
        const quadKey = getGameKeybind("Quad Split");

        if (macroKey) {
            triggerKeyEvent('keydown', macroKey);
        }
        if (quadKey) {
            triggerKeyEvent('keydown', quadKey);
        }

        setTimeout(() => {
            if (macroKey) triggerKeyEvent('keyup', macroKey);
            if (quadKey) triggerKeyEvent('keyup', quadKey);
        }, 50);
    }

    let isSpammingFastFeed = false;
    let spamFastFeedIntervalId = null;

    function doSpamAction() {
        doComboFastFeed();
    }

    function startSpamming() {
        if (spamFastFeedIntervalId) clearInterval(spamFastFeedIntervalId);

        isSpammingFastFeed = true;
        doSpamAction();
        spamFastFeedIntervalId = setInterval(doSpamAction, savedState.spamFastFeedInterval);

        if (savedState.spamFastFeedMode === 'toggle') showToast("Spam Fast Feed ON");
        updateMacroStatus('fast-feed', 'Spam Fast Feed', true);
    }

    function stopSpamming() {
        if (spamFastFeedIntervalId) clearInterval(spamFastFeedIntervalId);
        spamFastFeedIntervalId = null;
        isSpammingFastFeed = false;

        if (savedState.spamFastFeedMode === 'toggle') showToast("Spam Fast Feed OFF");
        updateMacroStatus('fast-feed', 'Spam Fast Feed', false);
    }

    let isSpammingQuadFeed = false;
    let spamQuadFeedIntervalId = null;

    function doQuadSpamAction() {
        const quadKey = getGameKeybind("Clip");

        if (quadKey) {
            triggerKeyEvent('keydown', quadKey);
            setTimeout(() => {
                triggerKeyEvent('keyup', quadKey);
            }, 50);
        }
    }

    function startSpammingQuad() {
        if (spamQuadFeedIntervalId) clearInterval(spamQuadFeedIntervalId);
        isSpammingQuadFeed = true;
        doQuadSpamAction();
        spamQuadFeedIntervalId = setInterval(doQuadSpamAction, savedState.quadFeedInterval);
        if (savedState.spamQuadFeedMode === 'toggle') showToast("Quad Feed Spam ON");
        updateMacroStatus('quad-feed', 'Quad Feed Spam', true);
    }

    function stopSpammingQuad() {
        if (spamQuadFeedIntervalId) clearInterval(spamQuadFeedIntervalId);
        spamQuadFeedIntervalId = null;
        isSpammingQuadFeed = false;
        if (savedState.spamQuadFeedMode === 'toggle') showToast("Quad Feed Spam OFF");
        updateMacroStatus('quad-feed', 'Quad Feed Spam', false);
    }

    let isSpammingW = false;
    let spamWIntervalId = null;

    function doSpamWAction() {
        const feedKey = getGameKeybind("Feed");

        if (feedKey) {
            triggerKeyEvent('keydown', feedKey);
            setTimeout(() => {
                triggerKeyEvent('keyup', feedKey);
            }, 50);
        }
    }

    function startSpammingW() {
        if (spamWIntervalId) clearInterval(spamWIntervalId);
        isSpammingW = true;
        doSpamAction();
        spamWIntervalId = setInterval(doSpamWAction, savedState.spamWInterval);
        if (savedState.spamWMode === 'toggle') showToast("Spam W (Feed) ON");
        updateMacroStatus('w-spam', 'Spam W', true);
    }

    function stopSpammingW() {
        if (spamWIntervalId) clearInterval(spamWIntervalId);
        spamWIntervalId = null;
        isSpammingW = false;
        if (savedState.spamWMode === 'toggle') showToast("Spam W (Feed) OFF");
        updateMacroStatus('w-spam', 'Spam W', false);
    }

    function isVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }

    function triggerQuickRespawn(manualTrigger = false) {
        if (isChatActive()) return false;

        const respawnBtn = document.getElementById('respawn-button');
        const playBtn = document.getElementById('play-btn');

        if (isVisible(respawnBtn)) {
            respawnBtn.click();
            return true;
        }

        if (manualTrigger && isVisible(playBtn)) {
            playBtn.click();
            return true;
        }

        return false;
    }

    let autoRespawnIntervalId = null;
    let lastAutoRespawnTryTime = 0;

    function checkAndAutoRespawn() {
        if (!savedState.autoRespawnEnabled) return;
        if (isSpammingFastFeed || isSpammingQuadFeed || isSpammingW) return;
        if (isChatActive()) return;

        const now = Date.now();
        if (now - lastAutoRespawnTryTime < 800) return;

        lastAutoRespawnTryTime = now;
        triggerQuickRespawn(false);
    }

    function toggleAutoRespawn(enabled) {
        if (enabled) {
            if (!autoRespawnIntervalId) {
                autoRespawnIntervalId = setInterval(checkAndAutoRespawn, 300);
            }
        } else {
            if (autoRespawnIntervalId) {
                clearInterval(autoRespawnIntervalId);
                autoRespawnIntervalId = null;
            }
        }
    }

    function setModMenuSlider(id, value) {
        function findSliderByIdOrLabel(targetId) {
            let s = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`) || document.querySelector(`input[data-id="${targetId}"]`);
            if (s) return s;

            const friendly = targetId.replace(/([A-Z])/g, ' $1').toLowerCase();
            const keywords = friendly.split(/\s+/).filter(Boolean);

            const candidates = Array.from(document.querySelectorAll('input[type="range"], input[type="number"], input[type="text"]'));
            for (const c of candidates) {
                let labelText = '';
                if (c.id) {
                    const lab = document.querySelector(`label[for="${c.id}"]`);
                    if (lab) labelText = lab.innerText || '';
                }
                if (!labelText) {
                    if (c.previousElementSibling && c.previousElementSibling.innerText) labelText = c.previousElementSibling.innerText;
                    else if (c.parentElement && c.parentElement.innerText) labelText = c.parentElement.innerText;
                }

                const txt = (labelText || '').toLowerCase();
                if (!txt) continue;

                let match = true;
                for (const k of keywords) {
                    if (k.length < 2) continue;
                    if (!txt.includes(k)) {
                        match = false;
                        break;
                    }
                }
                if (match) return c;
            }

            return null;
        }

        const slider = findSliderByIdOrLabel(id);
        if (!slider) {
            showToast(`Slider "${id}" not found. Open the XelaCold Mod Menu or the game settings first.`);
            return false;
        }

        try {
            if (slider.tagName === 'INPUT' && slider.type === 'range') {
                const min = parseFloat(slider.min || slider.getAttribute('min') || 0);
                const max = parseFloat(slider.max || slider.getAttribute('max') || 0);
                if (!isNaN(min) && !isNaN(max) && (id === 'macroSpeed' || slider.dataset.controlId === 'macroSpeed' || slider.id === 'macroSpeed')) {
                    const desiredMs = Number(value);
                    if (!isNaN(desiredMs)) {
                        let computed = (min + max) - desiredMs;
                        if (computed < min) computed = min;
                        if (computed > max) computed = max;
                        slider.value = computed;
                    } else {
                        slider.value = value;
                    }
                } else {
                    slider.value = value;
                }
            } else {
                slider.value = value;
            }

            slider.dispatchEvent(new Event('input', { bubbles: true }));
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        } catch (e) {
            console.error('Failed to set slider', id, e);
            return false;
        }
    }

    function setGameMod(macroSpeed, macroAmount, modeName) {
        const macroSpeedSet = setModMenuSlider('macroSpeed', macroSpeed);
        const macroAmountSet = setModMenuSlider('macroAmount', macroAmount);
        const viewBaseScaleSet = setModMenuSlider('viewBaseScale', 4.0);

        if (macroSpeedSet && macroAmountSet && viewBaseScaleSet) {
            showToast(`${modeName} activated: Macro Speed = ${macroSpeed}ms, Macro Amount = ${macroAmount}, FOV = 4.0`);
        }
    }

    function setSafeMode() {
        setGameMod(70, 30, 'Safe Mode');
    }

    function setMediumRiskMode() {
        setGameMod(40, 100, 'Medium Risk Mode');
    }

    function setAggressiveMode() {
        setGameMod(20, 200, 'Aggressive Mode');
    }

    function dispatchSequenceKeyDown(key) {
        let keyCode = 0;
        let code = '';
        let eventKey = key;

        if (/^[A-Z0-9]$/.test(key)) {
            keyCode = key.charCodeAt(0);
            code = (key >= '0' && key <= '9') ? `Digit${key}` : `Key${key}`;
            eventKey = key.toLowerCase();
        } else if (key === 'SPACE') {
            keyCode = 32;
            code = 'Space';
            eventKey = ' ';
        } else if (key === 'SHIFT') {
            keyCode = 16;
            code = 'ShiftLeft';
            eventKey = 'Shift';
        } else {
            keyCode = key.charCodeAt(0);
            if (keyCode >= 65 && keyCode <= 90) {
                code = `Key${key}`;
                eventKey = key.toLowerCase();
            }
        }

        try {
            const event = new KeyboardEvent('keydown', {
                key: eventKey,
                code: code,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        } catch (e) {
            console.error('Failed to dispatch keydown:', e);
        }
    }

    function dispatchSequenceKeyUp(key) {
        let keyCode = 0;
        let code = '';
        let eventKey = key;

        if (/^[A-Z0-9]$/.test(key)) {
            keyCode = key.charCodeAt(0);
            code = (key >= '0' && key <= '9') ? `Digit${key}` : `Key${key}`;
            eventKey = key.toLowerCase();
        } else if (key === 'SPACE') {
            keyCode = 32;
            code = 'Space';
            eventKey = ' ';
        } else if (key === 'SHIFT') {
            keyCode = 16;
            code = 'ShiftLeft';
            eventKey = 'Shift';
        } else {
            keyCode = key.charCodeAt(0);
            if (keyCode >= 65 && keyCode <= 90) {
                code = `Key${key}`;
                eventKey = key.toLowerCase();
            }
        }

        try {
            const event = new KeyboardEvent('keyup', {
                key: eventKey,
                code: code,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
        } catch (e) {
            console.error('Failed to dispatch keyup:', e);
        }
    }

    function triggerSequenceMacro(sequence) {
        if (isChatInputFocused || !sequence) return;

        if (sequence === "Split -> Double Split -> Double Split") {
            dispatchSequenceKeyDown("Shift");
            setTimeout(() => dispatchSequenceKeyUp("Shift"), 10);

            const actions = [savedState.sequenceSplitKey, savedState.sequenceDoubleSplitKey, savedState.sequenceDoubleSplitKey];
            actions.forEach((key, i) => {
                setTimeout(() => dispatchSequenceKeyDown(key), i * 20);
                setTimeout(() => dispatchSequenceKeyUp(key), i * 20 + 10);
            });

            setTimeout(() => {
                dispatchSequenceKeyDown("Shift");
                setTimeout(() => dispatchSequenceKeyUp("Shift"), 10);
            }, actions.length * 20 + 50);

            return;
        }

        if (sequence === "Quad Split") {
            dispatchSequenceKeyDown("Shift");
            setTimeout(() => dispatchSequenceKeyUp("Shift"), 10);

            dispatchSequenceKeyDown(savedState.sequenceQuadSplitKey);
            setTimeout(() => dispatchSequenceKeyUp(savedState.sequenceQuadSplitKey), 30);

            setTimeout(() => {
                dispatchSequenceKeyDown("Shift");
                setTimeout(() => dispatchSequenceKeyUp("Shift"), 10);
            }, 60);

            return;
        }

        const parts = sequence.split("->").map(s => s.trim());

        parts.forEach((action, index) => {
            const tDown = index * savedState.sequenceMacroDelay;
            const tUp = (index + 1) * savedState.sequenceMacroDelay;

            setTimeout(() => {
                if (action === "Pause") return;

                if (action === "Macro") {
                    if (savedState.sequenceOptionMode === "A") dispatchSequenceKeyDown(savedState.sequenceMacroKey);
                } else if (action === "Split") dispatchSequenceKeyDown(savedState.sequenceSplitKey);
                else if (action === "Double Split") dispatchSequenceKeyDown(savedState.sequenceDoubleSplitKey);
                else if (action === "Quad Split") dispatchSequenceKeyDown(savedState.sequenceQuadSplitKey);
            }, tDown);

            setTimeout(() => {
                if (action === "Pause") return;

                if (action === "Macro") {
                    if (savedState.sequenceOptionMode === "A") dispatchSequenceKeyUp(savedState.sequenceMacroKey);
                } else if (action === "Split") dispatchSequenceKeyUp(savedState.sequenceSplitKey);
                else if (action === "Double Split") dispatchSequenceKeyUp(savedState.sequenceDoubleSplitKey);
                else if (action === "Quad Split") dispatchSequenceKeyUp(savedState.sequenceQuadSplitKey);
            }, tUp);
        });
    }

    function handleSequenceKeyEvents() {
        window.addEventListener('keydown', function (event) {
            if (isChatActive() || isWaitingForKeybind) return;

            let key = event.key.toUpperCase();

            if (event.key === ' ') key = 'SPACE';
            else if (event.code && event.code.startsWith('F') && event.keyCode >= 112 && event.keyCode <= 123) {
                key = event.code;
            }

            sequenceKeysPressed[key] = true;

            if (key === savedState.sequenceModeToggleKey && !sequenceKeysPressed['_toggling']) {
                sequenceKeysPressed['_toggling'] = true;
                savedState.sequenceOptionMode = savedState.sequenceOptionMode === "A" ? "B" : "A";
                localStorage.setItem('sequenceOptionMode', savedState.sequenceOptionMode);
                updateSequenceModeIndicator();
                showToast(`Sequence Mode: ${savedState.sequenceOptionMode === "A" ? "A (Trigger runs Macro)" : "B (Manual Macro)"}`);
                persist();
            }

            if (key === savedState.sequenceTriggerKey && !sequenceKeysPressed['_sequenceRunning']) {
                sequenceKeysPressed['_sequenceRunning'] = true;
                triggerSequenceMacro(savedState.selectedSequence);
            }

            if (key === savedState.sequencePreSplitTriggerKey && !sequenceKeysPressed['_preSequenceRunning']) {
                sequenceKeysPressed['_preSequenceRunning'] = true;
                triggerSequenceMacro(savedState.selectedPreSequence);
            }
        });

        window.addEventListener('keyup', function (event) {
            let key = event.key.toUpperCase();

            if (event.key === ' ') key = 'SPACE';
            else if (event.code && event.code.startsWith('F') && event.keyCode >= 112 && event.keyCode <= 123) {
                key = event.code;
            }

            sequenceKeysPressed[key] = false;

            if (key === savedState.sequenceModeToggleKey) sequenceKeysPressed['_toggling'] = false;
            if (key === savedState.sequenceTriggerKey || key === savedState.sequenceMacroKey) sequenceKeysPressed['_sequenceRunning'] = false;
            if (key === savedState.sequencePreSplitTriggerKey) sequenceKeysPressed['_preSequenceRunning'] = false;
        });
    }

    function setupSequenceKeybindListeners() {
        const setSequenceMacroKeybind = (btn) => setupKeybindListener(btn, 'sequenceMacroKey', 'Sequence Macro Key');
        const setSequenceSplitKeybind = (btn) => setupKeybindListener(btn, 'sequenceSplitKey', 'Sequence Split Key');
        const setSequenceDoubleSplitKeybind = (btn) => setupKeybindListener(btn, 'sequenceDoubleSplitKey', 'Sequence Double Split Key');
        const setSequenceQuadSplitKeybind = (btn) => setupKeybindListener(btn, 'sequenceQuadSplitKey', 'Sequence Quad Split Key');
        const setSequenceTriggerKeybind = (btn) => setupKeybindListener(btn, 'sequenceTriggerKey', 'Sequence Trigger Key');
        const setSequenceModeToggleKeybind = (btn) => setupKeybindListener(btn, 'sequenceModeToggleKey', 'Sequence Mode Toggle Key');
        const setSequencePreSplitKeybind = (btn) => setupKeybindListener(btn, 'sequencePreSplitTriggerKey', 'Pre-Split Trigger Key');

        return {
            setSequenceMacroKeybind,
            setSequenceSplitKeybind,
            setSequenceDoubleSplitKeybind,
            setSequenceQuadSplitKeybind,
            setSequenceTriggerKeybind,
            setSequenceModeToggleKeybind,
            setSequencePreSplitKeybind
        };
    }

    defineCSSVariables();

    Object.assign(ui.style, {
        position: 'fixed',
        top: (savedState.top || 20) + 'px',
        left: (savedState.left !== null ? savedState.left + 'px' : (window.innerWidth - 350) + 'px'),
        width: savedState.menuWidth + 'px',
        maxWidth: '90vw',
        zIndex: 2147483646,
        display: 'flex',
        flexDirection: 'column',
        opacity: (savedState.uiOpacity / 100),
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(var(--accent-color-rgb), 0.15)',
        cursor: 'grab',
        transition: 'all 0.4s cubic-bezier(.25, .8, .25, 1), opacity 0.4s ease, box-shadow 0.3s ease',
        maxHeight: 'calc(90vh - 40px)',
        padding: '0',
        fontFamily: "'Inter', sans-serif"
    });

    const uiHeader = document.createElement('div');
    uiHeader.style.padding = '12px 12px 0 12px';
    uiHeader.style.position = 'relative';

    const collapseBtn = document.createElement('div');
    Object.assign(collapseBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '12px',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: '1',
        color: 'var(--text-secondary)',
        transition: 'transform 0.2s ease'
    });
    collapseBtn.innerText = '▼';
    collapseBtn.onmouseover = () => { collapseBtn.style.transform = 'scale(1.1)'; };
    collapseBtn.onmouseout = () => { collapseBtn.style.transform = 'scale(1)'; };
    uiHeader.appendChild(collapseBtn);

    const logo = document.createElement('img');
    logo.src = 'https://raw.githubusercontent.com/Jackon0234/Assest/main/modmenu.png';
    logo.alt = 'Jackon YTB Logo';
    Object.assign(logo.style, {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '50%',
        margin: '6px auto',
        display: 'block',
        border: '3px solid var(--border-secondary)',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 20px rgba(var(--accent-color-rgb), 0.2)'
    });
    uiHeader.appendChild(logo);

    const title = document.createElement('div');
    title.style.textAlign = 'center';
    title.style.paddingBottom = '8px';
    title.style.color = 'var(--text-primary)';
    title.innerHTML = `<strong style="font-size:16px; font-weight: 700; background: linear-gradient(135deg, var(--text-primary), var(--accent-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Retired Goats X <span style="color: var(--accent-color);">Jackon</span></strong><div style="font-size:13px;opacity:0.8;font-weight:500;margin-top:2px;color:var(--text-secondary);">Mod • v2.0.0</div>`;
    uiHeader.appendChild(title);

    const hr = document.createElement('div');
    Object.assign(hr.style, {
        height: '1px',
        background: 'var(--border-secondary)',
        margin: '6px 12px',
        opacity: '0.6'
    });
    uiHeader.appendChild(hr);

    const socialRow = document.createElement('div');
    Object.assign(socialRow.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        paddingBottom: '8px'
    });
    socialRow.appendChild(makeSocial('YouTube', 'https://www.youtube.com/@JackonYTB0'));
    uiHeader.appendChild(socialRow);
    ui.appendChild(uiHeader);

    const uiContent = document.createElement('div');
    Object.assign(uiContent.style, {
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 15px 8px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    });
    uiContent.style.scrollbarWidth = 'thin';
    uiContent.style.scrollbarColor = 'var(--accent-color) var(--bg-secondary)';

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
    #jackon-ui {
        font-family: 'Inter', sans-serif;
    }
    
    /* Scrollbar Styling */
    #jackon-ui div::-webkit-scrollbar { 
        width: 8px; 
    }
    #jackon-ui div::-webkit-scrollbar-track { 
        background: var(--bg-secondary); 
        border-radius: 4px; 
    }
    #jackon-ui div::-webkit-scrollbar-thumb { 
        background: linear-gradient(180deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.7));
        border-radius: 4px; 
        transition: all 0.3s ease;
        box-shadow: inset 0 0 6px rgba(var(--accent-color-rgb), 0.3);
    }
    #jackon-ui div::-webkit-scrollbar-thumb:hover { 
        background: linear-gradient(180deg, var(--accent-color), var(--accent-color));
        box-shadow: inset 0 0 10px rgba(var(--accent-color-rgb), 0.5), 0 0 10px rgba(var(--accent-color-rgb), 0.3);
    }
    
    /* Color Picker */
    #jackon-ui input[type="color"] { 
        min-width: 40px; 
        height: 30px; 
        padding: 0; 
        border: none; 
        background: none; 
        cursor: pointer;
        transition: all 0.2s ease;
    }
    #jackon-ui input[type="color"]::-webkit-color-swatch-wrapper { 
        padding: 2px; 
        border-radius: 8px; 
        border: 2px solid var(--border-secondary);
    }
    #jackon-ui input[type="color"]::-webkit-color-swatch { 
        border: none; 
        border-radius: 6px;
        box-shadow: inset 0 0 8px rgba(0,0,0,0.3);
    }
    
    /* Buttons */
    #jackon-ui button {
        font-family: 'Inter', sans-serif;
        font-weight: 600; 
        border-radius: 10px; 
        border: none;
        transition: all 0.3s cubic-bezier(.2,.8,.2,1);
        cursor: pointer;
        background: linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05));
        color: var(--text-primary);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
    }
    
    #jackon-ui button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        transition: left 0.5s ease;
    }
    
    #jackon-ui button:hover {
        transform: translateY(-3px); 
        filter: brightness(1.15);
        box-shadow: 0 8px 25px rgba(var(--accent-color-rgb), 0.3), 0 0 20px rgba(var(--accent-color-rgb), 0.2);
    }
    
    #jackon-ui button:hover::before {
        left: 100%;
    }
    
    #jackon-ui button:active {
        transform: translateY(-1px); 
        filter: brightness(0.95);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    #jackon-ui button.primary {
        background: linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8));
        color: white;
        font-weight: 700;
        box-shadow: 0 6px 20px rgba(var(--accent-color-rgb), 0.4);
    }
    
    #jackon-ui button.primary:hover {
        box-shadow: 0 10px 35px rgba(var(--accent-color-rgb), 0.6), 0 0 30px rgba(var(--accent-color-rgb), 0.4);
        filter: brightness(1.1);
    }

    /* Text Input & Number Input */
    #jackon-ui input[type="text"], #jackon-ui input[type="number"] {
        font-family: 'Inter', sans-serif;
        border-radius: 10px; 
        padding: 10px 12px; 
        border: 2px solid var(--border-primary);
        background: linear-gradient(135deg, var(--bg-input), rgba(255,255,255,0.02));
        color: var(--text-primary);
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        font-size: 13px;
    }
    
    #jackon-ui input[type="text"]:focus, #jackon-ui input[type="number"]:focus {
        border-color: var(--accent-color);
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.2), 0 0 15px rgba(var(--accent-color-rgb), 0.4);
        outline: none;
        background: linear-gradient(135deg, var(--bg-input), rgba(var(--accent-color-rgb), 0.05));
    }
    
    /* Range Slider */
    #jackon-ui input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, var(--bg-input), rgba(var(--accent-color-rgb), 0.2));
        border-radius: 3px;
        outline: none;
        transition: opacity .2s;
        cursor: pointer;
        border: 1px solid var(--border-secondary);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    
    #jackon-ui input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.9));
        border: 3px solid var(--bg-primary);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 10px rgba(var(--accent-color-rgb), 0.5);
    }
    
    #jackon-ui input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 20px rgba(var(--accent-color-rgb), 0.8);
    }
    
    #jackon-ui input[type="range"]::-moz-range-track {
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, var(--bg-input), rgba(var(--accent-color-rgb), 0.2));
        border-radius: 3px;
        border: 1px solid var(--border-secondary);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    
    #jackon-ui input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.9));
        border: 3px solid var(--bg-primary);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 10px rgba(var(--accent-color-rgb), 0.5);
    }
    
    /* Checkbox (Toggle Switch) */
    #jackon-ui input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        width: 48px;
        height: 26px;
        background: linear-gradient(90deg, var(--bg-input), rgba(var(--accent-color-rgb), 0.1));
        border-radius: 13px;
        border: 2px solid var(--border-primary);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(.2,.8,.2,1);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }
    
    #jackon-ui input[type="checkbox"]::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--text-secondary), rgba(255,255,255,0.2));
        top: 2px;
        left: 2px;
        transition: all 0.3s cubic-bezier(.2,.8,.2,1);
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    #jackon-ui input[type="checkbox"]:hover::before {
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    }
    
    #jackon-ui input[type="checkbox"]:checked {
        background: linear-gradient(90deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8));
        border-color: var(--accent-color);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.3), 0 0 15px rgba(var(--accent-color-rgb), 0.3);
    }
    
    #jackon-ui input[type="checkbox"]:checked::before {
        background: white;
        transform: translateX(22px);
        box-shadow: 0 2px 8px rgba(var(--accent-color-rgb), 0.5);
    }
    
    /* Select Dropdown */
    #jackon-ui select {
        font-family: 'Inter', sans-serif;
        border-radius: 10px;
        padding: 10px 12px;
        border: 2px solid var(--border-primary);
        background: linear-gradient(135deg, var(--bg-input), rgba(255,255,255,0.02));
        color: var(--text-primary) !important;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        font-size: 13px;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 16px;
        padding-right: 40px;
    }
    
    #jackon-ui select option {
        background: var(--bg-primary);
        color: var(--text-primary);
        padding: 8px;
    }
    
    #jackon-ui select:focus {
        border-color: var(--accent-color);
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.2), 0 0 15px rgba(var(--accent-color-rgb), 0.4);
        outline: none;
        background: linear-gradient(135deg, var(--bg-input), rgba(var(--accent-color-rgb), 0.05));
    }
    
    /* Tab Animation */
    @keyframes tabSlide {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes glow {
        0%, 100% {
            box-shadow: 0 0 10px rgba(var(--accent-color-rgb), 0.3);
        }
        50% {
            box-shadow: 0 0 20px rgba(var(--accent-color-rgb), 0.6);
        }
    }
    
    @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
    }
    
    #jackon-ui [style*="display: block"] {
        animation: tabSlide 0.4s cubic-bezier(.2,.8,.2,1);
    }
  `;
    document.head.appendChild(styleSheet);

    const tabContainer = document.createElement('div');
    Object.assign(tabContainer.style, {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        borderBottom: '2px solid var(--border-secondary)',
        paddingBottom: '10px',
        padding: '0 15px',
        marginLeft: '0',
        marginRight: '0'
    });

    const mainTabBtn = document.createElement('button');
    mainTabBtn.innerText = '⚙️ Main';
    mainTabBtn.dataset.tab = 'main';
    Object.assign(mainTabBtn.style, {
        flex: '1',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))',
        color: 'white',
        borderRadius: '10px',
        border: 'none',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 4px 15px rgba(var(--accent-color-rgb), 0.3)',
        cursor: 'pointer'
    });

    const macrosTabBtn = document.createElement('button');
    macrosTabBtn.innerText = '🎮 Macros';
    macrosTabBtn.dataset.tab = 'macros';
    Object.assign(macrosTabBtn.style, {
        flex: '1',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
        color: 'var(--text-primary)',
        borderRadius: '10px',
        border: '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer'
    });

    const configsTabBtn = document.createElement('button');
    configsTabBtn.innerText = '⚡ Configs';
    configsTabBtn.dataset.tab = 'configs';
    Object.assign(configsTabBtn.style, {
        flex: '1',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
        color: 'var(--text-primary)',
        borderRadius: '10px',
        border: '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer'
    });

    const sequencesTabBtn = document.createElement('button');
    sequencesTabBtn.innerText = '🔁 Sequences';
    sequencesTabBtn.dataset.tab = 'sequences';
    Object.assign(sequencesTabBtn.style, {
        flex: '1',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
        color: 'var(--text-primary)',
        borderRadius: '10px',
        border: '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer'
    });

    tabContainer.appendChild(mainTabBtn);
    tabContainer.appendChild(macrosTabBtn);
    tabContainer.appendChild(configsTabBtn);
    tabContainer.appendChild(sequencesTabBtn);
    uiContent.appendChild(tabContainer);

    const mainPanel = document.createElement('div');
    mainPanel.id = 'main-panel';
    Object.assign(mainPanel.style, { display: 'block' });

    const macrosPanel = document.createElement('div');
    macrosPanel.id = 'macros-panel';
    Object.assign(macrosPanel.style, { display: 'none' });

    const configsPanel = document.createElement('div');
    configsPanel.id = 'configs-panel';
    Object.assign(configsPanel.style, { display: 'none' });

    const sequencesPanel = document.createElement('div');
    sequencesPanel.id = 'sequences-panel';
    Object.assign(sequencesPanel.style, { display: 'none' });

    function switchTab(tabName) {
        [mainPanel, macrosPanel, configsPanel, sequencesPanel].forEach(p => {
            p.style.display = 'none';
            p.style.animation = 'none';
        });

        [mainTabBtn, macrosTabBtn, configsTabBtn, sequencesTabBtn].forEach(b => {
            b.style.background = 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))';
            b.style.color = 'var(--text-primary)';
            b.style.border = '2px solid transparent';
            b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });

        if (tabName === 'main') {
            mainPanel.style.display = 'block';
            mainPanel.style.animation = 'tabSlide 0.4s cubic-bezier(.2,.8,.2,1)';
            mainTabBtn.style.background = 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))';
            mainTabBtn.style.color = 'white';
            mainTabBtn.style.boxShadow = '0 4px 15px rgba(var(--accent-color-rgb), 0.3)';
        } else if (tabName === 'macros') {
            macrosPanel.style.display = 'block';
            macrosPanel.style.animation = 'tabSlide 0.4s cubic-bezier(.2,.8,.2,1)';
            macrosTabBtn.style.background = 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))';
            macrosTabBtn.style.color = 'white';
            macrosTabBtn.style.boxShadow = '0 4px 15px rgba(var(--accent-color-rgb), 0.3)';
        } else if (tabName === 'configs') {
            configsPanel.style.display = 'block';
            configsPanel.style.animation = 'tabSlide 0.4s cubic-bezier(.2,.8,.2,1)';
            configsTabBtn.style.background = 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))';
            configsTabBtn.style.color = 'white';
            configsTabBtn.style.boxShadow = '0 4px 15px rgba(var(--accent-color-rgb), 0.3)';
        } else if (tabName === 'sequences') {
            sequencesPanel.style.display = 'block';
            sequencesPanel.style.animation = 'tabSlide 0.4s cubic-bezier(.2,.8,.2,1)';
            sequencesTabBtn.style.background = 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))';
            sequencesTabBtn.style.color = 'white';
            sequencesTabBtn.style.boxShadow = '0 4px 15px rgba(var(--accent-color-rgb), 0.3)';
        }
    }

    mainTabBtn.onclick = () => switchTab('main');
    macrosTabBtn.onclick = () => switchTab('macros');
    configsTabBtn.onclick = () => switchTab('configs');
    sequencesTabBtn.onclick = () => switchTab('sequences');

    const fpsRow = document.createElement('div');
    Object.assign(fpsRow.style, { display: 'flex', alignItems: 'center', gap: '8px' });

    const fpsLabel = document.createElement('div');
    fpsLabel.innerText = 'FPS Limit';
    fpsLabel.style.minWidth = '70px';
    fpsLabel.style.color = 'var(--text-primary)';
    fpsLabel.style.fontSize = '14px';
    fpsRow.appendChild(fpsLabel);

    const fpsBtnContainer = document.createElement('div');
    Object.assign(fpsBtnContainer.style, {
        display: 'flex',
        gap: '6px',
        flex: '1',
        flexWrap: 'wrap'
    });

    [60, 120, 144, 180, 240, 300].forEach(v => {
        const b = document.createElement('button');
        b.innerText = v;
        b.dataset.fps = v;
        Object.assign(b.style, {
            flex: '1 1 auto',
            minWidth: '40px',
            padding: '8px',
            fontSize: '12px',
            fontWeight: '600',
            background: (savedState.fps === v) ? 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))' : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
            color: (savedState.fps === v) ? 'white' : 'var(--text-primary)',
            marginBottom: '4px',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: (savedState.fps === v) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)'
        });

        b.onmouseover = () => {
            if (b.dataset.fps != savedState.fps) {
                b.style.transform = 'translateY(-2px)';
                b.style.boxShadow = '0 4px 12px rgba(var(--accent-color-rgb), 0.2)';
            }
        };

        b.onmouseout = () => {
            b.style.transform = 'translateY(0)';
            b.style.boxShadow = (b.dataset.fps == savedState.fps) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)';
        };

        b.onclick = () => {
            savedState.fps = v;
            persist();

            Array.from(fpsBtnContainer.children).forEach(ch => {
                ch.style.background = (ch.dataset.fps == v) ? 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))' : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))';
                ch.style.color = (ch.dataset.fps == v) ? 'white' : 'var(--text-primary)';
                ch.style.boxShadow = (ch.dataset.fps == v) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)';
            });

            showToast('🎬 FPS set to ' + v);
        };

        fpsBtnContainer.appendChild(b);
    });

    fpsRow.appendChild(fpsBtnContainer);
    mainPanel.appendChild(fpsRow);

    const qualitySliderRow = document.createElement('div');
    Object.assign(qualitySliderRow.style, { display: 'flex', alignItems: 'center', gap: '10px' });

    qualityLabel = document.createElement('div');
    qualityLabel.innerText = `Quality`;
    qualityLabel.style.minWidth = '70px';
    qualityLabel.style.color = 'var(--text-primary)';
    qualityLabel.style.fontSize = '14px';
    qualitySliderRow.appendChild(qualityLabel);

    qualitySlider = document.createElement('input');
    qualitySlider.type = 'range';
    qualitySlider.min = '20';
    qualitySlider.max = '100';
    qualitySlider.step = '5';
    qualitySlider.value = savedState.qualityPercent;
    qualitySlider.style.flex = '1';

    qualitySlider.addEventListener('input', () => {
        setGameQuality(qualitySlider.value, true);
    });

    qualitySliderRow.appendChild(qualitySlider);
    mainPanel.appendChild(qualitySliderRow);

    const qualityBtnRow = document.createElement('div');
    Object.assign(qualityBtnRow.style, { display: 'flex', gap: '6px', flex: '1', marginTop: '4px' });

    [['Low', 40], ['Med', 70], ['High', 90], ['Max', 100]].forEach(([name, percent]) => {
        const b = document.createElement('button');
        b.innerText = name;
        Object.assign(b.style, {
            flex: '1',
            padding: '8px',
            fontSize: '12px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        });

        b.onmouseover = () => {
            b.style.transform = 'translateY(-2px)';
            b.style.boxShadow = '0 4px 12px rgba(var(--accent-color-rgb), 0.2)';
            b.style.background = 'linear-gradient(135deg, rgba(var(--accent-color-rgb), 0.2), rgba(var(--accent-color-rgb), 0.1))';
        };

        b.onmouseout = () => {
            b.style.transform = 'translateY(0)';
            b.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            b.style.background = 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))';
        };

        b.onclick = () => {
            setGameQuality(percent, true);
        };

        qualityBtnRow.appendChild(b);
    });

    mainPanel.appendChild(qualityBtnRow);

    mainPanel.appendChild(createSettingCategory('Appearance'));

    const widthRow = createSettingRow('Menu Width');
    widthRow.style.flexDirection = 'column';
    widthRow.style.alignItems = 'stretch';

    const widthLabel = widthRow.querySelector('div');
    widthLabel.innerText = `Menu Width: ${savedState.menuWidth}px`;
    widthLabel.style.marginBottom = '8px';

    const widthSlider = document.createElement('input');
    widthSlider.type = 'range';
    widthSlider.min = '280';
    widthSlider.max = '450';
    widthSlider.step = '5';
    widthSlider.value = savedState.menuWidth;
    widthSlider.style.width = '100%';

    widthSlider.addEventListener('input', () => {
        const newWidth = widthSlider.value;
        ui.style.width = newWidth + 'px';
        widthLabel.innerText = `Menu Width: ${newWidth}px`;
    });

    widthSlider.addEventListener('change', () => {
        const newWidth = widthSlider.value;
        savedState.menuWidth = parseInt(newWidth);
        persist();
    });

    widthRow.appendChild(widthSlider);
    mainPanel.appendChild(widthRow);

    const opacityRow = createSettingRow('Menu Opacity');
    opacityRow.style.flexDirection = 'column';
    opacityRow.style.alignItems = 'stretch';

    const opacityLabel = opacityRow.querySelector('div');
    opacityLabel.innerText = `Menu Opacity: ${savedState.uiOpacity}%`;
    opacityLabel.style.marginBottom = '8px';

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '20';
    opacitySlider.max = '100';
    opacitySlider.step = '1';
    opacitySlider.value = savedState.uiOpacity;
    opacitySlider.style.width = '100%';

    opacitySlider.addEventListener('input', () => {
        const newOpacity = opacitySlider.value;
        ui.style.opacity = newOpacity / 100;
        opacityLabel.innerText = `Menu Opacity: ${newOpacity}%`;
    });

    opacitySlider.addEventListener('change', () => {
        savedState.uiOpacity = parseInt(opacitySlider.value);
        persist();
    });

    opacityRow.appendChild(opacitySlider);
    mainPanel.appendChild(opacityRow);

    const themeSelectionRow = createSettingRow('Theme Selection');
    themeSelectionRow.style.flexDirection = 'column';
    themeSelectionRow.style.alignItems = 'stretch';
    themeSelectionRow.querySelector('div').style.marginBottom = '8px';

    const themeButtonContainer = document.createElement('div');
    Object.assign(themeButtonContainer.style, {
        display: 'flex',
        gap: '6px',
        flex: '1',
        width: '100%'
    });

    const themes = [
        { name: 'Dark', value: 'dark' },
        { name: 'Light', value: 'light' },
        { name: 'Transparent', value: 'transparent' }
    ];

    themes.forEach(({ name, value }) => {
        const b = document.createElement('button');
        b.innerText = (value === 'dark') ? '🌙 ' + name : (value === 'light') ? '☀️ ' + name : '✨ ' + name;
        b.dataset.theme = value;
        Object.assign(b.style, {
            flex: '1',
            padding: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: (savedState.theme === value) ? 'white' : 'var(--text-primary)',
            background: (savedState.theme === value) ? 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))' : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: (savedState.theme === value) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)'
        });

        b.onmouseover = () => {
            if (b.dataset.theme !== savedState.theme) {
                b.style.transform = 'translateY(-2px)';
                b.style.boxShadow = '0 4px 12px rgba(var(--accent-color-rgb), 0.2)';
            }
        };

        b.onmouseout = () => {
            b.style.transform = 'translateY(0)';
            b.style.boxShadow = (b.dataset.theme === savedState.theme) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)';
        };

        b.onclick = () => {
            applyTheme(value);

            Array.from(themeButtonContainer.children).forEach(ch => {
                ch.style.background = (ch.dataset.theme === value) ? 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-color-rgb), 0.8))' : 'linear-gradient(135deg, var(--bg-tertiary), rgba(255,255,255,0.05))';
                ch.style.color = (ch.dataset.theme === value) ? 'white' : 'var(--text-primary)';
                ch.style.boxShadow = (ch.dataset.theme === value) ? '0 4px 12px rgba(var(--accent-color-rgb), 0.3)' : '0 2px 6px rgba(0,0,0,0.15)';
            });

            showToast(`🎨 Theme set to '${name}'.`);
        };

        themeButtonContainer.appendChild(b);
    });

    themeSelectionRow.appendChild(themeButtonContainer);
    mainPanel.appendChild(themeSelectionRow);

    const accentRow = createSettingRow('Accent Color');
    const accentColorPicker = document.createElement('input');
    accentColorPicker.id = 'accentColorPickerInput';
    accentColorPicker.type = 'color';
    accentColorPicker.value = savedState.accentColor;

    accentColorPicker.addEventListener('input', () => {
        applyAccentColor(accentColorPicker.value, false);
    });

    accentColorPicker.addEventListener('change', () => {
        applyAccentColor(accentColorPicker.value, true);
    });

    accentRow.appendChild(accentColorPicker);
    mainPanel.appendChild(accentRow);

    const rgbModeRow = createSettingRow('RGB Mode 🌈');
    const rgbModeSwitch = document.createElement('input');
    rgbModeSwitch.id = 'rgbModeSwitch';
    rgbModeSwitch.type = 'checkbox';
    rgbModeSwitch.checked = savedState.rgbModeEnabled;

    rgbModeSwitch.onchange = () => {
        toggleRGBMode(rgbModeSwitch.checked);
    };

    rgbModeRow.appendChild(rgbModeSwitch);
    mainPanel.appendChild(rgbModeRow);

    const smartRGBRow = createSettingRow('Smart RGB Game Colors');
    const smartRGBSwitch = document.createElement('input');
    smartRGBSwitch.type = 'checkbox';
    smartRGBSwitch.checked = savedState.smartRGBGameColors;

    smartRGBSwitch.onchange = () => {
        savedState.smartRGBGameColors = smartRGBSwitch.checked;
        persist();
        showToast('Smart RGB Game Colors ' + (savedState.smartRGBGameColors ? 'ON' : 'OFF'));

        if (savedState.smartRGBGameColors && savedState.rgbModeEnabled) {
            updateGameColorsWithRGB(savedState.accentColor);
        }
    };

    smartRGBRow.appendChild(smartRGBSwitch);
    mainPanel.appendChild(smartRGBRow);

    mainPanel.appendChild(createSettingCategory('Custom Color Overrides'));

    const customThemeRow = createSettingRow('Enable Custom Colors');
    const customThemeSwitch = document.createElement('input');
    customThemeSwitch.type = 'checkbox';
    customThemeSwitch.checked = savedState.customThemeEnabled;
    customThemeRow.appendChild(customThemeSwitch);
    mainPanel.appendChild(customThemeRow);

    const customThemeColorsPanel = document.createElement('div');
    Object.assign(customThemeColorsPanel.style, {
        display: savedState.customThemeEnabled ? 'block' : 'none',
        padding: '10px',
        border: '1px solid var(--border-secondary)',
        borderRadius: '6px',
        marginTop: '5px',
        background: 'rgba(0,0,0,0.1)'
    });

    customThemeSwitch.onchange = () => {
        savedState.customThemeEnabled = customThemeSwitch.checked;
        persist();

        customThemeColorsPanel.style.display = savedState.customThemeEnabled ? 'block' : 'none';

        if (savedState.customThemeEnabled) {
            applyCustomColorOverrides();
            showToast('Custom Colors Enabled.');
        } else {
            applyTheme(savedState.theme);
            showToast('Custom Colors Disabled.');
        }
    };

    customThemeColorsPanel.appendChild(createColorPickerRow('Background Color', 'customBgColor', '--bg-primary'));
    customThemeColorsPanel.appendChild(createColorPickerRow('Primary Text Color', 'customTextColor', '--text-primary'));
    customThemeColorsPanel.appendChild(createColorPickerRow('Border Color', 'customBorderColor', '--border-primary'));

    mainPanel.appendChild(customThemeColorsPanel);

    mainPanel.appendChild(createSettingCategory('Background'));

    const bgLabel = document.createElement('div');
    bgLabel.innerText = 'Custom Background URL (Supports GIF):';
    Object.assign(bgLabel.style, {
        color: 'var(--text-primary)',
        fontSize: '14px',
        marginTop: '10px'
    });
    mainPanel.appendChild(bgLabel);

    const bgInput = document.createElement('input');
    bgInput.type = 'text';
    bgInput.placeholder = 'https://i.imgur.com/your-image.gif';
    bgInput.value = savedState.customBackgroundUrl;
    Object.assign(bgInput.style, {
        width: '100%',
        marginTop: '4px',
        boxSizing: 'border-box'
    });
    mainPanel.appendChild(bgInput);

    const bgButtonRow = document.createElement('div');
    Object.assign(bgButtonRow.style, {
        display: 'flex',
        gap: '6px',
        flex: '1',
        marginTop: '6px'
    });

    const bgApplyButton = document.createElement('button');
    bgApplyButton.innerText = 'Set Background';
    bgApplyButton.className = 'primary';
    Object.assign(bgApplyButton.style, {
        flex: '2',
        padding: '8px'
    });

    bgApplyButton.onclick = () => {
        applyCustomBackground(bgInput.value, true);
    };

    bgButtonRow.appendChild(bgApplyButton);

    const bgResetButton = document.createElement('button');
    bgResetButton.innerText = 'Reset';
    Object.assign(bgResetButton.style, {
        flex: '1',
        padding: '8px'
    });

    bgResetButton.onclick = () => {
        bgInput.value = '';
        applyCustomBackground('', true);
    };

    bgButtonRow.appendChild(bgResetButton);
    mainPanel.appendChild(bgButtonRow);

    const btnStyle = {
        padding: '6px 12px',
        minWidth: '90px',
        background: 'var(--accent-color)',
        color: 'white',
        border: 'none',
        textAlign: 'center',
        fontSize: '13px'
    };

    macrosPanel.appendChild(createSettingCategory('Keybinds'));

    const comboFastFeedRow = createSettingRow('Fast Feed (Macro+Quad)');
    const comboFastFeedButton = document.createElement('button');
    Object.assign(comboFastFeedButton.style, btnStyle);
    comboFastFeedButton.innerText = savedState.comboFastFeedKey || 'NONE';
    comboFastFeedButton.onclick = () => setComboKeybind(comboFastFeedButton);
    comboFastFeedRow.appendChild(comboFastFeedButton);
    macrosPanel.appendChild(comboFastFeedRow);

    const leftClickMacroRow = createSettingRow('Left Click Macro+Quad');
    const leftClickMacroSwitch = document.createElement('input');
    leftClickMacroSwitch.type = 'checkbox';
    leftClickMacroSwitch.checked = savedState.leftClickMacroEnabled;

    leftClickMacroSwitch.onchange = () => {
        savedState.leftClickMacroEnabled = leftClickMacroSwitch.checked;
        persist();
        showToast('Left Click Macro ' + (savedState.leftClickMacroEnabled ? 'ON' : 'OFF'));
    };

    leftClickMacroRow.appendChild(leftClickMacroSwitch);
    macrosPanel.appendChild(leftClickMacroRow);

    const comboSpamFeedRow = createSettingRow('Spam Fast Feed (H)');
    const comboSpamFeedButton = document.createElement('button');
    Object.assign(comboSpamFeedButton.style, btnStyle);
    comboSpamFeedButton.innerText = savedState.spamFastFeedKey || 'NONE';
    comboSpamFeedButton.onclick = () => setSpamKeybind(comboSpamFeedButton);
    comboSpamFeedRow.appendChild(comboSpamFeedButton);
    macrosPanel.appendChild(comboSpamFeedRow);

    const spamModeRow = createSettingRow('Spam Mode (H Key)');
    spamModeRow.appendChild(createModeSwitch('spamFastFeedMode', 'Spam (H)'));
    macrosPanel.appendChild(spamModeRow);

    const spamIntervalRow = createSettingRow('Spam Interval (ms)');
    const spamIntervalInput = document.createElement('input');
    spamIntervalInput.type = 'number';
    spamIntervalInput.min = '100';
    spamIntervalInput.step = '50';
    spamIntervalInput.value = savedState.spamFastFeedInterval;
    Object.assign(spamIntervalInput.style, {
        width: '90px'
    });

    spamIntervalInput.onchange = () => {
        let val = parseInt(spamIntervalInput.value);
        if (isNaN(val) || val < 100) val = 100;
        spamIntervalInput.value = val;
        savedState.spamFastFeedInterval = val;
        persist();

        if (isSpammingFastFeed) {
            startSpamming();
        }
    };

    spamIntervalRow.appendChild(spamIntervalInput);
    macrosPanel.appendChild(spamIntervalRow);

    const quadFeedRow = createSettingRow('Quad Feed Spam (F)');
    const quadFeedButton = document.createElement('button');
    Object.assign(quadFeedButton.style, btnStyle);
    quadFeedButton.innerText = savedState.quadFeedKey || 'NONE';
    quadFeedButton.onclick = () => setQuadFeedKeybind(quadFeedButton);
    quadFeedRow.appendChild(quadFeedButton);
    macrosPanel.appendChild(quadFeedRow);

    const quadModeRow = createSettingRow('F Spam Mode');
    quadModeRow.appendChild(createModeSwitch('spamQuadFeedMode', 'Spam (F)'));
    macrosPanel.appendChild(quadModeRow);

    const quadIntervalRow = createSettingRow('F Spam Interval (ms)');
    const quadIntervalInput = document.createElement('input');
    quadIntervalInput.type = 'number';
    quadIntervalInput.min = '100';
    quadIntervalInput.step = '50';
    quadIntervalInput.value = savedState.quadFeedInterval;
    Object.assign(quadIntervalInput.style, { width: '90px' });

    quadIntervalInput.onchange = () => {
        let val = parseInt(quadIntervalInput.value);
        if (isNaN(val) || val < 100) val = 100;
        quadIntervalInput.value = val;
        savedState.quadFeedInterval = val;
        persist();

        if (isSpammingQuadFeed) startSpammingQuad();
    };

    quadIntervalRow.appendChild(quadIntervalInput);
    macrosPanel.appendChild(quadIntervalRow);

    const spamWFeedRow = createSettingRow('Spam W (Feed)');
    const spamWFeedButton = document.createElement('button');
    Object.assign(spamWFeedButton.style, btnStyle);
    spamWFeedButton.innerText = savedState.spamWKey || 'NONE';
    spamWFeedButton.onclick = () => setSpamWKeybind(spamWFeedButton);
    spamWFeedRow.appendChild(spamWFeedButton);
    macrosPanel.appendChild(spamWFeedRow);

    const wModeRow = createSettingRow('W Spam Mode');
    wModeRow.appendChild(createModeSwitch('spamWMode', 'Spam (W)'));
    macrosPanel.appendChild(wModeRow);

    const spamWIntervalRow = createSettingRow('W Spam Interval (ms)');
    const spamWIntervalInput = document.createElement('input');
    spamWIntervalInput.type = 'number';
    spamWIntervalInput.min = '50';
    spamWIntervalInput.step = '10';
    spamWIntervalInput.value = savedState.spamWInterval;
    Object.assign(spamWIntervalInput.style, {
        width: '90px'
    });

    spamWIntervalInput.onchange = () => {
        let val = parseInt(spamWIntervalInput.value);
        if (isNaN(val) || val < 50) val = 50;
        spamWIntervalInput.value = val;
        savedState.spamWInterval = val;
        persist();

        if (isSpammingW) {
            startSpammingW();
        }
    };

    spamWIntervalRow.appendChild(spamWIntervalInput);
    macrosPanel.appendChild(spamWIntervalRow);

    const quickRespawnRow = createSettingRow('Quick Respawn');
    const quickRespawnButton = document.createElement('button');
    Object.assign(quickRespawnButton.style, btnStyle);
    quickRespawnButton.innerText = savedState.quickRespawnKey || 'NONE';
    quickRespawnButton.onclick = () => setRespawnKeybind(quickRespawnButton);
    quickRespawnRow.appendChild(quickRespawnButton);
    macrosPanel.appendChild(quickRespawnRow);

    macrosPanel.appendChild(createSettingCategory('Quick Chat Binds'));

    const keybindBtnStyle = {
        padding: '6px 12px',
        minWidth: '60px',
        background: 'var(--accent-color)',
        color: 'white',
        border: 'none',
        textAlign: 'center',
        fontSize: '13px'
    };

    macrosPanel.appendChild(createQuickChatRow(1, keybindBtnStyle));
    macrosPanel.appendChild(createQuickChatRow(2, keybindBtnStyle));
    macrosPanel.appendChild(createQuickChatRow(3, keybindBtnStyle));
    macrosPanel.appendChild(createQuickChatRow(4, keybindBtnStyle));

    macrosPanel.appendChild(createSettingCategory('General'));

    const autoRespawnRow = createSettingRow('Auto Respawn');
    const autoRespawnSwitch = document.createElement('input');
    autoRespawnSwitch.type = 'checkbox';
    autoRespawnSwitch.checked = savedState.autoRespawnEnabled;

    autoRespawnSwitch.onchange = () => {
        savedState.autoRespawnEnabled = autoRespawnSwitch.checked;
        persist();
        showToast('Auto Respawn ' + (savedState.autoRespawnEnabled ? 'ON' : 'OFF'));
        toggleAutoRespawn(savedState.autoRespawnEnabled);
    };

    autoRespawnRow.appendChild(autoRespawnSwitch);
    macrosPanel.appendChild(autoRespawnRow);

    const sndRow = createSettingRow('Sound Effects (Menu)');
    const sndSwitch = document.createElement('input');
    sndSwitch.type = 'checkbox';
    sndSwitch.checked = savedState.soundEffects;

    sndSwitch.onchange = () => {
        savedState.soundEffects = sndSwitch.checked;
        persist();
        showToast('Sound Effects ' + (savedState.soundEffects ? 'ON' : 'OFF'));
    };

    sndRow.appendChild(sndSwitch);
    macrosPanel.appendChild(sndRow);

    const nRow = createSettingRow('Notifications');
    const nSwitch = document.createElement('input');
    nSwitch.type = 'checkbox';
    nSwitch.checked = savedState.notifications;

    nSwitch.onchange = () => {
        savedState.notifications = nSwitch.checked;
        persist();
        showToast('Notifications ' + (savedState.notifications ? 'ON' : 'OFF'));
    };

    nRow.appendChild(nSwitch);
    macrosPanel.appendChild(nRow);

    configsPanel.appendChild(createSettingCategory('RGB & Game Sync'));

    const killChainControlRow = createSettingRow('Kill Chain Control');
    const killChainControlSwitch = document.createElement('input');
    killChainControlSwitch.type = 'checkbox';
    killChainControlSwitch.checked = savedState.killChainControlEnabled;

    killChainControlSwitch.onchange = () => {
        savedState.killChainControlEnabled = killChainControlSwitch.checked;
        persist();
        showToast('Kill Chain Control ' + (savedState.killChainControlEnabled ? 'ON' : 'OFF'));

        if (savedState.killChainControlEnabled) {
            setupKillChainListener();
        }
    };

    killChainControlRow.appendChild(killChainControlSwitch);
    configsPanel.appendChild(killChainControlRow);

    configsPanel.appendChild(createSettingCategory('XelaCold Mod Menu Presets'));

    const presetButtonsContainer = document.createElement('div');
    Object.assign(presetButtonsContainer.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '10px'
    });

    const safeBtn = document.createElement('button');
    safeBtn.innerText = '🛡️ Safe Mode (70ms / 30)';
    Object.assign(safeBtn.style, {
        width: '100%',
        padding: '14px',
        fontSize: '14px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #36d1dc, #5b86e5)',
        color: 'white',
        marginBottom: '0',
        borderRadius: '10px',
        border: 'none',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(54, 209, 220, 0.3)',
        position: 'relative',
        overflow: 'hidden'
    });
    safeBtn.onmouseover = () => {
        safeBtn.style.transform = 'translateY(-3px)';
        safeBtn.style.boxShadow = '0 10px 30px rgba(54, 209, 220, 0.5)';
    };
    safeBtn.onmouseout = () => {
        safeBtn.style.transform = 'translateY(0)';
        safeBtn.style.boxShadow = '0 6px 20px rgba(54, 209, 220, 0.3)';
    };
    safeBtn.onclick = setSafeMode;
    presetButtonsContainer.appendChild(safeBtn);

    const mediumBtn = document.createElement('button');
    mediumBtn.innerText = '⚠️ Medium Risk (40ms / 100)';
    Object.assign(mediumBtn.style, {
        width: '100%',
        padding: '14px',
        fontSize: '14px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #f39c12, #e67e22)',
        color: 'white',
        marginBottom: '0',
        borderRadius: '10px',
        border: 'none',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(243, 156, 18, 0.3)',
        position: 'relative',
        overflow: 'hidden'
    });
    mediumBtn.onmouseover = () => {
        mediumBtn.style.transform = 'translateY(-3px)';
        mediumBtn.style.boxShadow = '0 10px 30px rgba(243, 156, 18, 0.5)';
    };
    mediumBtn.onmouseout = () => {
        mediumBtn.style.transform = 'translateY(0)';
        mediumBtn.style.boxShadow = '0 6px 20px rgba(243, 156, 18, 0.3)';
    };
    mediumBtn.onclick = setMediumRiskMode;
    presetButtonsContainer.appendChild(mediumBtn);

    const aggressiveBtn = document.createElement('button');
    aggressiveBtn.innerText = '🔥 Aggressive Mode (20ms / 200)';
    Object.assign(aggressiveBtn.style, {
        width: '100%',
        padding: '14px',
        fontSize: '14px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
        color: 'white',
        marginBottom: '10px',
        borderRadius: '10px',
        border: 'none',
        transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(255, 65, 108, 0.3)',
        position: 'relative',
        overflow: 'hidden'
    });
    aggressiveBtn.onmouseover = () => {
        aggressiveBtn.style.transform = 'translateY(-3px)';
        aggressiveBtn.style.boxShadow = '0 10px 30px rgba(255, 65, 108, 0.5)';
    };
    aggressiveBtn.onmouseout = () => {
        aggressiveBtn.style.transform = 'translateY(0)';
        aggressiveBtn.style.boxShadow = '0 6px 20px rgba(255, 65, 108, 0.3)';
    };
    aggressiveBtn.onclick = setAggressiveMode;
    presetButtonsContainer.appendChild(aggressiveBtn);

    configsPanel.appendChild(presetButtonsContainer);

    configsPanel.appendChild(createSettingCategory('Manage Settings'));

    const manageButtonsRow = document.createElement('div');
    Object.assign(manageButtonsRow.style, {
        display: 'flex',
        gap: '6px',
        flex: '1',
        marginTop: '8px'
    });

    const exportButton = document.createElement('button');
    exportButton.innerText = 'Export';
    Object.assign(exportButton.style, {
        flex: '1',
        padding: '8px',
        fontSize: '12px'
    });

    exportButton.onclick = () => {
        try {
            const jsonSettings = JSON.stringify(savedState);
            navigator.clipboard.writeText(jsonSettings);
            showToast('Settings copied to clipboard!');
        } catch (e) {
            showToast('Error: Could not copy settings.');
        }
    };

    manageButtonsRow.appendChild(exportButton);

    const importButton = document.createElement('button');
    importButton.innerText = 'Import';
    Object.assign(importButton.style, {
        flex: '1',
        padding: '8px',
        fontSize: '12px'
    });

    importButton.onclick = () => {
        const jsonSettings = prompt('Please paste the exported settings code here:');
        if (jsonSettings) {
            try {
                const parsed = JSON.parse(jsonSettings);
                savedState = Object.assign({}, defaultState, parsed);
                persist();
                showToast('Settings imported! Reloading page...');
                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                showToast('Error: Invalid settings code.');
            }
        }
    };

    manageButtonsRow.appendChild(importButton);

    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset';
    Object.assign(resetButton.style, {
        flex: '1',
        padding: '8px',
        background: '#e74c3c',
        color: 'white',
        fontSize: '12px'
    });

    resetButton.onclick = () => {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            showToast('Settings reset! Reloading page...');
            setTimeout(() => location.reload(), 1500);
        }
    };

    manageButtonsRow.appendChild(resetButton);
    configsPanel.appendChild(manageButtonsRow);

    sequencesPanel.appendChild(createSettingCategory('🎮 CUSTOM MACRO SEQUENCES'));

    const sequenceModeRow = createSettingRow('Current Mode');
    const sequenceModeDisplay = document.createElement('div');
    sequenceModeDisplay.style.color = 'var(--accent-color)';
    sequenceModeDisplay.style.fontWeight = 'bold';
    sequenceModeDisplay.style.fontSize = '14px';
    sequenceModeDisplay.style.padding = '8px 12px';
    sequenceModeDisplay.style.borderRadius = '8px';
    sequenceModeDisplay.style.background = 'rgba(var(--accent-color-rgb), 0.1)';
    sequenceModeDisplay.style.border = '2px solid var(--accent-color)';
    sequenceModeDisplay.style.textAlign = 'center';
    sequenceModeDisplay.style.marginTop = '5px';
    sequenceModeDisplay.style.width = '100%';

    sequenceModeDisplay.innerText = savedState.sequenceOptionMode === "A"
        ? "🔴 MODE A: Trigger runs Macro automatically"
        : "🔵 MODE B: Manual Macro (you press Macro key)";

    sequenceModeRow.appendChild(sequenceModeDisplay);
    sequencesPanel.appendChild(sequenceModeRow);

    const modeToggleRow = createSettingRow('Switch Mode');
    const modeToggleBtn = document.createElement('button');
    modeToggleBtn.innerText = savedState.sequenceOptionMode === "A" ? 'Switch to Mode B' : 'Switch to Mode A';
    Object.assign(modeToggleBtn.style, {
        padding: '8px 12px',
        background: 'var(--accent-color)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        width: '100%'
    });

    modeToggleBtn.onclick = () => {
        savedState.sequenceOptionMode = savedState.sequenceOptionMode === "A" ? "B" : "A";
        persist();
        sequenceModeDisplay.innerText = savedState.sequenceOptionMode === "A"
            ? "🔴 MODE A: Trigger runs Macro automatically"
            : "🔵 MODE B: Manual Macro (you press Macro key)";
        modeToggleBtn.innerText = savedState.sequenceOptionMode === "A" ? 'Switch to Mode B' : 'Switch to Mode A';
        updateSequenceModeIndicator();
        showToast(`Sequence Mode switched to ${savedState.sequenceOptionMode}`);
    };

    modeToggleRow.appendChild(modeToggleBtn);
    sequencesPanel.appendChild(modeToggleRow);

    sequencesPanel.appendChild(createSettingCategory('Main Sequence'));

    const sequenceSelectLabel = document.createElement('div');
    sequenceSelectLabel.innerText = 'Select Main Sequence:';
    sequenceSelectLabel.style.color = 'var(--text-primary)';
    sequenceSelectLabel.style.fontSize = '14px';
    sequenceSelectLabel.style.marginTop = '10px';
    sequenceSelectLabel.style.marginBottom = '5px';
    sequencesPanel.appendChild(sequenceSelectLabel);

    const sequenceSelect = document.createElement('select');
    sequenceSelect.style.width = '100%';
    sequenceSelect.style.marginBottom = '10px';
    sequenceSelect.style.color = 'var(--text-primary) !important';

    savedState.sequencePresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset;
        option.textContent = preset;
        option.style.color = 'var(--text-primary)';
        option.style.background = 'var(--bg-primary)';
        if (preset === savedState.selectedSequence) option.selected = true;
        sequenceSelect.appendChild(option);
    });

    sequenceSelect.onchange = () => {
        savedState.selectedSequence = sequenceSelect.value;
        persist();
        showToast(`Main sequence set to: ${sequenceSelect.value}`);
    };

    sequencesPanel.appendChild(sequenceSelect);

    sequencesPanel.appendChild(createSettingCategory('Pre-Split Sequences'));

    const preSequenceSelectLabel = document.createElement('div');
    preSequenceSelectLabel.innerText = 'Select Pre-Split Sequence:';
    preSequenceSelectLabel.style.color = 'var(--text-primary)';
    preSequenceSelectLabel.style.fontSize = '14px';
    preSequenceSelectLabel.style.marginTop = '10px';
    preSequenceSelectLabel.style.marginBottom = '5px';
    sequencesPanel.appendChild(preSequenceSelectLabel);

    const preSequenceSelect = document.createElement('select');
    preSequenceSelect.style.width = '100%';
    preSequenceSelect.style.marginBottom = '10px';
    preSequenceSelect.style.color = 'var(--text-primary) !important';

    savedState.preSequencePresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset;
        option.textContent = preset;
        option.style.color = 'var(--text-primary)';
        option.style.background = 'var(--bg-primary)';
        if (preset === savedState.selectedPreSequence) option.selected = true;
        preSequenceSelect.appendChild(option);
    });

    preSequenceSelect.onchange = () => {
        savedState.selectedPreSequence = preSequenceSelect.value;
        persist();
        showToast(`Pre-split sequence set to: ${preSequenceSelect.value}`);
    };

    sequencesPanel.appendChild(preSequenceSelect);

    sequencesPanel.appendChild(createSettingCategory('🎯 Key Bindings'));

    const sequenceKeybinds = setupSequenceKeybindListeners();

    const seqMacroKeyRow = createSettingRow('Macro Key');
    const seqMacroKeyBtn = document.createElement('button');
    Object.assign(seqMacroKeyBtn.style, keybindBtnStyle);
    seqMacroKeyBtn.innerText = savedState.sequenceMacroKey || 'E';
    seqMacroKeyBtn.onclick = () => sequenceKeybinds.setSequenceMacroKeybind(seqMacroKeyBtn);
    seqMacroKeyRow.appendChild(seqMacroKeyBtn);
    sequencesPanel.appendChild(seqMacroKeyRow);

    const seqSplitKeyRow = createSettingRow('Split Key');
    const seqSplitKeyBtn = document.createElement('button');
    Object.assign(seqSplitKeyBtn.style, keybindBtnStyle);
    seqSplitKeyBtn.innerText = savedState.sequenceSplitKey === "SPACE" ? "SPACE" : (savedState.sequenceSplitKey || "SPACE");
    seqSplitKeyBtn.onclick = () => sequenceKeybinds.setSequenceSplitKeybind(seqSplitKeyBtn);
    seqSplitKeyRow.appendChild(seqSplitKeyBtn);
    sequencesPanel.appendChild(seqSplitKeyRow);

    const seqDoubleSplitKeyRow = createSettingRow('Double Split Key');
    const seqDoubleSplitKeyBtn = document.createElement('button');
    Object.assign(seqDoubleSplitKeyBtn.style, keybindBtnStyle);
    seqDoubleSplitKeyBtn.innerText = savedState.sequenceDoubleSplitKey || 'D';
    seqDoubleSplitKeyBtn.onclick = () => sequenceKeybinds.setSequenceDoubleSplitKeybind(seqDoubleSplitKeyBtn);
    seqDoubleSplitKeyRow.appendChild(seqDoubleSplitKeyBtn);
    sequencesPanel.appendChild(seqDoubleSplitKeyRow);

    const seqQuadSplitKeyRow = createSettingRow('Quad Split Key');
    const seqQuadSplitKeyBtn = document.createElement('button');
    Object.assign(seqQuadSplitKeyBtn.style, keybindBtnStyle);
    seqQuadSplitKeyBtn.innerText = savedState.sequenceQuadSplitKey || 'F';
    seqQuadSplitKeyBtn.onclick = () => sequenceKeybinds.setSequenceQuadSplitKeybind(seqQuadSplitKeyBtn);
    seqQuadSplitKeyRow.appendChild(seqQuadSplitKeyBtn);
    sequencesPanel.appendChild(seqQuadSplitKeyRow);

    const seqTriggerKeyRow = createSettingRow('Trigger Main Sequence');
    const seqTriggerKeyBtn = document.createElement('button');
    Object.assign(seqTriggerKeyBtn.style, keybindBtnStyle);
    seqTriggerKeyBtn.innerText = savedState.sequenceTriggerKey || 'F';
    seqTriggerKeyBtn.onclick = () => sequenceKeybinds.setSequenceTriggerKeybind(seqTriggerKeyBtn);
    seqTriggerKeyRow.appendChild(seqTriggerKeyBtn);
    sequencesPanel.appendChild(seqTriggerKeyRow);

    const seqModeToggleKeyRow = createSettingRow('Mode Toggle Key');
    const seqModeToggleKeyBtn = document.createElement('button');
    Object.assign(seqModeToggleKeyBtn.style, keybindBtnStyle);
    seqModeToggleKeyBtn.innerText = savedState.sequenceModeToggleKey || 'G';
    seqModeToggleKeyBtn.onclick = () => sequenceKeybinds.setSequenceModeToggleKeybind(seqModeToggleKeyBtn);
    seqModeToggleKeyRow.appendChild(seqModeToggleKeyBtn);
    sequencesPanel.appendChild(seqModeToggleKeyRow);

    const preSeqTriggerKeyRow = createSettingRow('Trigger Pre-Split');
    const preSeqTriggerKeyBtn = document.createElement('button');
    Object.assign(preSeqTriggerKeyBtn.style, keybindBtnStyle);
    preSeqTriggerKeyBtn.innerText = savedState.sequencePreSplitTriggerKey || 'P';
    preSeqTriggerKeyBtn.onclick = () => sequenceKeybinds.setSequencePreSplitKeybind(preSeqTriggerKeyBtn);
    preSeqTriggerKeyRow.appendChild(preSeqTriggerKeyBtn);
    sequencesPanel.appendChild(preSeqTriggerKeyRow);

    sequencesPanel.appendChild(createSettingCategory('⚙️ Sequence Settings'));

    const macroDelayRow = createSettingRow('Sequence Delay (ms)');
    const macroDelayInput = document.createElement('input');
    macroDelayInput.type = 'number';
    macroDelayInput.min = '0';               // 🔁 CHANGED: was '50'
    macroDelayInput.max = '2000';
    macroDelayInput.step = '1';              // 🔁 CHANGED: was '10' (optional)
    macroDelayInput.value = savedState.sequenceMacroDelay;
    Object.assign(macroDelayInput.style, {
        width: '100px',
        color: 'var(--text-primary)',
        background: 'var(--bg-input)'
    });

    macroDelayInput.onchange = () => {
        let val = parseInt(macroDelayInput.value);
        if (isNaN(val) || val < 0) val = 0;   // 🔁 CHANGED: was '< 50'
        if (val > 2000) val = 2000;
        macroDelayInput.value = val;
        savedState.sequenceMacroDelay = val;
        persist();
        showToast(`Sequence delay set to ${val}ms`);
    };

    macroDelayRow.appendChild(macroDelayInput);
    sequencesPanel.appendChild(macroDelayRow);

    sequencesPanel.appendChild(createSettingCategory('📖 How to Use'));

    const sequenceInfo = document.createElement('div');
    Object.assign(sequenceInfo.style, {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '10px',
        padding: '10px',
        border: '1px solid var(--border-secondary)',
        borderRadius: '8px',
        background: 'rgba(0,0,0,0.1)',
        lineHeight: '1.5'
    });
    sequenceInfo.innerHTML = `
        <strong style="color: var(--accent-color); display: block; margin-bottom: 8px;">🎮 SEQUENCE CONTROLS:</strong>
        • <strong style="color: var(--text-primary);">${savedState.sequenceTriggerKey || 'F'}</strong> - Trigger main sequence<br>
        • <strong style="color: var(--text-primary);">${savedState.sequencePreSplitTriggerKey || 'P'}</strong> - Trigger pre-split sequence<br>
        • <strong style="color: var(--text-primary);">${savedState.sequenceModeToggleKey || 'G'}</strong> - Toggle Mode A/B<br><br>
        
        <strong style="color: var(--accent-color); display: block; margin-bottom: 8px;">📖 MODE EXPLANATION:</strong>
        • <strong style="color: #ff6b6b;">🔴 MODE A:</strong> Trigger key runs Macro automatically<br>
        • <strong style="color: #4dabf7;">🔵 MODE B:</strong> Manual Macro control (you press Macro key)<br><br>
        
        <strong style="color: var(--accent-color); display: block; margin-bottom: 8px;">⚠️ IMPORTANT NOTES:</strong>
        • Sequences ignore chat input (won't trigger while typing)<br>
        • Pre-split sequences use Line Lock (Shift) automatically<br>
        • All settings are saved automatically
    `;
    sequencesPanel.appendChild(sequenceInfo);

    uiContent.appendChild(mainPanel);
    uiContent.appendChild(macrosPanel);
    uiContent.appendChild(configsPanel);
    uiContent.appendChild(sequencesPanel);
    ui.appendChild(uiContent);

    const uiFooter = document.createElement('div');
    Object.assign(uiFooter.style, {
        padding: '12px 15px',
        borderTop: '2px solid var(--border-secondary)',
        marginTop: 'auto',
        background: 'linear-gradient(180deg, transparent, rgba(var(--accent-color-rgb), 0.05))'
    });

    const footerText = document.createElement('div');
    Object.assign(footerText.style, {
        fontSize: '11px',
        opacity: '0.75',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontWeight: '400',
        letterSpacing: '0.5px'
    });

    footerText.innerText = '⌨️ Shift + Alt + T to toggle UI • v2.0.0 Professional Edition with Sequences';
    uiFooter.appendChild(footerText);
    ui.appendChild(uiFooter);

    function setCollapseState(isCollapsed) {
        savedState.collapsed = isCollapsed;
        persist();
        playClick();

        if (isCollapsed) {
            Array.from(uiHeader.children).forEach(child => {
                if (child !== logo) child.style.display = 'none';
            });

            uiContent.style.display = 'none';
            uiFooter.style.display = 'none';

            Object.assign(logo.style, {
                width: '50px',
                height: '50px',
                margin: '0',
                cursor: 'pointer',
                border: '2px solid var(--accent-color)',
                boxShadow: '0 0 15px var(--accent-color), 0 0 30px rgba(var(--accent-color-rgb), 0.5)'
            });

            Object.assign(ui.style, {
                padding: '10px',
                width: 'auto',
                background: 'var(--bg-primary)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                maxHeight: 'none'
            });

            collapseBtn.style.display = 'none';
        } else {
            Array.from(uiHeader.children).forEach(child => {
                child.style.display = '';
            });

            uiContent.style.display = 'flex';
            uiFooter.style.display = 'block';

            Object.assign(logo.style, {
                width: '100px',
                height: '100px',
                margin: '4px auto',
                cursor: '',
                border: '2px solid var(--border-secondary)',
                boxShadow: 'none'
            });

            Object.assign(ui.style, {
                padding: '0',
                width: savedState.menuWidth + 'px',
                background: 'var(--bg-primary)',
                boxShadow: '0 10px 50px rgba(0,0,0,0.5)',
                maxHeight: 'calc(90vh - 40px)'
            });

            collapseBtn.style.display = 'block';
        }
    }

    logo.onclick = () => {
        if (savedState.collapsed) setCollapseState(false);
    };

    logo.onmouseover = () => {
        logo.style.transform = 'scale(1.05)';
        logo.style.boxShadow = '0 0 30px rgba(var(--accent-color-rgb), 0.4)';
    };

    logo.onmouseout = () => {
        logo.style.transform = 'scale(1)';
        logo.style.boxShadow = savedState.collapsed ? '0 0 15px var(--accent-color), 0 0 30px rgba(var(--accent-color-rgb), 0.5)' : '0 0 20px rgba(var(--accent-color-rgb), 0.2)';
    };

    collapseBtn.onclick = () => setCollapseState(true);

    (function makeDraggable(node) {
        let isDown = false, offsetX = 0, offsetY = 0;

        node.addEventListener('mousedown', e => {
            // Allow dragging even if collapsed, but check if we're clicking the logo or header
            if (e.target.closest('button, input, select, a') ||
                e.target === uiContent ||
                (uiContent.contains(e.target) && uiContent.scrollHeight > uiContent.clientHeight &&
                    e.offsetX > uiContent.clientWidth)) {
                return;
            }

            isDown = true;
            node.style.cursor = 'grabbing';
            offsetX = e.clientX - node.getBoundingClientRect().left;
            offsetY = e.clientY - node.getBoundingClientRect().top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (!isDown) return;

            const left = Math.max(6, Math.min(window.innerWidth - node.offsetWidth - 6, e.clientX - offsetX));
            const top = Math.max(6, Math.min(window.innerHeight - node.offsetHeight - 6, e.clientY - offsetY));

            node.style.left = left + 'px';
            node.style.top = top + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDown) return;

            isDown = false;
            node.style.cursor = 'grab';

            if (!savedState.collapsed) {
                savedState.left = parseInt(ui.style.left || 0);
                savedState.top = parseInt(ui.style.top || 0);
                persist();
            }
        });
    })(ui);

    let uiVisible = true;

    document.addEventListener('keydown', e => {
        if (isWaitingForKeybind || isChatActive()) return;

        if (e.shiftKey && e.altKey && (e.code === 'KeyT' || e.key.toUpperCase() === 'T')) {
            e.preventDefault();
            e.stopPropagation();

            uiVisible = !uiVisible;

            if (uiVisible) {
                ui.style.display = 'flex';
                if (sequenceModeIndicator) sequenceModeIndicator.style.display = 'block';
                originalUIRAF(() => {
                    ui.style.opacity = (savedState.uiOpacity / 100);
                    ui.style.transform = 'translateY(0)';
                });
            } else {
                ui.style.opacity = '0';
                ui.style.transform = 'translateY(-12px)';
                if (sequenceModeIndicator) sequenceModeIndicator.style.display = 'none';
                setTimeout(() => {
                    if (!uiVisible) ui.style.display = 'none';
                }, 400);
            }

            playClick();
            return;
        }

        let pressedKey = e.key ? e.key.toUpperCase() : '';
        if (pressedKey === ' ') pressedKey = 'SPACE';
        if (e.code && e.code.startsWith('F') && e.keyCode >= 112 && e.keyCode <= 123) {
            pressedKey = e.code;
        }

        for (let i = 1; i <= 4; i++) {
            if (savedState[`quickChatKey${i}`] && pressedKey === savedState[`quickChatKey${i}`]) {
                e.preventDefault();
                e.stopPropagation();
                sendChatMessage(savedState[`quickChat${i}`]);
                return;
            }
        }

        if (savedState.quickRespawnKey && pressedKey === savedState.quickRespawnKey) {
            e.preventDefault();
            e.stopPropagation();
            triggerQuickRespawn(true);
            return;
        }

        if (savedState.spamFastFeedKey && pressedKey === savedState.spamFastFeedKey) {
            e.preventDefault();
            e.stopPropagation();

            if (savedState.spamFastFeedMode === 'hold') {
                if (isSpammingFastFeed) return;
                startSpamming();
            } else {
                if (isSpammingFastFeed) {
                    stopSpamming();
                } else {
                    startSpamming();
                }
            }
            return;
        }

        if (savedState.quadFeedKey && pressedKey === savedState.quadFeedKey) {
            e.preventDefault();
            e.stopPropagation();

            if (savedState.spamQuadFeedMode === 'hold') {
                if (isSpammingQuadFeed) return;
                startSpammingQuad();
            } else {
                if (isSpammingQuadFeed) {
                    stopSpammingQuad();
                } else {
                    startSpammingQuad();
                }
            }
            return;
        }

        if (savedState.spamWKey && pressedKey === savedState.spamWKey) {
            e.preventDefault();
            e.stopPropagation();

            if (savedState.spamWMode === 'hold') {
                if (isSpammingW) return;
                startSpammingW();
            } else {
                if (isSpammingW) {
                    stopSpammingW();
                } else {
                    startSpammingW();
                }
            }
            return;
        }

        if (savedState.comboFastFeedKey && pressedKey === savedState.comboFastFeedKey) {
            e.preventDefault();
            e.stopPropagation();
            doComboFastFeed();
        }
    });

    document.addEventListener('keyup', e => {
        if (isWaitingForKeybind || isChatActive()) return;

        let pressedKey = e.key ? e.key.toUpperCase() : '';
        if (pressedKey === ' ') pressedKey = 'SPACE';
        if (e.code && e.code.startsWith('F') && e.keyCode >= 112 && e.keyCode <= 123) {
            pressedKey = e.code;
        }

        if (savedState.spamFastFeedKey && pressedKey === savedState.spamFastFeedKey) {
            if (savedState.spamFastFeedMode === 'hold') {
                e.preventDefault();
                e.stopPropagation();
                stopSpamming();
            }
        }

        if (savedState.quadFeedKey && pressedKey === savedState.quadFeedKey) {
            if (savedState.spamQuadFeedMode === 'hold') {
                e.preventDefault();
                e.stopPropagation();
                stopSpammingQuad();
            }
        }

        if (savedState.spamWKey && pressedKey === savedState.spamWKey) {
            if (savedState.spamWMode === 'hold') {
                e.preventDefault();
                e.stopPropagation();
                stopSpammingW();
            }
        }
    });

    document.addEventListener('mousedown', e => {
        if (e.button !== 0 || !savedState.leftClickMacroEnabled) return;
        if (isChatActive()) return;
        if (ui.contains(e.target)) return;

        e.preventDefault();
        e.stopPropagation();
        doComboFastFeed();
    }, true);

    document.body.appendChild(ui);

    setGameQuality(savedState.qualityPercent, false);
    initializeMacroStatusUI();
    toggleAutoRespawn(savedState.autoRespawnEnabled);

    if (savedState.customBackgroundUrl) {
        applyCustomBackground(savedState.customBackgroundUrl, false);
    }

    if (savedState.collapsed) {
        setCollapseState(true);
    }

    if (savedState.killChainControlEnabled) {
        setupKillChainListener();
    }

    if (savedState.smartRGBGameColors && savedState.rgbModeEnabled) {
        updateGameColorsWithRGB(savedState.accentColor);
    }

    setupChatInputListener();
    createSequenceModeIndicator();
    handleSequenceKeyEvents();

    (function addDiscordProfileButton() {
        const DISCORD_NAME = '_jack0n';
        const DISCORD_PROFILE = 'https://discord.com/users/_jack0n';
        const BUTTON_ID = 'jackon-discord-btn';

        function createButton() {
            const btn = document.createElement('button');
            btn.id = BUTTON_ID;
            btn.className = 'btn side-btn';
            btn.type = 'button';
            btn.title = `Join Discord: ${DISCORD_NAME}`;

            const imgSrc = 'https://raw.githubusercontent.com/Jackon0234/Assest/main/dc2.png';

            let ref = document.querySelector('#clan-btn');
            if (!ref) ref = document.querySelector('.btn.side-btn');

            let refW = 72, refH = 72, refBR = '12px';
            try {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    if (rect.width && rect.height) {
                        refW = Math.round(rect.width);
                        refH = Math.round(rect.height);
                    }
                    const cs = window.getComputedStyle(ref);
                    if (cs && cs.borderRadius) refBR = cs.borderRadius;
                }
            } catch (e) {
            }

            Object.assign(btn.style, {
                display: 'inline-block',
                width: refW + 'px',
                height: refH + 'px',
                padding: '0',
                margin: '0 6px 0 2px',
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                borderRadius: refBR,
                overflow: 'hidden',
                cursor: 'pointer'
            });

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = 'Discord';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            btn.appendChild(img);

            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                window.open(DISCORD_PROFILE, '_blank');
                if (typeof showToast === 'function') showToast(`Opening Discord profile: ${DISCORD_NAME}`);
            });

            return btn;
        }

        function tryInsert() {
            const clanBtn = document.querySelector('#clan-btn');
            if (!clanBtn) return false;
            if (document.getElementById(BUTTON_ID)) return true;

            const btn = createButton();
            clanBtn.insertAdjacentElement('afterend', btn);
            return true;
        }

        if (!tryInsert()) {
            const mo = new MutationObserver((mutations, observer) => {
                if (tryInsert()) {
                    observer.disconnect();
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }
    })();

    showToast('🎮 Jackon Mod v2.0.0 loaded with Advanced Sequences!');

})();