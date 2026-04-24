(function () {
    if (window.__WHISPER__) return;
    window.__WHISPER__ = true;

    function isDM() {
        return window.location.pathname.startsWith("/channel/");
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

    function hideVoiceWrapper() {
        const wrapper = findVoiceWrapper();
        if (!wrapper) return;
        wrapper.style.visibility = "hidden";
        wrapper.style.pointerEvents = "none";
    }

    function showVoiceWrapper() {
        const wrapper = findVoiceWrapper();
        if (!wrapper) return;
        wrapper.style.visibility = "visible";
        wrapper.style.pointerEvents = "none";
    }

    function restoreVoiceWrapper() {
        const wrapper = findVoiceWrapper();
        if (!wrapper) return;
        wrapper.style.visibility = "";
        wrapper.style.pointerEvents = "";
    }

    function removeInjectedBtn() {
        findInjectedBtn()?.remove();
    }

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

        hideVoiceWrapper();

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

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

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
                    hideVoiceWrapper();
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
        if (!findVoiceCard()) return;
        if (findActiveCall()) return;
        hideVoiceWrapper();
    }

    const observer = new MutationObserver(() => {
        injectVoiceButton();
        enforceHidden();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    injectVoiceButton();
    enforceHidden();
})();