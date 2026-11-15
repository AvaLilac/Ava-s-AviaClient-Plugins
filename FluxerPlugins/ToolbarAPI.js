/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/ToolbarAPI.js
  @VERSION: 1.1
*/

(function () {

    if (window.__AVIA_TOOLBAR__) return;
    window.__AVIA_TOOLBAR__ = true;

    const toolbarRegisteredItems = [];

    const CONTAINER_SELECTOR =
        '[data-flx="channel.textarea.textarea-buttons.button-container-dense"]';

    const TEMPLATE_SELECTOR =
        '[data-flx^="channel.textarea.textarea-buttons.textarea-button.expression-picker-toggle"]';

    const ICON_SELECTOR =
        '[data-flx="channel.textarea.textarea-button.icon"]';

    const TOOLTIP_ROOT_ID = "avia-toolbar-tooltip-root";

    const tooltipChildStyle = `
  --tooltip-surface: var(--settings-surface-background,var(--form-surface-background));
  --tooltip-border-width: .0625rem;
  --tooltip-border-color: var(--settings-border-color,var(--background-modifier-accent));
  --tooltip-shadow: 0 .5rem 1rem rgba(0,0,0,.22);
  --tooltip-active-surface: var(--tooltip-surface);
  --tooltip-active-border-color: var(--tooltip-border-color);
  --tooltip-pointer-surface: var(--tooltip-active-surface);
  --tooltip-pointer-border: var(--tooltip-active-border-color);
  --tooltip-pointer-size: .625rem;
  --tooltip-pointer-half-size: calc(var(--tooltip-pointer-size) / 2);
  transform-origin: 50% 100%;
  z-index: var(--z-index-tooltip);
  pointer-events: none;
  box-sizing: border-box;
  border: var(--tooltip-border-width) solid var(--tooltip-active-border-color);
  background: var(--tooltip-active-surface);
  max-width: 21.875rem;
  color: var(--text-primary);
  word-wrap: break-word;
  box-shadow: var(--tooltip-shadow);
  border-radius: .5rem;
  font-size: .8125rem;
  font-weight: 500;
  line-height: 1.125rem;
  position: relative;
  `;

    const tooltipPointerStyle = `
  -webkit-clip-path: polygon(100% 0,100% 100%,0 100%);
  clip-path: polygon(100% 0,100% 100%,0 100%);
  box-sizing: border-box;
  width: var(--tooltip-pointer-size);
  height: var(--tooltip-pointer-size);
  background: var(--tooltip-pointer-border);
  border: 0;
  display: block;
  transform: rotate(45deg);
  top: calc(100% - var(--tooltip-pointer-half-size));
  margin-left: calc(-1 * var(--tooltip-pointer-half-size));
  position: absolute;
  left: 50%;
  pointer-events: none;
  `;

    const tooltipContentStyle = `
  white-space: normal;
  word-break: break-word;
  text-align: center;
  padding: .4375rem .625rem;
  overflow: hidden;
  `;

    function hideTooltip() {
        const root = document.getElementById(TOOLTIP_ROOT_ID);

        if (root) {
            root.remove();
        }
    }

    function showTooltip(text, anchor) {
        hideTooltip();

        const root = document.createElement("div");

        root.id = TOOLTIP_ROOT_ID;
        root.style.cssText = `
      pointer-events: none;
      z-index: var(--z-index-tooltip);
      background: 0 0;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      `;

        root.innerHTML = `
    <div data-floating-ui-portal="">
      <div role="tooltip" data-flx="ui.tooltip.tooltip.tooltip" style="position: fixed; left: 0px; top: 0px; z-index: var(--z-index-tooltip); visibility: visible; opacity: 1; transform: none;">
        <div style="${tooltipChildStyle}">
          <div data-flx="ui.tooltip.tooltip.tooltip-container.tooltip-pointer" style="${tooltipPointerStyle}"></div>
          <div data-flx="ui.tooltip.tooltip.tooltip-container.tooltip-content" style="${tooltipContentStyle}"></div>
        </div>
      </div>
    </div>
    `;

        root.querySelector('[data-flx="ui.tooltip.tooltip.tooltip-container.tooltip-content"]').textContent = text;

        document.body.appendChild(root);

        const tooltip = root.querySelector('[role="tooltip"]');
        const pointer = root.querySelector('[data-flx="ui.tooltip.tooltip.tooltip-container.tooltip-pointer"]');
        const rect = anchor.getBoundingClientRect();

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        const left = Math.max(8, Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - 8
        ));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.top - tooltipHeight - 8}px`;

        pointer.style.left = `${rect.left + rect.width / 2 - left}px`;
    }

    function findContainers() {
        return document.querySelectorAll(CONTAINER_SELECTOR);
    }

    function findTemplate(container) {
        for (const child of container.children) {
            if (child.matches && child.matches(TEMPLATE_SELECTOR)) {
                return child;
            }
        }

        return null;
    }

    function buildButton(item, template) {
        const button = template.cloneNode(true);

        button.removeAttribute("id");
        button.removeAttribute("aria-pressed");
        button.removeAttribute("disabled");
        button.removeAttribute("data-expression-picker-tab");
        button.removeAttribute("data-focus-ring-managed");

        button.setAttribute("data-flx", "avia.toolbar.button");
        button.setAttribute("aria-label", item.name);
        button.setAttribute("type", "button");

        button.dataset.aviaToolbarId = item.id;

        const icon = button.querySelector(ICON_SELECTOR) || button.querySelector("svg");

        if (icon) {
            if (item.icon) {
                const filled = item.icon.endsWith("_fill");

                let size = "1.25rem";

                const templateIcon =
                    template.querySelector(ICON_SELECTOR) || template.querySelector("svg");

                if (templateIcon) {
                    const rect = templateIcon.getBoundingClientRect();

                    if (rect.width > 0) {
                        size = rect.width + "px";
                    }
                }

                const iconSpan = document.createElement("span");

                const originalClass = icon.getAttribute("class") || "";

                iconSpan.className =
                    (originalClass + " material-symbols-outlined").trim();

                iconSpan.textContent = filled
                    ? item.icon.slice(0, -5)
                    : item.icon;

                iconSpan.style.cssText =
                    "flex-shrink:0;display:block;" +
                    "font-variation-settings:'FILL' " +
                    (filled ? "1" : "0") +
                    ",'wght' 400,'GRAD' 0;" +
                    "font-size:" + size + ";" +
                    "width:" + size + ";height:" + size + ";" +
                    "line-height:1;";

                icon.replaceWith(iconSpan);
            } else {
                icon.remove();
            }
        }

        button.addEventListener("mouseenter", () => {
            showTooltip(item.name, button);
        });

        button.addEventListener("mouseleave", hideTooltip);

        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            hideTooltip();

            try {
                item.onClick(event);
            } catch (error) {
                console.error("[AviaToolbar]", error);
            }
        });

        return button;
    }

    function renderItems() {
        for (const container of findContainers()) {
            const template = findTemplate(container);

            if (!template) continue;

            let next = template;

            for (let i = toolbarRegisteredItems.length - 1; i >= 0; i--) {
                const item = toolbarRegisteredItems[i];

                let button = container.querySelector(
                    `:scope > [data-avia-toolbar-id="${CSS.escape(item.id)}"]`
                );

                if (!button) {
                    button = buildButton(item, template);
                }

                if (button.nextElementSibling !== next) {
                    next.before(button);
                }

                next = button;
            }
        }
    }

    window.AviaToolbar = {
        register(item) {
            if (!item || typeof item !== "object") {
                console.error(
                    "[AviaToolbar] register: item must be an object, got",
                    typeof item
                );
                return;
            }

            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error(
                    "[AviaToolbar] register: item.id must be a non-empty string, got",
                    item.id
                );
                return;
            }

            if (typeof item.name !== "string" || !item.name.trim()) {
                console.error(
                    "[AviaToolbar] register: item.name must be a non-empty string, got",
                    item.name
                );
                return;
            }

            if (typeof item.onClick !== "function") {
                console.error(
                    "[AviaToolbar] register: item.onClick must be a function, got",
                    typeof item.onClick
                );
                return;
            }

            const id = item.id.trim();

            if (toolbarRegisteredItems.some(i => i.id === id)) {
                console.error(
                    "[AviaToolbar] register: id '%s' is already registered",
                    id
                );
                return;
            }

            toolbarRegisteredItems.push({
                id,
                name: item.name,
                icon:
                    typeof item.icon === "string" && item.icon.trim()
                        ? item.icon.trim()
                        : null,
                onClick: item.onClick
            });

            renderItems();
        },

        unregister(item) {
            if (!item || typeof item.id !== "string") {
                return;
            }

            const id = item.id.trim();

            const index = toolbarRegisteredItems.findIndex(
                i => i.id === id
            );

            if (index === -1) {
                return;
            }

            toolbarRegisteredItems.splice(index, 1);

            hideTooltip();

            document
                .querySelectorAll(`[data-avia-toolbar-id="${CSS.escape(id)}"]`)
                .forEach(button => button.remove());
        },

        update(item) {
            if (!item || typeof item.id !== "string") {
                console.error(
                    "[AviaToolbar] update: item.id must be a string, got",
                    item && item.id
                );
                return;
            }

            const id = item.id.trim();

            const registered = toolbarRegisteredItems.find(
                i => i.id === id
            );

            if (!registered) {
                console.error(
                    "[AviaToolbar] update: id '%s' is not registered",
                    id
                );
                return;
            }

            const hasName = "name" in item;
            const hasIcon = "icon" in item;

            if (hasName && (typeof item.name !== "string" || !item.name.trim())) {
                console.error(
                    "[AviaToolbar] update: item.name must be a non-empty string, got",
                    item.name
                );
                return;
            }

            if (hasName) {
                registered.name = item.name;
            }

            if (hasIcon) {
                registered.icon =
                    typeof item.icon === "string" && item.icon.trim()
                        ? item.icon.trim()
                        : null;
            }

            hideTooltip();

            document
                .querySelectorAll(`[data-avia-toolbar-id="${CSS.escape(id)}"]`)
                .forEach(button => button.remove());

            renderItems();
        }
    };

    let scheduled = false;

    new MutationObserver(() => {
        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            renderItems();
        });
    }).observe(document.body, {
        childList: true,
        subtree: true
    });

    renderItems();

})();