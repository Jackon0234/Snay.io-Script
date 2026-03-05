/**
 * @file content_injector.js
 * @description Injects the main script into the Snay.io game context.
 * Securely executes the script in the page environment to access game variables.
 */

(function () {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('inject.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
})();
