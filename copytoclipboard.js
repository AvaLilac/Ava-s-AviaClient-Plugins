(function () {
    if (window.__CLIPBOARD_COPY__) return;
    window.__CLIPBOARD_COPY__ = true;
   /*If you are reading this. this isnt fully stable. if you have ideas on how to copy animated images to clipboard. let me know, i wrote this with my brain blank*/
    function safeQuery(root, selector) {
        try { return root ? root.querySelector(selector) : null; }
        catch (_) { return null; }
    }

    function iconName(btn) {
        try {
            const ic = btn && btn.querySelector(".material-symbols-outlined");
            return ic ? ic.textContent.trim() : "";
        } catch (_) { return ""; }
    }

    function findIconButton(group, names) {
        try {
            return Array.from(group.querySelectorAll("button"))
                .find(b => names.includes(iconName(b)));
        } catch (_) { return null; }
    }

    function flash(btn, name, ms = 220) {
        const ic = btn.querySelector(".material-symbols-outlined");
        const prev = ic ? ic.textContent : "content_copy";
        if (ic) ic.textContent = name;
        btn.style.opacity = "0.55";
        setTimeout(() => {
            if (ic) ic.textContent = prev;
            btn.style.opacity = "1";
        }, ms);
    }

    function getViewerRoot(group) {
        try {
            return group.closest("div.d_flex.flex-d_column") || document;
        } catch (_) { return document; }
    }

    function mimeFromUrl(url) {
        const c = String(url || "").split("?")[0].toLowerCase();
        if (c.endsWith(".png")) return "image/png";
        if (c.endsWith(".jpg") || c.endsWith(".jpeg")) return "image/jpeg";
        if (c.endsWith(".gif")) return "image/gif";
        if (c.endsWith(".webp")) return "image/webp";
        if (c.endsWith(".apng")) return "image/apng";
        if (c.endsWith(".avif")) return "image/avif";
        if (c.endsWith(".svg") || c.endsWith(".svgz")) return "image/svg+xml";
        if (c.endsWith(".bmp")) return "image/bmp";
        if (c.endsWith(".tif") || c.endsWith(".tiff")) return "image/tiff";
        if (c.endsWith(".ico")) return "image/x-icon";
        if (c.endsWith(".webm")) return "video/webm";
        if (c.endsWith(".mp4")) return "video/mp4";
        if (c.endsWith(".mov")) return "video/quicktime";
        if (c.endsWith(".ogg") || c.endsWith(".ogv")) return "video/ogg";
        return null;
    }

    function resolveMime(contentType, url) {
        const t = String(contentType || "").split(";")[0].trim().toLowerCase();
        if (t === "image/jpg") return "image/jpeg";
        if (t.startsWith("image/") || t.startsWith("video/")) return t;
        return mimeFromUrl(url) || "application/octet-stream";
    }

    function canClipboardWrite(mime) {
        if (typeof ClipboardItem === "undefined") return false;
        if (mime === "image/png") return true;
        if (typeof ClipboardItem.supports === "function") return ClipboardItem.supports(mime);
        return false;
    }

    function readU32BE(bytes, offset) {
        return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    }

    function readU32LE(bytes, offset) {
        return (bytes[offset]) | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    }

    function fourCC(bytes, offset) {
        return String.fromCharCode(
            bytes[offset],
            bytes[offset + 1],
            bytes[offset + 2],
            bytes[offset + 3]
        );
    }

    async function isAnimatedPng(blob) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (bytes.length < 8) return false;

        const sig = [137, 80, 78, 71, 13, 10, 26, 10];
        for (let i = 0; i < sig.length; i++) {
            if (bytes[i] !== sig[i]) return false;
        }

        let p = 8;
        while (p + 8 <= bytes.length) {
            const len = readU32BE(bytes, p);
            p += 4;
            if (p + 4 > bytes.length) break;

            const type = fourCC(bytes, p);
            p += 4;

            if (type === "acTL") return true;

            const next = p + len + 4;
            if (next > bytes.length) break;
            p = next;
        }

        return false;
    }

    async function isAnimatedGif(blob) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (bytes.length < 13) return false;

        const sig = String.fromCharCode(
            bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]
        );
        if (sig !== "GIF87a" && sig !== "GIF89a") return false;

        let p = 13;
        const packed = bytes[10];
        if (packed & 0x80) {
            p += 3 * (1 << ((packed & 0x07) + 1));
        }

        let imageCount = 0;

        while (p < bytes.length) {
            const introducer = bytes[p++];

            if (introducer === 0x2C) {
                imageCount++;
                if (imageCount > 1) return true;

                if (p + 9 > bytes.length) break;
                p += 8;

                const localPacked = bytes[p++];
                if (localPacked & 0x80) {
                    p += 3 * (1 << ((localPacked & 0x07) + 1));
                }

                if (p >= bytes.length) break;
                p++;

                while (p < bytes.length) {
                    const size = bytes[p++];
                    if (size === 0) break;
                    p += size;
                }
            } else if (introducer === 0x21) {
                if (p >= bytes.length) break;
                p++;

                while (p < bytes.length) {
                    const size = bytes[p++];
                    if (size === 0) break;
                    p += size;
                }
            } else if (introducer === 0x3B) {
                break;
            } else {
                break;
            }
        }

        return false;
    }

    async function isAnimatedWebP(blob) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (bytes.length < 12) return false;

        if (fourCC(bytes, 0) !== "RIFF" || fourCC(bytes, 8) !== "WEBP") return false;

        let p = 12;
        while (p + 8 <= bytes.length) {
            const type = fourCC(bytes, p);
            p += 4;

            const size = readU32LE(bytes, p);
            p += 4;

            if (type === "VP8X" && size >= 1) {
                const flags = bytes[p];
                if (flags & 0x02) return true;
            }

            if (type === "ANIM" || type === "ANMF") return true;

            p += size + (size & 1);
        }

        return false;
    }

    async function isSupportedStaticImageGroup(group) {
        const root = getViewerRoot(group);

        const img = safeQuery(root, 'img[src*="cdn.stoatusercontent.com"]')
                 || safeQuery(root, "img[src]");

        if (!img || !img.src) return false;

        const src = img.currentSrc || img.src;
        let blob;

        try {
            blob = await fetchBlob(src);
        } catch (_) {
            return false;
        }

        const mime = blob.type || resolveMime("", src);

        if (mime === "image/png") {
            return !(await isAnimatedPng(blob));
        }

        if (mime === "image/gif") {
            return !(await isAnimatedGif(blob));
        }

        if (mime === "image/webp") {
            return !(await isAnimatedWebP(blob));
        }

        if (mime === "image/jpeg") return true;
        if (mime === "image/bmp") return true;
        if (mime === "image/tiff") return true;
        if (mime === "image/x-icon") return true;
        if (mime === "image/svg+xml") return true;

        return false;
    }

    async function imageBlobToPng(blob) {
        const url = URL.createObjectURL(blob);
        try {
            const img = await new Promise((res, rej) => {
                const i = new Image();
                i.onload = () => res(i);
                i.onerror = () => rej(new Error("img load failed"));
                i.src = url;
            });
            const c = document.createElement("canvas");
            c.width = img.naturalWidth || 1;
            c.height = img.naturalHeight || 1;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
            return await new Promise((res, rej) =>
                c.toBlob(b => b ? res(b) : rej(new Error("toBlob failed")), "image/png")
            );
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async function svgToPng(blob) {
        const text = await blob.text();
        const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
        const img = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = () => rej(new Error("SVG load failed"));
            i.src = dataUrl;
        });
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || 512;
        c.height = img.naturalHeight || 512;
        c.getContext("2d").drawImage(img, 0, 0);
        return new Promise((res, rej) =>
            c.toBlob(b => b ? res(b) : rej(new Error("SVG toBlob failed")), "image/png")
        );
    }

    async function fetchBlob(src) {
        const r = await fetch(src, {
            mode: "cors", credentials: "omit", redirect: "follow", cache: "no-store"
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const ct = r.headers.get("content-type");
        const raw = await r.blob();
        const mime = resolveMime(ct, src);
        return new Blob([raw], { type: mime });
    }

    async function writeToClipboard(blob, src) {
        if (!navigator?.clipboard?.write) throw new Error("Clipboard API unavailable");

        const mime = blob.type || "image/png";

        if (mime === "image/svg+xml") {
            const png = await svgToPng(blob);
            await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
            return;
        }

        if (canClipboardWrite(mime)) {
            try {
                await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
                return;
            } catch (_) {}
        }

        if (mime.startsWith("image/")) {
            const png = await imageBlobToPng(blob);
            await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
            return;
        }

        throw new Error("VIDEO_FALLBACK:" + src);
    }

    async function copyMedia(group) {
        const root = getViewerRoot(group);

        const img = safeQuery(root, 'img[src*="cdn.stoatusercontent.com"]')
                 || safeQuery(root, "img[src]");

        if (img && img.src) {
            const blob = await fetchBlob(img.currentSrc || img.src);
            await writeToClipboard(blob, img.currentSrc || img.src);
            return "copied";
        }

        const video = safeQuery(root, "video[src]") || safeQuery(root, "video");
        const vsrc = video && (video.currentSrc || video.src || safeQuery(video, "source[src]")?.src);

        if (vsrc) {
            let blob;
            try {
                blob = await fetchBlob(vsrc);
            } catch (e) {
                window.open(vsrc, "_blank");
                return "opened";
            }
            try {
                await writeToClipboard(blob, vsrc);
                return "copied";
            } catch (e) {
                if (String(e.message).startsWith("VIDEO_FALLBACK:")) {
                    window.open(vsrc, "_blank");
                    return "opened";
                }
                throw e;
            }
        }

        throw new Error("No media found in viewer");
    }

    function makeButton(template) {
        const btn = template.cloneNode(true);
        btn.dataset.copyBtn = "1";
        btn.removeAttribute("aria-label");
        btn.setAttribute("aria-label", "Copy media");

        const ic = btn.querySelector(".material-symbols-outlined");
        if (ic) ic.textContent = "content_copy";

        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const group = btn.closest("div.z_999");
            if (!group) return;
            try {
                const result = await copyMedia(group);
                flash(btn, result === "opened" ? "open_in_new" : "check");
            } catch (err) {
                console.error("[stoat-copy]", err);
                flash(btn, "close");
            }
        });

        return btn;
    }

    async function maybeInjectGroup(group) {
        try {
            if (!group || group.dataset.copyInjected || group.dataset.copyPending) return;

            const closeBtn = findIconButton(group, ["close"]);
            const zoomIn = findIconButton(group, ["zoom_in"]);
            const zoomOut = findIconButton(group, ["zoom_out"]);
            const template = closeBtn || zoomIn || zoomOut || group.querySelector("button");
            if (!template) return;

            if (typeof template.cloneNode !== "function") return;

            group.dataset.copyPending = "1";

            const supported = await isSupportedStaticImageGroup(group);

            delete group.dataset.copyPending;

            if (!supported) return;

            if (group.dataset.copyInjected) return;

            group.dataset.copyInjected = "1";
            const btn = makeButton(template);

            if (closeBtn) closeBtn.insertAdjacentElement("beforebegin", btn);
            else if (zoomIn) zoomIn.insertAdjacentElement("afterend", btn);
            else if (zoomOut) zoomOut.insertAdjacentElement("afterend", btn);
            else group.appendChild(btn);

        } catch (_) {
            try { delete group.dataset.copyPending; } catch (_) {}
        }
    }

    function inject() {
        try {
            document.querySelectorAll("div.z_999").forEach((group) => {
                try {
                    void maybeInjectGroup(group);
                } catch (_) {}
            });
        } catch (_) {}
    }

    inject();

    const observer = new MutationObserver(() => {
        try { inject(); } catch (_) {}
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

})();