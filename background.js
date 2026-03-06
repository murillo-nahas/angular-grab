const tabState = {};

chrome.action.onClicked.addListener((tab) => {
  toggleTab(tab.id);
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "DEACTIVATED" && sender.tab) {
    tabState[sender.tab.id] = false;
  }

  if (msg.type === "TOGGLE_FROM_POPUP") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        toggleTab(tab.id);
      }
    });
  }
});

function toggleTab(tabId) {
  tabState[tabId] = !(tabState[tabId] ?? false);

  chrome.tabs.sendMessage(tabId, { type: "TOGGLE" });
}
