(function () {
  'use strict';

  var EXCLUDED_HOSTS = ['msgtp.langame.ru', 'msgpublic.langame.ru'];
  var MSG_ORIGIN = 'https://msgtp.langame.ru';
  var IFRAME_PATH = '/lansearch-chat';
  var STORAGE_TOGGLE_KEY = 'lanSearchChatPopup';
  var STORAGE_OPEN_KEY = 'lanSearchChatPopupOpenByHost';
  var ROOT_HOST_ID = 'lan-search-chat-popup-host';

  /** Inline SVG for FAB: twin bubbles + sheen + dots (replaces emoji for consistent rendering). */
  var CHAT_FAB_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="lsChatFabSheen" x1="3" y1="2" x2="21" y2="19" gradientUnits="userSpaceOnUse">' +
    '<stop stop-color="#ffffff" stop-opacity="0.5"/>' +
    '<stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>' +
    '</linearGradient>' +
    '</defs>' +
    '<g opacity="0.34" transform="translate(2.25,2.25) scale(0.82)">' +
    '<path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
    '</g>' +
    '<path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
    '<path fill="url(#lsChatFabSheen)" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
    '<circle cx="9" cy="10" r="1.35" fill="#dc0000"/>' +
    '<circle cx="12" cy="10" r="1.35" fill="#dc0000"/>' +
    '<circle cx="15" cy="10" r="1.35" fill="#dc0000"/>' +
    '</svg>';

  var hostname = (window.location.hostname || '').toLowerCase();
  if (!hostname) return;
  if (EXCLUDED_HOSTS.indexOf(hostname) !== -1) return;
  if (window.top !== window.self) return;
  if (document.getElementById(ROOT_HOST_ID)) return;

  function isToggleEnabled(callback) {
    var defaultEnabled = true;
    try {
      var local = localStorage.getItem(STORAGE_TOGGLE_KEY);
      if (local !== null) {
        callback(local === 'true');
        return;
      }
    } catch (_) {}
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      try {
        chrome.storage.sync.get([STORAGE_TOGGLE_KEY], function (result) {
          var raw = result ? result[STORAGE_TOGGLE_KEY] : undefined;
          var enabled = raw === undefined ? defaultEnabled : raw === true;
          try {
            localStorage.setItem(STORAGE_TOGGLE_KEY, enabled ? 'true' : 'false');
          } catch (_) {}
          callback(enabled);
        });
        return;
      } catch (_) {}
    }
    callback(defaultEnabled);
  }

  function readOpenByHost() {
    try {
      var raw = localStorage.getItem(STORAGE_OPEN_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeOpenByHost(map) {
    try {
      localStorage.setItem(STORAGE_OPEN_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function setOpenForHost(host, isOpen) {
    var map = readOpenByHost();
    if (isOpen) map[host] = true;
    else delete map[host];
    writeOpenByHost(map);
  }

  function buildIframeUrl(host) {
    var url = MSG_ORIGIN + IFRAME_PATH + '?domain=' + encodeURIComponent(host);
    return url;
  }

  function createUi(host) {
    var root = document.createElement('div');
    root.id = ROOT_HOST_ID;
    root.style.cssText = [
      'position:fixed',
      'left:auto',
      'right:24px',
      'bottom:24px',
      'top:auto',
      'z-index:2147483647',
      'pointer-events:none',
    ].join(';');
    document.documentElement.appendChild(root);

    var shadow = root.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = [
      ':host, * { box-sizing: border-box; }',
      '.fab {',
      '  pointer-events: auto;',
      '  width: 56px; height: 56px; border-radius: 50%;',
      '  background: #dc0000; color: #fff;',
      '  border: 0; cursor: pointer;',
      '  display: none;',
      '  align-items: center; justify-content: center;',
      '  box-shadow: 0 6px 18px rgba(0,0,0,0.25);',
      '  font-size: 24px; line-height: 1;',
      '  position: relative;',
      '  transition: transform 0.15s ease, box-shadow 0.15s ease;',
      '}',
      '.fab.visible { display: inline-flex; }',
      '.fab:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(0,0,0,0.32); }',
      '.fab:focus { outline: 2px solid #ffffff; outline-offset: 2px; }',
      '.fab-icon { display: flex; align-items: center; justify-content: center; }',
      '.fab-icon svg { display: block; flex-shrink: 0; }',
      '.badge {',
      '  position: absolute; top: -4px; right: -4px;',
      '  min-width: 20px; height: 20px; padding: 0 6px;',
      '  border-radius: 10px; background: #f99c06; color: #000;',
      '  font-size: 11px; font-weight: 700;',
      '  display: none; align-items: center; justify-content: center;',
      '  box-shadow: 0 2px 6px rgba(0,0,0,0.25);',
      '}',
      '.badge.visible { display: inline-flex; }',
      '.popup {',
      '  pointer-events: auto;',
      '  position: absolute; right: 0; bottom: 72px;',
      '  width: 380px; height: 560px; max-width: calc(100vw - 32px);',
      '  max-height: calc(100vh - 96px);',
      '  background: #1a1a1a; color: #fff;',
      '  border-radius: 14px; overflow: hidden;',
      '  box-shadow: 0 18px 48px rgba(0,0,0,0.45);',
      '  display: none; flex-direction: column;',
      '}',
      '.popup.visible { display: flex; }',
      '.popup .topbar {',
      '  display: flex; align-items: center; gap: 8px;',
      '  padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.08);',
      '  background: #141414;',
      '}',
      '.popup .topbar .title {',
      '  flex: 1; font-size: 12px; font-weight: 600; opacity: 0.85;',
      '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
      '}',
      '.popup .topbar button {',
      '  background: transparent; border: 0; color: #fff; cursor: pointer;',
      '  padding: 4px 8px; font-size: 14px; line-height: 1; border-radius: 6px;',
      '}',
      '.popup .topbar button:hover { background: rgba(255,255,255,0.08); }',
      '.popup iframe {',
      '  flex: 1; width: 100%; border: 0; display: block; background: #1a1a1a;',
      '  min-height: 0;',
      '}',
    ].join('\n');
    shadow.appendChild(style);

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'fab';
    fab.title = 'Чат клуба';
    fab.setAttribute('aria-label', 'Открыть чат клуба');
    var fabIcon = document.createElement('span');
    fabIcon.className = 'fab-icon';
    fabIcon.innerHTML = CHAT_FAB_ICON_SVG;
    fab.appendChild(fabIcon);

    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = '';
    fab.appendChild(badge);

    var popup = document.createElement('div');
    popup.className = 'popup';

    var topbar = document.createElement('div');
    topbar.className = 'topbar';
    var title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'Чаты клуба · ' + host;
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.title = 'Закрыть';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.textContent = '×';
    topbar.appendChild(title);
    topbar.appendChild(closeBtn);

    var iframe = document.createElement('iframe');
    iframe.src = buildIframeUrl(host);
    iframe.setAttribute('title', 'LanSearch chat');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute(
      'sandbox',
      'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
    );

    popup.appendChild(topbar);
    popup.appendChild(iframe);

    iframe.addEventListener('load', function onIframeLoad() {
      iframe.removeEventListener('load', onIframeLoad);
      injectMsgtpTokenToFrame(iframe);
      setTimeout(function () {
        injectMsgtpTokenToFrame(iframe);
      }, 600);
    });

    shadow.appendChild(popup);
    shadow.appendChild(fab);

    return {
      root: root,
      shadow: shadow,
      fab: fab,
      badge: badge,
      popup: popup,
      iframe: iframe,
      title: title,
      closeBtn: closeBtn,
    };
  }

  function setBadge(badge, count) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.add('visible');
    } else {
      badge.textContent = '';
      badge.classList.remove('visible');
    }
  }

  function setVisible(el, on) {
    if (on) el.classList.add('visible');
    else el.classList.remove('visible');
  }

  function postToFrame(iframe, msg) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(msg, MSG_ORIGIN);
    } catch (_) {}
  }

  function injectMsgtpTokenToFrame(iframe) {
    if (!iframe || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    try {
      chrome.storage.local.get(['msgtpSessionToken'], function (data) {
        var t = data && data.msgtpSessionToken;
        if (typeof t !== 'string' || !t.trim()) return;
        postToFrame(iframe, { type: 'lansearch-host-msgtp-token', token: t.trim() });
      });
    } catch (_) {}
  }

  function init() {
    var ui;
    var ready = false;
    var hasChats = false;
    var unread = 0;

    function teardown() {
      try {
        if (ui && ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
      } catch (_) {}
    }

    function openPopup() {
      if (!ui) return;
      setVisible(ui.popup, true);
      setOpenForHost(hostname, true);
      postToFrame(ui.iframe, { type: 'lansearch-host-open' });
    }

    function closePopup() {
      if (!ui) return;
      setVisible(ui.popup, false);
      setOpenForHost(hostname, false);
      postToFrame(ui.iframe, { type: 'lansearch-host-close' });
    }

    function applyVisibility() {
      if (!ui) return;
      setVisible(ui.fab, ready);
      setBadge(ui.badge, unread);
      if (!hasChats) {
        setVisible(ui.popup, false);
        setOpenForHost(hostname, false);
      }
    }

    function onMessage(event) {
      if (event.origin !== MSG_ORIGIN) return;
      if (!ui || event.source !== ui.iframe.contentWindow) return;
      var data = event.data;
      if (!data || typeof data !== 'object') return;
      var type = data.type;
      if (type === 'lansearch-ready') {
        ready = true;
        hasChats = data.status === 'has_chats';
        unread = typeof data.unread === 'number' ? Math.max(0, data.unread) : 0;
        applyVisibility();
        if (hasChats) {
          var openMap = readOpenByHost();
          if (openMap[hostname]) openPopup();
        }
      } else if (type === 'lansearch-active-chat') {
        if (data && typeof data.title === 'string' && data.title.trim().length > 0) {
          ui.title.textContent = data.title;
        } else {
          ui.title.textContent = 'Чаты клуба · ' + hostname;
        }
      } else if (type === 'lansearch-auth-changed') {
        // No-op: visibility is driven by lansearch-ready.
      }
    }

    function bindEvents() {
      ui.fab.addEventListener('click', function () {
        if (ui.popup.classList.contains('visible')) closePopup();
        else openPopup();
      });
      ui.closeBtn.addEventListener('click', function () {
        closePopup();
      });
      window.addEventListener('message', onMessage);
    }

    isToggleEnabled(function (enabled) {
      if (!enabled) return;
      ui = createUi(hostname);
      bindEvents();
    });

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      try {
        chrome.storage.onChanged.addListener(function (changes, area) {
          if (area === 'local' && changes && changes.msgtpSessionToken && ui && ui.iframe) {
            var nv = changes.msgtpSessionToken.newValue;
            if (typeof nv === 'string' && nv.trim()) {
              postToFrame(ui.iframe, { type: 'lansearch-host-msgtp-token', token: nv.trim() });
            }
          }
          if (area !== 'sync' || !changes || !changes[STORAGE_TOGGLE_KEY]) return;
          var enabled = changes[STORAGE_TOGGLE_KEY].newValue === true;
          try {
            localStorage.setItem(STORAGE_TOGGLE_KEY, enabled ? 'true' : 'false');
          } catch (_) {}
          if (enabled && !ui) {
            ui = createUi(hostname);
            bindEvents();
          } else if (!enabled && ui) {
            window.removeEventListener('message', onMessage);
            teardown();
            ui = null;
            ready = false;
            hasChats = false;
            unread = 0;
          }
        });
      } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
