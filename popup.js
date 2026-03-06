const btn = document.getElementById("toggleBtn");
let isActive = false;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
    if (chrome.runtime.lastError) { return; }
    isActive = res?.active ?? false;
    updateBtn();
  });
});

btn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_FROM_POPUP" });
  isActive = !isActive;
  updateBtn();
});

function updateBtn() {
  if (isActive) {
    btn.textContent = "Disable Picker";
    btn.className = "on";
  } else {
    btn.textContent = "Enable Picker";
    btn.className = "off";
  }
}
