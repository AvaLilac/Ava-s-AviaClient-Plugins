(function(){
'use strict';

if(window.__AVIA_FORCE_APPEARANCE__) return;
window.__AVIA_FORCE_APPEARANCE__ = true;

let appearanceContainer = null;
let userSettingsContainer = null;

function findAppearanceContainer() {
    if(appearanceContainer && document.body.contains(appearanceContainer)) return appearanceContainer;
    const links = document.querySelectorAll("a.pos_relative.min-w_0.d_flex.ai_center");
    for(const a of links){
        const svg = a.querySelector("svg");
        if(!svg) continue;
        const path = svg.querySelector("path");
        if(!path) continue;
        if(path.getAttribute("d")?.startsWith("M12 22C6.49 22")) {
            appearanceContainer = a.closest('.d_flex.flex-d_column.flex-g_initial');
            return appearanceContainer;
        }
    }
    appearanceContainer = null;
    return null;
}

function findUserSettingsSpan() {
    if(userSettingsContainer && document.body.contains(userSettingsContainer)) return userSettingsContainer;
    const spans = document.querySelectorAll('span.ov_hidden');
    for(const s of spans){
        const parent = s.parentElement;
        if(!parent) continue;
        if(parent.id==='avia-cloned-settings') continue;
        if(parent.querySelector('#avia-cloned-settings')) continue;
        const svgPath = parent.querySelector('a svg path');
        if(!svgPath) continue;
        const d = svgPath.getAttribute('d')||'';
        if(d.startsWith('M12 2C6.48 2')) {
            userSettingsContainer = s;
            return s;
        }
    }
    userSettingsContainer = null;
    return null;
}

function enforceLabels() {

    const container = findAppearanceContainer();
    if(container){
        const links = container.querySelectorAll("a.pos_relative.min-w_0.d_flex.ai_center");
        links.forEach(a=>{
            const svg = a.querySelector("svg");
            if(!svg) return;
            const path = svg.querySelector("path");
            if(!path) return;
            if(path.getAttribute("d")?.startsWith("M12 22C6.49 22")) {
                const label = a.querySelector("div.ov_hidden");
                if(label && label.textContent !== "Appearance") label.textContent = "Appearance";
            }
        });
    }

    const userSpan = findUserSettingsSpan();
    if(userSpan && userSpan.textContent !== "User Settings") userSpan.textContent = "User Settings";
}

const observer = new MutationObserver(() => enforceLabels());
observer.observe(document.body, { childList:true, subtree:true });

enforceLabels();

})();
