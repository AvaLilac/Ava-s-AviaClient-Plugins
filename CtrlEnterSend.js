(function () {

  function hookEditor(editor) {
    if (editor.__ctrlSendHooked) return;
    editor.__ctrlSendHooked = true;

    editor.addEventListener("keydown", (e) => {

      if (e.key !== "Enter") return;

      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const sendButton = [...document.querySelectorAll("button")]
          .find(b => b.innerText.includes("send"));

        if (sendButton) sendButton.click();

        return;
      }

      if (!e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const newEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          shiftKey: true,
          bubbles: true
        });

        editor.dispatchEvent(newEvent);
      }

    }, true);

  }

  const observer = new MutationObserver(() => {
    const editor = document.querySelector(".cm-content[contenteditable='true']");
    if (editor) hookEditor(editor);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
