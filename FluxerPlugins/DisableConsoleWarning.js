(() => {
    if (window.__DisableConsoleWarning) return;
    window.__DisableConsoleWarning = true;

    const originalLog = console.log;

    const blockedStyles = [
        "color: #36f1cd; font-size: 64px;",
        "font-size: 16px; font-weight: 500;",
        "font-size: 18px; font-weight: 800; color: #ff5c7a;",
        "font-size: 16px; font-style: italic;"
    ];

    console.log = function(...args) {
        if (typeof args[0] === "string" && args[0].startsWith("%c") &&
            blockedStyles.some(style => args[1]?.includes(style))) return;

        return originalLog.apply(this, args);
    };
})();