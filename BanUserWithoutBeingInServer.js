(function () {
  if (window.__AVIA_BAN_USER__) return;
  window.__AVIA_BAN_USER__ = true;

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

  async function apiReq(url, method, body) {
    const res = await originalFetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Session-Token": capturedToken },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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

  function mkField(label, placeholder) {
    const wrap = document.createElement("div");
    Object.assign(wrap.style, { display: "flex", flexDirection: "column", gap: "4px" });
    const lbl = document.createElement("label");
    lbl.textContent = label;
    Object.assign(lbl.style, {
      fontSize: "0.75rem", letterSpacing: "0.025rem",
      color: "var(--md-sys-color-on-surface-variant)",
    });
    const el = document.createElement("input");
    el.placeholder = placeholder || "";
    Object.assign(el.style, {
      width: "100%", boxSizing: "border-box",
      padding: "12px 16px", borderRadius: "4px",
      border: "none", outline: "none",
      background: "color-mix(in srgb, 8% var(--md-sys-color-on-surface), transparent)",
      color: "var(--md-sys-color-on-surface)",
      fontSize: "1rem", fontFamily: "inherit",
      borderBottom: "1px solid var(--md-sys-color-on-surface-variant)",
    });
    el.onfocus = () => el.style.borderBottom = "2px solid var(--md-sys-color-primary)";
    el.onblur  = () => el.style.borderBottom = "1px solid var(--md-sys-color-on-surface-variant)";
    wrap.append(lbl, el);
    return { wrap, el };
  }

  function openBanDialog() {
    if (document.getElementById("avia-ban-dialog")) return;

    const serverId = window.location.pathname.match(/\/server\/([^/]+)/)?.[1] ?? null;

    const backdrop = document.createElement("div");
    backdrop.id = "avia-ban-dialog";
    Object.assign(backdrop.style, {
      position: "fixed", inset: "0", zIndex: 9999999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
    });
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

    const card = document.createElement("div");
    Object.assign(card.style, {
      padding: "24px", minWidth: "300px", maxWidth: "460px", width: "100%",
      borderRadius: "28px", display: "flex", flexDirection: "column",
      color: "var(--md-sys-color-on-surface)",
      background: "var(--md-sys-color-surface-container-high)",
      boxSizing: "border-box", gap: "var(--gap-md, 12px)",
    });

    const title = document.createElement("span");
    title.textContent = "Ban User";
    Object.assign(title.style, {
      lineHeight: "2rem", fontSize: "1.5rem", letterSpacing: "0",
      fontWeight: "400", color: "var(--md-sys-color-on-surface)",
    });

    const userPreview = document.createElement("div");
    Object.assign(userPreview.style, {
      display: "none", alignItems: "center", gap: "10px",
      padding: "10px 14px", borderRadius: "12px",
      background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
    });

    const userAvatar = document.createElement("img");
    Object.assign(userAvatar.style, {
      width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: "0",
    });

    const userNameSpan = document.createElement("span");
    Object.assign(userNameSpan.style, {
      fontSize: "0.95rem", fontWeight: "500", color: "var(--md-sys-color-on-surface)",
    });

    userPreview.append(userAvatar, userNameSpan);

    const { wrap: idWrap, el: idInput }         = mkField("User ID", "Paste user ID here…");
    const { wrap: reasonWrap, el: reasonInput } = mkField("Reason (optional)", "e.g. Spamming");

    const statusMsg = document.createElement("span");
    Object.assign(statusMsg.style, {
      fontSize: "0.75rem", lineHeight: "1.4", minHeight: "1rem",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    let lookupTimer = null;
    let resolvedUsername = null;
    let resolvedAvatar = null;

    async function lookupUser(id) {
      if (!id || !capturedToken) {
        userPreview.style.display = "none";
        resolvedUsername = null;
        return;
      }
      const res = await apiReq(`https://api.revolt.chat/users/${id}`, "GET");
      if (res.ok && res.body?.username) {
        resolvedUsername = `${res.body.username}${res.body.discriminator ? "#" + res.body.discriminator : ""}`;
        resolvedAvatar = res.body.avatar
          ? `https://cdn.stoatusercontent.com/avatars/${res.body.avatar._id}`
          : `https://api.revolt.chat/users/${id}/default_avatar`;
        userAvatar.src = resolvedAvatar;
        userAvatar.onerror = () => { userAvatar.style.display = "none"; };
        userNameSpan.textContent = resolvedUsername;
        userPreview.style.display = "flex";
        statusMsg.textContent = "";
        statusMsg.style.color = "var(--md-sys-color-on-surface-variant)";
      } else {
        resolvedUsername = null;
        userPreview.style.display = "none";
        if (id.length > 10) {
          statusMsg.textContent = "⚠️ User not found — double-check the ID.";
          statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
        }
      }
    }

    idInput.oninput = () => {
      resolvedUsername = null;
      userPreview.style.display = "none";
      statusMsg.textContent = "";
      clearTimeout(lookupTimer);
      const val = idInput.value.trim();
      if (val.length > 10) lookupTimer = setTimeout(() => lookupUser(val), 500);
    };

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, {
      gap: "8px", display: "flex", justifyContent: "flex-end", marginBlockStart: "8px",
    });

    const closeBtn  = mkDialogBtn("Cancel", false);
    const banBtn    = mkDialogBtn("Ban", true);

    banBtn.style.background = "var(--md-sys-color-error, #b3261e)";
    banBtn.style.color = "var(--md-sys-color-on-error, #fff)";

    closeBtn.onclick = close;

    function setBusy(label) {
      banBtn.disabled = true;
      banBtn.textContent = label;
      Object.assign(banBtn.style, {
        cursor: "not-allowed",
        background: "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
        color: "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
      });
    }

    function setReady() {
      banBtn.disabled = false;
      banBtn.textContent = "Ban";
      banBtn.style.background = "var(--md-sys-color-error, #b3261e)";
      banBtn.style.color = "var(--md-sys-color-on-error, #fff)";
      banBtn.style.cursor = "pointer";
    }

    banBtn.onclick = async () => {
      if (!capturedToken) {
        statusMsg.textContent = "⚠️ No token captured yet — interact with the page first.";
        statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
        return;
      }
      if (!serverId) {
        statusMsg.textContent = "⚠️ Couldn't detect server ID from URL.";
        statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
        return;
      }

      const uid = idInput.value.trim();
      if (!uid) { idInput.focus(); return; }

      setBusy("Banning…");

      if (!resolvedUsername) await lookupUser(uid);

      const body = {};
      const reason = reasonInput.value.trim();
      if (reason) body.reason = reason;

      const res = await apiReq(
        `https://api.revolt.chat/servers/${serverId}/bans/${uid}`,
        "PUT", body
      );

      if (res.ok) {
        const name = resolvedUsername ?? uid;
        statusMsg.textContent = `✅ Banned ${name} successfully.`;
        statusMsg.style.color = "var(--md-sys-color-primary)";
        idInput.value = "";
        reasonInput.value = "";
        userPreview.style.display = "none";
        resolvedUsername = null;
        setReady();

        setTimeout(close, 1500);
      } else {
        const errMsg = res.body?.type ?? res.body ?? res.status;
        statusMsg.textContent = `❌ Failed: ${errMsg}`;
        statusMsg.style.color = "var(--md-sys-color-error, #b3261e)";
        setReady();
      }
    };

    btnRow.append(closeBtn, banBtn);
    card.append(title, idWrap, userPreview, reasonWrap, statusMsg, btnRow);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    setTimeout(() => idInput.focus(), 50);

    function close() { backdrop.remove(); }
  }

  function injectBanButton() {

    const theads = document.querySelectorAll("thead tr");
    for (const thead of theads) {
      if (thead.querySelector("[data-avia-ban-btn]")) continue;

      const cells = thead.querySelectorAll("td");

      const hasUserField   = [...cells].some(td => td.querySelector("mdui-text-field[label='User']"));
      const hasReasonField = [...cells].some(td => td.querySelector("mdui-text-field[label='Reason']"));
      if (!hasUserField || !hasReasonField) continue;

      const lastTd = cells[cells.length - 1];

      const banBtn = document.createElement("button");
      banBtn.dataset.aviaBanBtn = "true";
      banBtn.type = "button";
      banBtn.textContent = "+ Ban User";
      Object.assign(banBtn.style, {
        lineHeight: "1.25rem", fontSize: "0.875rem",
        letterSpacing: "0.015625rem", fontWeight: "500",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px", height: "40px", whiteSpace: "nowrap",
        borderRadius: "var(--borderRadius-full, 9999px)",
        border: "none", cursor: "pointer", fontFamily: "inherit",
        transition: "var(--transitions-medium, 200ms) all",
        background: "var(--md-sys-color-error, #b3261e)",
        color: "var(--md-sys-color-on-error, #fff)",
      });
      banBtn.onmouseenter = () => banBtn.style.opacity = "0.85";
      banBtn.onmouseleave = () => banBtn.style.opacity = "1";
      banBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openBanDialog();
      };

      lastTd.appendChild(banBtn);
    }
  }

  let debounceTimer = null;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectBanButton, 150);
  }).observe(document.body, { childList: true, subtree: true });

  injectBanButton();
})();