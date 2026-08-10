/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/KlipyV2.js
  @VERSION: 1.2
*/

/*
Version 1.2
Fix the plugin after stoat update broke everything

Version 1.1

Allows you to set a limit onto how many gif's load at a time. GIF_LOAD_LIMIT is for search. 
Setting it to 1 only loads One gif. Same with TRENDING_LOAD_LIMIT. Though that is for the trending page. 
*/

(function () {
    if (window.__KlipyV2__) return;
    window.__KlipyV2__ = true;

    const GIF_LOAD_LIMIT = 100; // 100 is the max Gif's for search. Enter more then 100 and it will default to 100.
    const TRENDING_LOAD_LIMIT = 100; // Trending Doesn't appear to have a limit. If you find a limit. Send me a ping. im not counting every card. So you can set this to whatever

    const SETTINGS_KEY = "KlipyAPIKey";

    function loadSettings() {
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
        catch { return {}; }
    }

    function saveSettings(s) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    }

    let settings = loadSettings();

    const AVIA_FAV_KEY = "avia_favorites";

    function getAviaFavs() {
        try { return JSON.parse(localStorage.getItem(AVIA_FAV_KEY) || "[]"); }
        catch { return []; }
    }

    function setAviaFavs(arr) {
        localStorage.setItem(AVIA_FAV_KEY, JSON.stringify(arr));
    }

    function isAviaSaved(url) {
        return getAviaFavs().some(f => f.url === url);
    }

    function addAviaFav(url, title) {
        const favs = getAviaFavs();
        if (favs.some(f => f.url === url)) return false;
        favs.push({ url: url, title: title || "", addedAt: Date.now() });
        setAviaFavs(favs);
        syncAviaBadge();
        return true;
    }

    function removeAviaFav(url) {
        setAviaFavs(getAviaFavs().filter(f => f.url !== url));
        syncAviaBadge();
    }

    function syncAviaBadge() {
        const badge = document.getElementById("avia-favorites-badge");
        if (!badge) return;
        const count = getAviaFavs().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
    }

    const KLIPY_BASE = "https://api.klipy.com/v2";
    const MEDIA_FILTER = "gif,tinygif,nanogif,tinymp4,preview,nanowebm,nanomp4,webm,tinywebm,mp4,mediumgif,loopedmp4";

    const GROUPS = [
        ["gif", "mediumgif", "tinygif", "nanogif", "preview"],
        ["mp4", "loopedmp4", "tinymp4", "nanomp4"],
        ["webm", "tinywebm", "nanowebm"]
    ];
    const ALL_KEYS = ["gif", "tinygif", "nanogif", "tinymp4", "preview", "nanowebm", "nanomp4", "webm", "tinywebm", "mp4", "mediumgif", "loopedmp4"];

    function ensureFormats(formats) {
        const out = Object.assign({}, formats);
        for (const group of GROUPS) {
            const present = group.find(k => out[k] && out[k].url);
            if (!present) continue;
            for (const k of group) {
                if (!out[k]) out[k] = out[present];
            }
        }
        for (const k of ALL_KEYS) {
            if (!out[k]) {
                const fallback = ALL_KEYS.find(fk => out[fk] && out[fk].url);
                if (fallback) out[k] = out[fallback];
            }
        }
        return out;
    }

    function klipyNativeItemToGifboxItem(raw) {
        const url = raw?.file?.hd?.gif?.url || raw?.file?.md?.gif?.url || raw?.file?.sm?.gif?.url || raw?.file?.xs?.gif?.url || "";
        const dims = [raw?.file?.hd?.gif?.width || 0, raw?.file?.hd?.gif?.height || 0];
        const base = { url, dimensions: dims };
        const formats = ensureFormats({ gif: base });
        return {
            id: String(raw?.id ?? raw?.slug ?? url),
            media_formats: formats,
            url: raw?.share_url || url
        };
    }

    function normalizeSearchPayload(json) {
        if (json && Array.isArray(json.results)) {
            const results = json.results.map(item => ({
                id: item.id,
                media_formats: ensureFormats(item.media_formats || {}),
                url: item.url || (item.media_formats && item.media_formats.gif && item.media_formats.gif.url) || ""
            }));
            return Object.assign({}, json, { results });
        }
        if (json && json.data && Array.isArray(json.data.data)) {
            return { results: json.data.data.map(klipyNativeItemToGifboxItem) };
        }
        return { results: [] };
    }

    function normalizeCategoriesPayload(json) {
        const tags = Array.isArray(json?.tags) ? json.tags
            : Array.isArray(json?.data?.data) ? json.data.data
            : Array.isArray(json) ? json
            : [];
        return tags.map(t => ({
            title: t.name || t.title || "",
            image: t.image || (t.file && (t.file.md?.gif?.url || t.file.sm?.gif?.url)) || ""
        })).filter(c => c.title && c.image);
    }

    function buildKlipyUrl(path, params) {
        const key = (settings.apiKey || "").trim();
        const qs = new URLSearchParams(params);
        if (key) qs.set("key", key);
        return `${KLIPY_BASE}/${path}?${qs.toString()}`;
    }

    async function handleCategories(originalUrl) {
        const u = new URL(originalUrl);
        const locale = u.searchParams.get("locale") || "en_US";
        const key = (settings.apiKey || "").trim();
        if (!key) return jsonResponse([]);
        const target = buildKlipyUrl("categories", { locale });
        const res = await fetch(target, { headers: { Accept: "application/json" } });
        const json = await res.json();
        return jsonResponse(normalizeCategoriesPayload(json));
    }

    const KLIPY_PAGE_SIZE = 100;
    const EFFECTIVE_GIF_LIMIT = Math.min(GIF_LOAD_LIMIT, KLIPY_PAGE_SIZE);

    async function fetchKlipyPaged(path, baseParams, targetLimit) {
        let collected = [];
        let pos = baseParams.pos || "";
        let nextCursor = "";
        let guard = 0;
        while (collected.length < targetLimit && guard < 20) {
            guard++;
            const remaining = targetLimit - collected.length;
            const params = Object.assign({}, baseParams, { limit: String(Math.min(remaining, KLIPY_PAGE_SIZE)) });
            if (pos) params.pos = pos; else delete params.pos;
            const target = buildKlipyUrl(path, params);
            const res = await fetch(target, { headers: { Accept: "application/json" } });
            const json = await res.json();
            const norm = normalizeSearchPayload(json);
            if (!norm.results.length) { nextCursor = ""; break; }
            collected = collected.concat(norm.results);
            nextCursor = norm.next || json.next || json.pos || "";
            if (!nextCursor) break;
            pos = nextCursor;
        }
        return { results: collected.slice(0, targetLimit), next: nextCursor };
    }

    async function handleSearch(originalUrl) {
        const u = new URL(originalUrl);
        const locale = u.searchParams.get("locale") || "en_US";
        const query = u.searchParams.get("query") || u.searchParams.get("q") || "";
        const pos = u.searchParams.get("pos") || u.searchParams.get("next") || "";
        const key = (settings.apiKey || "").trim();
        if (!key) return jsonResponse({ results: [] });
        const baseParams = { q: query, locale, media_filter: MEDIA_FILTER, contentfilter: "off" };
        if (pos) baseParams.pos = pos;
        const payload = await fetchKlipyPaged("search", baseParams, EFFECTIVE_GIF_LIMIT);
        return jsonResponse(payload);
    }

    async function handleTrending(originalUrl) {
        const u = new URL(originalUrl);
        const locale = u.searchParams.get("locale") || "en_US";
        const pos = u.searchParams.get("pos") || u.searchParams.get("next") || "";
        const key = (settings.apiKey || "").trim();
        if (!key) return jsonResponse({ results: [] });
        const baseParams = { locale, media_filter: MEDIA_FILTER, contentfilter: "off" };
        if (pos) baseParams.pos = pos;
        const payload = await fetchKlipyPaged("featured", baseParams, TRENDING_LOAD_LIMIT);
        return jsonResponse(payload);
    }

    function jsonResponse(body) {
        return new Response(JSON.stringify(body), {
            status: 200,
            headers: { "content-type": "application/json" }
        });
    }

    function matchGifbox(url) {
        try {
            const u = new URL(url, location.href);
            if (u.hostname !== "api.gifbox.me") return null;
            if (u.pathname === "/categories") return "categories";
            if (u.pathname === "/search") return "search";
            if (u.pathname === "/trending") return "trending";
            return null;
        } catch {
            return null;
        }
    }

    function dispatchHijack(kind, url) {
        if (kind === "categories") return handleCategories(url);
        if (kind === "trending") return handleTrending(url);
        return handleSearch(url);
    }

    const realFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : input?.url;
        const kind = url ? matchGifbox(url) : null;
        if (!kind) return realFetch(input, init);
        try {
            return await dispatchHijack(kind, url);
        } catch (err) {
            return jsonResponse(kind === "categories" ? [] : { results: [] });
        }
    };

    const RealXHR = window.XMLHttpRequest;
    function HijackXHR() {
        const xhr = new RealXHR();
        let hijackKind = null;
        let hijackUrl = null;
        const realOpen = xhr.open.bind(xhr);
        const realSend = xhr.send.bind(xhr);

        xhr.open = function (method, url, ...rest) {
            hijackKind = matchGifbox(url);
            hijackUrl = url;
            if (hijackKind) return;
            return realOpen(method, url, ...rest);
        };

        xhr.send = function (...args) {
            if (!hijackKind) return realSend(...args);
            const run = dispatchHijack(hijackKind, hijackUrl);
            run.then(async res => {
                const text = await res.text();
                Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });
                Object.defineProperty(xhr, "status", { value: 200, configurable: true });
                Object.defineProperty(xhr, "statusText", { value: "OK", configurable: true });
                Object.defineProperty(xhr, "responseText", { value: text, configurable: true });
                Object.defineProperty(xhr, "response", { value: text, configurable: true });
                xhr.dispatchEvent(new Event("readystatechange"));
                xhr.dispatchEvent(new Event("load"));
                xhr.dispatchEvent(new Event("loadend"));
            }).catch(() => {
                Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });
                Object.defineProperty(xhr, "status", { value: 200, configurable: true });
                Object.defineProperty(xhr, "responseText", { value: "{\"results\":[]}", configurable: true });
                Object.defineProperty(xhr, "response", { value: "{\"results\":[]}", configurable: true });
                xhr.dispatchEvent(new Event("readystatechange"));
                xhr.dispatchEvent(new Event("load"));
                xhr.dispatchEvent(new Event("loadend"));
            });
        };

        return xhr;
    }
    HijackXHR.prototype = RealXHR.prototype;
    window.XMLHttpRequest = HijackXHR;

    function openKeyDialog() {
        if (document.getElementById('avia-klipy-key-scrim')) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'avia-klipy-key-scrim';
        backdrop.style.cssText = `
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            position: fixed;
            z-index: 999982;
            max-height: 100%;
            display: grid;
            user-select: none;
            place-items: center;
            pointer-events: all;
            padding: 80px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.6);`;

        backdrop.innerHTML = `
          <div style="opacity: 1;">
            <div style="padding: 24px; min-width: 280px; max-width: 560px; border-radius: 28px; display: flex; flex-direction: column; color: var(--md-sys-color-on-surface); background: var(--md-sys-color-surface-container-high);">
              <span style="line-height: 2rem; font-size: 1.5rem; letter-spacing: 0; font-weight: 400; margin-block-end: 16px;">Klipy API Key</span>
              <div style="color: var(--md-sys-color-on-surface-variant); line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400;">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <mdui-text-field id="klipy-key-input" variant="filled" type="password" name="apiKey" required label="Klipy API Key"></mdui-text-field>
                </div>
              </div>
              <div style="gap: 8px; display: flex; justify-content: flex-end; margin-block-start: 24px;">
                <button id="klipy-key-close-btn" type="button" style="line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; position: relative; padding-inline: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: pointer; border: none; transition: opacity 0.15s; height: 40px; border-radius: 9999px; background: none; color: var(--md-sys-color-primary);">
                  <md-ripple aria-hidden="true"></md-ripple>Close
                </button>
                <button id="klipy-key-save-btn" type="button" disabled style="line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; position: relative; padding-inline: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: not-allowed; border: none; transition: opacity 0.15s; height: 40px; border-radius: 9999px; color: color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent); background: color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent);">
                  <md-ripple aria-hidden="true"></md-ripple>Save
                </button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(backdrop);

        const closeBtn = backdrop.querySelector('#klipy-key-close-btn');
        const saveBtn = backdrop.querySelector('#klipy-key-save-btn');
        const field = backdrop.querySelector('#klipy-key-input');

        field.value = settings.apiKey || "";

        function close() { backdrop.remove(); }

        function syncSaveState() {
            const hasValue = !!(field.value || "").trim();
            saveBtn.disabled = !hasValue;
            saveBtn.style.cursor = hasValue ? 'pointer' : 'not-allowed';
            saveBtn.style.color = hasValue ? 'var(--md-sys-color-on-primary)' : 'color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)';
            saveBtn.style.background = hasValue ? 'var(--md-sys-color-primary)' : 'color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)';
        }
        syncSaveState();
        field.addEventListener('input', syncSaveState);
        field.addEventListener('change', syncSaveState);

        backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
        closeBtn.addEventListener('click', close);

        saveBtn.addEventListener('click', () => {
            if (saveBtn.disabled) return;
            settings.apiKey = (field.value || "").trim();
            saveSettings(settings);
            close();
        });
    }

    function isGifMediaUrl(url) {
        return typeof url === "string" && (url.includes("static.klipy.com") || url.includes("media.klipy.com") || url.includes("media.gifbox.me"));
    }

    function showCardToast(card, text) {
        const old = card.querySelector(".avia-hijack-toast");
        if (old) old.remove();
        const toast = document.createElement("div");
        toast.className = "avia-hijack-toast";
        toast.textContent = text;
        Object.assign(toast.style, {
            position: "absolute",
            left: "50%",
            bottom: "6px",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.88)",
            color: "#fff",
            borderRadius: "999px",
            padding: "3px 9px",
            fontSize: "10px",
            zIndex: "3",
            pointerEvents: "none",
            opacity: "0",
            transition: "opacity 0.15s ease",
            whiteSpace: "nowrap"
        });
        card.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 150);
        }, 1000);
    }

    function attachStar(card, url) {
        const star = document.createElement("span");
        star.className = "material-symbols-outlined avia-hijack-star";
        const saved = isAviaSaved(url);
        star.textContent = saved ? "star" : "star_border";
        Object.assign(star.style, {
            position: "absolute",
            top: "4px",
            right: "4px",
            fontSize: "22px",
            color: saved ? "#f5c518" : "#fff",
            cursor: "pointer",
            zIndex: "2",
            fontVariationSettings: saved ? "'FILL' 1,'wght' 400,'GRAD' 0" : "'FILL' 0,'wght' 400,'GRAD' 0",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            transition: "color 0.15s, transform 0.1s",
            lineHeight: "1"
        });

        star.addEventListener("mouseenter", () => { star.style.transform = "scale(1.2)"; });
        star.addEventListener("mouseleave", () => { star.style.transform = "scale(1)"; });

        star.addEventListener("click", e => {
            e.stopPropagation();
            e.preventDefault();
            if (isAviaSaved(url)) {
                removeAviaFav(url);
                star.textContent = "star_border";
                star.style.color = "#fff";
                star.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
                showCardToast(card, "Removed");
            } else {
                addAviaFav(url, "");
                star.textContent = "star";
                star.style.color = "#f5c518";
                star.style.fontVariationSettings = "'FILL' 1,'wght' 400,'GRAD' 0";
                showCardToast(card, "Favorited!");
            }
        });

        star.addEventListener("mousedown", e => e.stopPropagation());

        card.appendChild(star);
    }

    function scanGifCards() {
        document.querySelectorAll('div[role="listitem"]:not([data-avia-fav-processed])').forEach(card => {
            const media = card.querySelector("video, img");
            if (!media) return;
            const src = media.currentSrc || media.src;
            if (!isGifMediaUrl(src)) return;
            card.dataset.aviaFavProcessed = "1";
            if (getComputedStyle(card).position === "static") {
                card.style.position = "relative";
            }
            attachStar(card, src);
        });
    }

    function registerAviaMenuButton() {
        if (!window.AviaMenu || typeof window.AviaMenu.register !== "function") return false;
        window.AviaMenu.register({
            id: "klipy-api",
            name: "Set API Key",
            icon: "Key",
            onClick: openKeyDialog
        });
        return true;
    }

    new MutationObserver(() => {
        scanGifCards();
    }).observe(document.body, { childList: true, subtree: true });
    scanGifCards();

    if (!registerAviaMenuButton()) {
        const aviaMenuWait = setInterval(() => {
            if (registerAviaMenuButton()) clearInterval(aviaMenuWait);
        }, 500);
    }
})();