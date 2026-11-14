(() => {
    if (window.__PluginRepoOveride) return;
    window.__PluginRepoOveride = true;

    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";

        if (url === "https://raw.githubusercontent.com/AvaLilac/FluxerPluginsRepo/refs/heads/main/PluginsRepo.js") {
            input = "https://raw.githubusercontent.com/AvaLilac/FluxerPluginsRepo/refs/heads/main/plugins.json";
        }

        return originalFetch.call(this, input, init);
    };
})();