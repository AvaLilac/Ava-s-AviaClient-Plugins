(function () {

if (window.__AVIA_TIMEZONES__) return;
window.__AVIA_TIMEZONES__ = true;

const STORAGE_ZONES = "avia_timezones";
const STORAGE_ENABLED = "avia_timezones_enabled";

const ALL_TIMEZONES = Intl.supportedValuesOf("timeZone");

let ZONES;

try {
    ZONES = JSON.parse(localStorage.getItem(STORAGE_ZONES) || "[]");
    if (!Array.isArray(ZONES)) ZONES = [];
} catch {
    ZONES = [];
}

ZONES = ZONES.filter(z => ALL_TIMEZONES.includes(z));

let ENABLED = localStorage.getItem(STORAGE_ENABLED) !== "false";

function getOffset(date, tz) {

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset"
    }).formatToParts(date);

    const part = parts.find(p => p.type === "timeZoneName");
    return part ? part.value : "";
}

function getTime(date, tz) {

    return new Intl.DateTimeFormat(navigator.language, {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: undefined
    }).format(date);
}

function applyTimezones() {

    document.querySelectorAll("time[datetime]").forEach(el => {

        const iso = el.getAttribute("datetime");
        if (!iso) return;

        const date = new Date(iso);

        if (!ENABLED || !ZONES.length) {

            if (el.dataset.aviaTimezoneOriginal) {
                el.textContent = el.dataset.aviaTimezoneOriginal;
            }

            delete el.dataset.aviaTimezoneDone;
            return;
        }

        if (!el.dataset.aviaTimezoneOriginal)
            el.dataset.aviaTimezoneOriginal = el.textContent;

        if (el.dataset.aviaTimezoneDone) return;

        const tz = ZONES[0];

        try {

            const time = getTime(date, tz);
            const offset = getOffset(date, tz);

            if (time && offset) {
                el.textContent =
                    el.dataset.aviaTimezoneOriginal + ` (${time} ${offset})`;
                el.dataset.aviaTimezoneDone = "true";
            }

        } catch {}

    });

}

let timezoneCooldown = false;

const timezoneObserver = new MutationObserver(() => {

    if (timezoneCooldown) return;

    timezoneCooldown = true;

    setTimeout(() => {

        applyTimezones();
        timezoneCooldown = false;

    }, 200);

});

timezoneObserver.observe(document.body, { childList: true, subtree: true });

applyTimezones();

function togglePanel() {

    let panel = document.getElementById("avia-timezone-panel");

    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-timezone-panel";

    Object.assign(panel.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        width: "380px",
        height: "500px",
        background: "#1e1e1e",
        color: "#fff",
        borderRadius: "20px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)"
    });

    const header = document.createElement("div");
    header.textContent = "Avia Timezones";

    Object.assign(header.style, {
        padding: "18px",
        fontWeight: "600",
        fontSize: "16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        cursor: "move",
        position: "relative",
        textAlign: "center",
        userSelect: "none"
    });

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {

        isDragging = true;

        const rect = panel.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        panel.style.bottom = "auto";
        panel.style.right = "auto";
        panel.style.left = rect.left + "px";
        panel.style.top = rect.top + "px";

        document.body.style.userSelect = "none";

    });

    document.addEventListener("mousemove", (e) => {

        if (!isDragging) return;

        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";

    });

    document.addEventListener("mouseup", () => {

        isDragging = false;
        document.body.style.userSelect = "";

    });

    const toggleBtn = document.createElement("div");

    Object.assign(toggleBtn.style, {
        position: "absolute",
        left: "18px",
        top: "16px",
        cursor: "pointer",
        fontSize: "12px",
        padding: "4px 8px",
        borderRadius: "8px"
    });

    function updateToggleUI() {

        toggleBtn.textContent = ENABLED ? "ON" : "OFF";

        toggleBtn.style.background = ENABLED
            ? "rgba(0,200,0,0.25)"
            : "rgba(200,0,0,0.25)";

    }

    updateToggleUI();

    toggleBtn.onclick = () => {

        ENABLED = !ENABLED;
        localStorage.setItem(STORAGE_ENABLED, ENABLED);

        updateToggleUI();

        document.querySelectorAll("time[datetime]").forEach(el => {
            delete el.dataset.aviaTimezoneDone;
        });

        applyTimezones();

    };

    header.appendChild(toggleBtn);

    const close = document.createElement("div");
    close.textContent = "✕";

    Object.assign(close.style, {
        position: "absolute",
        right: "18px",
        top: "16px",
        cursor: "pointer"
    });

    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    const container = document.createElement("div");

    Object.assign(container.style, {
        flex: "1",
        overflowY: "auto",
        padding: "18px"
    });

    const search = document.createElement("input");
    search.placeholder = "Search timezone...";

    Object.assign(search.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "12px",
        borderRadius: "8px",
        border: "none",
        outline: "none",
        background: "rgba(255,255,255,0.06)",
        color: "#fff"
    });

    container.appendChild(search);

    const listWrapper = document.createElement("div");
    container.appendChild(listWrapper);

    function render(filter = "") {

        listWrapper.innerHTML = "";

        ALL_TIMEZONES
        .filter(tz => tz.toLowerCase().includes(filter.toLowerCase()))
        .forEach(tz => {

            const btn = document.createElement("button");

            btn.textContent = tz;

            Object.assign(btn.style, {
                width: "100%",
                padding: "8px",
                marginBottom: "6px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: ZONES[0] === tz
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.06)",
                color: "#fff",
                textAlign: "left"
            });

            btn.onclick = () => {

                if (ZONES[0] === tz) {
                    ZONES = [];
                } else {
                    ZONES = [tz];
                }

                localStorage.setItem(STORAGE_ZONES, JSON.stringify(ZONES));

                document.querySelectorAll("time[datetime]").forEach(el => {
                    delete el.dataset.aviaTimezoneDone;
                });

                render(search.value);
                applyTimezones();

            };

            listWrapper.appendChild(btn);

        });

    }

    search.addEventListener("input", () => {
        render(search.value);
    });

    render();

    panel.appendChild(header);
    panel.appendChild(container);

    document.body.appendChild(panel);

}

function injectSettingsButton() {

    if (document.getElementById("avia-timezone-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");

    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-timezone-btn";

    clone.querySelector("span.material-symbols-outlined").textContent = "schedule";
    clone.querySelector("button").onclick = togglePanel;

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);

}

let buttonCooldown = false;

new MutationObserver(() => {

    if (buttonCooldown) return;

    buttonCooldown = true;

    setTimeout(() => {

        injectSettingsButton();
        buttonCooldown = false;

    }, 300);

}).observe(document.body, { childList: true, subtree: true });

injectSettingsButton();

})();
