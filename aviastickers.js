(function () {
    if (window.__AVIA_STICKERS__) return;
    window.__AVIA_STICKERS__ = true;

    const STICKER_MAX_SIZE = 200;

    function applySticker(embedDiv) {
        if (!embedDiv || embedDiv.dataset.aviaSticker) return;
        embedDiv.dataset.aviaSticker = '1';
        embedDiv.style.width = STICKER_MAX_SIZE + 'px';
        embedDiv.style.maxWidth = STICKER_MAX_SIZE + 'px';
        embedDiv.style.height = STICKER_MAX_SIZE + 'px';
        embedDiv.style.aspectRatio = '1 / 1';
        embedDiv.style.pointerEvents = 'none';
        embedDiv.style.userSelect = 'none';
        embedDiv.style.cursor = 'default';
        embedDiv.style.borderRadius = '12px';
        embedDiv.style.overflow = 'hidden';
        embedDiv.querySelectorAll('video, img, a').forEach(el => {
            el.style.pointerEvents = 'none';
            if (el.tagName === 'A') el.removeAttribute('href');
        });
    }

    function removeStickerNodesFromP(p) {
        const childNodes = Array.from(p.childNodes);
        let openIdx = -1;
        let closeIdx = -1;
        let linkEl = null;

        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('<aviasticker>')) {
                if (openIdx === -1) {
                    openIdx = i;
                } else {
                    closeIdx = i;
                }
            }
            if (openIdx !== -1 && closeIdx === -1 && node.nodeType === Node.ELEMENT_NODE &&
                (node.tagName === 'A' || node.querySelector('a'))) {
                linkEl = node;
            }
        }

        if (openIdx === -1 || closeIdx === -1) return false;

        const openNode = childNodes[openIdx];
        const closeNode = childNodes[closeIdx];

        const closingText = closeNode.textContent.replace(/<aviasticker>/g, '');
        if (closingText.trim()) {
            closeNode.textContent = closingText;
        } else {
            closeNode.remove();
        }

        const openingText = openNode.textContent.replace(/<aviasticker>/g, '');
        if (openingText.trim()) {
            openNode.textContent = openingText;
        } else {
            openNode.remove();
        }

        if (linkEl) linkEl.remove();

        if (!p.textContent.trim()) p.style.display = 'none';

        return true;
    }

    function findStickerP(wbDiv) {
        let found = null;
        try {
            wbDiv.querySelectorAll('p').forEach(p => {
                if (found) return;
                const text = p.textContent;
                if ((text.match(/<aviasticker>/g) || []).length >= 2 && p.querySelector('a')) {
                    found = p;
                }
            });
        } catch (e) {}
        return found;
    }

    function processWbDiv(wbDiv) {
        if (!wbDiv || wbDiv.dataset.aviaDone) return;

        const stickerP = findStickerP(wbDiv);
        if (!stickerP) return;

        if (!removeStickerNodesFromP(stickerP)) return;

        let sibling = wbDiv.nextElementSibling;
        while (sibling) {
            if (sibling.classList && sibling.classList.contains('d_grid')) {
                applySticker(sibling);
                wbDiv.dataset.aviaDone = '1';
                delete wbDiv.dataset.aviaPending;
                return;
            }
            sibling = sibling.nextElementSibling;
        }

        wbDiv.dataset.aviaPending = '1';
    }

    function tryResolvePending(grid) {
        if (!grid || grid.dataset.aviaSticker) return;
        let sib = grid.previousElementSibling;
        while (sib) {
            if (sib.classList && sib.classList.contains('wb_break-word')) {
                if (sib.dataset.aviaPending) {
                    applySticker(grid);
                    sib.dataset.aviaDone = '1';
                    delete sib.dataset.aviaPending;
                }
                break;
            }
            sib = sib.previousElementSibling;
        }
    }

    let debounceTimer = null;

    function scanAll() {
        try {
            document.querySelectorAll('.wb_break-word').forEach(wbDiv => {
                if (!wbDiv.dataset.aviaDone) processWbDiv(wbDiv);
            });
        } catch (e) {}
    }

    function debouncedScan() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scanAll, 300);
    }

    let observerBusy = false;

    const observer = new MutationObserver(mutations => {
        if (observerBusy) return;
        observerBusy = true;
        try {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!node || node.nodeType !== 1) continue;
                    try {
                        if (node.classList && node.classList.contains('wb_break-word')) {
                            processWbDiv(node);
                        }
                        if (node.classList && node.classList.contains('d_grid')) {
                            tryResolvePending(node);
                        }
                        if (typeof node.querySelectorAll === 'function') {
                            node.querySelectorAll('.wb_break-word').forEach(wb => {
                                if (!wb.dataset.aviaDone) processWbDiv(wb);
                            });
                            node.querySelectorAll('.d_grid').forEach(grid => {
                                tryResolvePending(grid);
                            });
                        }
                    } catch (e) {}
                }
            }
        } finally {
            observerBusy = false;
        }
        debouncedScan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    scanAll();
})();