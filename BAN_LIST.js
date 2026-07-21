/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/BAN_LIST.js
  @VERSION: 1.0
*/

(function () {
    if (window.__BAN_LIST__) return;
    window.__BAN_LIST__ = true;

    let capturedToken = null;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (...args) {
        try {
            const headers = args[1]?.headers;
            if (headers) {
                const t = typeof headers.get === "function"
                    ? (headers.get("X-Session-Token") || headers.get("x-session-token"))
                    : (headers["X-Session-Token"] || headers["x-session-token"]);
                if (t) capturedToken = t;
            }
        } catch (_) {}
        return originalFetch.apply(this, args);
    };

    async function apiReq(url) {
        const res = await originalFetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Session-Token": capturedToken
            },
            credentials: "omit"
        });
        const text = await res.text().catch(() => "");
        try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; }
        catch { return { ok: res.ok, status: res.status, body: text }; }
    }

    function mkDialogBtn(label, primary) {
        const btn = document.createElement("button");
        btn.textContent = label;
        Object.assign(btn.style, {
            lineHeight: "1.25rem", fontSize: "0.875rem",
            letterSpacing: "0.015625rem", fontWeight: "400",
            position: "relative", padding: "0 16px", flexShrink: "0",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "inherit", cursor: "pointer", border: "none",
            transition: "var(--transitions-medium, 200ms) all",
            color: primary ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-primary)",
            height: "40px", borderRadius: "var(--borderRadius-full, 9999px)",
            background: primary ? "var(--md-sys-color-primary)" : "none",
        });
        return btn;
    }

    function formatBanList(data) {
        const users = data.users || [];
        const bans = data.bans || [];
        const userMap = {};
        for (const u of users) userMap[u._id] = u;
        const lines = [];
        lines.push('Total bans: ' + bans.length);
        lines.push('');
        for (let i = 0; i < bans.length; i++) {
            const ban = bans[i];
            const uid = ban._id?.user ?? 'Unknown';
            const u = userMap[uid];
            const tag = u ? (u.discriminator ? u.username + '#' + u.discriminator : u.username) : 'Unknown';
            lines.push((i + 1) + '. ' + tag);
            lines.push('   ID: ' + uid);
            lines.push('   Reason: ' + (ban.reason || 'None'));
            if (i < bans.length - 1) lines.push('');
        }
        return lines.join("\n");
    }

    async function openBanListDialog() {
        if (document.getElementById("avia-banlist-dialog")) return;

        const serverId = window.location.pathname.match(/\/server\/([^/]+)/)?.[1] ?? null;

        const backdrop = document.createElement("div");
        backdrop.id = "avia-banlist-dialog";
        Object.assign(backdrop.style, {
            position: "fixed", inset: "0", zIndex: 9999999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
        });
        backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

        const card = document.createElement("div");
        Object.assign(card.style, {
            padding: "24px", minWidth: "340px", maxWidth: "580px", width: "100%",
            borderRadius: "28px", display: "flex", flexDirection: "column",
            color: "var(--md-sys-color-on-surface)",
            background: "var(--md-sys-color-surface-container-high)",
            boxSizing: "border-box", gap: "var(--gap-md, 12px)",
            maxHeight: "85vh",
        });

        const title = document.createElement("span");
        title.textContent = "Ban List";
        Object.assign(title.style, {
            lineHeight: "2rem", fontSize: "1.5rem", letterSpacing: "0",
            fontWeight: "400", color: "var(--md-sys-color-on-surface)",
            flexShrink: "0",
        });

        const statusMsg = document.createElement("span");
        Object.assign(statusMsg.style, {
            fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)",
            flexShrink: "0", minHeight: "1rem",
        });

        const preview = document.createElement("pre");
        Object.assign(preview.style, {
            flex: "1",
            minHeight: "0",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            margin: "0",
            padding: "14px 16px",
            borderRadius: "12px",
            background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
            color: "var(--md-sys-color-on-surface)",
            fontSize: "0.78rem",
            lineHeight: "1.6",
            fontFamily: "monospace",
            whiteSpace: "pre",
            wordBreak: "normal",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "none",
        });

        const btnRow = document.createElement("div");
        Object.assign(btnRow.style, {
            gap: "8px", display: "flex", justifyContent: "flex-end",
            flexShrink: "0", flexWrap: "wrap", alignItems: "center",
        });

        const closeBtn = mkDialogBtn("Close", false);
        closeBtn.onclick = close;

        const downloadBtn = mkDialogBtn("Download .txt", true);
        downloadBtn.style.display = "none";
        Object.assign(downloadBtn.style, {
            background: "var(--md-sys-color-primary)",
            color: "var(--md-sys-color-on-primary)",
        });

        let formattedText = "";

        downloadBtn.onclick = () => {
            if (!formattedText) return;
            const blob = new Blob([formattedText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `banlist-${serverId || "server"}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };

        const copyBtn = mkDialogBtn('Copy', false);
        copyBtn.style.display = 'none';
        copyBtn.onclick = async () => {
            if (!formattedText) return;
            if (navigator.clipboard?.writeText) {
                try { await navigator.clipboard.writeText(formattedText); } catch { fallbackCopy(formattedText); }
            } else { fallbackCopy(formattedText); }
            const prev = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = prev; }, 1200);
        };
        function fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;left:-9999px;top:-9999px;';
            document.body.appendChild(ta);
            ta.focus(); ta.select();
            try { document.execCommand('copy'); } catch {}
            document.body.removeChild(ta);
        }
        btnRow.append(closeBtn, copyBtn, downloadBtn);
        const previewScrollStyle = document.createElement('style');
        previewScrollStyle.textContent = '#avia-banlist-dialog pre::-webkit-scrollbar { display: none; }';
        document.head.appendChild(previewScrollStyle);
        card.append(title, statusMsg, preview, btnRow);
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);

        function close() { backdrop.remove(); }

        if (!capturedToken) {
            statusMsg.textContent = "⚠️ No token captured yet, Please interact with the page first, then reopen.";
            statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
            return;
        }

        if (!serverId) {
            statusMsg.textContent = "⚠️ Couldn't detect a server ID from the URL. Navigate into a server first.";
            statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
            return;
        }

        statusMsg.textContent = "Fetching ban list…";
        statusMsg.style.color = "var(--md-sys-color-on-surface-variant)";

        const res = await apiReq(`https://api.stoat.chat/servers/${serverId}/bans`);

        if (!res.ok) {
            const errMsg = res.body?.type ?? res.body ?? res.status;
            statusMsg.textContent = `❌ Failed to fetch bans: ${errMsg}`;
            statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
            return;
        }

        const bans = res.body?.bans || [];
        if (bans.length === 0) {
            statusMsg.textContent = "No bans found on this server.";
            statusMsg.style.color = "var(--md-sys-color-on-surface-variant)";
            return;
        }

        formattedText = formatBanList(res.body);
        preview.textContent = formattedText;
        preview.style.display = "block";
        statusMsg.textContent = `${bans.length} ban${bans.length !== 1 ? "s" : ""} found.`;
        statusMsg.style.color = "var(--md-sys-color-primary)";
        downloadBtn.style.display = "flex";
        copyBtn.style.display = "flex";
    }

    function injectBanListButton() {
        const theads = document.querySelectorAll("thead tr");
        for (const thead of theads) {
            if (thead.querySelector("[data-avia-banlist-btn]")) continue;

            const cells = thead.querySelectorAll("td");
            const hasUserField = [...cells].some(td => td.querySelector("mdui-text-field[label='User']"));
            const hasReasonField = [...cells].some(td => td.querySelector("mdui-text-field[label='Reason']"));
            if (!hasUserField || !hasReasonField) continue;

            const lastTd = cells[cells.length - 1];

            const btn = document.createElement("button");
            btn.dataset.aviaBanlistBtn = "true";
            btn.type = "button";
            btn.textContent = "+ Ban List";
            Object.assign(btn.style, {
                lineHeight: "1.25rem", fontSize: "0.875rem",
                letterSpacing: "0.015625rem", fontWeight: "500",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 16px", height: "40px", whiteSpace: "nowrap",
                borderRadius: "var(--borderRadius-full, 9999px)",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                transition: "var(--transitions-medium, 200ms) all",
                background: "var(--md-sys-color-primary)",
                color: "var(--md-sys-color-on-primary)",
            });
            btn.onmouseenter = () => btn.style.opacity = "0.85";
            btn.onmouseleave = () => btn.style.opacity = "1";
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openBanListDialog();
            };

            lastTd.appendChild(btn);
        }
    }

    let debounceTimer = null;
    new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(injectBanListButton, 150);
    }).observe(document.body, { childList: true, subtree: true });

    injectBanListButton();
})();