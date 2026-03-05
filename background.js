chrome.action.onClicked.addListener((tab) => {
  if (!tab?.url?.includes('snay.io')) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'T',
        code: 'KeyT',
        shiftKey: true,
        altKey: true,
        bubbles: true,
        cancelable: true
      }));
    }
  }).catch(err => console.debug('Toggle failed:', err));
});
