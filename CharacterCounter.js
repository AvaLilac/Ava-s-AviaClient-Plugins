(function () {
  if (window.__Character_Counter__) return;
  window.__Character_Counter__ = true;

  const MAX_CHARS = 2000;

  function getGifVisible() {
    return [...document.querySelectorAll("span.material-symbols-outlined")]
      .some(s => s.textContent.trim() === "gif");
  }

  function removeCounter() {
    const existing = document.getElementById("stoat-char-counter");
    if (existing) existing.remove();
  }

  function getEditor() {
    return document.querySelector(".cm-content[contenteditable='true']");
  }

  function getEditorHost(cmEditor) {
    return cmEditor?.closest("div.flex-g_1") || cmEditor?.parentElement?.parentElement || null;
  }

  function injectCounter(cmEditor) {
    if (!cmEditor) return;
    if (!getGifVisible()) {
      removeCounter();
      return;
    }

    if (document.getElementById("stoat-char-counter")) return;

    const host = getEditorHost(cmEditor);
    if (!host) return;

    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }

    const counter = document.createElement("div");
    counter.id = "stoat-char-counter";
    counter.style.cssText = `
      position: absolute;
      left: 12px;
      bottom: 1px;
      z-index: 5;
      font-size: 0.7rem;
      line-height: 1;
      opacity: 0.6;
      pointer-events: none;
      font-family: inherit;
      color: var(--md-sys-color-on-surface-variant);
      user-select: none;
    `;
    counter.textContent = `0 / ${MAX_CHARS}`;

    host.appendChild(counter);
  }

  function updateCounter(len) {
    const counter = document.getElementById("stoat-char-counter");
    if (!counter) return;

    counter.textContent = `${len} / ${MAX_CHARS}`;
    counter.style.opacity = len > MAX_CHARS * 0.9 ? "1" : "0.6";
    counter.style.color = len > MAX_CHARS
      ? "var(--md-sys-color-error, #f44336)"
      : "var(--md-sys-color-on-surface-variant)";
  }

  function getLength(cmContent) {
    try {
      const view = cmContent?.cmView?.view;
      if (view) return view.state.doc.length;
    } catch (_) {}
    return 0;
  }

  function hookEditor(cmContent) {
    if (!cmContent || cmContent.__charCounterHooked) return;
    cmContent.__charCounterHooked = true;

    const cmEditor = cmContent.closest(".cm-editor");

    const sync = () => {
      if (!getGifVisible()) {
        removeCounter();
        return;
      }
      injectCounter(cmContent);
      updateCounter(getLength(cmContent));
    };

    const observer = new MutationObserver(sync);
    observer.observe(cmContent, {
      childList: true,
      characterData: true,
      subtree: true
    });

    sync();
  }

  const observer = new MutationObserver(() => {
    const cmContent = getEditor();

    if (!getGifVisible()) {
      removeCounter();
      return;
    }

    if (cmContent) {
      hookEditor(cmContent);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const start = setInterval(() => {
    const cmContent = getEditor();
    if (cmContent) {
      hookEditor(cmContent);
      clearInterval(start);
    }
  }, 250);
})();