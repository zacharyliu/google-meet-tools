let activeMeetingTabId = null;

chrome.action.onClicked.addListener(async () => {
  if (activeMeetingTabId) {
    const tab = await chrome.tabs.update(activeMeetingTabId, {
      active: true,
    });
    await chrome.windows.update(tab.windowId, {
      focused: true,
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender) => {
  switch (request.type) {
    case "meeting_started":
      activeMeetingTabId = sender.tab.id;
      break;
    default:
      return;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeMeetingTabId) {
    activeMeetingTabId = null;
  }
});
