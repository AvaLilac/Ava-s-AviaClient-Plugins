(function () {
  if (window.__stoatDedupeFix) return;
  window.__stoatDedupeFix = true;

  const scheduled = new WeakSet();

  function clean(v) {
    return (v || "").replace(/\s+/g, " ").trim();
  }

  function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function getUrls(el) {
    const urls = [];

    el.querySelectorAll?.("iframe[src], img[src], video[src], source[src], a[href]").forEach(n => {
      const src = n.getAttribute("src");
      const href = n.getAttribute("href");
      if (src) urls.push(src);
      if (href) urls.push(href);
    });

    const title = el.getAttribute?.("title");
    if (title && /^https?:\/\//i.test(title)) urls.push(title);

    return uniq(urls.map(clean));
  }

  function isCardLike(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.querySelector("iframe[src], img[src], video[src], source[src]")) return true;
    if (el.querySelector("a[href]")) return true;
    if (el.children.length > 0 && clean(el.textContent).length > 0) return true;
    return false;
  }

  function fingerprint(el) {
    if (!(el instanceof HTMLElement)) return null;

    const urls = getUrls(el);
    const text = clean(el.textContent).slice(0, 220);

    const tag = el.tagName.toLowerCase();
    const cls = clean(el.className).slice(0, 220);

    if (!urls.length && !text) return null;

    return JSON.stringify({
      tag,
      cls,
      urls,
      text
    });
  }

  function dedupeSiblings(parent) {
    if (!(parent instanceof HTMLElement)) return;
    if (parent.children.length < 2) return;

    const seen = new Set();

    for (const child of Array.from(parent.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (!isCardLike(child)) continue;

      const htmlKey = clean(child.outerHTML);
      const fpKey = fingerprint(child);
      const key = fpKey || htmlKey;

      if (seen.has(key)) {
        child.remove();
      } else {
        seen.add(key);
      }
    }
  }

  function run(node) {
    if (!(node instanceof HTMLElement)) return;

    const roots = new Set();

    if (node.classList?.contains("group")) roots.add(node);
    node.closest?.(".group") && roots.add(node.closest(".group"));

    node.querySelectorAll?.(".group").forEach(el => roots.add(el));

    for (const root of roots) {
      const containers = [root, ...root.querySelectorAll("div")];
      for (const container of containers) {
        dedupeSiblings(container);
      }
    }
  }

  function schedule(node) {
    if (!(node instanceof HTMLElement)) return;

    const root = node.closest?.(".group") || (node.classList?.contains("group") ? node : null);
    if (!root) return;

    if (scheduled.has(root)) return;
    scheduled.add(root);

    requestAnimationFrame(() => {
      run(root);
      requestAnimationFrame(() => {
        run(root);
        scheduled.delete(root);
      });
    });
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        schedule(node);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  document.querySelectorAll(".group").forEach(schedule);
})();
