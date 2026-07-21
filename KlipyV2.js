(function () {
    if (window.__KlipyV2__) return;
    window.__KlipyV2__ = true;

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

    async function handleSearch(originalUrl) {
        const u = new URL(originalUrl);
        const locale = u.searchParams.get("locale") || "en_US";
        const query = u.searchParams.get("query") || u.searchParams.get("q") || "";
        const limit = u.searchParams.get("limit") || "50";
        const pos = u.searchParams.get("pos") || u.searchParams.get("next") || "";
        const key = (settings.apiKey || "").trim();
        if (!key) return jsonResponse({ results: [] });
        const params = { q: query, locale, limit, media_filter: MEDIA_FILTER, contentfilter: "off" };
        if (pos) params.pos = pos;
        const target = buildKlipyUrl("search", params);
        const res = await fetch(target, { headers: { Accept: "application/json" } });
        const json = await res.json();
        return jsonResponse(normalizeSearchPayload(json));
    }

    async function handleTrending(originalUrl) {
        const u = new URL(originalUrl);
        const locale = u.searchParams.get("locale") || "en_US";
        const limit = u.searchParams.get("limit") || "50";
        const pos = u.searchParams.get("pos") || u.searchParams.get("next") || "";
        const key = (settings.apiKey || "").trim();
        if (!key) return jsonResponse({ results: [] });
        const params = { locale, limit, media_filter: MEDIA_FILTER, contentfilter: "off" };
        if (pos) params.pos = pos;
        const target = buildKlipyUrl("featured", params);
        const res = await fetch(target, { headers: { Accept: "application/json" } });
        const json = await res.json();
        return jsonResponse(normalizeSearchPayload(json));
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

    function closeKeyDialog() {
        const scrim = document.getElementById("gifbox-klipy-key-scrim");
        if (scrim) scrim.remove();
    }

    function openKeyDialog() {
        if (document.getElementById("gifbox-klipy-key-scrim")) return;

        const scrim = document.createElement("div");
        scrim.id = "gifbox-klipy-key-scrim";
        scrim.className = "top_0 left_0 right_0 bottom_0 pos_fixed z_998 max-h_100% d_grid us_none place-items_center pointer-events_all anim-n_scrimFadeIn anim-dur_0.1s anim-fm_forwards trs_var(--transitions-medium)_all p_80px phone:p_30px ov-y_auto --background_rgba(0,_0,_0,_0.6) dialog_scrim";
        scrim.style.setProperty("--background", "rgba(0, 0, 0, 0.6)");
        scrim.addEventListener("click", e => { if (e.target === scrim) closeKeyDialog(); });

        const dialog = document.createElement("div");
        dialog.className = "dialog";
        dialog.style.opacity = "1";
        dialog.style.setProperty("--motion-translateY", "0px");
        dialog.style.transform = "translateY(var(--motion-translateY))";

        const card = document.createElement("div");
        card.className = "p_24px min-w_280px max-w_560px bdr_28px d_flex flex-d_column c_var(--md-sys-color-on-surface) bg_var(--md-sys-color-surface-container-high)";

        const heading = document.createElement("span");
        heading.className = "lh_2rem fs_1.5rem ls_0 fw_400 mbe_16px";
        heading.textContent = "Klipy API Key";

        const body = document.createElement("div");
        body.className = "c_var(--md-sys-color-on-surface-variant) ov-wrap_anywhere lh_1.25rem fs_0.875rem ls_0.015625rem fw_400";

        const form = document.createElement("form");
        const formInner = document.createElement("div");
        formInner.className = "d_flex flex-d_column flex-g_initial m_0 ai_initial jc_initial gap_var(--gap-md)";

        const field = document.createElement("mdui-text-field");
        field.className = "cursor_text";
        field.setAttribute("variant", "filled");
        field.setAttribute("type", "password");
        field.setAttribute("name", "apiKey");
        field.setAttribute("required", "");
        field.setAttribute("label", "Klipy API Key");
        field.value = settings.apiKey || "";

        formInner.appendChild(field);
        form.appendChild(formInner);
        body.appendChild(form);

        const actions = document.createElement("div");
        actions.className = "gap_8px d_flex jc_end mbs_24px";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "ov-wrap_anywhere lh_1.25rem fs_0.875rem ls_0.015625rem fw_400 pos_relative px_16px flex-sh_0 d_flex ai_center jc_center ff_inherit cursor_pointer bd_none trs_var(--transitions-medium)_all c_var(--color) fill_var(--color) h_40px bdr_var(--borderRadius-full) --color_var(--md-sys-color-primary)";
        closeBtn.innerHTML = '<md-ripple aria-hidden="true"></md-ripple>Close';
        closeBtn.onclick = closeKeyDialog;

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        const enabledClass = "ov-wrap_anywhere lh_1.25rem fs_0.875rem ls_0.015625rem fw_400 pos_relative px_16px flex-sh_0 d_flex ai_center jc_center ff_inherit cursor_pointer bd_none trs_var(--transitions-medium)_all c_var(--color) fill_var(--color) h_40px bdr_var(--borderRadius-full) --color_var(--md-sys-color-on-primary) bg_var(--md-sys-color-primary)";
        const disabledClass = "ov-wrap_anywhere lh_1.25rem fs_0.875rem ls_0.015625rem fw_400 pos_relative px_16px flex-sh_0 d_flex ai_center jc_center ff_inherit cursor_not-allowed bd_none trs_var(--transitions-medium)_all c_var(--color) fill_var(--color) h_40px bdr_var(--borderRadius-full) --color_color-mix(in_srgb,_38%_var(--md-sys-color-on-surface),_transparent) bg_color-mix(in_srgb,_10%_var(--md-sys-color-on-surface),_transparent)";
        saveBtn.textContent = "Save";

        function syncSaveState() {
            const hasValue = !!(field.value || "").trim();
            saveBtn.disabled = !hasValue;
            saveBtn.className = hasValue ? enabledClass : disabledClass;
        }
        syncSaveState();
        field.addEventListener("input", syncSaveState);
        field.addEventListener("change", syncSaveState);

        saveBtn.onclick = () => {
            if (saveBtn.disabled) return;
            settings.apiKey = (field.value || "").trim();
            saveSettings(settings);
            closeKeyDialog();
        };

        actions.appendChild(closeBtn);
        actions.appendChild(saveBtn);

        card.appendChild(heading);
        card.appendChild(body);
        card.appendChild(actions);
        dialog.appendChild(card);
        scrim.appendChild(dialog);
        document.body.appendChild(scrim);
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