(function () {

  if (window.__HORIZONTAL_SERVER_BAR__) return;
  window.__HORIZONTAL_SERVER_BAR__ = true;

  const STYLE_ID   = '__hsb_style__';
  const BAR_H      = 54;
  const TITLEBAR_H = 29;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;

    const COL = `
      #root > div > div:nth-child(2) > div:first-child > div:first-child
    `;

    s.textContent = `

      #root > div > div:nth-child(2) {
        padding-top: ${BAR_H}px !important;
        box-sizing: border-box !important;
      }

      ${COL} {
        position: fixed !important;
        top: ${TITLEBAR_H}px !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: ${BAR_H}px !important;
        flex-direction: row !important;
        align-items: center !important;
        padding: 0 6px !important;
        box-sizing: border-box !important;
        z-index: 9000 !important;
        background: var(--md-sys-color-surface-container-highest) !important;
        border-bottom: 1px solid
          color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent) !important;
        overflow: visible !important;
        gap: 2px !important;
      }

      ${COL} > .will-change_transform {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        height: ${BAR_H}px !important;
        flex-grow: 1 !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
        scrollbar-width: none !important;
        gap: 2px !important;
        padding: 0 !important;
        min-width: 0 !important;
      }
      ${COL} > .will-change_transform::-webkit-scrollbar {
        display: none !important;
      }

      ${COL} .w_56px.h_56px {
        width: 44px !important;
        height: 44px !important;
        flex-shrink: 0 !important;
      }

      ${COL} > .will-change_transform > a[href="/app"] {
        width: 44px !important;
        height: 44px !important;
        flex-shrink: 0 !important;
      }

      ${COL} > .will-change_transform > div[aria-label] > a {
        width: 44px !important;
        height: 44px !important;
        flex-shrink: 0 !important;
      }

      ${COL} .w_56px.h_56px::before,
      ${COL} > .will-change_transform > a[href="/app"]::before,
      ${COL} > .will-change_transform > div[aria-label] > a::before {
        top: auto !important;
        bottom: -5px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 0px !important;
        height: 3px !important;
        border-radius: 2px !important;
      }


      ${COL} [class*="before\\]:h_0px"]::before  { width: 0px  !important; }

      ${COL} [class*="before\\]:h_8px"]::before  { width: 8px  !important; }

      ${COL} [class*="before\\]:h_32px"]::before { width: 24px !important; }

      ${COL} [class*="hover\\:before\\]:h_16px"]:hover::before { width: 14px !important; }

      ${COL} .h_1px.flex-sh_0 {
        width: 1px !important;
        height: 28px !important;
        margin: 0 5px !important;
        flex-shrink: 0 !important;
      }

      ${COL} [role="list"] {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 2px !important;
        height: ${BAR_H}px !important;
        overflow: visible !important;
      }

      ${COL} [role="listitem"] {
        height: ${BAR_H}px !important;
        display: flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
        cursor: grab !important;
      }

      ${COL} > .will-change_transform > div[aria-label]:not([aria-disabled]) {
        display: flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
        height: ${BAR_H}px !important;
      }

      ${COL} .h_0.z_1.pos_relative {
        display: none !important;
      }

      ${COL} > div[aria-label="Settings"] {
        display: flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
        height: ${BAR_H}px !important;
        margin-left: auto !important;
      }
      ${COL} > div[aria-label="Settings"] > a {
        width: 44px !important;
        height: 44px !important;
      }

      ${COL} svg[viewBox="0 0 32 32"] {
        width: 38px !important;
        height: 38px !important;
        flex-shrink: 0 !important;
      }
    `;
    document.head.appendChild(s);
  }

  let wheelBound = false;
  function bindWheel() {
    if (wheelBound) return;
    const col = getCol();
    if (!col) return;
    const scrollRow = col.querySelector('.will-change_transform');
    if (!scrollRow) return;

    scrollRow.addEventListener('wheel', (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      scrollRow.scrollLeft += e.deltaY;
    }, { passive: false });

    wheelBound = true;
  }

  function getCol() {
    return document.querySelector(
      '#root > div > div:nth-child(2) > div:first-child > div:first-child'
    );
  }

  function stamp() {
    const col = getCol();
    if (!col || !col.querySelector('[role="list"]')) return false;
    col.dataset.hsbDone = '1';
    bindWheel();
    return true;
  }

  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const col = getCol();
      if (col && col.dataset.hsbDone !== '1') stamp();
      else bindWheel();
    }, 80);
  }).observe(document.body, { childList: true, subtree: true });

  injectStyle();

  (function tryInit() {
    if (!stamp()) setTimeout(tryInit, 150);
  })();

})();