(function () {

  if (window.__AVIA_MASQ_PANEL__) return;
  window.__AVIA_MASQ_PANEL__ = true;

  const STORAGE_ENABLED = "avia_masq_enabled";
  const STORAGE_LIST    = "avia_masq_list";
  const MASQ_PERM_BIT   = 1 << 28;

  let ENABLED   = localStorage.getItem(STORAGE_ENABLED) !== "false";
  let MASQ_LIST = JSON.parse(localStorage.getItem(STORAGE_LIST) || "[]");

  // IndexedDB
  function readAuth() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("localforage");
      req.onerror   = () => reject(new Error("Failed to open IndexedDB"));
      req.onsuccess = () => {
        const db    = req.result;
        const tx    = db.transaction("keyvaluepairs", "readonly");
        const store = tx.objectStore("keyvaluepairs");
        const get   = store.get("auth");
        get.onsuccess = () => {
          const val = get.result;
          db.close();
          resolve({
            token:  val?.session?.token   ?? val?.token   ?? null,
            userId: val?.session?.userId ?? val?.userId ?? null,
          });
        };
        get.onerror = () => { db.close(); reject(new Error("Failed to read auth key")); };
      };
    });
  }

  // Permission cache
  const channelPerms = new Map();

  function hasMasqPerm(channelId) {
    const perms = channelPerms.get(channelId);
    if (perms == null) return false;
    return (perms & MASQ_PERM_BIT) !== 0;
  }

  function getCurrentChannelId() {
    const m = window.location.pathname.match(/\/channel\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  // Permission resolution
  async function fetchChannelPerms(channelId) {
    if (channelPerms.has(channelId)) {
      updatePanelPermState();
      return;
    }

    try {
      const { token, userId } = await readAuth();
      if (!token || !userId) {
        console.warn("[Masq] Missing token or userId in IndexedDB");
        updatePanelPermState();
        return;
      }

      // Fetch channel
      const chanRes = await originalFetch(`https://stoat.chat/api/channels/${channelId}`, {
        headers: { "x-session-token": token }
      });
      if (!chanRes.ok) {
        console.warn("[Masq] Channel fetch failed:", chanRes.status);
        channelPerms.set(channelId, null);
        updatePanelPermState();
        return;
      }
      const channel = await chanRes.json();
      console.log("[Masq] Channel:", channel);
      // DM - just allow it
      if (channel.channel_type === "DirectMessage") {
        const input = document.querySelector("textarea[placeholder], div[contenteditable='true']");
        const canSend = input && !input.disabled && !input.closest("[aria-disabled='true']");
        channelPerms.set(channelId, canSend ? MASQ_PERM_BIT : 0);
        updatePanelPermState();
        return;
      }
      // Group - use default_permissions directly
      if (channel.channel_type === "Group") {
        const perms = channel.permissions ?? null;
        channelPerms.set(channelId, perms != null ? Number(perms) : null);
        updatePanelPermState();
        return;
      }

      // TextChannel - resolve via server member + roles
      if (channel.channel_type === "TextChannel") {
        const serverId = channel.server;
        if (!serverId) {
          console.warn("[Masq] TextChannel has no server field");
          channelPerms.set(channelId, null);
          updatePanelPermState();
          return;
        }

        // Fetch our member record with roles
        const memberRes = await originalFetch(
          `https://stoat.chat/api/servers/${serverId}/members/${userId}?roles=true`,
          { headers: { "x-session-token": token } }
        );
        if (!memberRes.ok) {
          console.warn("[Masq] Member fetch failed:", memberRes.status);
          channelPerms.set(channelId, null);
          updatePanelPermState();
          return;
        }
        const member = await memberRes.json();
        console.log("[Masq] Member:", member);

        // Start from default_permissions on the channel (server-wide baseline)
        let resolved = Number(channel.default_permissions ?? 0);

        // Apply each role's allow/deny in order
        const roles = Object.values(member.roles ?? {});
        for (const role of roles) {
          const allow = Number(role?.permissions?.a ?? role?.permissions?.allow ?? 0);
          const deny  = Number(role?.permissions?.d ?? role?.permissions?.deny  ?? 0);
          resolved |= allow;
          resolved &= ~deny;
        }

        // Apply channel overwrites - keyed by role id or user id
        const overwrites = channel.role_permissions ?? channel.overwrites ?? {};
        // Handle both array and object shapes
        const overwriteList = Array.isArray(overwrites)
          ? overwrites
          : Object.entries(overwrites).map(([id, v]) => ({ id, ...v }));

        const roleIds = new Set(roles.map(r => r._id ?? r.id));
        for (const ow of overwriteList) {
          const owId = ow._id ?? ow.id;
          if (owId === userId || roleIds.has(owId)) {
            const allow = Number(ow?.permissions?.a ?? ow?.permissions?.allow ?? ow?.allow ?? 0);
            const deny  = Number(ow?.permissions?.d ?? ow?.permissions?.deny  ?? ow?.deny  ?? 0);
            resolved |= allow;
            resolved &= ~deny;
          }
        }

        console.log("[Masq] Resolved permissions:", resolved, "bit 28:", !!(resolved & MASQ_PERM_BIT));
        channelPerms.set(channelId, resolved);
        updatePanelPermState();
        return;
      }

      // Unknown channel type - fail safe
      console.warn("[Masq] Unknown channel_type:", channel.channel_type);
      channelPerms.set(channelId, null);
    } catch (e) {
      console.warn("[Masq] Error resolving permissions:", e);
      channelPerms.set(channelId, null);
    }

    updatePanelPermState();
  }

  // Navigation listener
  let _lastChanId = null;

  function onNavigate() {
    const id = getCurrentChannelId();
    if (id && id !== _lastChanId) {
      _lastChanId = id;
      fetchChannelPerms(id);
    }
  }

  const _origPushState    = history.pushState.bind(history);
  const _origReplaceState = history.replaceState.bind(history);
  history.pushState = function (...args) {
    _origPushState(...args);
    onNavigate();
  };
  history.replaceState = function (...args) {
    _origReplaceState(...args);
    onNavigate();
  };
  window.addEventListener("popstate", onNavigate);
  onNavigate();

  // Fetch monkey-patch
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (resource, config = {}) {
    const url    = resource?.toString?.() ?? "";
    const method = (config.method ?? "GET").toUpperCase();

    if (
      ENABLED &&
      method === "POST" &&
      url.includes("/channel/") &&
      url.includes("/messages") &&
      config.body &&
      typeof config.body === "string" &&
      MASQ_LIST.length
    ) {
      const chanIdMatch = url.match(/\/channel\/([^/?#]+)/);
      const chanId      = chanIdMatch?.[1] ?? null;

      try {
        const parsed     = JSON.parse(config.body);
        const activeMasq = MASQ_LIST.find(m => m.enabled);

        if (
          activeMasq &&
          typeof parsed?.content === "string" &&
          chanId &&
          hasMasqPerm(chanId)
        ) {
          parsed.masquerade = { name: activeMasq.name, avatar: activeMasq.avatar };
          config = { ...config, body: JSON.stringify(parsed) };
        }
      } catch (e) { console.warn("[Masq] Fetch intercept error:", e); }
    }

    return originalFetch(resource, config);
  };

  // UI helpers
  function updatePanelPermState() {
    const banner  = document.getElementById("avia-masq-perm-banner");
    const toolBtn = document.querySelector("#avia-masq-btn button");

    const chanId  = getCurrentChannelId();
    const cached  = chanId ? channelPerms.has(chanId) : false;
    const allowed = chanId ? hasMasqPerm(chanId) : false;

    if (banner) {
      if (!chanId) {
        banner.textContent = "ℹ️ Not in a channel.";
        banner.style.color = "#aaa";
      } else if (!cached) {
        banner.textContent = "⏳ Checking permissions...";
        banner.style.color = "#aaa";
      } else if (allowed) {
        banner.textContent = "✅ Masquerade permitted in this channel.";
        banner.style.color = "#4caf50";
      } else {
        banner.textContent = "🚫 No masquerade permission in this channel.";
        banner.style.color = "#f44336";
      }
    }

    if (toolBtn) {
      const disabled = cached && !allowed;
      toolBtn.style.opacity       = disabled ? "0.35" : "";
      toolBtn.style.filter        = disabled ? "grayscale(1)" : "";
      toolBtn.style.cursor        = disabled ? "not-allowed" : "pointer";
      toolBtn.style.pointerEvents = disabled ? "none" : "";
      toolBtn.title               = disabled
        ? "No masquerade permission in this channel"
        : "Masquerade";
    }
  }

  // Panel
  function toggleMasqPanel() {
    let panel = document.getElementById("avia-masq-panel");

    if (panel) {
      panel.style.display = panel.style.display === "none" ? "flex" : "none";
      if (panel.style.display === "flex") updatePanelPermState();
      return;
    }

    panel = document.createElement("div");
    panel.id = "avia-masq-panel";

    Object.assign(panel.style, {
      position:      "fixed",
      bottom:        "40px",
      right:         "40px",
      width:         "380px",
      height:        "560px",
      background:    "#1e1e1e",
      color:         "#fff",
      borderRadius:  "20px",
      boxShadow:     "0 12px 35px rgba(0,0,0,0.45)",
      zIndex:        999999,
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
      border:        "1px solid rgba(255,255,255,0.08)"
    });

    // Header
    const header = document.createElement("div");
    header.textContent = "Masquerade";
    Object.assign(header.style, {
      padding:      "18px",
      fontWeight:   "600",
      fontSize:     "16px",
      background:   "rgba(255,255,255,0.04)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      cursor:       "move",
      position:     "relative",
      textAlign:    "center",
      userSelect:   "none"
    });

    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener("mousedown", e => {
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.bottom = "auto";
      panel.style.right  = "auto";
      panel.style.left   = rect.left + "px";
      panel.style.top    = rect.top  + "px";
      document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", e => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - offsetX) + "px";
      panel.style.top  = (e.clientY - offsetY) + "px";
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });

    const toggleBtn = document.createElement("div");
    Object.assign(toggleBtn.style, {
      position:     "absolute",
      left:         "18px",
      top:          "16px",
      cursor:       "pointer",
      fontSize:     "12px",
      padding:      "4px 8px",
      borderRadius: "8px"
    });
    function updateToggleUI() {
      toggleBtn.textContent      = ENABLED ? "ON" : "OFF";
      toggleBtn.style.background = ENABLED
        ? "rgba(0,200,0,0.25)"
        : "rgba(200,0,0,0.25)";
    }
    updateToggleUI();
    toggleBtn.onclick = () => {
      ENABLED = !ENABLED;
      localStorage.setItem(STORAGE_ENABLED, ENABLED);
      updateToggleUI();
    };
    header.appendChild(toggleBtn);

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style, {
      position: "absolute",
      right:    "18px",
      top:      "16px",
      cursor:   "pointer"
    });
    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    // Body
    const container = document.createElement("div");
    Object.assign(container.style, {
      flex:      "1",
      overflowY: "auto",
      padding:   "18px"
    });

    const disclaimer = document.createElement("div");
    disclaimer.textContent = "⚠️ Masquerade only works in servers/groups with permission. Currently does not work in DMs. There has been a fix made, but it's not live yet.";
    Object.assign(disclaimer.style, {
      fontSize:     "12px",
      marginBottom: "8px",
      color:        "#ffcc00"
    });
    container.appendChild(disclaimer);

    const permBanner = document.createElement("div");
    permBanner.id = "avia-masq-perm-banner";
    Object.assign(permBanner.style, {
      fontSize:     "12px",
      marginBottom: "12px",
      color:        "#aaa"
    });
    container.appendChild(permBanner);
    updatePanelPermState();

    const nameInput = document.createElement("input");
    nameInput.placeholder = "Masq Name";
    Object.assign(nameInput.style, {
      width:        "100%",
      marginBottom: "6px",
      padding:      "6px",
      borderRadius: "6px",
      border:       "none",
      boxSizing:    "border-box"
    });

    const avatarInput = document.createElement("input");
    avatarInput.placeholder = "Avatar URL";
    Object.assign(avatarInput.style, {
      width:        "100%",
      marginBottom: "6px",
      padding:      "6px",
      borderRadius: "6px",
      border:       "none",
      boxSizing:    "border-box"
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Masquerade";
    Object.assign(addBtn.style, {
      width:        "100%",
      padding:      "6px",
      borderRadius: "6px",
      marginBottom: "12px",
      cursor:       "pointer"
    });

    addBtn.onclick = () => {
      const name   = nameInput.value.trim();
      const avatar = avatarInput.value.trim();
      if (!name || !avatar) return;
      const anyActive = MASQ_LIST.some(m => m.enabled);
      MASQ_LIST.push({ name, avatar, enabled: !anyActive });
      localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
      renderMasqList();
      nameInput.value   = "";
      avatarInput.value = "";
    };

    container.appendChild(nameInput);
    container.appendChild(avatarInput);
    container.appendChild(addBtn);

    const listWrapper = document.createElement("div");
    container.appendChild(listWrapper);

    function renderMasqList() {
      listWrapper.innerHTML = "";
      MASQ_LIST.forEach((m, i) => {
        const row = document.createElement("div");
        Object.assign(row.style, {
          display:      "flex",
          alignItems:   "center",
          marginBottom: "6px"
        });

        const btn = document.createElement("button");
        Object.assign(btn.style, {
          flex:         "1",
          padding:      "6px",
          borderRadius: "6px",
          border:       "none",
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          gap:          "8px",
          position:     "relative",
          background:   "rgba(255,255,255,0.08)"
        });

        const img = document.createElement("img");
        img.src = m.avatar;
        Object.assign(img.style, {
          width:        "24px",
          height:       "24px",
          borderRadius: "50%",
          objectFit:    "cover"
        });

        const nameSpan       = document.createElement("span");
        nameSpan.textContent = m.name;
        nameSpan.style.flex  = "1";

        const check = document.createElement("span");
        check.textContent = "✔";
        Object.assign(check.style, {
          position:   "absolute",
          right:      "6px",
          top:        "6px",
          fontSize:   "12px",
          color:      m.enabled ? "#0f0" : "transparent",
          fontWeight: "bold"
        });

        btn.appendChild(img);
        btn.appendChild(nameSpan);
        btn.appendChild(check);

        btn.onclick = () => {
          MASQ_LIST.forEach((x, idx) => x.enabled = idx === i);
          localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
          renderMasqList();
        };

        const delBtn         = document.createElement("button");
        delBtn.textContent   = "✕";
        Object.assign(delBtn.style, { marginLeft: "6px", cursor: "pointer" });
        delBtn.onclick = () => {
          MASQ_LIST.splice(i, 1);
          localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
          renderMasqList();
        };

        row.appendChild(btn);
        row.appendChild(delBtn);
        listWrapper.appendChild(row);
      });
    }

    renderMasqList();

    panel.appendChild(header);
    panel.appendChild(container);
    document.body.appendChild(panel);
  }

  // Inject toolbar button
  function injectSettingsButton() {
    if (document.getElementById("avia-masq-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
      .find(s => s.textContent.trim() === "gif");
    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id    = "avia-masq-btn";

    const btn   = clone.querySelector("button");
    btn.onclick = toggleMasqPanel;

    const spanIcon = clone.querySelector("span.material-symbols-outlined");
    spanIcon.textContent                 = "domino_mask";
    spanIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    spanIcon.style.color                 = "#e3e3e3";

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
  }

  new MutationObserver(injectSettingsButton)
    .observe(document.body, { childList: true, subtree: true });

  injectSettingsButton();

})();
