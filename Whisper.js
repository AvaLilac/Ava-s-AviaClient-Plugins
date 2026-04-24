(function () {
    if (window.__WHISPER__) return;
    window.__WHISPER__ = true;

    const style = document.createElement("style");
    style.id = "whisper-hide";
    style.textContent = `
        [style*="position: fixed"] div.w_360px.h_120px {
            visibility: hidden !important;
            pointer-events: none !important;
            transition: none !important;
        }
    `;

    function isDM() {
        return window.location.pathname.startsWith("/channel/");
    }

    function applyCSS() {
        if (isDM()) {
            if (!document.getElementById("whisper-hide")) {
                document.head.appendChild(style);
            }
        } else {
            document.getElementById("whisper-hide")?.remove();
        }
    }

    function findVoiceCard() {
        return [...document.querySelectorAll("div.cursor_pointer")]
            .find(el => el.classList.contains("w_360px") && el.classList.contains("h_120px"));
    }

    function findVoiceInner() {
        return findVoiceCard()?.querySelector("div.pos_relative");
    }

    function findVoiceWrapper() {
        let el = findVoiceCard()?.parentElement;
        while (el) {
            if (el.style?.position === "fixed") return el;
            el = el.parentElement;
        }
        return null;
    }

    function findActiveCall() {
        return [...document.querySelectorAll("div.pointer-events_all")]
            .find(el => el.classList.contains("h_40vh") && el.classList.contains("w_100%"));
    }

    function findPinButton() {
        return document.querySelector('button[aria-label="View pinned messages"]');
    }

    function findInjectedBtn() {
        return document.querySelector("[data-avia-voice-btn]");
    }

    function showVoiceWrapper() {
        const wrapper = findVoiceWrapper();
        if (!wrapper) return;
        wrapper.style.transition = "none";
        wrapper.style.visibility = "visible";
        wrapper.style.pointerEvents = "none";
    }

    function restoreVoiceWrapper() {
        const wrapper = findVoiceWrapper();
        if (!wrapper) return;
        wrapper.style.transition = "";
        wrapper.style.visibility = "";
        wrapper.style.pointerEvents = "";
    }

    function removeInjectedBtn() {
        findInjectedBtn()?.remove();
    }

    // Tooltip
    let whisperTooltip = null;

    function getTooltip() {
        if (!whisperTooltip) {
            whisperTooltip = document.createElement("div");
            whisperTooltip.style.cssText = "position:fixed;z-index:999;display:none;pointer-events:none;";
            const inner = document.createElement("div");
            inner.className = "c_white bg_black p_var(--gap-md) bdr_var(--borderRadius-md) lh_0.875rem fs_0.6875rem ls_0.03125rem fw_500";
            inner.textContent = "Start voice call";
            whisperTooltip.appendChild(inner);
            document.body.appendChild(whisperTooltip);
        }
        return whisperTooltip;
    }

    function showTooltip(btn) {
        const t = getTooltip();
        t.style.display = "block";
        const rect = btn.getBoundingClientRect();
        // Position below the button, centered
        requestAnimationFrame(() => {
            const tw = t.getBoundingClientRect().width;
            const x = rect.left + (rect.width / 2) - (tw / 2);
            const y = rect.bottom + 6;
            t.style.left = x + "px";
            t.style.top  = y + "px";
        });
    }

    function hideTooltip() {
        getTooltip().style.display = "none";
    }

    function onRouteChange() {
        applyCSS();
        if (!isDM()) {
            removeInjectedBtn();
            restoreVoiceWrapper();
        }
    }

    const _pushState = history.pushState.bind(history);
    const _replaceState = history.replaceState.bind(history);

    history.pushState = function (...args) {
        _pushState(...args);
        onRouteChange();
    };

    history.replaceState = function (...args) {
        _replaceState(...args);
        onRouteChange();
    };

    window.addEventListener("popstate", onRouteChange);

    function injectVoiceButton() {
        if (!isDM()) {
            removeInjectedBtn();
            restoreVoiceWrapper();
            return;
        }

        const voiceCard = findVoiceCard();
        const pinBtn    = findPinButton();

        if (!voiceCard) {
            removeInjectedBtn();
            return;
        }

        if (!pinBtn) return;
        if (findInjectedBtn()) return;

        const btn = pinBtn.cloneNode(false);
        btn.setAttribute("data-avia-voice-btn", "true");
        btn.setAttribute("aria-label", "Start voice call");

        const ripple = document.createElement("md-ripple");
        ripple.setAttribute("aria-hidden", "true");
        btn.appendChild(ripple);

        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.style.cssText = "display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:24px;";
        icon.textContent = "call";
        btn.appendChild(icon);

        btn.addEventListener("mouseenter", () => showTooltip(btn));
        btn.addEventListener("mouseleave", hideTooltip);

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTooltip();

            if (findActiveCall()) return;

            const inner = findVoiceInner();
            if (!inner) return;

            showVoiceWrapper();

            const eventOpts = { bubbles: true, cancelable: true, view: window };
            inner.dispatchEvent(new PointerEvent("pointerenter", eventOpts));
            inner.dispatchEvent(new PointerEvent("pointerdown",  { ...eventOpts, pointerId: 1, isPrimary: true }));
            inner.dispatchEvent(new PointerEvent("pointerup",    { ...eventOpts, pointerId: 1, isPrimary: true }));
            inner.dispatchEvent(new MouseEvent("click",          eventOpts));

            setTimeout(() => {
                if (findActiveCall()) {
                    restoreVoiceWrapper();
                } else {
                    applyCSS();
                }
            }, 300);
        });

        pinBtn.insertAdjacentElement("afterend", btn);
    }

    function enforceHidden() {
        if (!isDM()) {
            restoreVoiceWrapper();
            return;
        }
        if (findActiveCall()) return;
        applyCSS();
    }

    const observer = new MutationObserver(() => {
        injectVoiceButton();
        enforceHidden();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    applyCSS();
    injectVoiceButton();
    enforceHidden();
})();