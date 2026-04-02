(function() {
    if (window.__AVIA_NOTI_SOUNDS__) return;
    window.__AVIA_NOTI_SOUNDS__ = true;

    const targetNode = document.documentElement;
    const config = { childList: true, subtree: true };

    function getNotiSound() {
        return localStorage.getItem('avia-noti-sound') || '';
    }
    function setNotiSound(url) {
        localStorage.setItem('avia-noti-sound', url);
    }
    function playNotiSound() {
        const url = getNotiSound();
        if (!url) return;
        new Audio(url).play().catch(e => console.warn('Avia: audio play failed', e));
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

    function styleInput(input) {
        input.style.padding = '6px 8px';
        input.style.borderRadius = '8px';
        input.style.border = '1px solid rgba(255,255,255,0.1)';
        input.style.background = 'rgba(255,255,255,0.05)';
        input.style.color = '#fff';
        input.style.flex = '1';
        input.style.minWidth = '0';
    }

    function enableDrag(panel, header) {
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

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

    function togglePanel() {
        let panel = document.getElementById('avia-noti-sounds-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-noti-sounds-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '340px',
            background: 'var(--md-sys-color-surface, #1e1e1e)',
            color: 'var(--md-sys-color-on-surface, #fff)',
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
        });

        const header = document.createElement('div');
        header.textContent = 'Notification Sound';
        Object.assign(header.style, {
            padding: '12px 16px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move',
            userSelect: 'none',
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '10px',
            right: '14px',
            cursor: 'pointer',
            opacity: '0.6',
            fontSize: '14px',
        });
        closeBtn.onclick = () => panel.style.display = 'none';

        const body = document.createElement('div');
        Object.assign(body.style, {
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        });

        const label = document.createElement('div');
        label.textContent = 'Sound URL (plays on DM or mention)';
        label.style.fontSize = '12px';
        label.style.opacity = '0.6';

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';

        const urlInput = document.createElement('input');
        urlInput.placeholder = 'https://example.com/sound.mp3';
        urlInput.value = getNotiSound();
        styleInput(urlInput);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        Object.assign(saveBtn.style, {
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--md-sys-color-primary, #7b6af0)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            flexShrink: '0',
        });
        saveBtn.onclick = () => {
            setNotiSound(urlInput.value.trim());
            saveBtn.textContent = 'Saved!';
            setTimeout(() => saveBtn.textContent = 'Save', 1500);
        };

        const testBtn = document.createElement('button');
        testBtn.textContent = '🔊 Test';
        Object.assign(testBtn.style, {
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
        });
        testBtn.onclick = () => {
            const url = urlInput.value.trim();
            if (!url) return;
            new Audio(url).play();
        };

        row.appendChild(urlInput);
        row.appendChild(saveBtn);
        body.appendChild(label);
        body.appendChild(row);
        body.appendChild(testBtn);
        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(body);
        document.body.appendChild(panel);
        enableDrag(panel, header);
    }

    function injectSettingsButton() {
        const plugins = document.getElementById('stoat-fake-plugins');
        if (plugins && !document.getElementById('avia-noti-sounds-btn')) {
            const btn = document.createElement('a');
            btn.id = 'avia-noti-sounds-btn';
            btn.className = 'pos_relative min-w_0 d_flex ai_center p_6px_8px bdr_8px fw_500 me_12px fs_15px us_none trs_background-color_0.1s_ease-in-out c_var(--md-sys-color-on-surface) fill_var(--md-sys-color-on-surface) bg_unset [&_svg]:flex-sh_0';
            btn.innerHTML = `<md-ripple aria-hidden="true"></md-ripple><div class="d_flex ai_center gap_8px flex-g_1 min-w_0 pe_8px"><div class="min-w_0 d_flex flex-d_column"><div class="ov_hidden white-space_nowrap tov_ellipsis">(Avia) Notification Sound</div></div></div>`;
            setIcon(btn);
            btn.onclick = togglePanel;
            plugins.parentElement.insertBefore(btn, plugins.nextSibling);
        }
    }

    const observer = new MutationObserver(injectSettingsButton);
    observer.observe(targetNode, config);
})();