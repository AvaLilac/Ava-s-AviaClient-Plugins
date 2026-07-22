/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/fav_status.js
  @VERSION: 1.0
*/

(function () {
    if (window.__FAV_STATUSES__) return;
    window.__FAV_STATUSES__ = true;

    const STORAGE_KEY = "fav_status";
    const getFavs = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } };
    const setFavs = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

    function injectStyles() {
        if (document.getElementById("avia-favstatus-styles")) return;
        const s = document.createElement("style");
        s.id = "avia-favstatus-styles";
        s.textContent = `
            .avia-fav-star-btn {
                background: none; border: none; cursor: pointer;
                padding: 6px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: rgba(255,255,255,0.3);
                transition: color 0.15s, transform 0.15s;
                font-size: 20px; line-height: 1; flex-shrink: 0;
            }
            .avia-fav-star-btn:hover { color: rgba(255,200,0,0.9); transform: scale(1.2); }
            .avia-fav-star-btn.active { color: rgba(255,200,0,0.9); }

            .avia-fav-input-row {
                display: flex; align-items: center; gap: 8px;
            }
            .avia-fav-input-row mdui-text-field { flex: 1; }

            .avia-fav-section { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }

            .avia-fav-section-label {
                font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
                text-transform: uppercase; color: rgba(255,255,255,0.35);
                margin-bottom: 2px;
            }
            .avia-fav-list {
                display: flex; flex-direction: column; gap: 4px;
                max-height: 200px; overflow-y: auto; scrollbar-width: thin;
            }
            .avia-fav-list::-webkit-scrollbar { width: 3px; }
            .avia-fav-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

            .avia-fav-item {
                display: flex; align-items: center; gap: 8px;
                padding: 8px 12px; border-radius: 10px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                cursor: pointer; transition: background 0.12s; user-select: none;
            }
            .avia-fav-item:hover { background: rgba(255,255,255,0.09); }

            .avia-fav-item-icon { font-size: 13px; color: rgba(255,200,0,0.7); flex-shrink: 0; }

            .avia-fav-item-text {
                flex: 1; font-size: 13px; color: rgba(255,255,255,0.85);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
            }
            .avia-fav-item-del {
                background: none; border: none; cursor: pointer;
                color: rgba(255,255,255,0.2); font-size: 13px;
                padding: 2px 5px; border-radius: 4px; line-height: 1;
                flex-shrink: 0; transition: color 0.12s;
            }
            .avia-fav-item-del:hover { color: rgba(255,80,80,0.8); }

            .avia-fav-empty {
                font-size: 12px; color: rgba(255,255,255,0.3);
                text-align: center; padding: 12px 0 4px; font-style: italic;
            }
        `;
        document.head.appendChild(s);
    }

    function getTextField(modal) {
        return modal.querySelector("mdui-text-field[name='text']");
    }

    function getTextValue(modal) {
        const f = getTextField(modal);
        if (!f) return "";
        if (typeof f.value === "string") return f.value;
        const inp = (f.shadowRoot || f).querySelector("input,textarea");
        return inp ? inp.value : "";
    }

    function setTextValue(modal, text) {
        const f = getTextField(modal);
        if (!f) return;
        if (typeof f.value !== "undefined") f.value = text;
        const inp = (f.shadowRoot || f).querySelector("input,textarea");
        if (inp) {
            inp.value = text;
            inp.dispatchEvent(new Event("input", { bubbles: true }));
            inp.dispatchEvent(new Event("change", { bubbles: true }));
        }
        f.dispatchEvent(new Event("input", { bubbles: true }));
        f.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function updateStarBtn(modal) {
        const btn = modal.querySelector(".avia-fav-star-btn");
        if (!btn) return;
        const cur = getTextValue(modal).trim();
        const isFaved = cur && getFavs().includes(cur);
        btn.classList.toggle("active", !!isFaved);
        btn.title = isFaved ? "Remove from favorites" : "Save as favorite";
    }

    function renderFavList(section, modal) {
        section.innerHTML = "";

        const label = document.createElement("div");
        label.className = "avia-fav-section-label";
        label.textContent = "Saved Statuses";
        section.appendChild(label);

        const list = document.createElement("div");
        list.className = "avia-fav-list";

        const favs = getFavs();
        if (!favs.length) {
            const empty = document.createElement("div");
            empty.className = "avia-fav-empty";
            empty.textContent = "No favorites yet — star a status to save it.";
            list.appendChild(empty);
        } else {
            favs.forEach((text, i) => {
                const item = document.createElement("div");
                item.className = "avia-fav-item";
                item.title = text;

                const icon = document.createElement("span");
                icon.className = "avia-fav-item-icon";
                icon.textContent = "★";

                const lbl = document.createElement("span");
                lbl.className = "avia-fav-item-text";
                lbl.textContent = text;

                const del = document.createElement("button");
                del.className = "avia-fav-item-del";
                del.textContent = "✕";
                del.title = "Remove";
                del.type = "button";
                del.onclick = (e) => {
                    e.stopPropagation();
                    const all = getFavs();
                    all.splice(i, 1);
                    setFavs(all);
                    renderFavList(section, modal);
                    updateStarBtn(modal);
                };

                item.onclick = () => {
                    setTextValue(modal, text);
                    updateStarBtn(modal);
                };

                item.append(icon, lbl, del);
                list.appendChild(item);
            });
        }

        section.appendChild(list);
    }

    function injectIntoModal(modal) {

        delete modal.dataset.aviaFavInjected;
        if (modal.dataset.aviaFavInjected) return;
        modal.dataset.aviaFavInjected = "1";

        injectStyles();

        const field = getTextField(modal);
        if (!field) return;

        const fieldParent = field.parentElement;
        if (!fieldParent) return;

        if (!fieldParent.classList.contains("avia-fav-input-row")) {
            const row = document.createElement("div");
            row.className = "avia-fav-input-row";
            fieldParent.insertBefore(row, field);
            row.appendChild(field);

            const starBtn = document.createElement("button");
            starBtn.className = "avia-fav-star-btn";
            starBtn.innerHTML = "★";
            starBtn.type = "button";
            starBtn.title = "Save as favorite";

            starBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cur = getTextValue(modal).trim();
                if (!cur) return;
                const favs = getFavs();
                const idx = favs.indexOf(cur);
                if (idx === -1) favs.push(cur);
                else favs.splice(idx, 1);
                setFavs(favs);
                renderFavList(favSection, modal);
                updateStarBtn(modal);
            };

            row.appendChild(starBtn);
        }

        const nativeInp = (field.shadowRoot || field).querySelector("input,textarea");
        if (nativeInp) nativeInp.addEventListener("input", () => updateStarBtn(modal));
        field.addEventListener("input", () => updateStarBtn(modal));

        const formParentDiv = field.closest("form")?.parentElement ?? field.closest("[class*='c_var']");
        const favSection = document.createElement("div");
        favSection.className = "avia-fav-section";

        if (formParentDiv && formParentDiv.parentElement) {
            formParentDiv.parentElement.insertBefore(favSection, formParentDiv.nextSibling);
        } else {
            modal.appendChild(favSection);
        }

        renderFavList(favSection, modal);
        updateStarBtn(modal);
    }

    function isStatusModal(el) {
        return el instanceof Element &&
            el.querySelector && 
            el.querySelector("mdui-text-field[name='text']") &&
            (el.className?.includes("max-w_560px") || el.querySelector('[class*="max-w_560px"]'));
    }

    function findAndInject(root) {

        if (root instanceof Element) {
            if (root.className?.includes?.("max-w_560px") && root.querySelector("mdui-text-field[name='text']")) {
                injectIntoModal(root);
                return;
            }

            const candidate = root.querySelector('[class*="max-w_560px"]');
            if (candidate && candidate.querySelector("mdui-text-field[name='text']")) {
                injectIntoModal(candidate);
            }
        }
    }

    let pendingNodes = [];
    let rafScheduled = false;

    function processPending() {
        rafScheduled = false;
        const nodes = pendingNodes.splice(0);
        for (const node of nodes) {
            findAndInject(node);
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node instanceof Element) {
                    pendingNodes.push(node);
                }
            }
        }
        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(processPending);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const existing = document.querySelector('[class*="max-w_560px"]');
    if (existing && existing.querySelector("mdui-text-field[name='text']")) {
        injectIntoModal(existing);
    }

})();