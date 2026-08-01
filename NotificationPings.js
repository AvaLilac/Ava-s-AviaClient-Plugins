/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/NotificationPings.js
  @VERSION: 1.2
*/

(function() {
    if (window.__AVIA_NOTI_SOUNDS__) return;
    window.__AVIA_NOTI_SOUNDS__ = true;

    const targetNode = document.documentElement;
    const config = { childList: true, subtree: true };

    const STORAGE_KEY = "avia_custom_sounds";

    const SOUND_DEFS = [
        { key: "message", label: "Message Received", pattern: /\/assets\/message_sound-2-?[^/]*\.ogg(\?.*)?$/i },
        { key: "mute", label: "Mute", pattern: /\/assets\/mute-[^/]*\.ogg(\?.*)?$/i },
        { key: "unmute", label: "Unmute", pattern: /\/assets\/unmute-[^/]*\.ogg(\?.*)?$/i },
        { key: "deafen", label: "Deafen", pattern: /\/assets\/deafen-[^/]*\.ogg(\?.*)?$/i },
        { key: "undeafen", label: "Undeafen", pattern: /\/assets\/undeafen-[^/]*\.ogg(\?.*)?$/i },
        { key: "user_join_voice", label: "User Join Voice", pattern: /\/assets\/user_join_voice-[^/]*\.ogg(\?.*)?$/i },
        { key: "user_leave_voice", label: "User Leave Voice", pattern: /\/assets\/user_leave_voice-[^/]*\.ogg(\?.*)?$/i },
        { key: "stream_start", label: "Stream Start", pattern: /\/assets\/stream_start-[^/]*\.ogg(\?.*)?$/i },
        { key: "stream_end", label: "Stream End", pattern: /\/assets\/stream_end-[^/]*\.ogg(\?.*)?$/i }
    ];

    function getSoundData() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
        catch { return {}; }
    }
    function setSoundData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    function getSoundEntry(key) {
        const data = getSoundData();
        return data[key] || null;
    }
    function setSoundEntry(key, dataUrl, name) {
        const data = getSoundData();
        data[key] = { dataUrl, name };
        setSoundData(data);
    }
    function removeSoundEntry(key) {
        const data = getSoundData();
        delete data[key];
        setSoundData(data);
    }
    function getVolume() {
        const data = getSoundData();
        return typeof data.volume === 'number' ? data.volume : 1;
    }
    function setVolume(v) {
        const data = getSoundData();
        data.volume = v;
        setSoundData(data);
    }
    function getPerceptualVolume() {
        const v = Math.max(0, Math.min(1, getVolume()));
        if (v <= 0) return 0;
        const floor = 0.02;
        return floor + (1 - floor) * Math.pow(v, 1.662);
    }

    function playNotiSound() {
        const entry = getSoundEntry("message");
        if (!entry) return;
        const audio = new Audio(entry.dataUrl);
        audio.volume = getPerceptualVolume();
        audio.play().catch(e => console.warn('Avia: audio play failed', e));
    }

    if (!window.__AVIA_NOTI_HOOKED__) {
        window.__AVIA_NOTI_HOOKED__ = true;
        const _OriginalNotification = window.Notification;

        function PatchedNotification(title, options) {
            playNotiSound();
            return new _OriginalNotification(title, options);
        }
        PatchedNotification.prototype = _OriginalNotification.prototype;
        PatchedNotification.requestPermission = _OriginalNotification.requestPermission.bind(_OriginalNotification);
        Object.defineProperty(PatchedNotification, 'permission', {
            get: () => _OriginalNotification.permission
        });

        window.Notification = PatchedNotification;
        console.log("Avia: Notification constructor hooked");
    }

    function resolveAudioSrc(url) {
        if (typeof url !== 'string') return url;
        for (const def of SOUND_DEFS) {
            if (def.pattern.test(url)) {
                const entry = getSoundEntry(def.key);
                if (entry) return entry.dataUrl;
                return url;
            }
        }
        return url;
    }

    if (!window.__AVIA_SOUND_AUDIO_HOOKED__) {
        window.__AVIA_SOUND_AUDIO_HOOKED__ = true;

        const _OriginalAudio = window.Audio;
        function PatchedAudio(src) {
            const resolved = resolveAudioSrc(src);
            const audio = new _OriginalAudio(resolved);
            audio.volume = getPerceptualVolume();
            return audio;
        }
        PatchedAudio.prototype = _OriginalAudio.prototype;
        window.Audio = PatchedAudio;

        const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
        if (srcDescriptor && srcDescriptor.set) {
            Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                get: srcDescriptor.get,
                set: function (value) {
                    srcDescriptor.set.call(this, resolveAudioSrc(value));
                    try { this.volume = getPerceptualVolume(); } catch (_) {}
                },
                configurable: true
            });
        }

        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (name, value) {
            if (this instanceof HTMLMediaElement && name === 'src') {
                value = resolveAudioSrc(value);
                originalSetAttribute.call(this, name, value);
                try { this.volume = getPerceptualVolume(); } catch (_) {}
                return;
            }
            return originalSetAttribute.call(this, name, value);
        };
    }

    let myId = null;
    const channelMap = {};

    function getCurrentChannelId() {
        const activeChat = document.querySelector('[data-testid="channel-view"]');
        return activeChat ? activeChat.getAttribute("data-channel") : null;
    }

    function handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "Ready") {
                myId = data.users?.find(u => u.relationship === "User")?._id || data.user_id;
                if (Array.isArray(data.channels)) {
                    data.channels.forEach(c => { channelMap[c._id] = c.channel_type; });
                }
            }
            if (data.type === "ChannelCreate") channelMap[data.channel._id] = data.channel.channel_type;
            if (data.type === "ChannelUpdate") channelMap[data.channel._id] = data.channel.channel_type;
        } catch (_) {}
    }

    window.__AVIA_WS_ORIGINAL__ = window.WebSocket;
    window.WebSocket = function(...args) {
        const socket = new window.__AVIA_WS_ORIGINAL__(...args);
        socket.addEventListener("message", handleMessage);
        console.log("Avia: hooked WebSocket", args[0]);
        return socket;
    };
    window.WebSocket.prototype = window.__AVIA_WS_ORIGINAL__.prototype;
    console.log("Avia: WebSocket wrapped, waiting for next connection...");

    function setIcon(button) {
        const oldSvg = button.querySelector('svg');
        if (oldSvg) oldSvg.remove();
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('fill', 'currentColor');
        svg.style.marginRight = '8px';
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6');
        svg.appendChild(path);
        button.insertBefore(svg, button.firstChild);
    }

    function buildSoundRow(def, refreshAll) {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            flex: '1 1 0',
            minWidth: '0',
            boxSizing: 'border-box'
        });

        const labelWrap = document.createElement('div');
        Object.assign(labelWrap.style, { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0', flex: '1' });

        const label = document.createElement('div');
        label.textContent = def.label;
        Object.assign(label.style, { fontSize: '0.85rem', fontWeight: '600', color: 'var(--md-sys-color-on-surface, #fff)' });

        const statusLine = document.createElement('div');
        Object.assign(statusLine.style, {
            fontSize: '0.7rem',
            opacity: '0.45',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        });

        function refreshStatus() {
            const entry = getSoundEntry(def.key);
            statusLine.textContent = entry ? entry.name : 'Using default sound';
        }
        refreshStatus();

        labelWrap.appendChild(label);
        labelWrap.appendChild(statusLine);

        const btnGroup = document.createElement('div');
        Object.assign(btnGroup.style, { display: 'flex', gap: '6px', flexShrink: '0', flexWrap: 'wrap', width: '100%' });

        const importBtn = document.createElement('button');
        importBtn.className = 'avia-sound-action-btn';
        importBtn.textContent = 'Import';
        Object.assign(importBtn.style, {
            background: 'var(--md-sys-color-primary, rgba(103,80,164,0.9))',
            color: '#fff',
            flex: '1',
            minWidth: '0'
        });

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ogg,audio/ogg';
        fileInput.style.display = 'none';

        importBtn.onclick = () => fileInput.click();

        fileInput.onchange = () => {
            const f = fileInput.files[0];
            if (!f) return;
            if (!f.name.toLowerCase().endsWith('.ogg')) {
                fileInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setSoundEntry(def.key, reader.result, f.name);
                refreshStatus();
                fileInput.value = '';
            };
            reader.readAsDataURL(f);
        };

        const testBtn = document.createElement('button');
        testBtn.className = 'avia-sound-action-btn avia-sound-icon-btn';
        Object.assign(testBtn.style, {
            color: 'var(--md-sys-color-primary, #cfbcff)',
            background: 'transparent'
        });
        const testIcon = document.createElement('span');
        testIcon.className = 'material-symbols-outlined';
        testIcon.textContent = 'volume_up';
        testIcon.style.cssText = "font-size:18px;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;";
        testBtn.appendChild(testIcon);
        testBtn.onclick = () => {
            const entry = getSoundEntry(def.key);
            if (!entry) return;
            const audio = new Audio(entry.dataUrl);
            audio.volume = getPerceptualVolume();
            audio.play();
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'avia-sound-action-btn avia-sound-icon-btn';
        removeBtn.textContent = '✕';
        Object.assign(removeBtn.style, {
            color: 'var(--md-sys-color-error, #f2b8b8)',
            background: 'transparent'
        });
        removeBtn.onclick = () => {
            removeSoundEntry(def.key);
            refreshStatus();
        };

        btnGroup.appendChild(testBtn);
        btnGroup.appendChild(importBtn);
        btnGroup.appendChild(removeBtn);
        btnGroup.appendChild(fileInput);

        row.appendChild(labelWrap);
        row.appendChild(btnGroup);

        return row;
    }

    let __aviaSoundsModalOpening = false;

    function showSoundsModal() {
        if (document.getElementById('avia-sounds-modal-scrim')) return;
        if (__aviaSoundsModalOpening) return;
        __aviaSoundsModalOpening = true;
        setTimeout(() => { __aviaSoundsModalOpening = false; }, 250);

        const styleEl = document.createElement('style');
        styleEl.id = 'avia-sounds-modal-styles';
        styleEl.textContent = `
            @keyframes avia-sounds-scrim-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes avia-sounds-modal-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            #avia-sounds-modal-inner { animation: avia-sounds-modal-in 0.15s forwards; }
            .avia-sound-action-btn {
                height: 32px;
                border-radius: 999px;
                border: none;
                padding: 0 12px;
                font-size: 0.75rem;
                font-weight: 500;
                letter-spacing: 0.015625rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.15s;
                font-family: inherit;
            }
            .avia-sound-action-btn:hover { opacity: 0.8; }
            .avia-sound-icon-btn { width: 32px; padding: 0; font-size: 0.85rem; }
            #avia-sounds-list::-webkit-scrollbar { display: none; }
            .avia-volume-slider {
                -webkit-appearance: none;
                appearance: none;
                width: 96px;
                height: 20px;
                background: transparent;
                cursor: pointer;
                flex-shrink: 0;
            }
            .avia-volume-slider::-webkit-slider-runnable-track {
                height: 4px;
                border-radius: 999px;
                background: rgba(255,255,255,0.16);
            }
            .avia-volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                margin-top: -5px;
                border-radius: 50%;
                background: var(--md-sys-color-primary, #cfbcff);
                border: none;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .avia-volume-slider::-moz-range-track {
                height: 4px;
                border-radius: 999px;
                background: rgba(255,255,255,0.16);
            }
            .avia-volume-slider::-moz-range-progress {
                height: 4px;
                border-radius: 999px;
                background: var(--md-sys-color-primary, #cfbcff);
            }
            .avia-volume-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--md-sys-color-primary, #cfbcff);
                border: none;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            .avia-volume-pct {
                font-size: 0.75rem;
                font-variant-numeric: tabular-nums;
                color: rgba(255,255,255,0.6);
                min-width: 30px;
                text-align: right;
                flex-shrink: 0;
                cursor: default;
            }
        `;
        document.head.appendChild(styleEl);

        const scrim = document.createElement('div');
        scrim.id = 'avia-sounds-modal-scrim';
        Object.assign(scrim.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            zIndex: '999999',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: '80px',
            overflowY: 'auto',
            animation: 'avia-sounds-scrim-in 0.1s forwards',
            boxSizing: 'border-box'
        });

        let scrimClickArmed = false;
        setTimeout(() => { scrimClickArmed = true; }, 50);

        scrim.addEventListener('click', e => {
            if (!scrimClickArmed) return;
            if (e.target === scrim) {
                scrim.remove();
                styleEl.remove();
            }
        });

        const modal = document.createElement('div');
        modal.id = 'avia-sounds-modal-inner';
        Object.assign(modal.style, {
            padding: '24px',
            minWidth: '340px',
            maxWidth: '560px',
            width: '100%',
            borderRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--md-sys-color-on-surface, #fff)',
            background: 'var(--md-sys-color-surface-container-high, #2b2b2f)',
            boxSizing: 'border-box'
        });

        const title = document.createElement('span');
        title.textContent = 'Notification Sounds';
        Object.assign(title.style, {
            lineHeight: '2rem',
            fontSize: '1.5rem',
            letterSpacing: '0',
            fontWeight: '400',
            marginBottom: '6px'
        });
        modal.appendChild(title);

        const subtitle = document.createElement('div');
        subtitle.textContent = 'Only .ogg files are supported';
        Object.assign(subtitle.style, {
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '18px'
        });
        modal.appendChild(subtitle);

        const list = document.createElement('div');
        list.id = 'avia-sounds-list';
        Object.assign(list.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '20px'
        });

        const GROUP_SIZE = 3;
        for (let i = 0; i < SOUND_DEFS.length; i += GROUP_SIZE) {
            const group = SOUND_DEFS.slice(i, i + GROUP_SIZE);
            const groupRow = document.createElement('div');
            Object.assign(groupRow.style, {
                display: 'flex',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box'
            });
            group.forEach(def => {
                groupRow.appendChild(buildSoundRow(def));
            });
            list.appendChild(groupRow);
        }

        modal.appendChild(list);

        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '4px'
        });

        const volumeWrap = document.createElement('div');
        Object.assign(volumeWrap.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: '0'
        });

        const volumeIcon = document.createElement('span');
        volumeIcon.className = 'material-symbols-outlined';
        volumeIcon.textContent = 'volume_up';
        volumeIcon.style.cssText = "font-size:20px;color:rgba(255,255,255,0.6);flex-shrink:0;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;";

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        const initialVolPct = Math.round(getVolume() * 100);
        volumeSlider.value = String(initialVolPct);
        volumeSlider.className = 'avia-volume-slider';
        volumeSlider.title = initialVolPct + '%';

        const volumePct = document.createElement('span');
        volumePct.className = 'avia-volume-pct';
        volumePct.textContent = initialVolPct + '%';
        volumePct.title = 'Notification sound volume';

        volumeSlider.addEventListener('input', () => {
            const v = Number(volumeSlider.value);
            setVolume(v / 100);
            volumePct.textContent = v + '%';
            volumeSlider.title = v + '%';
        });

        volumeWrap.appendChild(volumeIcon);
        volumeWrap.appendChild(volumeSlider);
        volumeWrap.appendChild(volumePct);
        btnRow.appendChild(volumeWrap);

        const closeModalBtn = document.createElement('button');
        closeModalBtn.textContent = 'Close';
        Object.assign(closeModalBtn.style, {
            height: '40px',
            borderRadius: '999px',
            border: 'none',
            padding: '0 16px',
            fontSize: '0.875rem',
            fontWeight: '500',
            letterSpacing: '0.015625rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            color: 'var(--md-sys-color-primary, #cfbcff)',
            background: 'transparent'
        });
        closeModalBtn.onmouseenter = () => closeModalBtn.style.opacity = '0.8';
        closeModalBtn.onmouseleave = () => closeModalBtn.style.opacity = '1';
        closeModalBtn.addEventListener('click', () => { scrim.remove(); styleEl.remove(); });

        btnRow.appendChild(closeModalBtn);
        modal.appendChild(btnRow);

        scrim.appendChild(modal);
        document.body.appendChild(scrim);
    }

    function injectSettingsButton() {
        if (document.getElementById('avia-noti-sounds-btn')) return;

        const appearanceBtn = [...document.querySelectorAll(
                `.settings_sidebar .content a.button:not(
                    [id^='avia-']
                ):not(
                    [id^='stoat-fake-']
                ):has(
                    > div
                    > svg
                    > path[d^='M12 22C6.49 22']
                )`
            )].find((a) => {
                const label = a.querySelector('div > svg + div > div');
                if (label.textContent === "Appearance") return a;
            });
        if (!appearanceBtn) return;

        const aviaPluginsBtn = document.getElementById('stoat-fake-plugins');
        if (!aviaPluginsBtn) return;

        const btn = appearanceBtn.cloneNode(true);
        btn.id = 'avia-noti-sounds-btn';

        const textNode = [...btn.querySelectorAll("div")].find(d => d.children.length === 0 && d.textContent.trim() === "Appearance");
        if (textNode) textNode.textContent = "(Avia) Notification Sound";

        setIcon(btn);
        btn.onclick = showSoundsModal;

        aviaPluginsBtn.parentElement.insertBefore(btn, aviaPluginsBtn.nextSibling);
    }

    function registerWithAviaMenu() {
        if (window.AviaMenu) {
            window.AviaMenu.register({ id: "avia_noti_sounds", name: "Notification Sounds", icon: "volume_up", onClick: showSoundsModal });
        } else {
            const interval = setInterval(() => {
                if (window.AviaMenu) {
                    clearInterval(interval);
                    window.AviaMenu.register({ id: "avia_noti_sounds", name: "Notification Sounds", icon: "volume_up", onClick: showSoundsModal });
                }
            }, 100);
        }
    }

    const observer = new MutationObserver(injectSettingsButton);
    observer.observe(targetNode, config);

    registerWithAviaMenu();
})();