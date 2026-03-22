(function () {
    if (window.__AVIA_REPO_BRIDGE__) return;
    window.__AVIA_REPO_BRIDGE__ = true;

    const BRIDGE_KEY = "avia_repo_inject_request";
    const BRIDGE_ACK_KEY = "avia_repo_inject_ack";
    const STORAGE_KEY = "avia_plugins";

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function handleInjectRequest(name, url) {
        const plugins = getPlugins();
        const already = plugins.find(p => p.url === url);
        if (already) {
            // Already exists — just enable it if it isn't
            if (!already.enabled) {
                already.enabled = true;
                setPlugins(plugins);
            }
            showBridgeToast(`"${already.name}" is already installed — enabled!`, true);
            return;
        }
        const plugin = { name, url, enabled: true };
        plugins.push(plugin);
        setPlugins(plugins);

        if (window.__AVIA_PLUGINS_LOADED__) {
            const event = new StorageEvent('storage', {
                key: STORAGE_KEY,
                newValue: JSON.stringify(plugins),
                storageArea: localStorage
            });
            window.dispatchEvent(event);
        }

        showBridgeToast(`"${name}" added & enabled!`, true);
    }

    function pollForRequests() {
        const raw = localStorage.getItem(BRIDGE_KEY);
        if (!raw) return;
        try {
            const req = JSON.parse(raw);
            if (!req || !req.url || !req.name || !req.id) return;
            // Don't process the same request twice
            const lastAck = localStorage.getItem(BRIDGE_ACK_KEY);
            if (lastAck === req.id) return;
            // Acknowledge immediately
            localStorage.setItem(BRIDGE_ACK_KEY, req.id);
            localStorage.removeItem(BRIDGE_KEY);
            handleInjectRequest(req.name, req.url);
        } catch (e) {}
    }

    window.addEventListener('storage', (e) => {
        if (e.key === BRIDGE_KEY) pollForRequests();
    });

    setInterval(pollForRequests, 1000);

    function showBridgeToast(message, success = true) {
        const existing = document.getElementById('avia-bridge-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'avia-bridge-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%) translateY(0);
            background: ${success ? '#1e3a2a' : '#3a1e1e'};
            color: ${success ? '#4dff88' : '#ff6b6b'};
            border: 1px solid ${success ? '#4dff88' : '#ff6b6b'};
            border-radius: 12px;
            padding: 12px 22px;
            font-size: 13px;
            font-weight: 500;
            z-index: 9999999;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            font-family: 'Google Sans', system-ui, sans-serif;
            white-space: nowrap;
            animation: abt-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes abt-in {
                from { transform: translateX(-50%) translateY(16px); opacity: 0; }
                to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.style.fontSize = '16px';
        icon.textContent = success ? 'rocket_launch' : 'error';

        const text = document.createElement('span');
        text.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(text);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => toast.remove(), 350);
        }, 3000);
    }

    console.log('[Avia Repo Bridge] Loaded — listening for repo inject requests.');
})();
