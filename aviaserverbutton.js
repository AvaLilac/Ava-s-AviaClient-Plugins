(function(){

if (window.__AVIA_SERVER_BUTTON__) return;
window.__AVIA_SERVER_BUTTON__ = true;

const AVIA_INVITE = "https://stt.gg/ACbzrJEF";

function apply(){

  document.querySelectorAll("a").forEach(a => {

    if (!a.textContent.includes("Go to the Stoat Lounge")) return;
    if (a.__aviaServerButton) return;

    a.__aviaServerButton = true;

    const title = a.querySelector("div.flex-g_1 > div");

    if (title) title.textContent = "Go to the Avia Client Server";

    a.addEventListener("click", (e)=>{
      e.preventDefault();
      e.stopPropagation();
      window.open(AVIA_INVITE, "_blank");
    }, true);

  });

}

const observer = new MutationObserver(apply);
observer.observe(document.body,{childList:true,subtree:true});

apply();

})();
