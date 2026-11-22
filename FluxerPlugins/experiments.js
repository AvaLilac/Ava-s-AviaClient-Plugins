/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/experiments.js
  @VERSION: 1.0
*/

(function() {
    if (window.__EXPERIMENTS__) return;
    window.__EXPERIMENTS__ = true;

    const STORAGE_KEY = "avia_experiment_overrides";
    const PARENT_ID = "avia-experiments";
    const API_PATH = "/api/v1/experiments";

    let overrides = {};

    try {
        overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        overrides = {};
    }

    const saveOverrides = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    };

    const decodeUrl = (url) => {
        let decoded = String(url);

        for (let i = 0; i < 3; i++) {
            try {
                const next = decodeURIComponent(decoded);
                if (next === decoded) break;
                decoded = next;
            } catch {
                break;
            }
        }

        return decoded;
    };

    const isExperimentsRequest = (url) => {
        return decodeUrl(url).includes(API_PATH);
    };

    const getFlagKey = (experiment) => {
        if (!experiment || typeof experiment !== "object") return null;
        if (typeof experiment.active === "boolean") return "active";
        if (typeof experiment.enabled === "boolean") return "enabled";
        return null;
    };

    const getEnabled = (experiment) => {
        const flag = getFlagKey(experiment);
        return flag ? experiment[flag] : false;
    };

    const menuItems = new Set();
    let latestAssignments = {};

    const updateMenuItem = (name, experiment) => {
        const enabled = getEnabled(experiment);

        window.AviaMenu?.updatesubmenu?.({
            parent: PARENT_ID,
            id: `avia-experiment-${name}`,
            text: name,
            icon: enabled ? "check_circle" : "x_circle"
        });
    };

    const registerExperiment = (name, experiment) => {
        if (!window.AviaMenu) return;

        const id = `avia-experiment-${name}`;

        if (!menuItems.has(name)) {
            window.AviaMenu.submenu({
                parent: PARENT_ID,
                id,
                name,
                icon: getEnabled(experiment) ? "check_circle" : "x_circle",
                onClick: () => {
                    const current = latestAssignments[name];
                    const flag = getFlagKey(current);

                    if (!flag) return;

                    const nextValue = !getEnabled(current);

                    overrides[name] = nextValue;
                    saveOverrides();

                    current[flag] = nextValue;
                    updateMenuItem(name, current);
                }
            });

            menuItems.add(name);
        } else {
            updateMenuItem(name, experiment);
        }
    };

    const resetExperiments = () => {
        localStorage.removeItem(STORAGE_KEY);
        overrides = {};

        for (const [name, experiment] of Object.entries(latestAssignments)) {
            const flag = getFlagKey(experiment);
            if (!flag) continue;

            updateMenuItem(name, experiment);
        }
    };

    const modifyExperiments = (data) => {
        if (!data || typeof data !== "object") return data;
        if (!data.assignments || typeof data.assignments !== "object") return data;

        latestAssignments = data.assignments;

        for (const [name, experiment] of Object.entries(data.assignments)) {
            const flag = getFlagKey(experiment);

            if (!flag) continue;

            if (typeof overrides[name] === "boolean") {
                experiment[flag] = overrides[name];
            }

            registerExperiment(name, experiment);
        }

        return data;
    };

    if (window.AviaMenu?.submenuregister) {
        window.AviaMenu.submenuregister({
            id: PARENT_ID,
            name: "Experiments",
            icon: "settings"
        });

        window.AviaMenu.submenu({
            parent: PARENT_ID,
            id: "avia-experiments-reset",
            name: "Reset Experiments",
            icon: "refresh",
            onClick: resetExperiments
        });
    }

    const xhrPrototype = XMLHttpRequest.prototype;
    const originalOpen = xhrPrototype.open;

    const responseTextDescriptor = Object.getOwnPropertyDescriptor(xhrPrototype, "responseText");
    const responseDescriptor = Object.getOwnPropertyDescriptor(xhrPrototype, "response");

    const xhrCache = new WeakMap();

    const modifyXhrResponse = (xhr, originalValue) => {
        if (!xhr.__aviaExperimentsRequest || xhr.readyState !== XMLHttpRequest.DONE) {
            return originalValue;
        }

        if (xhrCache.has(xhr)) return xhrCache.get(xhr);

        try {
            const isString = typeof originalValue === "string";
            const data = isString ? JSON.parse(originalValue) : originalValue;

            if (!data || typeof data !== "object") return originalValue;

            modifyExperiments(data);

            const modified = isString ? JSON.stringify(data) : data;

            xhrCache.set(xhr, modified);

            return modified;
        } catch {
            return originalValue;
        }
    };

    xhrPrototype.open = function(method, url, ...args) {
        this.__aviaExperimentsRequest = isExperimentsRequest(url);
        xhrCache.delete(this);

        return originalOpen.call(this, method, url, ...args);
    };

    if (responseTextDescriptor?.get && responseTextDescriptor.configurable) {
        Object.defineProperty(xhrPrototype, "responseText", {
            ...responseTextDescriptor,
            get() {
                const original = responseTextDescriptor.get.call(this);

                if (!this.__aviaExperimentsRequest) return original;

                return modifyXhrResponse(this, original);
            }
        });
    }

    if (responseDescriptor?.get && responseDescriptor.configurable) {
        Object.defineProperty(xhrPrototype, "response", {
            ...responseDescriptor,
            get() {
                const original = responseDescriptor.get.call(this);

                if (!this.__aviaExperimentsRequest) return original;

                if (this.responseType === "" || this.responseType === "text") {
                    return modifyXhrResponse(this, original);
                }

                if (this.responseType === "json") {
                    if (xhrCache.has(this)) return xhrCache.get(this);

                    try {
                        modifyExperiments(original);
                        xhrCache.set(this, original);
                        return original;
                    } catch {
                        return original;
                    }
                }

                return original;
            }
        });
    }

    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const input = args[0];
        const url = typeof input === "string" ? input : input?.url;

        const response = await originalFetch.apply(this, args);

        if (!url || !isExperimentsRequest(url)) return response;

        try {
            const data = await response.clone().json();

            modifyExperiments(data);

            const headers = new Headers(response.headers);
            headers.delete("content-length");
            headers.delete("content-encoding");
            headers.delete("transfer-encoding");

            return new Response(JSON.stringify(data), {
                status: response.status,
                statusText: response.statusText,
                headers
            });
        } catch {
            return response;
        }
    };

    console.log("[Avia Experiments] Loaded.");
})();