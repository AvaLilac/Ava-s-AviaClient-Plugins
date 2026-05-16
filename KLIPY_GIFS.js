(function () {
    if (window.__KLIPY_GIFS__) return;
    window.__KLIPY_GIFS__ = true;

    const SETTINGS_KEY = "kiply_gif_plugin_settings";
    const AVIA_FAV_KEY = "avia_favorites";

    function loadSettings() {
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); }
        catch { return {}; }
    }

    function saveSettings(s) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    }

    let settings = loadSettings();

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

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;left:-9999px;top:-9999px;";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            try { await navigator.clipboard.writeText(text); return; } catch {}
        }
        fallbackCopy(text);
    }

    function showToast(container, text) {
        const old = container.querySelector(".kiply-toast");
        if (old) old.remove();
        const toast = document.createElement("div");
        toast.className = "kiply-toast";
        toast.textContent = text;
        Object.assign(toast.style, {
            position: "absolute",
            left: "50%",
            bottom: "8px",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.88)",
            color: "#fff",
            borderRadius: "999px",
            padding: "4px 10px",
            fontSize: "10px",
            zIndex: "10",
            pointerEvents: "none",
            opacity: "0",
            transition: "opacity 0.15s ease",
            whiteSpace: "nowrap"
        });
        container.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 150);
        }, 1200);
    }

    function parseItem(raw) {
        const url = raw?.file?.hd?.gif?.url || raw?.file?.md?.gif?.url || raw?.file?.sm?.gif?.url || "";
        const thumb = raw?.file?.sm?.gif?.url || raw?.file?.xs?.gif?.url || url;
        const title = raw?.title || raw?.name || "GIF";
        return { url, thumb, title };
    }

    function normalizeResults(payload) {
        return (payload?.data?.data || []).map(parseItem).filter(i => i.url);
    }

    async function klipyFetch(endpoint, params) {
        const key = (settings.apiKey || "").trim();
        if (!key) throw new Error("no_key");
        const base = `https://api.klipy.com/api/v1/${encodeURIComponent(key)}/gifs/${endpoint}`;
        const qs = new URLSearchParams(params || {}).toString();
        const res = await fetch(qs ? `${base}?${qs}` : base, {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "omit"
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!text.trim()) throw new Error("Empty response");
        return JSON.parse(text);
    }

    function setStatus(panel, text) {
        const el = panel.querySelector("#kiply-status");
        if (el) el.textContent = text || "";
    }

    function resetPanel(panel) {
        const grid = panel.querySelector("#kiply-grid");
        if (grid) grid.innerHTML = "";
        setStatus(panel, "");
    }

    async function runSearch(panel, query, trending) {
        const grid = panel.querySelector("#kiply-grid");
        if (grid) grid.innerHTML = "";
        setStatus(panel, trending ? "Loading trending GIFs..." : `Searching "${query}"...`);
        try {
            const params = { per_page: "50" };
            if (!trending && query) params.q = query;
            const payload = await klipyFetch(trending ? "trending" : "search", params);
            const items = normalizeResults(payload);
            if (!items.length) { setStatus(panel, "No results found."); return; }
            renderGrid(panel, items);
            setStatus(panel, `${items.length} result${items.length !== 1 ? "s" : ""}`);
        } catch (err) {
            if (err.message === "no_key") {
                setStatus(panel, "Enter your Klipy API key above and click Save.");
            } else {
                setStatus(panel, `Error: ${err.message}`);
            }
        }
    }

    function buildCard(item, observer) {
        const card = document.createElement("div");
        card.dataset.url = item.url;
        card.dataset.thumb = item.thumb;
        card.dataset.title = item.title;
        Object.assign(card.style, {
            position: "relative",
            borderRadius: "10px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            flexShrink: "0",
            boxSizing: "border-box",
            transition: "transform 0.15s ease, border-color 0.15s ease",
            width: "108px",
            height: "108px"
        });

        const saved = isAviaSaved(item.url);
        const starBtn = document.createElement("span");
        starBtn.className = "material-symbols-outlined";
        starBtn.textContent = saved ? "star" : "star_border";
        Object.assign(starBtn.style, {
            position: "absolute",
            top: "4px",
            right: "4px",
            fontSize: "16px",
            color: saved ? "#f5c518" : "#fff",
            cursor: "pointer",
            zIndex: "3",
            fontVariationSettings: saved ? "'FILL' 1,'wght' 400,'GRAD' 0" : "'FILL' 0,'wght' 400,'GRAD' 0",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            transition: "color 0.15s, transform 0.1s",
            lineHeight: "1"
        });

        starBtn.addEventListener("mouseenter", () => { starBtn.style.transform = "scale(1.2)"; });
        starBtn.addEventListener("mouseleave", () => { starBtn.style.transform = "scale(1)"; });
        starBtn.addEventListener("click", e => {
            e.stopPropagation();
            if (isAviaSaved(item.url)) {
                removeAviaFav(item.url);
                starBtn.textContent = "star_border";
                starBtn.style.color = "#fff";
                starBtn.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
                showToast(card, "Removed");
            } else {
                addAviaFav(item.url, item.title);
                starBtn.textContent = "star";
                starBtn.style.color = "#f5c518";
                starBtn.style.fontVariationSettings = "'FILL' 1,'wght' 400,'GRAD' 0";
                showToast(card, "Favorited!");
            }
        });

        card.appendChild(starBtn);

        card.addEventListener("mouseenter", () => {
            card.style.transform = "scale(1.04)";
            card.style.borderColor = "rgba(255,255,255,0.18)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "scale(1)";
            card.style.borderColor = "rgba(255,255,255,0.06)";
        });

        card.addEventListener("click", async () => {
            await copyText(item.url);
            showToast(card, "Copied!");
        });

        observer.observe(card);
        return card;
    }

    function loadCardImage(card) {
        if (card.dataset.loaded) return;
        card.dataset.loaded = "1";

        const thumb = card.dataset.thumb;
        const url = card.dataset.url;
        const title = card.dataset.title;

        const img = document.createElement("img");
        img.draggable = false;
        img.src = thumb;
        Object.assign(img.style, {
            position: "absolute",
            top: "0", left: "0",
            width: "100%", height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
            zIndex: "1"
        });

        img.onerror = () => {
            if (img.src !== url) { img.src = url; return; }
            img.remove();
            const fb = document.createElement("div");
            fb.textContent = "GIF";
            Object.assign(fb.style, {
                position: "absolute", top: "0", left: "0",
                width: "100%", height: "100%", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)", fontSize: "11px", zIndex: "1"
            });
            card.appendChild(fb);
        };

        card.appendChild(img);

        const titleEl = document.createElement("div");
        titleEl.textContent = title;
        Object.assign(titleEl.style, {
            position: "absolute",
            bottom: "0", left: "0", right: "0",
            padding: "16px 5px 4px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            fontSize: "9px", color: "#fff", lineHeight: "1.2",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            pointerEvents: "none", zIndex: "2"
        });
        card.appendChild(titleEl);
    }

    function renderGrid(panel, items) {
        const grid = panel.querySelector("#kiply-grid");
        if (!grid) return;
        grid.innerHTML = "";

        if (!items.length) {
            const empty = document.createElement("div");
            empty.textContent = "No results";
            Object.assign(empty.style, {
                width: "100%", padding: "28px 0", textAlign: "center",
                color: "rgba(255,255,255,0.4)", fontSize: "13px"
            });
            grid.appendChild(empty);
            return;
        }

        const gridWrap = panel.querySelector("#kiply-gridwrap");

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadCardImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { root: gridWrap, rootMargin: "80px", threshold: 0 });

        items.forEach(item => grid.appendChild(buildCard(item, observer)));
    }

    function styleBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px", borderRadius: "8px", border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff", cursor: "pointer", fontSize: "12px",
            fontWeight: "500", whiteSpace: "nowrap", flexShrink: "0"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function styledInput(placeholder) {
        const input = document.createElement("input");
        input.placeholder = placeholder;
        Object.assign(input.style, {
            flex: "1", padding: "6px 8px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff", fontSize: "13px", outline: "none", minWidth: "0"
        });
        return input;
    }

    function makePanel() {
        let panel = document.getElementById("kiply-panel");
        if (panel) return panel;

        panel = document.createElement("div");
        panel.id = "kiply-panel";
        Object.assign(panel.style, {
            position: "fixed", right: "40px", bottom: "28px",
            width: "520px", height: "490px", zIndex: "999999",
            display: "none", flexDirection: "column", overflow: "hidden",
            borderRadius: "16px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            color: "var(--md-sys-color-on-surface, #fff)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.textContent = "Klipy GIFs";
        Object.assign(header.style, {
            padding: "14px 16px", fontWeight: "600", fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move", userSelect: "none", flexShrink: "0"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute", top: "12px", right: "16px",
            cursor: "pointer", opacity: "0.7", color: "#fff",
            fontSize: "13px", zIndex: "1"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => {
            panel.style.display = "none";
            resetPanel(panel);
        };

        const keyRow = document.createElement("div");
        Object.assign(keyRow.style, {
            padding: "10px 16px", display: "flex", gap: "8px",
            alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: "0"
        });

        const keyInput = styledInput("Api Key");
        keyInput.type = "password";
        keyInput.value = settings.apiKey || "";

        const showBtn = document.createElement("button");
        showBtn.textContent = "Show";
        styleBtn(showBtn);
        showBtn.onclick = () => {
            if (keyInput.type === "password") { keyInput.type = "text"; showBtn.textContent = "Hide"; }
            else { keyInput.type = "password"; showBtn.textContent = "Show"; }
        };

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        styleBtn(saveBtn, "#2d6a4f");
        saveBtn.onclick = () => {
            settings.apiKey = keyInput.value.trim();
            saveSettings(settings);
            saveBtn.textContent = "✓ Saved";
            setTimeout(() => saveBtn.textContent = "Save", 1200);
            runSearch(panel, "", true);
        };

        keyRow.appendChild(keyInput);
        keyRow.appendChild(showBtn);
        keyRow.appendChild(saveBtn);

        const searchRow = document.createElement("div");
        Object.assign(searchRow.style, {
            padding: "10px 16px", display: "flex", gap: "8px",
            alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: "0"
        });

        const queryInput = styledInput("Search KLIPY");

        const searchBtn = document.createElement("button");
        searchBtn.textContent = "Search";
        styleBtn(searchBtn);
        searchBtn.onclick = () => runSearch(panel, queryInput.value.trim(), false);

        const trendBtn = document.createElement("button");
        trendBtn.textContent = "Trending";
        styleBtn(trendBtn);
        trendBtn.onclick = () => runSearch(panel, "", true);

        queryInput.addEventListener("keydown", e => {
            if (e.key === "Enter") runSearch(panel, queryInput.value.trim(), false);
        });

        searchRow.appendChild(queryInput);
        searchRow.appendChild(searchBtn);
        searchRow.appendChild(trendBtn);

        const status = document.createElement("div");
        status.id = "kiply-status";
        Object.assign(status.style, {
            padding: "6px 16px 0", fontSize: "11px",
            opacity: "0.6", minHeight: "18px", flexShrink: "0"
        });

        const gridWrap = document.createElement("div");
        gridWrap.id = "kiply-gridwrap";
        Object.assign(gridWrap.style, {
            flex: "1", minHeight: "0", overflowY: "auto",
            padding: "10px 16px 14px", boxSizing: "border-box"
        });

        const grid = document.createElement("div");
        grid.id = "kiply-grid";
        Object.assign(grid.style, {
            display: "flex", flexWrap: "wrap",
            gap: "8px", alignContent: "flex-start"
        });

        gridWrap.appendChild(grid);

        const attr = document.createElement("div");
        attr.textContent = "Powered by KLIPY";
        Object.assign(attr.style, {
            padding: "5px 16px", fontSize: "10px", opacity: "0.3",
            textAlign: "right", flexShrink: "0", letterSpacing: "0.04em"
        });

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(keyRow);
        panel.appendChild(searchRow);
        panel.appendChild(status);
        panel.appendChild(gridWrap);
        panel.appendChild(attr);
        document.body.appendChild(panel);

        let dragging = false, ox = 0, oy = 0;
        header.addEventListener("mousedown", e => {
            dragging = true;
            const rect = panel.getBoundingClientRect();
            ox = e.clientX - rect.left;
            oy = e.clientY - rect.top;
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            panel.style.left = rect.left + "px";
            panel.style.top = rect.top + "px";
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => { dragging = false; document.body.style.userSelect = ""; });
        document.addEventListener("mousemove", e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - ox) + "px";
            panel.style.top = (e.clientY - oy) + "px";
        });

        if (settings.apiKey) {
            setTimeout(() => runSearch(panel, "", true), 80);
        } else {
            setStatus(panel, "Enter your Klipy API key above and click Save.");
        }

        return panel;
    }

    function togglePanel() {
        const panel = makePanel();
        const isHidden = panel.style.display === "none";
        if (isHidden) {
            panel.style.display = "flex";
            const q = panel.querySelector("input[placeholder='Search KLIPY']");
            if (q) q.focus();
        } else {
            panel.style.display = "none";
            resetPanel(panel);
        }
    }

    function injectButton() {
        if (document.getElementById("avia-kiply-gif-btn")) return;
        const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
            .find(s => s.textContent.trim() === "gif");
        if (!gifSpan) return;
        const wrapper = gifSpan.closest("div.flex-sh_0");
        if (!wrapper) return;

        const clone = wrapper.cloneNode(true);
        clone.id = "avia-kiply-gif-btn";
        clone.style.position = "relative";

        const icon = clone.querySelector("span.material-symbols-outlined");
        if (icon) icon.textContent = "gif_box";

        const btn = clone.querySelector("button") || clone;
        btn.onclick = togglePanel;

        wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
    }

    new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    injectButton();
})();