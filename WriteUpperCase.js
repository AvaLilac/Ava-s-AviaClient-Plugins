(function () {

  function hookEditor(editor) {
    if (editor.__autoCapHooked) return;
    editor.__autoCapHooked = true;

    editor.addEventListener("beforeinput", (e) => {
      if (e.inputType !== "insertText") return;
      if (!e.data || !/^[a-z]$/.test(e.data)) return;

      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(editor);
      preRange.setEnd(range.startContainer, range.startOffset);

      const textBefore = preRange.toString();

      const isStart = textBefore.trim().length === 0;

      const afterPunctuationWithSpace = /[.!?]\s+$/.test(textBefore);

      if (isStart || afterPunctuationWithSpace) {
        e.preventDefault();
        document.execCommand("insertText", false, e.data.toUpperCase());
      }
    });
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