// Listen for clicks on the extension icon in the browser toolbar
chrome.action.onClicked.addListener((tab) => {
  // Ensure the tab is valid and is a Snay.io page
  if (!tab || !tab.url || !tab.url.includes('snay.io')) return;
  // Execute a script in the active tab to toggle the mod menu UI
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      try {
        // Simulate Shift+Alt+T keypress to trigger UI toggle
        const event = new KeyboardEvent('keydown', {
          key: 'T',
          code: 'KeyT',
          shiftKey: true,
          altKey: true,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
      } catch (e) {
        console.error('Jackon: Toggle dispatch failed', e);
      }
    }
  }).catch(err => console.error('Jackon: toggle failed', err));
});