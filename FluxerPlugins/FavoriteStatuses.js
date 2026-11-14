/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/FavoriteStatuses.js
  @VERSION: 1.0
*/

(function() {
    if (window.__FAVORITE_STATUSES__) return;
    window.__FAVORITE_STATUSES__ = true;

    const STORAGE_KEY = "fav_status";

    let pending = false;

    const getFavs = () => {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(data) ? data.filter(item => typeof item === "string") : [];
        } catch {
            return [];
        }
    };

    const setFavs = data => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    function injectStyles() {
        if (document.getElementById("avia-favstatus-styles")) return;

        const style = document.createElement("style");
        style.id = "avia-favstatus-styles";
        style.textContent = `
            .avia-fav-input-row {
                width: 100%;
            }

            .avia-fav-input-row > [data-flx="ui.form.input.input-container"] {
                width: 100%;
                min-width: 0;
            }

            .avia-fav-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 4px;
                width: 100%;
            }

            .avia-fav-section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 32px;
            }

            .avia-fav-section-label {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--text-primary);
            }

            .avia-fav-star-btn {
                width: 32px;
                height: 32px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: rgba(255,255,255,0.35);
                cursor: pointer;
                font-size: 22px;
                transition: color 0.15s, background 0.15s;
            }

            .avia-fav-star-btn:hover,
            .avia-fav-star-btn.active {
                color: #ffc800;
            }

            .avia-fav-star-btn:hover {
                background: rgba(255,255,255,0.06);
            }

            .avia-fav-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 240px;
                overflow-y: auto;
                scrollbar-width: thin;
            }

            .avia-fav-item {
                display: flex;
                flex-direction: column;
                gap: 6px;
                width: 100%;
                min-width: 0;
            }

            .avia-fav-item-display {
                position: relative;
                display: flex;
                align-items: center;
                box-sizing: border-box;
                width: 100%;
                min-width: 0;
                height: 40px;
                min-height: 40px;
                padding: 0 44px 0 12px;
                overflow: hidden;
                white-space: nowrap;
                cursor: default;
                user-select: text;
            }

            .avia-fav-item-text {
                display: block;
                flex: 1;
                min-width: 0;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .avia-fav-item-use {
                align-self: flex-end;
                height: 28px;
                min-width: 52px;
                padding: 0 12px;
                border: none;
                border-radius: 6px;
                background: var(--background-secondary, rgba(255,255,255,0.1));
                color: var(--text-primary, rgba(255,255,255,0.9));
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s;
            }

            .avia-fav-item-use:hover {
                background: var(--background-modifier-hover, rgba(255,255,255,0.18));
            }

            .avia-fav-item-del {
                position: absolute;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
            }

            .avia-fav-empty {
                font-size: 12px;
                color: var(--text-muted, rgba(255,255,255,0.4));
                text-align: center;
                padding: 12px 0;
                font-style: italic;
            }
        `;

        document.head.appendChild(style);
    }

    function getInput(modal) {
        return modal.querySelector('[data-flx="user.custom-status-modal.custom-status-text.set-status-text"]');
    }

    function updateStar(modal) {
        const input = getInput(modal);
        const button = modal.querySelector(".avia-fav-star-btn");

        if (!input || !button) return;

        const current = input.value.trim();
        const active = current && getFavs().includes(current);

        button.classList.toggle("active", !!active);
    }

    function setStatus(modal, text) {
        const input = getInput(modal);
        if (!input) return;

        const descriptor = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
        );

        if (!descriptor?.set) return;

        descriptor.set.call(input, text);

        input.dispatchEvent(new Event("input", {
            bubbles: true,
            composed: true
        }));

        input.dispatchEvent(new Event("change", {
            bubbles: true,
            composed: true
        }));

        updateStar(modal);
    }

    function renderFavorites(modal) {
        const section = modal.querySelector(".avia-fav-section");
        if (!section) return;

        section.querySelector(".avia-fav-list")?.remove();

        const list = document.createElement("div");
        list.className = "avia-fav-list";

        const favs = getFavs();

        if (!favs.length) {
            const empty = document.createElement("div");
            empty.className = "avia-fav-empty";
            empty.textContent = "No favorites yet. Star a status to save it.";
            list.appendChild(empty);
        } else {
            favs.forEach(text => {
                const item = document.createElement("div");
                item.className = "avia-fav-item";

                const display = document.createElement("div");
                display.className = "avia-fav-item-display FormSurface.module__surface___OS1LcU FormInput.module__input___STEwc0 FormInput.module__minHeight___STEwc0 FormInput.module__focusable___STEwc0";

                const textDisplay = document.createElement("span");
                textDisplay.className = "avia-fav-item-text";
                textDisplay.textContent = text;

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "avia-fav-item-del CustomStatusModal.module__clearButtonIcon___ZXZDTF";
                remove.setAttribute("aria-label", "Remove favorite");

                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("width", "16");
                svg.setAttribute("height", "16");
                svg.setAttribute("fill", "currentColor");
                svg.setAttribute("viewBox", "0 0 256 256");
                svg.dataset.flx = "user.custom-status-modal.x-icon";

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", "M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z");

                svg.appendChild(path);
                remove.appendChild(svg);

                remove.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const updated = getFavs();
                    const index = updated.indexOf(text);

                    if (index !== -1) {
                        updated.splice(index, 1);
                    }

                    setFavs(updated);
                    renderFavorites(modal);
                    updateStar(modal);
                });

                display.append(textDisplay, remove);

                const use = document.createElement("button");
                use.type = "button";
                use.className = "avia-fav-item-use";
                use.textContent = "Use";

                use.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setStatus(modal, text);
                });

                item.append(display, use);
                list.appendChild(item);
            });
        }

        section.appendChild(list);
    }

    function injectModal(modal) {
        if (!modal.isConnected) return;

        const input = getInput(modal);
        if (!input) return;

        const container = input.closest('[data-flx="ui.form.input.input-container"]');
        const statusWrapper = input.closest('[data-flx="user.custom-status-modal.status-input-wrapper"]');

        if (!container || !statusWrapper) return;

        injectStyles();

        let row = modal.querySelector(".avia-fav-input-row");

        if (!row) {
            const parent = container.parentElement;
            if (!parent || container.parentNode !== parent) return;

            row = document.createElement("div");
            row.className = "avia-fav-input-row";

            parent.insertBefore(row, container);
            row.appendChild(container);
        } else if (!row.contains(container)) {
            row.appendChild(container);
        }

        let section = modal.querySelector(".avia-fav-section");

        if (!section) {
            section = document.createElement("div");
            section.className = "avia-fav-section";

            const header = document.createElement("div");
            header.className = "avia-fav-section-header";

            const heading = document.createElement("div");
            heading.className = "avia-fav-section-label";
            heading.textContent = "Saved Statuses";

            const star = document.createElement("button");
            star.type = "button";
            star.className = "avia-fav-star-btn";
            star.textContent = "★";

            star.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();

                const current = getInput(modal)?.value.trim();
                if (!current) return;

                const favs = getFavs();
                const index = favs.indexOf(current);

                if (index === -1) {
                    favs.push(current);
                } else {
                    favs.splice(index, 1);
                }

                setFavs(favs);
                renderFavorites(modal);
                updateStar(modal);
            });

            header.append(heading, star);
            section.appendChild(header);
        }

        if (statusWrapper.nextElementSibling !== section) {
            statusWrapper.parentNode.insertBefore(section, statusWrapper.nextSibling);
        }

        if (section.dataset.initialized !== "true") {
            section.dataset.initialized = "true";
            renderFavorites(modal);
        }

        updateStar(modal);
    }

    function processModal() {
        pending = false;

        document.querySelectorAll('[data-flx="user.custom-status-modal.modal-root"]').forEach(modal => {
            try {
                injectModal(modal);
            } catch (error) {
                console.error("[Avia Favorite Statuses]", error);
            }
        });
    }

    function scheduleProcess() {
        if (pending) return;

        pending = true;
        requestAnimationFrame(processModal);
    }

    function start() {
        injectStyles();
        processModal();

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type !== "childList") continue;

                const changed = [
                    ...mutation.addedNodes,
                    ...mutation.removedNodes
                ];

                const relevant = changed.some(node => {
                    if (!(node instanceof Element)) return false;

                    return node.matches('[data-flx="user.custom-status-modal.modal-root"]') ||
                        node.querySelector('[data-flx="user.custom-status-modal.modal-root"]') ||
                        node.matches('[data-flx="user.custom-status-modal.custom-status-text.set-status-text"]') ||
                        node.querySelector('[data-flx="user.custom-status-modal.custom-status-text.set-status-text"]') ||
                        node.matches('[data-flx="user.custom-status-modal.status-input-wrapper"]') ||
                        node.querySelector('[data-flx="user.custom-status-modal.status-input-wrapper"]');
                });

                if (relevant) {
                    scheduleProcess();
                    break;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.addEventListener("input", event => {
            if (!(event.target instanceof HTMLInputElement)) return;
            if (!event.target.matches('[data-flx="user.custom-status-modal.custom-status-text.set-status-text"]')) return;

            const modal = event.target.closest('[data-flx="user.custom-status-modal.modal-root"]');
            if (modal) updateStar(modal);
        }, true);

        document.addEventListener("change", event => {
            if (!(event.target instanceof HTMLInputElement)) return;
            if (!event.target.matches('[data-flx="user.custom-status-modal.custom-status-text.set-status-text"]')) return;

            const modal = event.target.closest('[data-flx="user.custom-status-modal.modal-root"]');
            if (modal) updateStar(modal);
        }, true);
    }

    if (document.body) {
        start();
    } else {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    }
})();