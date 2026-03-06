(() => {
  let active = false;
  let highlightEl = null;
  let tooltip = null;

  function createTooltip() {
    const el = document.createElement("div");
    el.id = "__angular-grab-tooltip__";
    document.body.appendChild(el);
    return el;
  }

  function removeTooltip() {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  }

  function positionTooltip(target) {
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - tooltip.offsetHeight - 8;
    tooltip.style.top = `${Math.max(top, 4)}px`;
    tooltip.style.left = `${Math.max(rect.left + window.scrollX, 4)}px`;
    tooltip.style.display = "block";
  }

  function showTooltip(target, text) {
    if (!tooltip) { tooltip = createTooltip(); }
    tooltip.textContent = text;
    positionTooltip(target);
  }

  function showCopiedFeedback(target) {
    if (!tooltip) { tooltip = createTooltip(); }
    tooltip.textContent = "Copied!";
    tooltip.classList.add("__angular-grab-copied__");
    positionTooltip(target);

    setTimeout(() => {
      if (!tooltip) { return; }
      tooltip.classList.remove("__angular-grab-copied__");
      tooltip.style.display = "none";
    }, 1200);
  }

  function highlight(el) {
    clearHighlight();
    el.classList.add("__angular-grab-highlight__");
    highlightEl = el;
  }

  function clearHighlight() {
    if (highlightEl) {
      highlightEl.classList.remove("__angular-grab-highlight__");
      highlightEl = null;
    }
  }

  function onMouseOver(e) {
    if (!active) { return; }
    e.stopPropagation();

    const target = e.target;
    if (target.id === "__angular-grab-tooltip__") { return; }

    highlight(target);
    const info = AngularInspector.inspect(target);
    const label = info.componentName ? `${info.componentName} › ${info.tag}` : info.tag;
    showTooltip(target, label);
  }

  function onMouseOut(e) {
    if (!active) { return; }
    clearHighlight();
    if (tooltip) { tooltip.style.display = "none"; }
  }

  function onClick(e) {
    if (!active) { return; }
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    if (target.id === "__angular-grab-tooltip__") { return; }

    const info = AngularInspector.inspect(target);
    const text = AngularInspector.formatForClipboard(info);

    navigator.clipboard.writeText(text).then(() => {
      showCopiedFeedback(target);
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showCopiedFeedback(target);
    });
  }

  function onKeyDown(e) {
    if (e.key === "Escape" && active) {
      deactivate();
      chrome.runtime.sendMessage({ type: "DEACTIVATED" });
    }
  }

  function activate() {
    active = true;
    document.body.classList.add("__angular-grab-active__");
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function deactivate() {
    active = false;
    document.body.classList.remove("__angular-grab-active__");
    clearHighlight();
    removeTooltip();
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("mouseout", onMouseOut, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "TOGGLE") {
      active ? deactivate() : activate();
    }
    if (msg.type === "GET_STATE") {
      sendResponse({ active });
    }
  });
})();
