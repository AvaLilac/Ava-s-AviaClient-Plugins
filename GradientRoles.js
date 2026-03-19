(function () {
  if (window.__AVIA_GRADIENT_ROLE__) return;
  window.__AVIA_GRADIENT_ROLE__ = true;

  let capturedToken = null;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    try {
      const [, options] = args;
      const headers = options?.headers;
      if (headers) {
        if (typeof headers.get === "function") {
          const t = headers.get("X-Session-Token") || headers.get("x-session-token");
          if (t) capturedToken = t;
        } else {
          const t = headers["X-Session-Token"] || headers["x-session-token"];
          if (t) capturedToken = t;
        }
      }
    } catch (_) {}
    return originalFetch.apply(this, args);
  };

  async function apiReq(url, method, body) {
    const res = await originalFetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Session-Token": capturedToken },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    try { return { ok: res.ok, body: JSON.parse(text) }; }
    catch { return { ok: res.ok, body: text }; }
  }

  async function createGradientRole(serverId, name, gradient) {
    const cr = await apiReq(
      `https://api.revolt.chat/servers/${serverId}/roles`,
      "POST", { name, colour: "#ff0000" }
    );
    if (!cr.ok || !cr.body?.id) return { ok: false, body: cr.body };
    return await apiReq(
      `https://api.revolt.chat/servers/${serverId}/roles/${cr.body.id}`,
      "PATCH", { colour: gradient }
    );
  }

  async function editRoleGradient(serverId, roleId, gradient) {
    return await apiReq(
      `https://api.revolt.chat/servers/${serverId}/roles/${roleId}`,
      "PATCH", { colour: gradient }
    );
  }

  let stops = [
    { color: "#ff0000", pos: 0 },
    { color: "#ff00ff", pos: 50 },
    { color: "#0000ff", pos: 100 },
  ];
  let gType = "linear";
  let gAngle = 90;

  let inputMode = "picker";
  let hardStop = false;

  function toHardStops(stopsArr) {
    const n = stopsArr.length;
    const out = [];
    stopsArr.forEach((stop, i) => {
      const start = Math.round((i / n) * 100);
      const end   = Math.round(((i + 1) / n) * 100);

      out.push(start === 0  ? stop.color : `${stop.color} ${start}%`);
      out.push(end   === 100 ? stop.color : `${stop.color} ${end}%`);
    });
    return out.join(",");
  }

  function buildGradientCSS(stopsStr) {

    if (gType === "radial") return `radial-gradient(${stopsStr})`;
    return `linear-gradient(${gAngle}deg,${stopsStr})`;
  }

  function resolveToHex(color) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

      const hex6 = [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
      const canShorten = hex6[0] === hex6[1] && hex6[2] === hex6[3] && hex6[4] === hex6[5];
      return canShorten ? `#${hex6[0]}${hex6[2]}${hex6[4]}` : `#${hex6}`;
    } catch (_) {
      return color;
    }
  }

  function hexifyStops(stopsArr) {
    return stopsArr.map(s => ({ ...s, color: resolveToHex(s.color) }));
  }

  function buildCSSFromStops(forApi = false) {
    const s = forApi ? hexifyStops(stops) : stops;
    const stopsStr = hardStop
      ? toHardStops(s)
      : s.map(s => `${s.color} ${s.pos}%`).join(forApi ? "," : ", ");
    return buildGradientCSS(stopsStr);
  }

  function parseNamedColors(raw) {

    const parts = raw.replace(/,\s*$/, "").split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length < 1) return null;

    const tester = document.createElement("div");
    tester.style.display = "none";
    document.body.appendChild(tester);

    function isValidColor(color) {

      if (/^#([0-9a-fA-F]{3,8})$/.test(color)) return true;
      if (/^rgb/i.test(color)) return true;
      if (/^hsl/i.test(color)) return true;

      tester.style.color = "";
      tester.style.color = color;
      const computed = getComputedStyle(tester).color;

      if (!computed) return false;
      if (computed === "rgba(0, 0, 0, 0)") return color.trim().toLowerCase() === "transparent";
      return true;
    }

    const valid = [];
    for (const color of parts) {
      if (isValidColor(color)) valid.push(color);

    }
    tester.remove();

    if (valid.length < 1) return null;
    if (valid.length === 1) {
      return [{ color: valid[0], pos: 0 }, { color: valid[0], pos: 100 }];
    }

    return valid.map((color, i) => ({
      color,
      pos: Math.round((i / (valid.length - 1)) * 100),
    }));
  }

  function buildCSSFromText(raw, forApi = false) {
    const parsed = parseNamedColors(raw);
    if (!parsed) return null;
    const s = forApi ? hexifyStops(parsed) : parsed;
    const stopsStr = hardStop
      ? toHardStops(s)
      : s.map(s => `${s.color} ${s.pos}%`).join(forApi ? "," : ", ");
    return buildGradientCSS(stopsStr);
  }

  function openDialog(mode) {
    if (document.getElementById("avia-gradient-dialog")) return;

    stops = [
      { color: "#ff0000", pos: 0 },
      { color: "#ff00ff", pos: 50 },
      { color: "#0000ff", pos: 100 },
    ];
    gType = "linear";
    gAngle = 90;
    inputMode = "picker";
    hardStop = false;

    const isEdit = mode === "edit";
    const serverIdFromUrl = window.location.pathname.match(/\/server\/([^/]+)/)?.[1] ?? null;

    const backdrop = document.createElement("div");
    backdrop.id = "avia-gradient-dialog";
    Object.assign(backdrop.style, {
      position: "fixed", inset: "0",
      zIndex: 9999999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
    });
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

    const card = document.createElement("div");
    Object.assign(card.style, {
      padding: "24px",
      minWidth: "280px",
      maxWidth: "520px",
      width: "100%",
      borderRadius: "28px",
      display: "flex",
      flexDirection: "column",
      color: "var(--md-sys-color-on-surface)",
      background: "var(--md-sys-color-surface-container-high)",
      boxSizing: "border-box",
    });

    const title = document.createElement("span");
    title.textContent = isEdit ? "Edit Role Gradient" : "Create Gradient Role";
    Object.assign(title.style, {
      lineHeight: "2rem",
      fontSize: "1.5rem",
      letterSpacing: "0",
      fontWeight: "400",
      marginBlockEnd: "16px",
      color: "var(--md-sys-color-on-surface)",
    });

    const sub = document.createElement("div");
    Object.assign(sub.style, {
      color: "var(--md-sys-color-on-surface-variant)",
      lineHeight: "1.25rem",
      fontSize: "0.875rem",
      letterSpacing: "0.015625rem",
      fontWeight: "400",
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-md, 12px)",
    });

    function mkField(label, placeholder, val) {
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
      if (val !== undefined) el.value = val;
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

    const { wrap: nameWrap, el: nameInput } = isEdit
      ? { wrap: null, el: null }
      : mkField("Role Name", "Gradient Role", "Gradient Role");

    const { wrap: roleIdWrap, el: roleIdInput } = isEdit
      ? mkField("Role ID", "Paste role ID here")
      : { wrap: null, el: null };

    const preview = document.createElement("div");
    Object.assign(preview.style, {
      height: "36px", borderRadius: "8px",
      border: "1px solid color-mix(in srgb, 12% var(--md-sys-color-on-surface), transparent)",
      transition: "background 0.2s",
    });

    const toggleRow = document.createElement("div");
    Object.assign(toggleRow.style, {
      display: "flex", gap: "0", borderRadius: "8px", overflow: "hidden",
      border: "1px solid color-mix(in srgb, 18% var(--md-sys-color-on-surface), transparent)",
      alignSelf: "flex-start",
    });

    function mkToggleBtn(label, modeKey) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.dataset.modeKey = modeKey;
      Object.assign(btn.style, {
        padding: "6px 14px", border: "none", cursor: "pointer",
        fontSize: "0.8rem", fontFamily: "inherit",
        transition: "background 0.15s, color 0.15s",
      });
      return btn;
    }

    const pickerToggle = mkToggleBtn("🎨 Color Picker", "picker");
    const textToggle   = mkToggleBtn("✏️ Named Colors", "text");

    function applyToggleStyles() {
      [pickerToggle, textToggle].forEach(btn => {
        const active = btn.dataset.modeKey === inputMode;
        btn.style.background = active
          ? "var(--md-sys-color-primary)"
          : "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)";
        btn.style.color = active
          ? "var(--md-sys-color-on-primary)"
          : "var(--md-sys-color-on-surface-variant)";
      });
    }

    toggleRow.append(pickerToggle, textToggle);

    const typeRow = document.createElement("div");
    Object.assign(typeRow.style, { display: "flex", gap: "10px", alignItems: "center" });

    const typeSelect = document.createElement("select");
    Object.assign(typeSelect.style, {
      padding: "8px 12px", borderRadius: "4px",
      border: "none", outline: "none", flexShrink: "0",
      background: "color-mix(in srgb, 8% var(--md-sys-color-on-surface), transparent)",
      color: "var(--md-sys-color-on-surface)",
      fontSize: "0.875rem", fontFamily: "inherit", cursor: "pointer",
    });
    ["linear", "radial"].forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1);
      typeSelect.appendChild(o);
    });
    typeSelect.value = gType;

    const angleLabel = document.createElement("span");
    Object.assign(angleLabel.style, {
      fontSize: "0.75rem", whiteSpace: "nowrap", width: "58px",
      color: "var(--md-sys-color-on-surface-variant)",
    });
    angleLabel.textContent = `${gAngle}°`;

    const angleSlider = document.createElement("input");
    angleSlider.type = "range"; angleSlider.min = 0; angleSlider.max = 360; angleSlider.value = gAngle;
    Object.assign(angleSlider.style, { flex: "1", accentColor: "var(--md-sys-color-primary)" });
    angleSlider.oninput = () => {
      gAngle = +angleSlider.value;
      angleLabel.textContent = `${gAngle}°`;
      refresh();
    };

    typeSelect.onchange = () => {
      gType = typeSelect.value;
      angleSlider.style.display = gType === "radial" ? "none" : "";
      angleLabel.style.display  = gType === "radial" ? "none" : "";
      refresh();
    };

    typeRow.append(typeSelect, angleSlider, angleLabel);

    const hardStopRow = document.createElement("label");
    Object.assign(hardStopRow.style, {
      display: "flex", alignItems: "center", gap: "10px",
      cursor: "pointer", userSelect: "none",
      padding: "8px 12px", borderRadius: "8px",
      background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
    });

    const hardStopCheckbox = document.createElement("input");
    hardStopCheckbox.type = "checkbox";
    hardStopCheckbox.checked = hardStop;
    Object.assign(hardStopCheckbox.style, {
      width: "16px", height: "16px", cursor: "pointer",
      accentColor: "var(--md-sys-color-primary)", flexShrink: "0",
    });
    hardStopCheckbox.onchange = () => {
      hardStop = hardStopCheckbox.checked;
      hardStopDesc.textContent = hardStop
        ? "Colors snap sharply — no blending between them."
        : "Colors blend smoothly from one to the next.";
      refresh();
    };

    const hardStopTextWrap = document.createElement("div");
    Object.assign(hardStopTextWrap.style, { display: "flex", flexDirection: "column", gap: "2px" });

    const hardStopLabel = document.createElement("span");
    hardStopLabel.textContent = "Hard stops (no transition)";
    Object.assign(hardStopLabel.style, {
      fontSize: "0.875rem", color: "var(--md-sys-color-on-surface)",
    });

    const hardStopDesc = document.createElement("span");
    hardStopDesc.textContent = "Colors blend smoothly from one to the next.";
    Object.assign(hardStopDesc.style, {
      fontSize: "0.72rem", color: "var(--md-sys-color-on-surface-variant)", lineHeight: "1.4",
    });

    hardStopTextWrap.append(hardStopLabel, hardStopDesc);
    hardStopRow.append(hardStopCheckbox, hardStopTextWrap);

    const pickerSection = document.createElement("div");
    Object.assign(pickerSection.style, { display: "flex", flexDirection: "column", gap: "6px" });

    const stopsList = document.createElement("div");
    Object.assign(stopsList.style, { display: "flex", flexDirection: "column", gap: "6px" });

    function renderStops() {
      stopsList.innerHTML = "";
      stops.forEach((stop, idx) => {
        const row = document.createElement("div");
        Object.assign(row.style, {
          display: "flex", gap: "8px", alignItems: "center",
          background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
          borderRadius: "8px", padding: "8px 10px",
        });

        const swatch = document.createElement("input");
        swatch.type = "color"; swatch.value = stop.color;
        Object.assign(swatch.style, {
          width: "30px", height: "30px", borderRadius: "50%",
          border: "none", cursor: "pointer", padding: "2px",
          background: "none", flexShrink: "0",
        });
        swatch.oninput = () => { stops[idx].color = swatch.value; refresh(); };

        const slider = document.createElement("input");
        slider.type = "range"; slider.min = 0; slider.max = 100; slider.value = stop.pos;
        Object.assign(slider.style, { flex: "1", accentColor: "var(--md-sys-color-primary)" });

        const posLbl = document.createElement("span");
        Object.assign(posLbl.style, {
          fontSize: "0.75rem", width: "30px", textAlign: "right",
          color: "var(--md-sys-color-on-surface-variant)",
        });
        posLbl.textContent = stop.pos + "%";

        slider.oninput = () => {
          stops[idx].pos = +slider.value;
          posLbl.textContent = slider.value + "%";
          refresh();
        };

        const rmBtn = document.createElement("button");
        rmBtn.textContent = "✕";
        Object.assign(rmBtn.style, {
          background: "none", border: "none", cursor: "pointer", flexShrink: "0",
          color: "var(--md-sys-color-on-surface-variant)",
          fontSize: "0.875rem", padding: "2px 6px", borderRadius: "4px",
        });
        rmBtn.onclick = () => {
          if (stops.length <= 2) return;
          stops.splice(idx, 1);
          renderStops(); refresh();
        };

        row.append(swatch, slider, posLbl, rmBtn);
        stopsList.appendChild(row);
      });
      addStopBtn.style.display  = stops.length >= 5 ? "none" : "";
      pickerCapMsg.style.display = stops.length >= 5 ? "" : "none";
    }

    const addStopBtn = document.createElement("button");
    addStopBtn.textContent = "+ Add Stop";
    Object.assign(addStopBtn.style, {
      alignSelf: "flex-start",
      background: "none", border: "none", cursor: "pointer",
      color: "var(--md-sys-color-primary)",
      fontSize: "0.875rem", letterSpacing: "0.015625rem",
      padding: "4px 0", fontFamily: "inherit",
    });
    addStopBtn.onclick = () => {
      if (stops.length >= 5) return;
      stops.push({ color: "#ffffff", pos: Math.min(100, stops[stops.length - 1].pos + 10) });
      renderStops(); refresh();
    };

    const pickerCapMsg = document.createElement("span");
    pickerCapMsg.textContent = "Stoat only supports up to 128 characters — 5 colors is the max.";
    Object.assign(pickerCapMsg.style, {
      display: "none", fontSize: "0.72rem", lineHeight: "1.4",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    const pickerLenMsg = document.createElement("span");
    Object.assign(pickerLenMsg.style, {
      fontSize: "0.72rem", lineHeight: "1.4",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    pickerSection.append(stopsList, addStopBtn, pickerCapMsg, pickerLenMsg);

    const textSection = document.createElement("div");
    Object.assign(textSection.style, { display: "none", flexDirection: "column", gap: "8px" });

    const textLbl = document.createElement("label");
    textLbl.textContent = "Colors (comma-separated)";
    Object.assign(textLbl.style, {
      fontSize: "0.75rem", letterSpacing: "0.025rem",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    const textInput = document.createElement("input");
    textInput.placeholder = "e.g.  red, yellow, green, blue";
    Object.assign(textInput.style, {
      width: "100%", boxSizing: "border-box",
      padding: "12px 16px", borderRadius: "4px",
      border: "none", outline: "none",
      background: "color-mix(in srgb, 8% var(--md-sys-color-on-surface), transparent)",
      color: "var(--md-sys-color-on-surface)",
      fontSize: "1rem", fontFamily: "inherit",
      borderBottom: "1px solid var(--md-sys-color-on-surface-variant)",
    });
    textInput.onfocus = () => textInput.style.borderBottom = "2px solid var(--md-sys-color-primary)";
    textInput.onblur  = () => textInput.style.borderBottom = "1px solid var(--md-sys-color-on-surface-variant)";
    textInput.oninput = () => refresh();

    const textHint = document.createElement("span");
    Object.assign(textHint.style, {
      fontSize: "0.72rem",
      color: "var(--md-sys-color-on-surface-variant)",
      lineHeight: "1.4",
    });
    textHint.textContent =
      "Accepts any CSS color name (red, gold, dodgerblue…), hex (#ff00ff), rgb(), or hsl(). " +
      "Colors will be evenly spaced automatically.";

    const textCapMsg = document.createElement("span");
    textCapMsg.textContent = "Stoat only supports up to 128 characters — 5 colors is the max.";
    Object.assign(textCapMsg.style, {
      display: "none", fontSize: "0.72rem", lineHeight: "1.4",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    const textLenMsg = document.createElement("span");
    Object.assign(textLenMsg.style, {
      fontSize: "0.72rem", lineHeight: "1.4",
      color: "var(--md-sys-color-on-surface-variant)",
    });

    textSection.append(textLbl, textInput, textHint, textCapMsg, textLenMsg);

    if (isEdit) {
      sub.append(roleIdWrap, preview, toggleRow, typeRow, hardStopRow, pickerSection, textSection);
    } else {
      sub.append(nameWrap, preview, toggleRow, typeRow, hardStopRow, pickerSection, textSection);
    }

    function switchMode(m) {
      inputMode = m;
      applyToggleStyles();
      pickerSection.style.display = m === "picker" ? "flex" : "none";
      textSection.style.display   = m === "text"   ? "flex" : "none";
      refresh();
    }

    pickerToggle.onclick = () => switchMode("picker");
    textToggle.onclick   = () => switchMode("text");

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, {
      gap: "8px", display: "flex", justifyContent: "flex-end", marginBlockStart: "24px",
    });

    function mkDialogBtn(label, primary) {
      const btn = document.createElement("button");
      btn.textContent = label;
      Object.assign(btn.style, {
        lineHeight: "1.25rem", fontSize: "0.875rem",
        letterSpacing: "0.015625rem", fontWeight: "400",
        position: "relative", padding: "0 16px", flexShrink: "0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", cursor: "pointer",
        border: "none",
        transition: "var(--transitions-medium, 200ms) all",
        color: primary ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-primary)",
        height: "40px", borderRadius: "var(--borderRadius-full, 9999px)",
        background: primary ? "var(--md-sys-color-primary)" : "none",
      });
      return btn;
    }

    const closeBtn = mkDialogBtn("Close", false);
    closeBtn.onclick = close;

    const actionLabel = isEdit ? "Save" : "Create";
    const actionBtn = mkDialogBtn(actionLabel, true);

    function setDisabled() {
      actionBtn.disabled = true;
      actionBtn.textContent = isEdit ? "Saving…" : "Creating…";
      Object.assign(actionBtn.style, {
        cursor: "not-allowed",
        color: "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
        background: "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
      });
    }

    function setEnabled() {
      actionBtn.disabled = false;
      actionBtn.textContent = actionLabel;
      Object.assign(actionBtn.style, {
        cursor: "pointer",
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      });
    }

    actionBtn.onclick = async () => {
      if (!capturedToken) {
        actionBtn.textContent = "No token yet!";
        setTimeout(setEnabled, 2000);
        return;
      }
      const sid = serverIdFromUrl;
      if (!sid) {
        actionBtn.textContent = "Can't find server ID";
        setTimeout(setEnabled, 2000);
        return;
      }

      let css;
      if (inputMode === "text") {
        const raw = textInput.value.trim();

        const parts = raw.replace(/,\s*$/, "").split(",").map(p => p.trim()).filter(Boolean);
        css = buildCSSFromText(raw, true);
        if (!css || parts.length < 2) {
          actionBtn.textContent = "Need 2+ colors!";
          setTimeout(setEnabled, 2000);
          textInput.focus();
          return;
        }
        if (parts.length > 5) {
          actionBtn.textContent = "Max 5 colors!";
          setTimeout(setEnabled, 2000);
          textInput.focus();
          return;
        }
      } else {
        css = buildCSSFromStops(true);
      }

      setDisabled();

      if (css.length > 128) {
        setEnabled();
        actionBtn.textContent = "Too long!";
        setTimeout(setEnabled, 2000);
        return;
      }
      let res;
      if (isEdit) {
        const rid = roleIdInput.value.trim();
        if (!rid) { setEnabled(); roleIdInput.focus(); return; }
        res = await editRoleGradient(sid, rid, css);
      } else {
        res = await createGradientRole(sid, nameInput.value.trim() || "Gradient Role", css);
      }
      if (res?.ok) {
        close();
      } else {
        setEnabled();
        actionBtn.textContent = "Failed";
        console.error(res);
        setTimeout(setEnabled, 2000);
      }
    };

    btnRow.append(closeBtn, actionBtn);
    card.append(title, sub, btnRow);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    function close() { backdrop.remove(); }

    function updateLenMsg(msg, css) {
      const len = css ? css.length : 0;
      if (len > 128) {
        msg.textContent = `⚠️ ${len}/128 chars — Stoat will reject this, too long.`;
        msg.style.color = "var(--md-sys-color-error, #b3261e)";
      } else if (len > 100) {
        msg.textContent = `${len}/128 chars — getting close to Stoat's limit.`;
        msg.style.color = "orange";
      } else {
        msg.textContent = `${len}/128 chars`;
        msg.style.color = "var(--md-sys-color-on-surface-variant)";
      }
    }

    function refresh() {
      let css;
      if (inputMode === "text") {
        css = buildCSSFromText(textInput.value.trim()) || "transparent";
        const validCount = (parseNamedColors(textInput.value.trim()) || []).length;
        const realCount = validCount === 2 && textInput.value.trim().split(",").filter(p => p.trim()).length === 1 ? 1 : validCount;
        const overCap = realCount > 5;
        textCapMsg.style.display = overCap ? "" : "none";
        updateLenMsg(textLenMsg, overCap ? null : buildCSSFromText(textInput.value.trim(), true));
      } else {
        css = buildCSSFromStops();
        updateLenMsg(pickerLenMsg, buildCSSFromStops(true));
      }
      preview.style.background = css;
    }

    applyToggleStyles();
    renderStops();
    refresh();
  }

  function injectGradientRoleButton() {
    const createBtn = [...document.querySelectorAll("a.pos_relative.cursor_pointer")]
      .find(a => a.innerText.includes("Create Role") && !a.innerText.includes("Gradient"));
    if (!createBtn) return;

    const parent = createBtn.parentElement;
    if (parent.querySelector("[data-avia-gradient-btn]")) return;

    function makeClone(labelText, subLabelText, mode) {
      const clone = createBtn.cloneNode(true);
      clone.dataset.aviaGradientBtn = mode;
      const labelDiv = clone.querySelector("div.flex-g_1 div");
      if (labelDiv) labelDiv.textContent = labelText;
      const subText = clone.querySelector("span");
      if (subText) subText.textContent = subLabelText;
      clone.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDialog(mode);
      };
      return clone;
    }

    const createClone = makeClone("Create Gradient Role", "Create a role with gradient color", "create");
    const editClone   = makeClone("Edit Role Gradient",   "Change an existing role's gradient",  "edit");

    parent.insertBefore(createClone, createBtn.nextSibling);
    parent.insertBefore(editClone, createClone.nextSibling);
  }

  let debounceTimer = null;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectGradientRoleButton, 150);
  }).observe(document.body, { childList: true, subtree: true });

  injectGradientRoleButton();
})();
