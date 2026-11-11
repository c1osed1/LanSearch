
(function () {
  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname === 'msgtp.langame.ru'
    || hostname === 'msgpublic.langame.ru'
    || hostname.endsWith('.msgtp.langame.ru')
    || hostname.endsWith('.msgpublic.langame.ru')
  ) return;
  const MENU_ID = ["nav-accordion-parent", "globalMenuAccordion"];
  const SEARCH_ID = "globalMenuSearchInput";
  const STYLE_ID = "globalMenuSearchStyles";

  function getMenuRootFromIds() {
    for (const id of MENU_ID) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }


  function isExcludedHost(hostname) {
    const h = (hostname || '').toLowerCase();
    return h === 'msgtp.langame.ru'
      || h === 'msgpublic.langame.ru'
      || h.endsWith('.msgtp.langame.ru')
      || h.endsWith('.msgpublic.langame.ru');
  }

  function isSuitableDomain() {
    const hostname = window.location.hostname.toLowerCase();
    if (isExcludedHost(hostname)) return false;
    return hostname.includes('langame') || hostname.includes('cls') || hostname.includes('f5center');
  }


  function setDomainAttribute() {
    if (isSuitableDomain()) {
      document.documentElement.setAttribute('data-lansearch-domain', 'true');
    } else {
      document.documentElement.setAttribute('data-lansearch-domain', 'false');
    }
  }

  const AMOLED_STYLE_ID = 'lgs-amoled-force';
  const AMOLED_CSS = `
html.lgs-amoled {
  --bg-color: #000000 !important;
  --bg-secondary: #000000 !important;
  --bg-tertiary: #050505 !important;
  --surface: #000000 !important;
  --surface-solid: #000000 !important;
  --surface-container-highest: #000000 !important;
  --surface-container-lowest: #000000 !important;
  --work-fill-on-surface: #000000 !important;
  --border-color: #141414 !important;
}
html.lgs-amoled,
html.lgs-amoled body,
html.lgs-amoled #page-top,
html.lgs-amoled .content-wrapper,
html.lgs-amoled .main-content,
html.lgs-amoled .container-fluid,
html.lgs-amoled .container-fluid.px-1,
html.lgs-amoled .container-fluid.p-lg-3,
html.lgs-amoled .container-fluid.px-1.p-lg-3,
html.lgs-amoled .content-wrapper > .container-fluid,
html.lgs-amoled .layout,
html.lgs-amoled .layout__content,
html.lgs-amoled .layout__body,
html.lgs-amoled .layout__main,
html.lgs-amoled .layout__wrapper,
html.lgs-amoled .page-content,
html.lgs-amoled .wrapper,
html.lgs-amoled .page-wrapper,
html.lgs-amoled .navbar,
html.lgs-amoled .navbar.bg-dark,
html.lgs-amoled .navbar-dark,
html.lgs-amoled .navbar-sidenav,
html.lgs-amoled .navbar-brand,
html.lgs-amoled #mainNav,
html.lgs-amoled #mainNav.navbar,
html.lgs-amoled #mainNav.navbar.bg-dark,
html.lgs-amoled #js-header,
html.lgs-amoled #js-header.header,
html.lgs-amoled .layout__header,
html.lgs-amoled #js-header .container-fluid,
html.lgs-amoled .header .container-fluid,
html.lgs-amoled html .bg-dark,
html.lgs-amoled body .bg-dark,
html.lgs-amoled ul#globalMenuAccordion,
html.lgs-amoled #globalMenuAccordion,
html.lgs-amoled #globalMenuAccordion.navbar-nav,
html.lgs-amoled #globalMenuAccordion.navbar-sidenav,
html.lgs-amoled html body .navbar.navbar-dark > .navbar-brand,
html.lgs-amoled body .navbar.navbar-dark > .navbar-brand,
html.lgs-amoled #mainNav.navbar.navbar-dark > .navbar-brand,
html.lgs-amoled #mainNav > .navbar-brand,
html.lgs-amoled .card,
html.lgs-amoled .card-header,
html.lgs-amoled .card-body,
html.lgs-amoled .modal-content,
html.lgs-amoled .modal-header,
html.lgs-amoled .modal-footer,
html.lgs-amoled .modal-body,
html.lgs-amoled .dropdown-menu,
html.lgs-amoled .form-control,
html.lgs-amoled .input-group-text,
html.lgs-amoled .list-group-item,
html.lgs-amoled .table,
html.lgs-amoled .footer,
html.lgs-amoled #layoutStatusPC form.pc,
html.lgs-amoled .lan-search-pc-card,
html.lgs-amoled .lgs-clubs-tabs,
html.lgs-amoled .lgs-clubs-actions,
html.lgs-amoled .select-actions .lgs-select-filters,
html.lgs-amoled .select-actions .lgs-select-commands,
html.lgs-amoled .search-widget-container,
html.lgs-amoled .search-widget-container .search-input,
html.lgs-amoled .search-widget-container .search-results,
html.lgs-amoled #recentTabsContainer .lgs-tab-card,
html.lgs-amoled #recentTabsContainer .card,
html.lgs-amoled #guestSearchContainer .form-control,
html.lgs-amoled #massive-pc-selection-panel-allclubs,
html.lgs-amoled #massive-pc-selection-panel {
  background: #000000 !important;
  background-color: #000000 !important;
}
html.lgs-amoled .navbar-nav .nav-link.selected,
html.lgs-amoled .navbar-sidenav .nav-link.selected,
html.lgs-amoled .navbar-sidenav .nav-link.active,
html.lgs-amoled .btn-dark,
html.lgs-amoled .btn-secondary {
  background: #0a0a0a !important;
  background-color: #0a0a0a !important;
}
`.trim();

  function syncAmoledForceStyle(on) {
    let el = document.getElementById(AMOLED_STYLE_ID);
    if (!on) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = AMOLED_STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    if (el.textContent !== AMOLED_CSS) el.textContent = AMOLED_CSS;
    // всегда в конце head — перекрыть theme.css / сайт
    if (el.parentNode) el.parentNode.appendChild(el);
  }

  function forceAmoledInlineSurfaces() {
    const root = document.documentElement;
    [
      '--bg-color', '--bg-secondary', '--bg-tertiary',
      '--surface', '--surface-solid',
      '--surface-container-highest', '--surface-container-lowest',
      '--work-fill-on-surface'
    ].forEach((k) => root.style.setProperty(k, '#000000', 'important'));

    document.querySelectorAll(
      '.content-wrapper, .container-fluid, .main-content, #page-top, body'
    ).forEach((node) => {
      if (!node || !node.style) return;
      // recent-tabs ставит var(--bg-color); при битом каскаде форсим чёрный
      const bg = (node.getAttribute('style') || '');
      if (bg.includes('background') || node.classList.contains('container-fluid') || node.classList.contains('content-wrapper')) {
        node.style.setProperty('background-color', '#000000', 'important');
        node.style.setProperty('background', '#000000', 'important');
      }
    });
  }

  function clearAmoledInlineSurfaces() {
    const root = document.documentElement;
    [
      '--bg-color', '--bg-secondary', '--bg-tertiary',
      '--surface', '--surface-solid',
      '--surface-container-highest', '--surface-container-lowest',
      '--work-fill-on-surface'
    ].forEach((k) => root.style.removeProperty(k));

    document.querySelectorAll(
      '.content-wrapper, .container-fluid, .main-content, #page-top, body'
    ).forEach((node) => {
      if (!node || !node.style) return;
      node.style.removeProperty('background');
      node.style.removeProperty('background-color');
    });
  }

  // /reservation/: сайт пишет белый inline на .item-title / .row — zone-цвета не трогаем
  let reservationWhiteObserver = null;
  function isNearWhiteCssColor(value) {
    if (!value) return false;
    const m = String(value).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!m) return /^#(?:fff|ffffff|f5f5f5)$/i.test(String(value).trim());
    const r = +m[1], g = +m[2], b = +m[3];
    return r > 240 && g > 240 && b > 240;
  }
  function fixReservationWhiteInlines() {
    if (!(location.pathname || '').includes('/reservation/')) return;
    const darkLike = document.documentElement.getAttribute('data-theme') === 'dark'
      || document.documentElement.classList.contains('lgs-amoled');
    if (!darkLike) return;
    const amoled = document.documentElement.classList.contains('lgs-amoled');
    const titleBg = amoled ? '#000000' : '#1c1e20';
    const rowBg = amoled ? '#0a0a0a' : '#222428';
    document.querySelectorAll('.schedule_wrapper .item-title').forEach((el) => {
      if (!isNearWhiteCssColor(el.style.backgroundColor)) return;
      el.style.setProperty('background-color', titleBg, 'important');
      el.style.setProperty('color', '#f5f5f5', 'important');
    });
    document.querySelectorAll('.schedule_wrapper .schedule .rows .row').forEach((el) => {
      if (!isNearWhiteCssColor(el.style.backgroundColor)) return;
      el.style.setProperty('background-color', rowBg, 'important');
    });
  }
  function ensureReservationWhiteObserver() {
    if (!(location.pathname || '').includes('/reservation/')) return;
    if (reservationWhiteObserver) return;
    const root = document.body || document.documentElement;
    reservationWhiteObserver = new MutationObserver(() => {
      try { fixReservationWhiteInlines(); } catch (_) {}
    });
    reservationWhiteObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    fixReservationWhiteInlines();
  }

  // amoled = тёмная палитра + класс чистого чёрного
  function paintDocumentTheme(theme) {
    const t = (theme === 'amoled' || theme === 'light' || theme === 'dark') ? theme : 'dark';
    const attr = t === 'amoled' ? 'dark' : t;
    document.documentElement.setAttribute('data-theme', attr);
    document.documentElement.classList.toggle('lgs-amoled', t === 'amoled');

    // сайт (/reservation/ и др.) слушает body.dark_theme / light_theme
    const syncBodyThemeClass = () => {
      if (!document.body) return false;
      const darkLike = t === 'dark' || t === 'amoled';
      document.body.classList.toggle('dark_theme', darkLike);
      document.body.classList.toggle('light_theme', !darkLike);
      return true;
    };
    if (!syncBodyThemeClass()) {
      document.addEventListener('DOMContentLoaded', syncBodyThemeClass, { once: true });
    }

    syncAmoledForceStyle(t === 'amoled');
    if (t === 'amoled') forceAmoledInlineSurfaces();
    else clearAmoledInlineSurfaces();
    try {
      ensureReservationWhiteObserver();
      fixReservationWhiteInlines();
    } catch (_) {}
    return t;
  }


  setDomainAttribute();



  function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    

    if (isSuitableDomain()) {
      const themeLink = document.createElement("link");
      themeLink.rel = "stylesheet";
      themeLink.href = chrome.runtime.getURL("theme.css");
      document.head.appendChild(themeLink);

      try {
        paintDocumentTheme(localStorage.getItem('lanSearchTheme') || 'dark');
      } catch (e) {
        paintDocumentTheme('dark');
      }

      // класс нового UI ставит new-ui-boot.js на document_start; CSS — через manifest
      try {
        if (localStorage.getItem('lanSearchNewUi') === 'true') {
          document.documentElement.classList.add('lgs-new-ui');
        }
        if ((location.pathname || '').includes('/all_clubs_pc/') &&
            localStorage.getItem('lanSearchNewUiAllClubsPc') === 'true') {
          document.documentElement.classList.add('lgs-new-ui-pc');
        }
      } catch (_) {}
    }
    
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .gms-container {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 12px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        backdrop-filter: blur(8px);
        padding-top:0px;
      }
      .gms-field {
        position: relative;
        display: flex;
        align-items: center;
      }
      .gms-field-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 14px;
        height: 14px;
        pointer-events: none;
        opacity: 0.55;
        color: rgba(255,253,253,0.85);
      }
      .gms-field-icon svg {
        display: block;
        width: 14px;
        height: 14px;
      }
      .gms-input {
        width: 100%;
        height: 36px;
        padding: 8px 58px 8px 32px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        outline: none !important;
        box-shadow: none !important;
        font-size: 12px;
        line-height: 18px;
        background: rgba(255,255,255,0.06);
        color: #fffdfd;
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .gms-input::placeholder {
        color: rgba(255,253,253,0.45);
      }
      .gms-input::-webkit-search-decoration,
      .gms-input::-webkit-search-cancel-button,
      .gms-input::-webkit-search-results-button,
      .gms-input::-webkit-search-results-decoration {
        -webkit-appearance: none;
        appearance: none;
      }
      .gms-input:hover {
        border-color: rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.08);
      }
      .gms-input:focus {
        border-color: rgba(255,255,255,0.28);
        background: rgba(255,255,255,0.09);
        box-shadow: none !important;
        outline: none !important;
      }
      .gms-field-actions {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .gms-kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 5px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(0,0,0,0.25);
        color: rgba(255,253,253,0.55);
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        pointer-events: none;
      }
      .gms-clear {
        display: none;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border: none;
        border-radius: 6px;
        background: rgba(255,255,255,0.08);
        color: rgba(255,253,253,0.75);
        cursor: pointer;
      }
      .gms-clear:hover {
        background: rgba(255,255,255,0.14);
        color: #fff;
      }
      .gms-container.is-filled .gms-clear { display: inline-flex; }
      .gms-container.is-filled .gms-kbd,
      .gms-container.is-focused .gms-kbd { display: none; }
      .gms-meta {
        display: none;
        margin-top: 8px;
        font-size: 11px;
        color: rgba(255,253,253,0.45);
      }
      .gms-container.is-active .gms-meta { display: block; }
      .gms-no-results {
        padding: 14px 16px;
        color: rgba(255,253,253,0.5);
        font-size: 12px;
      }
      .gms-hidden { display: none !important; }
      .gms-highlight {
        color: #fff;
        background: rgba(220, 53, 69, 0.35);
        border-radius: 3px;
        padding: 0 2px;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }

      /* Светлый сайдбар / старые кабинеты */
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-container,
      .sidebar:not(.bg-dark) .gms-container,
      #accordionSidebar .gms-container {
        background: rgba(248,249,250,0.96);
        border-bottom-color: rgba(0,0,0,0.08);
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-input,
      .sidebar:not(.bg-dark) .gms-input,
      #accordionSidebar .gms-input {
        background: #fff;
        border-color: rgba(0,0,0,0.12);
        color: #212529;
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-input::placeholder,
      .sidebar:not(.bg-dark) .gms-input::placeholder,
      #accordionSidebar .gms-input::placeholder {
        color: rgba(33,37,41,0.45);
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-field-icon,
      .sidebar:not(.bg-dark) .gms-field-icon,
      #accordionSidebar .gms-field-icon {
        color: rgba(33,37,41,0.45);
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-kbd,
      .sidebar:not(.bg-dark) .gms-kbd,
      #accordionSidebar .gms-kbd {
        background: rgba(0,0,0,0.04);
        border-color: rgba(0,0,0,0.12);
        color: rgba(33,37,41,0.5);
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-clear,
      .sidebar:not(.bg-dark) .gms-clear,
      #accordionSidebar .gms-clear {
        background: rgba(0,0,0,0.05);
        color: rgba(33,37,41,0.65);
      }
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-meta,
      .sidebar:not(.bg-dark) .gms-meta,
      #accordionSidebar .gms-meta,
      html:not([data-theme="dark"]) .nav:not(.bg-dark) .gms-no-results,
      .sidebar:not(.bg-dark) .gms-no-results,
      #accordionSidebar .gms-no-results {
        color: rgba(33,37,41,0.5);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }




  function applyThemeToPage() {

    try {
      paintDocumentTheme(localStorage.getItem('lanSearchTheme') || 'dark');
    } catch (e) {
      paintDocumentTheme('dark');
    }
    

    getCurrentTheme((theme) => {
      const t = paintDocumentTheme(theme);

      try {
        localStorage.setItem('lanSearchTheme', t);
      } catch (e) {

      }
      

      applyThemeToNewElements();
    });
  }






  let currentTheme = 'dark';
  let themeApplied = false;


  function getCurrentTheme(callback) {
    if (themeApplied) {
      callback(currentTheme);
      return;
    }
    
    try {

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['theme'], function(result) {
          try {
            const missing = !result || result.theme === undefined;
            currentTheme = missing ? 'dark' : result.theme;
            themeApplied = true;
            if (missing) {
              try { chrome.storage.sync.set({ theme: 'dark' }); } catch (_) {}
            }
            try { localStorage.setItem('lanSearchTheme', currentTheme); } catch (_) {}
            callback(currentTheme);
          } catch (e) {

            try {
              currentTheme = localStorage.getItem('lanSearchTheme') || 'dark';
            } catch (e2) {
              currentTheme = 'dark';
            }
            themeApplied = true;
            callback(currentTheme);
          }
        });
      } else {

        try {
          currentTheme = localStorage.getItem('lanSearchTheme') || 'dark';
        } catch (e2) {
          currentTheme = 'dark';
        }
        themeApplied = true;
        callback(currentTheme);
      }
    } catch (e) {

      try {
        currentTheme = localStorage.getItem('lanSearchTheme') || 'dark';
      } catch (e2) {
        currentTheme = 'dark';
      }
      themeApplied = true;
      callback(currentTheme);
    }
  }


  function applyThemeToNewElements() {

    getCurrentTheme((theme) => {
      paintDocumentTheme(theme);
    });
  }


  function observeDOMChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {

          setTimeout(applyThemeToNewElements, 100);
        }
      });
    });


    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }


  function observeThemeAttribute() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const htmlElement = document.documentElement;
          const currentTheme = htmlElement.getAttribute('data-theme');
          const oldTheme = mutation.oldValue;
          

          if ((oldTheme === 'dark' && currentTheme !== 'dark') || 
              (oldTheme === 'dark' && !currentTheme)) {
            
            

            setTimeout(() => {
              applyThemeToNewElements();
            }, 200);
          }
        }
      });
    });


    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
      attributeOldValue: true
    });
  }

  function isNewNavLayout(menuRoot) {
    if (!menuRoot || !menuRoot.classList) return false;
    if (
      menuRoot.classList.contains('nav__content') ||
      menuRoot.classList.contains('nav__item') ||
      menuRoot.classList.contains('nav__list') ||
      menuRoot.id === 'nav-accordion-parent'
    ) {
      return true;
    }
    return !!menuRoot.querySelector?.('.nav__list, .nav__item, .nav__sublink, .nav__link');
  }

  function getMenuSearchItems(menuRoot) {
    if (isNewNavLayout(menuRoot)) {
      return $all("li.nav__item, .nav__sublist > li", menuRoot);
    }
    return $all("li", menuRoot);
  }

  function createSearchBar(menuRoot) {
    if (document.getElementById(SEARCH_ID)) return document.getElementById(SEARCH_ID);

    const container = document.createElement("div");
    container.className = "gms-container";
    container.innerHTML = `
      <div class="gms-field">
        <span class="gms-field-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input type="search" placeholder="Поиск по меню" id="${SEARCH_ID}" class="gms-input" autocomplete="off" aria-label="Поиск по меню" />
        <div class="gms-field-actions">
          <button type="button" class="gms-clear" id="globalMenuSearchClear" aria-label="Очистить поиск" title="Очистить">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <kbd class="gms-kbd" title="Клавиша /">/</kbd>
        </div>
      </div>
      <div class="gms-meta" id="globalMenuSearchMeta" aria-live="polite"></div>
    `;

    menuRoot.insertBefore(container, menuRoot.firstChild);
    return container.querySelector('#' + SEARCH_ID);
  }

  function updateSearchChrome(input, metaText = '') {
    const container = input?.closest('.gms-container');
    if (!container) return;
    const hasValue = !!(input.value || '').trim();
    container.classList.toggle('is-filled', hasValue);
    container.classList.toggle('is-active', hasValue);
    const meta = container.querySelector('#globalMenuSearchMeta');
    if (meta) meta.textContent = metaText || '';
  }

  function normalize(text) {
    return (text || "").toLowerCase().replace(/[\s_\-\u00A0]+/g, " ").trim();
  }

  function getItemLabel(el) {
    const menuRoot = el.closest('#nav-accordion-parent, .nav__content, #globalMenuAccordion');
    if (isNewNavLayout(menuRoot || el)) {
      // Own title only — collapse/submenu lives inside li, so don't use el.textContent
      const labelNode =
        el.querySelector(":scope > .nav__link > span:not(.nav__link-icon):not(.nav__link-arrow)") ||
        el.querySelector(":scope > .nav__sublink") ||
        el.querySelector(":scope > .nav__link") ||
        el.querySelector(":scope > a");
      const text = labelNode
        ? (labelNode.matches('a.nav__link')
            ? (labelNode.querySelector('span:not(.nav__link-icon):not(.nav__link-arrow)')?.textContent || labelNode.textContent)
            : labelNode.textContent)
        : '';
      return normalize(text);
    }

    const labelNode = el.querySelector(".nav-link-text") || el.querySelector("a");
    const text = labelNode ? labelNode.textContent : el.textContent;
    return normalize(text);
  }

  function clearHighlights(root) {
    $all(".gms-highlight", root).forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(el.textContent || ""), el);
      parent.normalize();
    });
  }

  function highlightMatch(el, query) {
    if (!query) return;
    const targets = $all(":scope > .nav__link span:not(.nav__link-icon):not(.nav__link-arrow), :scope > .nav__sublink, :scope > a, .nav-link-text", el);
    const nodes = targets.length ? targets : [el];
    nodes.forEach((node) => {
      const text = node.textContent || "";
      const lower = normalize(text);
      const idx = lower.indexOf(query);
      if (idx < 0 || node.querySelector('.gms-highlight')) return;

      // Align index against original text roughly via lowercased scan
      const rawLower = text.toLowerCase();
      const rawIdx = rawLower.indexOf(query);
      if (rawIdx < 0) return;
      const before = text.slice(0, rawIdx);
      const match = text.slice(rawIdx, rawIdx + query.length);
      const after = text.slice(rawIdx + query.length);
      node.textContent = "";
      if (before) node.appendChild(document.createTextNode(before));
      const mark = document.createElement("mark");
      mark.className = "gms-highlight";
      mark.textContent = match;
      node.appendChild(mark);
      if (after) node.appendChild(document.createTextNode(after));
    });
  }

  function expandAncestors(li) {
    let parent = li.parentElement;
    while (parent && parent !== document.body) {
      if (parent.classList.contains("collapse")) {
        parent.classList.add("show");
        parent.style.height = "auto";
      }
      if (parent.id && parent.id.startsWith("collapse")) {
        const trigger =
          document.querySelector(`[href="#${parent.id}"]`) ||
          document.querySelector(`[data-bs-target="#${parent.id}"]`) ||
          document.querySelector(`[aria-controls="${parent.id}"]`);
        if (trigger) {
          trigger.classList.remove("collapsed");
          trigger.setAttribute("aria-expanded", "true");
        }
      }
      parent = parent.parentElement;
    }
  }

  let initialCollapseState = null;
  function captureInitialCollapseState(menuRoot) {
    initialCollapseState = {};
    $all(".collapse", menuRoot).forEach((el) => {
      if (el.id) initialCollapseState[el.id] = el.classList.contains("show");
    });
  }
  function restoreInitialCollapseState(menuRoot) {
    if (!initialCollapseState) return;
    Object.entries(initialCollapseState).forEach(([id, wasShown]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const trigger =
        document.querySelector(`[href="#${id}"]`) ||
        document.querySelector(`[data-bs-target="#${id}"]`) ||
        document.querySelector(`[aria-controls="${id}"]`);
      if (wasShown) {
        el.classList.add("show");
        el.style.height = "auto";
        if (trigger) { trigger.classList.remove("collapsed"); trigger.setAttribute("aria-expanded", "true"); }
      } else {
        el.classList.remove("show");
        el.style.height = "";
        if (trigger) { trigger.classList.add("collapsed"); trigger.setAttribute("aria-expanded", "false"); }
      }
    });
  }

  function getVisibleLeafLinks(menuRoot) {
    const visibleElements = getMenuSearchItems(menuRoot)
      .filter((li) => !li.classList.contains("gms-hidden"));

    const links = [];
    visibleElements.forEach((el) => {
      const a = el.querySelector(":scope > .nav__sublink[href], :scope > .nav__link[href], :scope > a[href], a[href]");
      if (a && !a.getAttribute("href")?.startsWith("#")) links.push({ li: el, a });
    });
    return links;
  }

  function filterMenu(menuRoot, queryRaw) {
    const query = normalize(queryRaw);
    const searchElements = getMenuSearchItems(menuRoot);
    const input = document.getElementById(SEARCH_ID);
    const noResHost = menuRoot.querySelector('.gms-container') || menuRoot;

    clearHighlights(menuRoot);

    if (!query) {
      searchElements.forEach((el) => el.classList.remove("gms-hidden"));
      const noRes = $(".gms-no-results", menuRoot);
      if (noRes) noRes.remove();
      restoreInitialCollapseState(menuRoot);
      updateSearchChrome(input, '');
      return;
    }

    const matches = [];

    searchElements.forEach((el) => {
      const label = getItemLabel(el);
      const isMatch = label.includes(query);
      if (isMatch) {
        el.classList.remove("gms-hidden");
        matches.push(el);
      } else {
        el.classList.add("gms-hidden");
      }
    });

    // If parent category matches — show its children too
    matches.forEach((li) => {
      if (li.classList.contains('nav__item')) {
        $all('.nav__sublist > li', li).forEach((child) => child.classList.remove('gms-hidden'));
      }
    });

    matches.forEach((li) => {
      expandAncestors(li);
      highlightMatch(li, query);
      let parent = li.parentElement;
      while (parent && parent !== menuRoot) {
        if (parent.tagName === "UL") parent.classList.remove("gms-hidden");
        if (parent.tagName === "LI") parent.classList.remove("gms-hidden");
        parent = parent.parentElement;
      }
    });

    let noRes = $(".gms-no-results", menuRoot);
    if (!matches.length) {
      if (!noRes) {
        noRes = document.createElement("div");
        noRes.className = "gms-no-results";
        noRes.textContent = "Ничего не найдено";
        const list = menuRoot.querySelector('.nav__list, ul');
        if (list) menuRoot.insertBefore(noRes, list);
        else noResHost.appendChild(noRes);
      }
      updateSearchChrome(input, 'Ничего не найдено');
    } else {
      if (noRes) noRes.remove();
      const leafCount = getVisibleLeafLinks(menuRoot).length;
      updateSearchChrome(input, leafCount ? `Найдено: ${leafCount}` : `Совпадений: ${matches.length}`);
    }
  }

  function shouldAutoActivate() {

    if (window.location.pathname.includes('/pc_tasks_config/')) {
      console.log('Lan-Search: Расширение отключено на странице /pc_tasks_config/ для предотвращения поломки Bootstrap Select');
      return false;
    }
    
    if (window.lanSearchIsCurrentDomainSuitable) {
      return window.lanSearchIsCurrentDomainSuitable();
    }

    return isSuitableDomain();
  }

  function isAuthPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return path.includes('/auth') || path.endsWith('auth.php');
  }

  function init() {
    if (isAuthPage()) {
      console.log('Lan-Search: пропуск инициализации поиска на странице авторизации');
      return;
    }

    let menuRoot = getMenuRootFromIds();
    const menuFromKnownIds = !!menuRoot;

    // Не подставляем body/nav/header: на auth и страницах без меню
    // это вставляет "Поиск по меню" куда попало (в т.ч. в document.body).
    if (!menuRoot) {
      if (shouldAutoActivate()) {
        console.log("Lan-Search: ни #nav-accordion-parent, ни #globalMenuAccordion не найдены на подходящем домене");
      }
      return;
    }


    if (document.getElementById(SEARCH_ID)) {
      return;
    }

    injectStylesOnce();
    const input = createSearchBar(menuRoot);
    const container = input.closest('.gms-container');
    const clearBtn = container?.querySelector('#globalMenuSearchClear');

    if (menuFromKnownIds) {
      captureInitialCollapseState(menuRoot);
    }

    let handle;
    const runFilter = () => {
      updateSearchChrome(input);
      filterMenu(menuRoot, input.value);
    };

    input.addEventListener("input", () => {
      updateSearchChrome(input);
      clearTimeout(handle);
      handle = setTimeout(runFilter, 120);
    });

    input.addEventListener("focus", () => container?.classList.add('is-focused'));
    input.addEventListener("blur", () => container?.classList.remove('is-focused'));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        runFilter();
        input.blur();
      } else if (e.key === "Enter") {
        const visible = getVisibleLeafLinks(menuRoot);
        if (visible.length === 1) {
          visible[0].a.click();
        }
      }
    });

    clearBtn?.addEventListener("click", () => {
      input.value = "";
      runFilter();
      input.focus();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          input.focus();
          input.select();
        }
      }
    });

    updateSearchChrome(input);

    if (!shouldAutoActivate()) {
      input.focus();
    }
  }


  window.lanSearchInit = init;


  window.lanSearchCreateWebSocket = createWebSocketConnection;


  let webSocketSettingCache = null;
  let webSocketSettingCacheTime = 0;
  const WEB_SOCKET_CACHE_DURATION = 5000; // 5 секунд


  function getWebSocketSetting(callback) {
    const now = Date.now();
    

    if (webSocketSettingCache !== null && (now - webSocketSettingCacheTime) < WEB_SOCKET_CACHE_DURATION) {
      callback(webSocketSettingCache);
      return;
    }
    
    chrome.storage.sync.get(['customWebSocket'], function(result) {
      if (chrome.runtime.lastError) {
        callback(false);
        return;
      }
      
      const setting = result.customWebSocket || false;
      webSocketSettingCache = setting;
      webSocketSettingCacheTime = now;
      
      callback(setting);
    });
  }


  function clearWebSocketSettingCache() {
    webSocketSettingCache = null;
    webSocketSettingCacheTime = 0;
  }


  window.lanSearchGetWebSocketSetting = getWebSocketSetting;


  window.lanSearchClearWebSocketSettingCache = clearWebSocketSettingCache;


  function createWebSocketConnection() {
    

    if (window._lanSearchWebSocket && window._lanSearchWebSocket.readyState === WebSocket.OPEN) {
      return;
    }
    
    if (window._lanSearchWebSocket && window._lanSearchWebSocket.readyState === WebSocket.CONNECTING) {
      return;
    }
    

    getWebSocketSetting(function(enabled) {
      if (!enabled) {
        return;
      }
      
      

      const domain = document.querySelector('meta[name="domain"]')?.getAttribute('content') || window.location.hostname;
    

      const sessionId = session_id();
      if (!sessionId) {
        return;
      }
      

      const wsUrl = `wss://${domain}/wss/?client_guid=${sessionId}&type_client=browser`;
      
      try {

        const ws = new WebSocket(wsUrl);
        window._lanSearchWebSocket = ws; // Сохраняем соединение глобально
        
        ws.onopen = function(event) {
          

          if (typeof requestAllPCStatus === 'function') {
            requestAllPCStatus();
          }
        };
        
        ws.onmessage = function(event) {
          try {
            const data = JSON.parse(event.data);
            

            if (data.status_pc !== undefined) {
              if (typeof window.lanSearchProcessPCData === 'function') {
                window.lanSearchProcessPCData(data);
              }
              return;
            }
            

            switch (data.command) {
              case "showConfig":
                if (typeof window.lanSearchProcessPCData === 'function') {
                  window.lanSearchProcessPCData(data);
                }
                break;
            }
            
          } catch (e) {
          }
        };
        
        ws.onclose = function(event) {
          

          setTimeout(() => {
            if (typeof window.lanSearchCreateWebSocket === 'function') {
              window.lanSearchCreateWebSocket();
            } else {
            }
          }, 3000);
        };
        
        ws.onerror = function(event) {
        };
        
      } catch (e) {
      }
    });
  }

  if (shouldAutoActivate()) {

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }


  if (window.location.hostname.includes('langame') || window.location.hostname.includes('cls') || window.location.hostname.includes('f5center')) {
    console.log('Lan-Search: Создание WebSocket соединения для домена:', window.location.hostname);
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (typeof window.lanSearchCreateWebSocket === 'function') {
            window.lanSearchCreateWebSocket();
          } else {
          }
        }, 1000);
      });
    } else {
      setTimeout(() => {
        if (typeof window.lanSearchCreateWebSocket === 'function') {
          window.lanSearchCreateWebSocket();
        } else {
        }
      }, 1000);
    }
  }


  function initGuestSearch() {
    if (shouldAutoActivate()) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {

          if (document.getElementById('recentTabsContainer') || document.getElementById('js-subscription-container') || document.getElementById('langameSubscriptionWrapper')) {
            initGuestSearchOnMainPage();
          } else {

            setTimeout(initGuestSearchOnMainPage, 50);
          }
        });
      } else {

        if (document.getElementById('recentTabsContainer') || document.getElementById('js-subscription-container') || document.getElementById('langameSubscriptionWrapper')) {
          initGuestSearchOnMainPage();
        } else {

          setTimeout(initGuestSearchOnMainPage, 50);
        }
      }
    }
  }


  const LGS_ICONS = {
    search: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    minus: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    gift: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    cubes: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    spinner: '<svg class="lgs-ico lgs-ico-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    arrowLeft: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    save: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    userSlash: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    box: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    monitor: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    lock: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    unlock: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    power: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
    powerOn: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    // сброс сессии — выход, не «перезагрузка»
    reset: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    wrench: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    stop: '<svg class="lgs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="0.5" fill="currentColor" stroke="none"/></svg>'
  };

  initGuestSearch();


  window.lanSearchInit = init;
  

  window.lanSearchInitGuestSearch = initGuestSearchOnMainPage;
  
  
  window.initFavoritesDragDrop = initFavoritesDragDrop;
  

  function applyPageSkipOneConfirm(enabled) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'lgsSetSkipOneConfirm', enabled: !!enabled }, () => {
          void chrome.runtime.lastError;
        });
      }
    } catch (_) {}
  }

  function applyModalBypassState(enabled) {
    applyPageSkipOneConfirm(enabled);
    if (enabled) replaceButtonsWithDivs();
    else restoreDivsToButtons();
  }

  window.lanSearchSyncModalBypass = function() {
    clearModalBypassCache();
    getModalBypassSetting(function(enabled) {
      applyModalBypassState(enabled);
    });
  };

  try {

    if (!shouldAutoActivate()) {

    }
  } catch (e) {
    console.error("Lan-Search init error", e);
  }


  function initRecentTabsTracking() {
    const menuRoot = getMenuRootFromIds();
    if (!menuRoot) return;


    if (window.recentTabsManager) {
      window.recentTabsManager.startTracking(menuRoot);
    }
  }


  function createGuestSearchBlock() {
    const container = document.createElement('div');
    container.id = 'guestSearchContainer';
    container.className = 'lgs-guest-panel';

    container.innerHTML = `
      <div class="lgs-guest-header">
        <div class="lgs-guest-title-wrap">
          <h3 class="lgs-guest-title" id="modeTitle">Поиск гостей</h3>
        </div>
        <div class="lgs-guest-tabs" role="tablist">
          <button type="button" id="modeSearchBtn" class="lgs-guest-tab is-active" role="tab" aria-selected="true">
            Поиск гостей
          </button>
          <button type="button" id="modeBulkBtn" class="lgs-guest-tab" role="tab" aria-selected="false">
            Массовый баланс
          </button>
          <button type="button" id="modeInventBtn" class="lgs-guest-tab" role="tab" aria-selected="false">
            ${LGS_ICONS.cubes} Инвентаризация
          </button>
        </div>
      </div>

      <div class="lgs-guest-body">
        <div id="guestSearchMode">
          <div class="lgs-guest-searchbar input-group">
            <span class="input-group-text lgs-guest-search-icon" aria-hidden="true">
              ${LGS_ICONS.search}
            </span>
            <input type="search" id="guestSearchInput" class="form-control" placeholder="Введите номер телефона, ФИО или email гостя..." autocomplete="off" />
            <button class="btn btn-primary" type="button" id="searchGuestBtn">
              ${LGS_ICONS.search} Найти
            </button>
          </div>

          <div id="guestSearchResults" class="lgs-guest-results" hidden>
            <div class="table-responsive">
              <table class="table table-hover lgs-guest-table mb-0">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Баланс</th>
                    <th>Бонусы</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody id="guestSearchResultsBody"></tbody>
              </table>
            </div>
          </div>
          <div id="guestSearchNoResults" class="lgs-guest-empty" hidden>
            ${LGS_ICONS.userSlash}
            <span>Гости не найдены</span>
          </div>
        </div>

        <div id="bulkBalanceMode" hidden>
          <p class="lgs-guest-hint">Загрузите Excel/CSV с колонками телефона и сумм — скрипт сам определит «Телефон», «Баланс», «Бонусный баланс».</p>
          <div class="lgs-bulk-toolbar">
            <label class="lgs-bulk-file btn btn-outline-secondary">
              Выбрать файл
              <input type="file" id="bulkBalanceFile" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden />
            </label>
            <span id="bulkBalanceFileName" class="lgs-bulk-file-name">Файл не выбран</span>
          </div>

          <div class="lgs-bulk-controls">
            <div class="lgs-bulk-field">
              <div class="lgs-bulk-label">Действие</div>
              <div class="lgs-bulk-radios">
                <label class="lgs-bulk-radio"><input type="radio" name="bulkBalanceAction" value="add" checked /> Пополнить</label>
                <label class="lgs-bulk-radio"><input type="radio" name="bulkBalanceAction" value="sub" /> Списать</label>
              </div>
            </div>
            <div class="lgs-bulk-field">
              <div class="lgs-bulk-label">Что менять</div>
              <div class="lgs-bulk-checks">
                <label class="lgs-bulk-check"><input type="checkbox" id="bulkApplyBalance" checked /> Баланс</label>
                <label class="lgs-bulk-check"><input type="checkbox" id="bulkApplyBonus" checked /> Бонусный баланс</label>
              </div>
            </div>
          </div>

          <div id="bulkBalanceMeta" class="lgs-bulk-meta" hidden></div>
          <div id="bulkBalancePreview" class="lgs-guest-results" hidden>
            <div class="table-responsive">
              <table class="table table-hover lgs-guest-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Телефон</th>
                    <th>Баланс</th>
                    <th>Бонусы</th>
                  </tr>
                </thead>
                <tbody id="bulkBalancePreviewBody"></tbody>
              </table>
            </div>
          </div>

          <div class="lgs-bulk-actions">
            <button type="button" id="bulkBalanceStartBtn" class="btn btn-primary" disabled>Запустить</button>
            <button type="button" id="bulkBalanceStopBtn" class="btn btn-outline-secondary" hidden>Стоп</button>
          </div>
          <div id="bulkBalanceProgress" class="lgs-bulk-progress" hidden>
            <div class="lgs-bulk-progress-bar"><span id="bulkBalanceProgressFill"></span></div>
            <div id="bulkBalanceProgressText" class="lgs-bulk-progress-text"></div>
          </div>
          <div id="bulkBalanceLog" class="lgs-bulk-log" hidden></div>
        </div>

        <div id="inventMode" hidden>
          <div id="inventClubsSelection">
            <p class="lgs-guest-hint">Выберите клуб для инвентаризации</p>
            <div id="clubsList" class="lgs-guest-clubs">
              <div class="lgs-guest-loading">
                ${LGS_ICONS.spinner} Загрузка клубов...
              </div>
            </div>
          </div>

          <div id="inventProductsSection" hidden>
            <div class="lgs-guest-invent-toolbar">
              <div class="lgs-guest-invent-toolbar-left">
                <button type="button" id="backToClubsBtn" class="btn btn-outline-secondary btn-sm">
                  ${LGS_ICONS.arrowLeft} Назад
                </button>
                <div id="selectedClubName" class="lgs-guest-club-name"></div>
              </div>
              <button type="button" id="saveInventBtnTop" class="btn btn-success btn-sm" hidden>
                ${LGS_ICONS.save} Сохранить
              </button>
            </div>

            <div id="inventResults" hidden>
              <div class="lgs-guest-searchbar input-group mb-3">
                <span class="input-group-text lgs-guest-search-icon" aria-hidden="true">
                  ${LGS_ICONS.search}
                </span>
                <input type="search" id="inventSearchInput" class="form-control" placeholder="Поиск по ID или наименованию..." autocomplete="off" />
              </div>
              <div class="table-responsive">
                <table class="table table-hover lgs-guest-table mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Наименование</th>
                      <th>Текущий остаток</th>
                      <th>Фактический остаток</th>
                    </tr>
                  </thead>
                  <tbody id="inventResultsBody"></tbody>
                </table>
              </div>
              <button type="button" id="saveInventBtn" class="btn btn-success w-100 mt-3">
                ${LGS_ICONS.save} Сохранить инвентаризацию
              </button>
            </div>
            <div id="inventNoResults" class="lgs-guest-empty" hidden>
              ${LGS_ICONS.box}
              <span>Продукты не загружены</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (!document.getElementById('addBalanceModal')) {
      const modal = document.createElement('div');
      modal.id = 'addBalanceModal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content lgs-guest-modal">
            <div class="modal-header">
              <h5 class="modal-title">Пополнить баланс</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form name="addBalanceForm">
                <input type="hidden" name="guest_id" value="">
                <div class="mb-3">
                  <label class="form-label" for="balanceAmount">Сумма</label>
                  <input id="balanceAmount" tabindex="0" type="number" class="form-control" max="999999" step="0.01" name="balance" placeholder="0.00" autocomplete="off" required>
                </div>
                <button tabindex="1" type="submit" class="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    if (!document.getElementById('addBonusModal')) {
      const bonusModal = document.createElement('div');
      bonusModal.id = 'addBonusModal';
      bonusModal.className = 'modal fade';
      bonusModal.setAttribute('tabindex', '-1');
      bonusModal.setAttribute('aria-hidden', 'true');
      bonusModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content lgs-guest-modal">
            <div class="modal-header">
              <h5 class="modal-title">Управление бонусами</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form name="addBonusForm">
                <input type="hidden" name="guest_id" value="">
                <input type="hidden" name="action" value="">
                <div class="mb-3">
                  <label class="form-label" for="bonusAmount">Сумма бонусов</label>
                  <input id="bonusAmount" tabindex="0" type="number" class="form-control" max="999999" step="0.01" name="bonus_balance" placeholder="0.00" autocomplete="off" required>
                </div>
                <button tabindex="1" type="submit" class="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(bonusModal);
    }

    return container;
  }


  function getMasterApiToken() {
    try {
      const fromCookie =
        getCookie('token_master_api') ||
        getCookie('token') ||
        getCookie('auth_token') ||
        getCookie('access_token');
      if (fromCookie) return decodeURIComponent(fromCookie);
    } catch (e) {}
    try {
      return localStorage.getItem('token_master_api') || localStorage.getItem('token') || '';
    } catch (e) {
      return '';
    }
  }

  function getMasterApiLanguage() {
    return document.querySelector('meta[name="language"]')?.getAttribute('content') || 'ru';
  }

  async function masterApiRequest(path, { method = 'GET', body = null, query = null } = {}) {
    const token = getMasterApiToken();
    if (!token) {
      throw new Error('Не найден token_master_api. Обновите страницу или войдите заново.');
    }

    let url = path.startsWith('http') ? path : `/master_api${path.startsWith('/') ? path : '/' + path}`;
    if (query) {
      const qs = query instanceof URLSearchParams ? query : new URLSearchParams(query);
      const q = qs.toString();
      if (q) url += (url.includes('?') ? '&' : '?') + q;
    }

    const language = getMasterApiLanguage();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Language': language,
      'X-Language': language,
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01'
    };

    const options = { method, headers, credentials: 'include' };
    if (body != null && method.toUpperCase() !== 'GET') {
      if (body instanceof FormData) {
        options.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error_message || `HTTP ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    if (data && typeof data.error_code !== 'undefined' && data.error_code !== 0) {
      const err = new Error(data.error_message || 'Ошибка master_api');
      err.data = data;
      throw err;
    }

    return data;
  }

  async function searchGuests(query, options = {}) {
    const silent = !!options.silent;
    if (!query || query.trim().length < 3) {
      if (!silent) showNotification('Введите минимум 3 символа для поиска', 'warning');
      return;
    }

    try {
      const params = new URLSearchParams({
        page: '1',
        onpage: '20',
        order_by: 'fio',
        order_dir: 'asc',
        search: query.trim()
      });

      const data = await masterApiRequest('/guests/search/list', { query: params });
      return data;
    } catch (error) {
      console.error('Ошибка при поиске гостей:', error);
      if (silent) throw error;
      if (error?.data?.error_code === 9) {
        showNotification('Ошибка авторизации. Войдите заново', 'error');
      } else {
        showNotification(error.message || 'Ошибка при поиске гостей', 'error');
      }
      return null;
    }
  }

  // Функции для работы с инвентаризацией
  function getClubId() {
    // Пытаемся получить club_id из URL
    const urlParams = new URLSearchParams(window.location.search);
    const clubId = urlParams.get('club_id');
    if (clubId) return clubId;
    
    // Пытаемся получить из meta тега
    const metaClubId = document.querySelector('meta[name="club_id"]');
    if (metaClubId) return metaClubId.getAttribute('content');
    
    return null;
  }

  async function loadClubsForInvent() {
    try {
      // Загружаем страницу инвентаризации для получения списка клубов
      const response = await fetch('/products_invent/', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Ищем select с клубами - может быть в разных местах
      let clubsSelect = doc.querySelector('select[name="club_id"]');
      if (!clubsSelect) {
        // Пробуем найти в модальном окне создания тикета
        clubsSelect = doc.querySelector('#createTickedWindow select[name="club_id"]');
      }
      
      if (!clubsSelect) {
        showNotification('Не удалось найти список клубов', 'error');
        return null;
      }

      const clubs = [];
      const options = clubsSelect.querySelectorAll('option');
      
      options.forEach(option => {
        const value = option.value;
        const text = option.textContent.trim();
        if (value && value !== '0' && text) {
          clubs.push({
            id: value,
            name: text
          });
        }
      });

      return clubs.length > 0 ? clubs : null;
    } catch (error) {
      console.error('Ошибка при загрузке клубов:', error);
      showNotification('Ошибка при загрузке клубов: ' + error.message, 'error');
      return null;
    }
  }

  function displayClubsForInvent(clubs) {
    const clubsList = document.getElementById('clubsList');
    if (!clubsList) return;

    clubsList.innerHTML = '';

    if (!clubs || clubs.length === 0) {
      clubsList.innerHTML = '<div class="lgs-guest-empty is-error">Клубы не найдены</div>';
      return;
    }

    clubs.forEach(club => {
      const clubBtn = document.createElement('button');
      clubBtn.type = 'button';
      clubBtn.className = 'lgs-guest-club-btn';
      clubBtn.textContent = club.name;
      clubBtn.setAttribute('data-club-id', club.id);

      clubBtn.addEventListener('click', async () => {
        const clubId = clubBtn.getAttribute('data-club-id');
        const clubName = clubBtn.textContent;

        setHidden(document.getElementById('inventClubsSelection'), true);
        setHidden(document.getElementById('inventProductsSection'), false);
        const selectedClubName = document.getElementById('selectedClubName');
        if (selectedClubName) {
          selectedClubName.textContent = clubName;
          selectedClubName.setAttribute('data-club-id', clubId);
        }

        await loadProductsForInvent(clubId);
      });

      clubsList.appendChild(clubBtn);
    });
  }

  async function loadProductsForInvent(clubId) {
    try {
      if (!clubId) {
        showNotification('Не указан club_id', 'error');
        return null;
      }

      // Загружаем страницу инвентаризации для выбранного клуба
      const response = await fetch(`/products_invent/?club_id=${clubId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Ищем таблицу с продуктами по ID
      const table = doc.querySelector('#dataTableIncome tbody');
      
      if (!table) {
        showNotification('Не удалось найти таблицу продуктов', 'warning');
        return null;
      }

      const products = [];
      const rows = table.querySelectorAll('tr');
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
          // Извлекаем данные из строки таблицы
          // Структура: Клуб, Сортировка, Наименование, Группа, art_numbers (скрыто), Цена закупки, Текущий остаток, Фактический остаток (input)
          
          // Название продукта - 3-я колонка (индекс 2)
          const productName = cells[2] ? cells[2].textContent.trim() : '';
          
          // Цена закупки - 6-я колонка (индекс 5)
          const price = cells[5] ? cells[5].textContent.trim() : '0';
          
          // Текущий остаток - 7-я колонка (индекс 6)
          const currentCount = cells[6] ? cells[6].textContent.trim() : '0';
          
          // Фактический остаток - input в 8-й колонке (индекс 7)
          const countInput = cells[7] ? cells[7].querySelector('input[name*="count"]') : null;
          
          if (countInput) {
            // Извлекаем product_id из name атрибута: count[1093] -> 1093
            const nameMatch = countInput.getAttribute('name').match(/count\[(\d+)\]/);
            if (nameMatch && nameMatch[1] && productName) {
              const productId = nameMatch[1];
              products.push({
                id: productId,
                name: productName,
                currentCount: currentCount,
                price: price,
                clubId: clubId
              });
            }
          }
        }
      });

      if (products.length === 0) {
        showNotification('Не удалось извлечь данные о продуктах', 'warning');
        return null;
      }

      // Отображаем продукты
      displayInventProducts(products);
      return products;
    } catch (error) {
      console.error('Ошибка при загрузке продуктов:', error);
      showNotification('Ошибка при загрузке продуктов: ' + error.message, 'error');
      return null;
    }
  }

  // Сохраняем все продукты для фильтрации
  let allInventProducts = [];

  function filterInventProducts(searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
      displayInventProductsTable(allInventProducts);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allInventProducts.filter(product => {
      const idMatch = product.id.toString().toLowerCase().includes(query);
      const nameMatch = product.name.toLowerCase().includes(query);
      return idMatch || nameMatch;
    });

    displayInventProductsTable(filtered);
  }

  function displayInventProductsTable(products) {
    const resultsBody = document.getElementById('inventResultsBody');
    if (!resultsBody) return;

    resultsBody.innerHTML = '';

    if (!products || products.length === 0) {
      resultsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">Продукты не найдены</td></tr>';
      return;
    }

    products.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td class="current-count-cell" data-product-id="${product.id}">${product.currentCount || '0'}</td>
        <td>
          <input type="text" 
                 class="form-control form-control-sm invent-count" 
                 data-product-id="${product.id}" 
                 value="" 
                 placeholder="0" 
                 min="0"
                 style="width: 120px;">
        </td>
      `;
      resultsBody.appendChild(row);
    });
  }

  function displayInventProducts(products) {
    const resultsContainer = document.getElementById('inventResults');
    const noResultsContainer = document.getElementById('inventNoResults');
    const saveInventBtnTop = document.getElementById('saveInventBtnTop');
    const searchInput = document.getElementById('inventSearchInput');

    if (!products || products.length === 0) {
      setHidden(resultsContainer, true);
      setHidden(noResultsContainer, false);
      setHidden(saveInventBtnTop, true);
      allInventProducts = [];
      return;
    }

    allInventProducts = products;

    setHidden(resultsContainer, false);
    setHidden(noResultsContainer, true);
    setHidden(saveInventBtnTop, false);

    if (searchInput) {
      searchInput.value = '';
    }

    displayInventProductsTable(products);
  }

  async function saveInvent() {
    try {
      // Получаем club_id из выбранного клуба
      const selectedClubName = document.getElementById('selectedClubName');
      const clubId = selectedClubName ? selectedClubName.getAttribute('data-club-id') : null;
      
      if (!clubId) {
        showNotification('Не удалось определить club_id', 'error');
        return;
      }

      const countInputs = document.querySelectorAll('.invent-count');
      
      const inventData = {};
      const productUpdates = {}; // Сохраняем данные для обновления текущего остатка
      let hasData = false;

      countInputs.forEach(input => {
        const productId = input.getAttribute('data-product-id');
        const count = input.value.trim();
        
        if (count && count !== '' && count !== '0') {
          inventData[`count[${productId}]`] = count + '__';
          productUpdates[productId] = count; // Сохраняем для обновления
          hasData = true;
        }
      });

      if (!hasData) {
        showNotification('Укажите хотя бы одно количество для сохранения', 'warning');
        return;
      }

      const formData = new URLSearchParams();
      formData.append('command', 'invent');
      formData.append('club_id', clubId);
      
      Object.keys(inventData).forEach(key => {
        formData.append(key, inventData[key]);
      });

      const response = await fetch('/products_invent/crud.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/javascript, */*; q=0.01'
        },
        credentials: 'include',
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ok') {
        showNotification('Инвентаризация успешно сохранена', 'success');
        
        // Обновляем текущий остаток на значение из фактического остатка
        Object.keys(productUpdates).forEach(productId => {
          const currentCountCell = document.querySelector(`.current-count-cell[data-product-id="${productId}"]`);
          const countInput = document.querySelector(`.invent-count[data-product-id="${productId}"]`);
          
          if (currentCountCell && countInput) {
            const newCount = countInput.value.trim();
            if (newCount) {
              currentCountCell.textContent = newCount;
              // Очищаем поле ввода
              countInput.value = '';
            }
          }
        });
      } else {
        showNotification('Ошибка при сохранении: ' + (result.textStatus || 'Неизвестная ошибка'), 'error');
      }
    } catch (error) {
      console.error('Ошибка при сохранении инвентаризации:', error);
      showNotification('Ошибка при сохранении инвентаризации', 'error');
    }
  }

  function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) {
      el.setAttribute('hidden', '');
      el.style.display = 'none';
    } else {
      el.removeAttribute('hidden');
      el.style.display = '';
    }
  }

  function switchMode(mode) {
    const guestSearchMode = document.getElementById('guestSearchMode');
    const bulkBalanceMode = document.getElementById('bulkBalanceMode');
    const inventMode = document.getElementById('inventMode');
    const modeTitle = document.getElementById('modeTitle');
    const modeSearchBtn = document.getElementById('modeSearchBtn');
    const modeBulkBtn = document.getElementById('modeBulkBtn');
    const modeInventBtn = document.getElementById('modeInventBtn');

    const setTab = (btn, on) => {
      btn?.classList.toggle('is-active', on);
      btn?.setAttribute('aria-selected', on ? 'true' : 'false');
    };

    setHidden(guestSearchMode, mode !== 'search');
    setHidden(bulkBalanceMode, mode !== 'bulk');
    setHidden(inventMode, mode !== 'invent');
    setTab(modeSearchBtn, mode === 'search');
    setTab(modeBulkBtn, mode === 'bulk');
    setTab(modeInventBtn, mode === 'invent');

    if (mode === 'search') {
      if (modeTitle) modeTitle.textContent = 'Поиск гостей';
    } else if (mode === 'bulk') {
      if (modeTitle) modeTitle.textContent = 'Массовый баланс';
    } else if (mode === 'invent') {
      if (modeTitle) modeTitle.textContent = 'Инвентаризация';
      setHidden(document.getElementById('inventClubsSelection'), false);
      setHidden(document.getElementById('inventProductsSection'), true);

      loadClubsForInvent().then(clubs => {
        if (clubs) {
          displayClubsForInvent(clubs);
        }
      });
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function displayGuestSearchResults(data) {
    const resultsContainer = document.getElementById('guestSearchResults');
    const noResultsContainer = document.getElementById('guestSearchNoResults');
    const resultsBody = document.getElementById('guestSearchResultsBody');
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!items.length) {
      setHidden(resultsContainer, true);
      setHidden(noResultsContainer, false);
      return;
    }

    setHidden(resultsContainer, false);
    setHidden(noResultsContainer, true);

    resultsBody.innerHTML = '';

    items.forEach(guest => {
      const row = document.createElement('tr');
      const guestId = String(guest.guest_id ?? '');
      const name = guest.fio || guest.guest_group || 'Без имени';
      const phone = guest.phone || '';
      const email = guest.email || '';
      const balance = guest.balance ?? 0;
      const bonusBalance = guest.bonus_balance ?? 0;

      row.innerHTML = `
        <td>
          <div class="lgs-guest-name">${escapeHtml(name)}</div>
          ${guestId ? `<div class="lgs-guest-id">ID ${escapeHtml(guestId)}</div>` : ''}
        </td>
        <td>${escapeHtml(phone)}</td>
        <td class="lgs-guest-email">${escapeHtml(email)}</td>
        <td><span class="lgs-guest-money">${escapeHtml(balance)}</span></td>
        <td><span class="lgs-guest-money is-bonus">${escapeHtml(bonusBalance)}</span></td>
        <td>
          <div class="lgs-guest-actions">
            <button type="button" class="btn btn-outline-success btn-sm addBalance" data-guest-id="${escapeHtml(guestId)}" title="Пополнить баланс">
              ${LGS_ICONS.plus}
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm subBalance" data-guest-id="${escapeHtml(guestId)}" title="Списать баланс">
              ${LGS_ICONS.minus}
            </button>
            <button type="button" class="btn btn-success btn-sm addBonusBalance" data-guest-id="${escapeHtml(guestId)}" title="Добавить бонусы">
              ${LGS_ICONS.gift}
            </button>
            <button type="button" class="btn btn-danger btn-sm subBonusBalance" data-guest-id="${escapeHtml(guestId)}" title="Списать бонусы">
              ${LGS_ICONS.gift}
            </button>
          </div>
        </td>
      `;

      resultsBody.appendChild(row);
    });
  }

  /**
   * Главная: вставка после блока подписки (#js-subscription-container), перед партнёрами (#js-partners-page).
   * Текущая разметка главной — основной путь, legacy-обёртка и .container-fluid оставлены
   * как фоллбэк для старых версий личного кабинета.
   */
  function insertMainDashboardWidget(element) {
    const subscription = document.getElementById('js-subscription-container');
    const partners = document.getElementById('js-partners-page');
    const legacy = document.getElementById('langameSubscriptionWrapper');

    if (subscription && partners && subscription.parentNode === partners.parentNode) {
      subscription.parentNode.insertBefore(element, partners);
      return true;
    }
    if (subscription && subscription.parentNode) {
      const parent = subscription.parentNode;
      const next = subscription.nextElementSibling;
      if (next) {
        parent.insertBefore(element, next);
      } else {
        parent.appendChild(element);
      }
      return true;
    }
    if (legacy && legacy.parentNode) {
      legacy.parentNode.insertBefore(element, legacy.nextSibling);
      return true;
    }
    const layoutContent = document.querySelector('#js-scrollable-area .layout__content');
    if (layoutContent) {
      const partnersOnly = document.getElementById('js-partners-page');
      if (partnersOnly && partnersOnly.parentNode === layoutContent) {
        layoutContent.insertBefore(element, partnersOnly);
      } else {
        layoutContent.appendChild(element);
      }
      return true;
    }
    // Старый ЛК: единственный якорь — .container-fluid. Первый такой элемент на странице
    // обычно принадлежит header, поэтому берём последний (контентный).
    const fluidBlocks = document.querySelectorAll('.container-fluid');
    const fluid = fluidBlocks[fluidBlocks.length - 1];
    if (fluid) {
      fluid.appendChild(element);
      return true;
    }
    return false;
  }

  window.lanSearchInsertMainDashboardWidget = insertMainDashboardWidget;


  function initGuestSearchOnMainPage(attempts = 0) {
    console.log('Lan-Search: Инициализация поиска гостей на главной странице');
    

    if (window.location.pathname !== '/' && window.location.pathname !== '/dashboard/') {
      return;
    }


    if (document.getElementById('guestSearchContainer')) {
      return;
    }


    const recentTabsContainer = document.getElementById('recentTabsContainer');
    let insertTarget = null;
    
    if (recentTabsContainer) {
      insertTarget = recentTabsContainer.parentNode;
      insertTarget.insertBefore(createGuestSearchBlock(), recentTabsContainer.nextSibling);
    } else if (!insertMainDashboardWidget(createGuestSearchBlock())) {
      if (attempts < 10) {
        setTimeout(() => initGuestSearchOnMainPage(attempts + 1), 200);
      } else {
        console.warn('Lan-Search: не найден якорь для блока поиска гостей на главной; блок не добавлен');
      }
      return;
    }
    
    console.log('Lan-Search: Блок поиска гостей добавлен');

    // Обработчики переключения режимов
    const modeSearchBtn = document.getElementById('modeSearchBtn');
    const modeBulkBtn = document.getElementById('modeBulkBtn');
    const modeInventBtn = document.getElementById('modeInventBtn');
    
    if (modeSearchBtn) {
      modeSearchBtn.addEventListener('click', () => switchMode('search'));
    }

    if (modeBulkBtn) {
      modeBulkBtn.addEventListener('click', () => switchMode('bulk'));
    }
    
    if (modeInventBtn) {
      modeInventBtn.addEventListener('click', () => switchMode('invent'));
    }

    wireBulkBalanceUi();

    // Обработчики для режима поиска гостей
    const searchInput = document.getElementById('guestSearchInput');
    const searchBtn = document.getElementById('searchGuestBtn');

    if (searchInput && searchBtn) {
      const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        searchBtn.disabled = true;
        searchBtn.innerHTML = `${LGS_ICONS.spinner} Поиск...`;

        try {
          const results = await searchGuests(query);
          if (results) {
            displayGuestSearchResults(results);
          }
        } finally {
          searchBtn.disabled = false;
          searchBtn.innerHTML = `${LGS_ICONS.search} Найти`;
        }
      };

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }

    // Обработчики для режима инвентаризации
    const backToClubsBtn = document.getElementById('backToClubsBtn');
    const saveInventBtn = document.getElementById('saveInventBtn');
    const saveInventBtnTop = document.getElementById('saveInventBtnTop');
    const inventSearchInput = document.getElementById('inventSearchInput');

    if (backToClubsBtn) {
      backToClubsBtn.addEventListener('click', () => {
        setHidden(document.getElementById('inventClubsSelection'), false);
        setHidden(document.getElementById('inventProductsSection'), true);
      });
    }

    // Обработчик поиска продуктов
    if (inventSearchInput) {
      inventSearchInput.addEventListener('input', (e) => {
        const searchQuery = e.target.value;
        filterInventProducts(searchQuery);
      });

      inventSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }

    const handleSaveInvent = async (btn) => {
      if (!btn) return;
      
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = `${LGS_ICONS.spinner} Сохранение...`;

      try {
        await saveInvent();
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    };

    if (saveInventBtn) {
      saveInventBtn.addEventListener('click', () => handleSaveInvent(saveInventBtn));
    }

    if (saveInventBtnTop) {
      saveInventBtnTop.addEventListener('click', () => handleSaveInvent(saveInventBtnTop));
    }


    setTimeout(() => {
      addBalanceHandlers();
    }, 50);

    setTimeout(() => {
      addModalCloseHandlers();
    }, 50);
  }


  function addModalCloseHandlers() {

    const addBalanceModal = document.getElementById('addBalanceModal');
    if (addBalanceModal) {
      const closeBtn = addBalanceModal.querySelector('.close, .btn-close, [data-dismiss="modal"], [data-bs-dismiss="modal"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#addBalanceModal').modal('hide');
          } else {
            addBalanceModal.style.display = 'none';
            addBalanceModal.classList.remove('show');
            document.body.classList.remove('modal-open');

            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        });
      }
    }


    const addBonusModal = document.getElementById('addBonusModal');
    if (addBonusModal) {
      const closeBtn = addBonusModal.querySelector('.close, .btn-close, [data-dismiss="modal"], [data-bs-dismiss="modal"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#addBonusModal').modal('hide');
          } else {
            addBonusModal.style.display = 'none';
            addBonusModal.classList.remove('show');
            document.body.classList.remove('modal-open');

            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        });
      }
    }
  }


  function addBalanceHandlers() {

    document.addEventListener('click', (e) => {
      if (e.target.closest('.addBalance')) {
        const guestId = e.target.closest('.addBalance').dataset.guestId;
        if (guestId) {
          showAddBalanceModal(guestId);
        }
      } else if (e.target.closest('.subBalance')) {
        const guestId = e.target.closest('.subBalance').dataset.guestId;
        if (guestId) {
          showAddBalanceModal(guestId, 'sub');
        }
      } else if (e.target.closest('.addBonusBalance')) {
        const guestId = e.target.closest('.addBonusBalance').dataset.guestId;
        if (guestId) {
          showAddBonusModal(guestId, 'add');
        }
      } else if (e.target.closest('.subBonusBalance')) {
        const guestId = e.target.closest('.subBonusBalance').dataset.guestId;
        if (guestId) {
          showAddBonusModal(guestId, 'sub');
        }
      }
    });
  }


  function showAddBalanceModal(guestId, action = 'add') {
    const modal = document.getElementById('addBalanceModal');
    if (!modal) {
      console.error('Модальное окно addBalanceModal не найдено');
      return;
    }


    const guestIdInput = modal.querySelector('input[name="guest_id"]');
    if (guestIdInput) {
      guestIdInput.value = guestId;
    }


    const title = modal.querySelector('.modal-title');
    if (title) {
      title.textContent = action === 'sub' ? 'Списать баланс' : 'Пополнить баланс';
    }


    const form = modal.querySelector('form');
    if (form) {
      form.reset();
      guestIdInput.value = guestId; // Устанавливаем ID заново после reset
    }


    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $(modal).modal('show');
    } else {

      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      

      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
      backdrop.style.display = 'block';
      backdrop.classList.add('show');
    }


    if (form) {

      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        

        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Отправка...';
        }
        
        try {
          await submitAddBalanceForm(guestId, new FormData(newForm), action);
        } finally {

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить';
          }
        }
      });
    }
  }


  function showAddBonusModal(guestId, action) {
    const modal = document.getElementById('addBonusModal');
    if (!modal) {
      console.error('Модальное окно addBonusModal не найдено');
      return;
    }


    const guestIdInput = modal.querySelector('input[name="guest_id"]');
    const actionInput = modal.querySelector('input[name="action"]');
    if (guestIdInput) {
      guestIdInput.value = guestId;
    }
    if (actionInput) {
      actionInput.value = action;
    }


    const title = modal.querySelector('.modal-title');
    if (title) {
      title.textContent = action === 'add' ? 'Добавить бонусы' : 'Списать бонусы';
    }


    const form = modal.querySelector('form');
    if (form) {
      form.reset();
      guestIdInput.value = guestId; // Устанавливаем ID заново после reset
      actionInput.value = action; // Устанавливаем действие заново после reset
    }


    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $(modal).modal('show');
    } else {

      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      

      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
      backdrop.style.display = 'block';
      backdrop.classList.add('show');
    }


    if (form) {

      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        

        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Отправка...';
        }
        
        try {
          await submitAddBonusForm(guestId, action, new FormData(newForm));
        } finally {

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить';
          }
        }
      });
    }
  }


  function showBalanceModal(guestId, action) {
    const modalId = `balanceModal_${guestId}_${action}`;
    let modal = document.getElementById(modalId);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${action === 'add' ? 'Пополнить баланс' : 'Списать баланс'}</h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form name="balanceForm_${guestId}">
                <input type="hidden" name="guest_id" value="${guestId}">
                ${action === 'sub' ? '<input type="hidden" name="subBalance" value="1">' : ''}
                <div class="form-group">
                  <label>Сумма:</label>
                  <input type="number" class="form-control" name="balance" step="0.01" max="999999" placeholder="${action === 'add' ? 'пополнить' : 'списать'}" required>
                </div>
                <div class="form-group">
                  <label>Комментарий:</label>
                  <textarea class="form-control" name="comment" rows="2" placeholder="Комментарий"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }


    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $(modal).modal('show');
    } else {

      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }


    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitBalanceForm(guestId, action, new FormData(form));
    });
  }


  function showBonusModal(guestId, action) {
    const modalId = `bonusModal_${guestId}_${action}`;
    let modal = document.getElementById(modalId);
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${action === 'add' ? 'Добавить бонусы' : 'Списать бонусы'}</h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form name="bonusForm_${guestId}">
                <input type="hidden" name="guest_id" value="${guestId}">
                <div class="form-group">
                  <label>Сумма бонусов:</label>
                  <input type="number" class="form-control" name="bonus_balance" step="0.01" max="999999" placeholder="${action === 'add' ? 'добавить' : 'списать'}" required>
                </div>
                <div class="form-group">
                  <label>Комментарий:</label>
                  <textarea class="form-control" name="comment" rows="2" placeholder="Комментарий"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }


    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $(modal).modal('show');
    } else {

      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }


    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitBonusForm(guestId, action, new FormData(form));
    });
  }


  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }


  function hideGuestModal(modalOrId) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (!modal) return;
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $(modal).modal('hide');
      return;
    }
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    document.querySelector('.modal-backdrop')?.remove();
  }

  async function refreshGuestSearchResults() {
    const searchInput = document.getElementById('guestSearchInput');
    if (!searchInput?.value.trim()) return;
    const results = await searchGuests(searchInput.value.trim());
    if (results) displayGuestSearchResults(results);
  }

  function notifyGuestBalanceError(error, fallbackMessage) {
    const code = error?.data?.error_code;
    if (code === 9) {
      showNotification('Ошибка авторизации. Войдите заново', 'error');
    } else if (code === 4) {
      showNotification('Недостаточно средств для списания указанной суммы', 'error');
    } else {
      showNotification(error?.message || fallbackMessage, 'error');
    }
  }

  async function postGuestBalance(guestId, type, sum) {
    return masterApiRequest(`/guests/${guestId}/balance`, {
      method: 'POST',
      body: { type, sum }
    });
  }

  let bulkBalanceRows = [];
  let bulkBalanceAbort = false;

  async function ensureXlsxLib() {
    if (globalThis.XLSX) return globalThis.XLSX;
    throw new Error('Парсер Excel не загружен (xlsx.mini.min.js)');
  }

  function normalizeGuestPhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      return digits.slice(1);
    }
    return digits;
  }

  function phonesMatch(a, b) {
    const na = normalizeGuestPhone(a);
    const nb = normalizeGuestPhone(b);
    if (!na || !nb) return false;
    return na === nb || na.endsWith(nb) || nb.endsWith(na);
  }

  function detectBulkColumns(headers) {
    const norm = (h) => String(h ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    let phone = -1;
    let balance = -1;
    let bonus = -1;
    headers.forEach((h, i) => {
      const n = norm(h);
      if (phone < 0 && /(телефон|phone|тел\.?|mobile|мобил)/.test(n)) phone = i;
      else if (bonus < 0 && /бонус/.test(n)) bonus = i;
      else if (balance < 0 && /(баланс|balance|сумма|amount|money)/.test(n)) balance = i;
    });
    if (phone < 0) phone = 0;
    if (balance < 0 && headers.length > 1) balance = 1;
    if (bonus < 0 && headers.length > 2) bonus = 2;
    return { phone, balance, bonus };
  }

  function parseBulkAmount(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value).trim().replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function parseCsvText(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');
    return lines.map((line) => {
      const cells = [];
      let cur = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (q && line[i + 1] === '"') { cur += '"'; i++; }
          else q = !q;
        } else if ((ch === ',' || ch === ';' || ch === '\t') && !q) {
          cells.push(cur);
          cur = '';
        } else cur += ch;
      }
      cells.push(cur);
      return cells;
    });
  }

  async function parseBulkBalanceFile(file) {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.csv') || file.type === 'text/csv') {
      const text = await file.text();
      return parseCsvText(text);
    }
    const XLSX = await ensureXlsxLib();
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error('В файле нет листов');
    const sheet = wb.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  }

  function buildBulkRowsFromMatrix(matrix) {
    if (!matrix || !matrix.length) throw new Error('Файл пустой');
    const headers = (matrix[0] || []).map((h) => String(h ?? '').trim());
    const cols = detectBulkColumns(headers);
    const rows = [];
    for (let i = 1; i < matrix.length; i++) {
      const row = matrix[i] || [];
      const phoneRaw = row[cols.phone];
      const phone = normalizeGuestPhone(phoneRaw);
      if (!phone) continue;
      const balance = cols.balance >= 0 ? Math.abs(parseBulkAmount(row[cols.balance])) : 0;
      const bonus = cols.bonus >= 0 ? Math.abs(parseBulkAmount(row[cols.bonus])) : 0;
      if (balance === 0 && bonus === 0) continue;
      rows.push({
        line: i + 1,
        phone,
        phoneDisplay: String(phoneRaw ?? phone),
        balance,
        bonus
      });
    }
    return { headers, cols, rows };
  }

  function renderBulkBalancePreview(parsed) {
    const meta = document.getElementById('bulkBalanceMeta');
    const preview = document.getElementById('bulkBalancePreview');
    const body = document.getElementById('bulkBalancePreviewBody');
    const startBtn = document.getElementById('bulkBalanceStartBtn');
    if (!meta || !preview || !body) return;

    const { headers, cols, rows } = parsed;
    bulkBalanceRows = rows;

    const sumBalance = rows.reduce((s, r) => s + r.balance, 0);
    const sumBonus = rows.reduce((s, r) => s + r.bonus, 0);
    meta.hidden = false;
    meta.innerHTML = `
      <div>Колонки: телефон = <b>${escapeHtml(headers[cols.phone] || cols.phone)}</b>,
      баланс = <b>${escapeHtml(headers[cols.balance] || '—')}</b>,
      бонусы = <b>${escapeHtml(headers[cols.bonus] || '—')}</b></div>
      <div>Строк: <b>${rows.length}</b> · сумма баланса: <b>${sumBalance.toLocaleString('ru-RU')}</b> · сумма бонусов: <b>${sumBonus.toLocaleString('ru-RU')}</b></div>
    `;

    body.innerHTML = '';
    rows.slice(0, 30).forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.phoneDisplay)}</td>
        <td>${escapeHtml(r.balance)}</td>
        <td>${escapeHtml(r.bonus)}</td>
      `;
      body.appendChild(tr);
    });
    if (rows.length > 30) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" class="lgs-bulk-more">… и ещё ${rows.length - 30}</td>`;
      body.appendChild(tr);
    }

    setHidden(preview, false);
    if (startBtn) startBtn.disabled = rows.length === 0;
  }

  async function findGuestIdByPhone(phone) {
    const variants = [phone];
    if (phone.length === 10) {
      variants.push('7' + phone, '8' + phone, '+7' + phone);
    }
    for (const q of variants) {
      let data;
      try {
        data = await searchGuests(q, { silent: true });
      } catch (_) {
        continue;
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      const hit = items.find((g) => phonesMatch(g.phone, phone));
      if (hit?.guest_id != null) return String(hit.guest_id);
      if (items.length === 1 && items[0]?.guest_id != null) return String(items[0].guest_id);
    }
    return null;
  }

  function appendBulkLog(text, kind = '') {
    const log = document.getElementById('bulkBalanceLog');
    if (!log) return;
    log.hidden = false;
    const line = document.createElement('div');
    if (kind) line.className = 'is-' + kind;
    line.textContent = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  async function runBulkBalance() {
    const action = document.querySelector('input[name="bulkBalanceAction"]:checked')?.value || 'add';
    const applyBalance = !!document.getElementById('bulkApplyBalance')?.checked;
    const applyBonus = !!document.getElementById('bulkApplyBonus')?.checked;
    if (!applyBalance && !applyBonus) {
      showNotification('Выберите баланс и/или бонусы', 'warning');
      return;
    }
    if (!bulkBalanceRows.length) {
      showNotification('Сначала загрузите файл', 'warning');
      return;
    }

    bulkBalanceAbort = false;
    const startBtn = document.getElementById('bulkBalanceStartBtn');
    const stopBtn = document.getElementById('bulkBalanceStopBtn');
    const progress = document.getElementById('bulkBalanceProgress');
    const fill = document.getElementById('bulkBalanceProgressFill');
    const progressText = document.getElementById('bulkBalanceProgressText');
    const log = document.getElementById('bulkBalanceLog');
    if (log) { log.hidden = false; log.innerHTML = ''; }
    if (progress) progress.hidden = false;
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) { stopBtn.hidden = false; stopBtn.disabled = false; }

    let ok = 0;
    let fail = 0;
    let skip = 0;
    const sign = action === 'sub' ? -1 : 1;
    const total = bulkBalanceRows.length;
    const BATCH_SIZE = 30;
    const BATCH_PAUSE_MS = 15000;

    async function sleepMs(ms) {
      const step = 250;
      let left = ms;
      while (left > 0) {
        if (bulkBalanceAbort) return;
        const chunk = Math.min(step, left);
        await new Promise((r) => setTimeout(r, chunk));
        left -= chunk;
      }
    }

    for (let i = 0; i < total; i++) {
      if (bulkBalanceAbort) {
        appendBulkLog('Остановлено пользователем', 'warn');
        break;
      }

      // каждые 30 строк — пауза 15 сек (не перед первой)
      if (i > 0 && i % BATCH_SIZE === 0) {
        appendBulkLog(`КД 15 сек после ${i} строк…`, 'warn');
        if (progressText) {
          progressText.textContent = `Пауза 15 сек · ${i}/${total} · ок ${ok} · ошибок ${fail}`;
        }
        await sleepMs(BATCH_PAUSE_MS);
        if (bulkBalanceAbort) {
          appendBulkLog('Остановлено пользователем', 'warn');
          break;
        }
      }

      const row = bulkBalanceRows[i];
      const pct = Math.round(((i) / total) * 100);
      if (fill) fill.style.width = pct + '%';
      if (progressText) {
        progressText.textContent = `${i + 1}/${total} · ${row.phoneDisplay} · ок ${ok} · ошибок ${fail}`;
      }

      try {
        const guestId = await findGuestIdByPhone(row.phone);
        if (!guestId) {
          skip += 1;
          fail += 1;
          appendBulkLog(`${row.phoneDisplay}: гость не найден`, 'error');
        } else {
          if (applyBalance && row.balance > 0) {
            await postGuestBalance(guestId, 'balance', sign * row.balance);
          }
          if (applyBonus && row.bonus > 0) {
            await postGuestBalance(guestId, 'bonus_balance', sign * row.bonus);
          }
          ok += 1;
          appendBulkLog(
            `${row.phoneDisplay}: ${action === 'sub' ? 'списано' : 'пополнено'}` +
            `${applyBalance && row.balance ? ` баланс ${row.balance}` : ''}` +
            `${applyBonus && row.bonus ? ` бонусы ${row.bonus}` : ''}`,
            'ok'
          );
        }
      } catch (err) {
        fail += 1;
        appendBulkLog(`${row.phoneDisplay}: ${err?.message || 'ошибка'}`, 'error');
      }

      await sleepMs(120);
    }

    if (fill) fill.style.width = '100%';
    if (progressText) {
      progressText.textContent = `Готово: ок ${ok}, ошибок ${fail}` +
        (bulkBalanceAbort ? ' (остановлено)' : '');
    }
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.hidden = true;
    showNotification(
      `Массовый баланс: успешно ${ok}, ошибок ${fail}`,
      fail ? 'warning' : 'success',
      5000
    );
  }

  function wireBulkBalanceUi() {
    const fileInput = document.getElementById('bulkBalanceFile');
    const fileName = document.getElementById('bulkBalanceFileName');
    const startBtn = document.getElementById('bulkBalanceStartBtn');
    const stopBtn = document.getElementById('bulkBalanceStopBtn');
    if (!fileInput) return;

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (fileName) fileName.textContent = file.name;
      if (startBtn) startBtn.disabled = true;
      try {
        const matrix = await parseBulkBalanceFile(file);
        const parsed = buildBulkRowsFromMatrix(matrix);
        renderBulkBalancePreview(parsed);
        showNotification(`Загружено строк: ${parsed.rows.length}`, 'success', 2500);
      } catch (err) {
        bulkBalanceRows = [];
        console.error(err);
        showNotification(err?.message || 'Не удалось прочитать файл', 'error');
      }
    });

    startBtn?.addEventListener('click', () => { void runBulkBalance(); });
    stopBtn?.addEventListener('click', () => {
      bulkBalanceAbort = true;
      stopBtn.disabled = true;
    });
  }

  async function submitAddBalanceForm(guestId, formData, action = 'add') {
    try {
      const balance = formData.get('balance');
      const sum = action === 'sub' ? -parseFloat(balance) : parseFloat(balance);
      await postGuestBalance(guestId, 'balance', sum);
      showNotification(`${action === 'sub' ? 'Баланс списан' : 'Баланс пополнен'} успешно`, 'success');
      hideGuestModal('addBalanceModal');
      await refreshGuestSearchResults();
    } catch (error) {
      console.error('Ошибка при пополнении баланса:', error);
      notifyGuestBalanceError(error, 'Ошибка при пополнении баланса');
    }
  }

  async function submitBalanceForm(guestId, action, formData) {
    try {
      const balance = formData.get('balance');
      const sum = action === 'sub' ? -parseFloat(balance) : parseFloat(balance);
      await postGuestBalance(guestId, 'balance', sum);
      showNotification(`${action === 'add' ? 'Баланс пополнен' : 'Баланс списан'} успешно`, 'success');
      hideGuestModal(`balanceModal_${guestId}_${action}`);
      await refreshGuestSearchResults();
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      notifyGuestBalanceError(error, 'Ошибка при обновлении баланса');
    }
  }

  async function submitAddBonusForm(guestId, action, formData) {
    try {
      const bonusBalance = formData.get('bonus_balance');
      const sum = action === 'add' ? parseFloat(bonusBalance) : -parseFloat(bonusBalance);
      await postGuestBalance(guestId, 'bonus_balance', sum);
      showNotification(`${action === 'add' ? 'Бонусы добавлены' : 'Бонусы списаны'} успешно`, 'success');
      hideGuestModal('addBonusModal');
      await refreshGuestSearchResults();
    } catch (error) {
      console.error('Ошибка при обновлении бонусов:', error);
      notifyGuestBalanceError(error, 'Ошибка при обновлении бонусов');
    }
  }

  async function submitBonusForm(guestId, action, formData) {
    try {
      const bonusBalance = formData.get('bonus_balance');
      const sum = action === 'add' ? parseFloat(bonusBalance) : -parseFloat(bonusBalance);
      await postGuestBalance(guestId, 'bonus_balance', sum);
      showNotification(`${action === 'add' ? 'Бонусы добавлены' : 'Бонусы списаны'} успешно`, 'success');
      hideGuestModal(`bonusModal_${guestId}_${action}`);
      await refreshGuestSearchResults();
    } catch (error) {
      console.error('Ошибка при обновлении бонусов:', error);
      notifyGuestBalanceError(error, 'Ошибка при обновлении бонусов');
    }
  }

  
  let globalDraggedElement = null;
  let globalDraggedIndex = -1;

  
  function initFavoritesDragDrop() {
    if (!window.recentTabsManager) return;

    
    if (!document.getElementById('favorites-drag-drop-styles')) {
      const style = document.createElement('style');
      style.id = 'favorites-drag-drop-styles';
      style.textContent = `
        .favorites-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          gap: 15px !important;
          margin-top: 15px !important;
        }
        
        .favorite-card {
          transition: all 0.2s ease !important;
          cursor: grab !important;
          user-select: none !important;
        }
        
        .favorite-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .favorite-card.dragging {
          opacity: 0.5 !important;
          transform: rotate(5deg) !important;
          cursor: grabbing !important;
          z-index: 1000 !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
        }
        
        .favorite-card.drag-over {
          border: 2px dashed #4c8bf5 !important;
          background: rgba(76, 139, 245, 0.1) !important;
          transform: scale(1.02) !important;
        }
        
        
        .drag-handle {
          position: absolute !important;
          top: 8px !important;
          left: 8px !important;
          width: 20px !important;
          height: 20px !important;
          background: rgba(0,0,0,0.1) !important;
          border-radius: 4px !important;
          cursor: grab !important;
          display: none !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 12px !important;
          color: #666 !important;
          z-index: 10 !important;
        }
        
        .favorite-card:hover .drag-handle {
          display: flex !important;
        }
        
        .drag-handle:hover {
          background: rgba(0,0,0,0.2) !important;
        }
        
        .drag-handle:active {
          cursor: grabbing !important;
        }
      `;
      document.head.appendChild(style);
    }

    
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { 
              
              const favoriteCards = node.querySelectorAll ? 
                node.querySelectorAll('.favorite-card, [data-favorite="true"]') : [];
              
              if (node.classList && (node.classList.contains('favorite-card') || node.getAttribute('data-favorite') === 'true')) {
                addDragDropToCard(node);
              }
              
              favoriteCards.forEach(card => addDragDropToCard(card));
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    
    setTimeout(() => {
      const existingCards = document.querySelectorAll('.favorite-card, [data-favorite="true"]');
      existingCards.forEach(card => addDragDropToCard(card));
    }, 1000);
  }

  
  function addDragDropToCard(card) {
    if (!card || card.hasAttribute('data-drag-enabled')) return;
    
    card.setAttribute('data-drag-enabled', 'true');
    card.classList.add('favorite-card');
    
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '⋮⋮';
    dragHandle.title = 'Перетащите для изменения порядка';
    card.appendChild(dragHandle);
    
    
    card.addEventListener('dragstart', function(e) {
      globalDraggedElement = this;
      globalDraggedIndex = Array.from(this.parentNode.children).indexOf(this);
      
      
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.outerHTML);
    });
    
    card.addEventListener('dragend', function(e) {
      this.classList.remove('dragging');
      globalDraggedElement = null;
      globalDraggedIndex = -1;
    });
    
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (this !== globalDraggedElement) {
        this.classList.add('drag-over');
      }
    });
    
    card.addEventListener('dragleave', function(e) {
      this.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      
      
      if (this !== globalDraggedElement && globalDraggedElement) {
        
        const currentDraggedIndex = Array.from(this.parentNode.children).indexOf(globalDraggedElement);
        const dropIndex = Array.from(this.parentNode.children).indexOf(this);
        
        
        
        if (currentDraggedIndex < dropIndex) {
          
          this.parentNode.insertBefore(globalDraggedElement, this.nextSibling);
        } else {
          
          this.parentNode.insertBefore(globalDraggedElement, this);
        }
        
        
        
        globalDraggedIndex = Array.from(this.parentNode.children).indexOf(globalDraggedElement);
        
        
        saveFavoritesOrder();
        
        
        showNotification('Порядок избранных вкладок изменен', 'success', 2000);
      } else {
      }
    });
    
    
    card.draggable = true;
  }

  
  function saveFavoritesOrder() {
    if (!window.recentTabsManager) return;
    
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) return;
    
    const cards = Array.from(favoritesGrid.children).filter(card => 
      card.classList.contains('favorite-card') && !card.classList.contains('drag-placeholder')
    );
    
    
    
    window.recentTabsManager.getFavoriteTabs().then(favorites => {
      
      
      const reorderedFavorites = [];
      
      
      cards.forEach((card, index) => {
        
        let cardTitle = null;
        
        
        const titleDiv = card.querySelector('div > div');
        if (titleDiv && titleDiv.textContent) {
          cardTitle = titleDiv.textContent.trim();
        }
        
        
        if (!cardTitle) {
          const allDivs = card.querySelectorAll('div');
          for (let div of allDivs) {
            const text = div.textContent?.trim();
            if (text && text.length > 0 && !text.includes('⋮⋮') && !text.includes('⭐') && !text.includes('🎨')) {
              cardTitle = text;
              break;
            }
          }
        }
        
        
        if (cardTitle && cardTitle.includes('/')) {
          cardTitle = cardTitle.split('/')[0].trim();
        }
        
        
        if (cardTitle) {
          const favorite = favorites.find(fav => fav.title === cardTitle);
          if (favorite) {
            reorderedFavorites.push(favorite);
          } else {
          }
        }
      });
      
      
      favorites.forEach(favorite => {
        if (!reorderedFavorites.find(fav => fav.title === favorite.title)) {
          reorderedFavorites.push(favorite);
        }
      });
      
      
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 
          'lanSearchFavoriteTabs': reorderedFavorites 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Ошибка сохранения порядка избранных:', chrome.runtime.lastError);
          } else {
            
            
            if (window.recentTabsManager && window.recentTabsManager.favoritesCache) {
              window.recentTabsManager.favoritesCache = reorderedFavorites;
            }
          }
        });
      }
    });
  }


  function setTabTitleToUrl() {
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    

    if (hostname.includes('langame') || hostname.includes('cls') || hostname.includes('f5center')) {

      const domain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      

      document.title = domain;
    }
  }


  function handleHideStylesOnUrlChange() {

    if (window.lanSearchGetHideCheckboxesSetting) {
      window.lanSearchGetHideCheckboxesSetting(function(hideCheckboxesEnabled) {
        if (hideCheckboxesEnabled) {
          applyHideCheckboxes();
        } else {
          removeHideCheckboxes();
        }
      });
    }
    
    if (window.lanSearchGetHideCommentsSetting) {
      window.lanSearchGetHideCommentsSetting(function(hideCommentsEnabled) {
        if (hideCommentsEnabled) {
          applyHideComments();
        } else {
          removeHideComments();
        }
      });
    }
  }

  function initUrlTracking() {
    let currentUrl = window.location.href;
    

    const checkAndUpdateTitle = () => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        setTabTitleToUrl();
        


      }
    };


    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(checkAndUpdateTitle, 100);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkAndUpdateTitle, 100);
    };


    window.addEventListener('popstate', () => {
      setTimeout(checkAndUpdateTitle, 100);
    });


    setInterval(checkAndUpdateTitle, 1000);


    setInterval(() => {
      const domain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      if (document.title !== domain) {
        document.title = domain;
      }
    }, 500);
  }


  if (shouldAutoActivate()) {
    
          if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          applyThemeToPage();
          observeDOMChanges();
          observeThemeAttribute();
          initRecentTabsTracking();
          initFavoritesDragDrop();
          if (window.recentTabsManager) {
            window.recentTabsManager.displayOnMainPage();
          }
          setTabTitleToUrl();
          initUrlTracking();
        });
      } else {
        applyThemeToPage();
        observeDOMChanges();
        observeThemeAttribute();
        initRecentTabsTracking();
        initFavoritesDragDrop();
        if (window.recentTabsManager) {
          window.recentTabsManager.displayOnMainPage();
        }
        setTabTitleToUrl();
        initUrlTracking();
      }
  }


  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.theme) {
          const newTheme = changes.theme.newValue || 'dark';
          currentTheme = newTheme;
          paintDocumentTheme(newTheme);
          try { localStorage.setItem('lanSearchTheme', newTheme); } catch (_) {}

          setTimeout(() => {
            applyThemeToNewElements();
          }, 100);
        }
      });
    }
  } catch (e) {

  }


  setInterval(function() {
    const htmlElement = document.documentElement;
    const currentThemeAttr = htmlElement.getAttribute('data-theme');
    const wantAmoled = currentTheme === 'amoled';
    const wantDarkAttr = currentTheme === 'dark' || wantAmoled;

    if (wantDarkAttr && currentThemeAttr !== 'dark') {
      paintDocumentTheme(currentTheme);
    } else if (wantAmoled && !htmlElement.classList.contains('lgs-amoled')) {
      htmlElement.classList.add('lgs-amoled');
    } else if (!wantAmoled && htmlElement.classList.contains('lgs-amoled') && currentTheme !== 'amoled') {
      htmlElement.classList.remove('lgs-amoled');
    }
  }, 1000); 


  window.addEventListener('popstate', function() {

    applyThemeToNewElements();
  });


  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    

    applyThemeToNewElements();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    

    applyThemeToNewElements();
  };


  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(...args) {
    this.addEventListener('load', function() {
      setTimeout(() => {
        applyThemeToNewElements();
      }, 100);
    });
    originalXHROpen.apply(this, args);
  };


  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      setTimeout(() => {
        applyThemeToNewElements();
      }, 100);
      return response;
    });
  };


  function getModalBypassSetting(callback) {
    const now = Date.now();

    if (modalBypassCache !== null && (now - modalBypassCacheTime) < CACHE_DURATION) {
      callback(modalBypassCache);
      return;
    }

    const finish = (enabled) => {
      const on = !!enabled;
      modalBypassCache = on;
      modalBypassCacheTime = Date.now();
      try {
        localStorage.setItem('lanSearchModalBypass', on.toString());
      } catch (_) {}
      callback(on);
    };

    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        finish(localStorage.getItem('lanSearchModalBypass') === 'true');
        return;
      }

      // local надёжнее sync после ребута; sync — запасной источник
      const readLocal = (cb) => {
        try {
          chrome.storage.local.get(['modalBypass'], (r) => {
            if (chrome.runtime.lastError) {
              cb(undefined);
              return;
            }
            cb(r && r.modalBypass);
          });
        } catch (_) {
          cb(undefined);
        }
      };
      const readSync = (cb) => {
        try {
          chrome.storage.sync.get(['modalBypass'], (r) => {
            if (chrome.runtime.lastError) {
              cb(undefined);
              return;
            }
            cb(r && r.modalBypass);
          });
        } catch (_) {
          cb(undefined);
        }
      };

      readLocal((localVal) => {
        if (localVal !== undefined) {
          finish(localVal);
          try { chrome.storage.sync.set({ modalBypass: !!localVal }); } catch (_) {}
          return;
        }
        readSync((syncVal) => {
          if (syncVal !== undefined) {
            finish(syncVal);
            try { chrome.storage.local.set({ modalBypass: !!syncVal }); } catch (_) {}
            return;
          }
          let pageLocal = false;
          try {
            pageLocal = localStorage.getItem('lanSearchModalBypass') === 'true';
          } catch (_) {}
          finish(pageLocal);
          if (pageLocal) {
            try {
              chrome.storage.local.set({ modalBypass: true });
              chrome.storage.sync.set({ modalBypass: true });
            } catch (_) {}
          }
        });
      });
    } catch (e) {
      finish(false);
    }
  }

  function clearModalBypassCache() {
    modalBypassCache = null;
    modalBypassCacheTime = 0;
  }

  function setModalBypassSetting(enabled) {
    try {
      const on = !!enabled;
      localStorage.setItem('lanSearchModalBypass', on.toString());
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try { chrome.storage.local.set({ modalBypass: on }); } catch (_) {}
        try { chrome.storage.sync.set({ modalBypass: on }); } catch (_) {}
      }
      modalBypassCache = on;
      modalBypassCacheTime = Date.now();
      applyModalBypassState(on);
      if (window.lanSearchProcessButtons) {
        window.lanSearchProcessButtons();
      }
    } catch (e) {
    }
  }


  function showNotification(message, type = 'success', duration = 4000) {

    const existingNotifications = document.querySelectorAll('.lan-search-notification');
    existingNotifications.forEach(notification => notification.remove());
    

    const notification = document.createElement('div');
    notification.className = 'lan-search-notification';
    

    const styles = {
      success: {
        background: 'linear-gradient(135deg, #28a745, #20c997)',
        icon: '✓'
      },
      error: {
        background: 'linear-gradient(135deg, #dc3545,rgb(223, 54, 12))',
        icon: '✗'
      },
      warning: {
        background: 'linear-gradient(135deg, #ffc107, #fd7e14)',
        icon: '⚠'
      }
    };
    
    const style = styles[type] || styles.success;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${style.background};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      min-width: 200px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    

    const icon = document.createElement('div');
    icon.textContent = style.icon;
    icon.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      flex-shrink: 0;
    `;
    

    const text = document.createElement('div');
    text.textContent = message;
    text.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
      flex-shrink: 0;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });
    
    closeButton.addEventListener('click', () => {
      hideNotification();
    });
    

    notification.appendChild(icon);
    notification.appendChild(text);
    notification.appendChild(closeButton);
    

    document.body.appendChild(notification);
    

    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    

    function hideNotification() {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
    

    if (duration > 0) {
      setTimeout(hideNotification, duration);
    }
    
    return { notification, hide: hideNotification };
  }


  function sendDirectCommand(uuid, command, whoSend) {
    const url = window.location.origin + '/all_clubs_pc/ajax/commen4PC.php';
    const body = `UUID=${encodeURIComponent(uuid)}&command=${encodeURIComponent(command)}&who_send=${encodeURIComponent(whoSend)}`;
    
    
    return fetch(url, {
      "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "ru,en-US;q=0.9,en;q=0.8,uk;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": window.location.href,
      "body": body,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });
  }


  function extractButtonParams(button) {
    const onclick = button.getAttribute('onclick');
    if (!onclick) return null;
    

    const uuidMatch = onclick.match(/['"]([A-F0-9a-f-]{36})['\"]/i);
    if (!uuidMatch) {
      console.warn('Lan-Search: UUID не найден в onclick:', onclick);
      return null;
    }
    
    const uuid = uuidMatch[1];
    const command = button.getAttribute('data-type') || 'startTehTime';
    

    const whoSend = getCookieValue('PHPSESSID') || getSessionId();
    
    
    return { uuid, command, whoSend };
  }


  function extractButtonParamsFromDiv(div) {
    const command = div.getAttribute('data-type');
    if (!command) return null;
    
    let uuid = null;
    let whoSend = null;
    
    
    const onclick = div.getAttribute('data-original-onclick');
    if (onclick) {
      const uuidMatch = onclick.match(/['"]([A-F0-9a-f-]{36})['\"]/i);
      if (uuidMatch) {
        uuid = uuidMatch[1];
      }
    }
    
    
    if (!uuid) {
      let parent = div.parentElement;
      while (parent && parent !== document.body) {
        const parentId = parent.getAttribute('id');
        if (parentId && parentId.match(/^[A-F0-9a-f-]{36}$/i)) {
          uuid = parentId;
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    
    if (!uuid) {
      const allButtons = document.querySelectorAll('button[data-type]');
      for (let otherButton of allButtons) {
        const otherOnclick = otherButton.getAttribute('onclick');
        if (otherOnclick) {
          const uuidMatch = otherOnclick.match(/['"]([A-F0-9a-f-]{36})['\"]/i);
          if (uuidMatch) {
            uuid = uuidMatch[1];
            break;
          }
        }
      }
    }
    
    if (!uuid) {
      console.warn('Lan-Search: UUID не найден для div команды:', command);
      return null;
    }
    
    
    whoSend = getCookieValue('PHPSESSID') || getSessionId();
    
    
    return { uuid, command, whoSend };
  }


  function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }


  function getSessionId() {

    const metaSession = document.querySelector('meta[name="session-id"]');
    if (metaSession) return metaSession.content;
    

    if (window.sessionId) return window.sessionId;
    if (window.whoSend) return window.whoSend;
    

    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      const content = script.textContent || script.innerText;
      if (content) {

        const whoSendMatch = content.match(/who_send\s*[=:]\s*['"]([^'"]+)['"]/);
        if (whoSendMatch) return whoSendMatch[1];
        

        const sessionMatch = content.match(/sessionId\s*[=:]\s*['"]([^'"]+)['"]/);
        if (sessionMatch) return sessionMatch[1];
      }
    }
    

    const forms = document.querySelectorAll('form');
    for (let form of forms) {
      const whoSendInput = form.querySelector('input[name="who_send"]');
      if (whoSendInput && whoSendInput.value) return whoSendInput.value;
    }
    

    const phpSessId = getCookieValue('PHPSESSID');
    if (phpSessId) {
      return 'h' + phpSessId.substring(0, 32);
    }
    

    return 'h' + Math.random().toString(36).substr(2, 32);
  }


  let processedClicks = new Set();
  

  let modalBypassCache = null;
  let modalBypassCacheTime = 0;
  const CACHE_DURATION = 5000; 
  let savedModalBypassState = null; // Сохраненное состояние обхода модальных окон перед активацией режима выбора 
  

  function isInsideReleForm(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'FORM' && current.id && current.id.startsWith('rele')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function replaceButtonsWithDivs() {
    const supportedCommands = ['startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC', 'Lock', 'UnLock', 'LockPS', 'UnLockPS'];
    
    
    const buttons = document.querySelectorAll('button[data-type]:not([data-lan-search-replaced])');
    
    buttons.forEach(button => {
      if (isInsideReleForm(button)) {
        return;
      }
      
      const dataType = button.getAttribute('data-type');
      const buttonText = button.textContent.trim();
      
      let command = dataType;
      
      
      if (!command) {
        if (buttonText.toLowerCase() === 'заблокировать') {
          command = 'Lock';
        } else if (buttonText.toLowerCase() === 'разблокировать') {
          command = 'UnLock';
        }
      }
      
      if (supportedCommands.includes(command)) {
        
        const div = document.createElement('div');
        
        
        Array.from(button.attributes).forEach(attr => {
          if (attr.name !== 'onclick') {
            div.setAttribute(attr.name, attr.value);
          }
        });
        
        
        if (!div.getAttribute('data-type')) {
          div.setAttribute('data-type', command);
        }
        
        
        if (button.getAttribute('onclick')) {
          div.setAttribute('data-original-onclick', button.getAttribute('onclick'));
        }
        
        
        div.setAttribute('data-lan-search-replaced', 'true');
        
        
        div.innerHTML = button.innerHTML;
        div.style.cssText = button.style.cssText;
        div.style.cursor = 'pointer';
        
        
        button.parentNode.replaceChild(div, button);
      }
    });
  }


  function restoreDivsToButtons() {

    const divs = document.querySelectorAll('div[data-lan-search-replaced="true"]');
    divs.forEach(div => {
      if (isInsideReleForm(div)) {
        return;
      }
      

      const button = document.createElement('button');
      

      Array.from(div.attributes).forEach(attr => {
        if (attr.name !== 'data-lan-search-replaced' && attr.name !== 'data-original-onclick') {
          button.setAttribute(attr.name, attr.value);
        }
      });
      

      if (div.getAttribute('data-original-onclick')) {
        button.setAttribute('onclick', div.getAttribute('data-original-onclick'));
      }
      

      button.innerHTML = div.innerHTML;
      

      button.style.cssText = div.style.cssText;
      

      button.style.cursor = '';
      

      div.parentNode.replaceChild(button, div);
    });
  }


  function initModalBypass() {
    if (!shouldAutoActivate()) return;

    let processingButtons = false;

    function processButtons() {
      if (processingButtons) return;
      processingButtons = true;

      getModalBypassSetting(function(bypassEnabled) {
        try {
          applyModalBypassState(bypassEnabled);
        } catch (e) {
          console.warn('Lan-Search: modal bypass apply failed', e);
        } finally {
          processingButtons = false;
        }
      });
    }

    window.lanSearchProcessButtons = processButtons;

    processButtons();
    // ПК-карточки часто дорисовываются после document_end
    setTimeout(processButtons, 800);
    setTimeout(processButtons, 2000);
    setTimeout(processButtons, 5000);

    let observerTimeout;
    const observer = new MutationObserver(function(mutations) {
      let relevant = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          relevant = true;
          break;
        }
      }
      if (!relevant) return;
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(processButtons, 400);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if ((namespace === 'sync' || namespace === 'local') && changes.modalBypass) {
          clearModalBypassCache();
          processButtons();
        }
      });
    }
    

    const MODAL_BYPASS_COMMANDS = [
      'startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC',
      'Lock', 'UnLock', 'LockPS', 'UnLockPS'
    ];

    function isModalBypassEnabledSync() {
      if (modalBypassCache !== null) return !!modalBypassCache;
      try {
        return localStorage.getItem('lanSearchModalBypass') === 'true';
      } catch (_) {
        return false;
      }
    }

    function commandSuccessMessage(command) {
      switch (command) {
        case 'startTehTime': return 'Тех.Старт выполнен успешно!';
        case 'stopTehTime': return 'Тех.Стоп выполнен успешно!';
        case 'rebootPC': return 'Перезагрузка ПК выполнена успешно!';
        case 'shutdownPC': return 'Выключение ПК выполнено успешно!';
        case 'Lock':
        case 'LockPS': return 'ПК заблокирован успешно!';
        case 'UnLock':
        case 'UnLockPS': return 'ПК разблокирован успешно!';
        default: return 'Команда выполнена успешно!';
      }
    }

    function commandErrorTitle(command, kind) {
      const net = kind === 'network';
      switch (command) {
        case 'startTehTime': return net ? 'Ошибка сети при Тех.Старте' : 'Ошибка Тех.Старта';
        case 'stopTehTime': return net ? 'Ошибка сети при Тех.Стопе' : 'Ошибка Тех.Стопа';
        case 'rebootPC': return net ? 'Ошибка сети при перезагрузке ПК' : 'Ошибка перезагрузки ПК';
        case 'shutdownPC': return net ? 'Ошибка сети при выключении ПК' : 'Ошибка выключения ПК';
        case 'Lock':
        case 'LockPS': return net ? 'Ошибка сети при блокировке ПК' : 'Ошибка блокировки ПК';
        case 'UnLock':
        case 'UnLockPS': return net ? 'Ошибка сети при разблокировке ПК' : 'Ошибка разблокировки ПК';
        default: return net ? 'Ошибка сети' : 'Ошибка выполнения команды';
      }
    }

    function flashCommandEl(el, ok) {
      const originalBg = el.style.backgroundColor;
      const originalColor = el.style.color;
      el.style.backgroundColor = ok ? '#28a745' : '#dc3545';
      el.style.color = 'white';
      setTimeout(() => {
        el.style.backgroundColor = originalBg;
        el.style.color = originalColor;
      }, 1000);
    }

    // capture + sync stop: сайт вешает $(document).on('click', '.action') → модалка
    document.addEventListener('click', function(event) {
      const target = event.target && event.target.closest
        ? event.target.closest('[data-lan-search-replaced="true"]')
        : null;
      if (!target) return;

      const dataType = target.getAttribute('data-type');
      if (!MODAL_BYPASS_COMMANDS.includes(dataType)) return;
      if (isInsideReleForm(target)) return;
      if (!isModalBypassEnabledSync()) return;

      // критично: до async и до jQuery .action
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const clickId = dataType + '_' + Math.floor(Date.now() / 500);
      if (processedClicks.has(clickId)) return;
      processedClicks.add(clickId);
      setTimeout(() => processedClicks.delete(clickId), 3000);

      const params = extractButtonParamsFromDiv(target);
      if (!params) return;

      const hadIcon = !!target.querySelector('.lgs-ico');
      const originalHTML = target.innerHTML;
      const originalText = target.textContent;
      if (!hadIcon) {
        target.textContent = 'Выполняется...';
      }
      target.style.pointerEvents = 'none';

      sendDirectCommand(params.uuid, params.command, params.whoSend)
        .then(response => response.json())
        .then(data => {
          if (hadIcon) target.innerHTML = originalHTML;
          else target.textContent = originalText;
          target.style.pointerEvents = '';

          if (data.status === true) {
            showNotification(commandSuccessMessage(params.command), 'success', 2000);
            flashCommandEl(target, true);
          } else {
            const errorMessage = data.textStatus || 'Неизвестная ошибка';
            console.warn('Lan-Search: Сообщение от API:', errorMessage);
            showNotification(`${commandErrorTitle(params.command)}: ${errorMessage}`, 'error', 5000);
            flashCommandEl(target, false);
          }
        })
        .catch(error => {
          console.warn('Lan-Search: Ошибка выполнения команды', error);
          if (hadIcon) target.innerHTML = originalHTML;
          else target.textContent = originalText;
          target.style.pointerEvents = '';
          showNotification(`${commandErrorTitle(params.command, 'network')}: ${error.message}`, 'error', 4000);
          flashCommandEl(target, false);
        });
    }, true);
  }


  
  let selectionMode = false;

  function initPCSelection() {
    if (!shouldAutoActivate()) return;
    
    if (window.location.pathname.includes('/all_clubs_pc/')) {
      addCheckDisksButton();
    }
    
    document.addEventListener('click', function(event) {
      if (event.target && event.target.id === 'selectPC') {
        selectionMode = true;
        addSelectionStyles();
        showNotification('Режим выбора активирован! Кликните на блок ПК для выделения', 'success', 3000);

        getModalBypassSetting(function(currentState) {
          savedModalBypassState = currentState;
          if (currentState) {
            restoreDivsToButtons();
          }
        });

        if (window.location.pathname.includes('/all_clubs_pc/')) {
          showMassiveSelectionPanelForAllClubs();
          setTimeout(() => {
            try { enhanceSelectActionsPanel(); } catch (_) {}
          }, 0);
        }
      }
      
      
      if (event.target && event.target.id === 'cancelSelect') {
        exitSelectionMode();
        if (window.location.pathname.includes('/all_clubs_pc/')) {
          hideMassiveSelectionPanelForAllClubs();
        }
      }
      
      // Обработка кнопок выбора в панели
      if (event.target && event.target.id === 'selectAllPC') {
        setTimeout(() => {
          exitSelectionMode();
          if (window.location.pathname.includes('/all_clubs_pc/')) {
            hideMassiveSelectionPanelForAllClubs();
          }
        }, 300);
      }
      
      if (event.target && event.target.id === 'selectAllFreePC') {
        setTimeout(() => {
          exitSelectionMode();
          if (window.location.pathname.includes('/all_clubs_pc/')) {
            hideMassiveSelectionPanelForAllClubs();
          }
        }, 300);
      }
      
      if (event.target && event.target.id === 'selectAllInTech') {
        setTimeout(() => {
          exitSelectionMode();
          if (window.location.pathname.includes('/all_clubs_pc/')) {
            hideMassiveSelectionPanelForAllClubs();
          }
        }, 300);
      }
      
      if (event.target && event.target.id === 'selectAllInUnlock') {
        setTimeout(() => {
          exitSelectionMode();
          if (window.location.pathname.includes('/all_clubs_pc/')) {
            hideMassiveSelectionPanelForAllClubs();
          }
        }, 300);
      }
      
      // Обработка action кнопок в панели выбора
      if (event.target && event.target.classList.contains('select-action')) {
        setTimeout(() => {
          exitSelectionMode();
          if (window.location.pathname.includes('/all_clubs_pc/')) {
            hideMassiveSelectionPanelForAllClubs();
          }
        }, 300);
      }
      
    });

    
    document.addEventListener('click', function(event) {
      if (!selectionMode) return;
      
      
      const pcForm = event.target.closest('form.pc');
      if (!pcForm) return;
      
      
      const checkbox = pcForm.querySelector('.pc-selector');
      if (!checkbox) return;
      
      
      checkbox.checked = !checkbox.checked;
      
      
      const pcName = pcForm.querySelector('.pc_name')?.textContent || 'ПК';
      const status = checkbox.checked ? 'выбран' : 'снят с выбора';
      showNotification(`${pcName} ${status}`, 'success', 1500);
    });

    
    document.addEventListener('keydown', function(event) {
      if (!selectionMode) return;
      
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        document.querySelectorAll('.pc-selector').forEach(cb => cb.checked = true);
        showNotification('Выделены все ПК', 'success', 2000);
      }
      
      if (event.key === 'Escape') {
        exitSelectionMode();
      }
    });
  }

  
  function initMassivePCSelection() {
    if (!shouldAutoActivate()) return;
    if (!window.location.pathname.includes('/pc_tasks/')) {
      return;
    }
    
    const checkForTable = () => {
      const table = document.querySelector('#dataTable, table.dataTable');
      if (!table) return;
      
      
      if (document.getElementById('massive-pc-selection-panel')) return;
      
      
      createMassiveSelectionPanel(table);
    };
    
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkForTable);
    } else {
      checkForTable();
    }
    
    
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          checkForTable();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function createMassiveSelectionPanel(table) {
    
    const panel = document.createElement('div');
    panel.id = 'massive-pc-selection-panel';
    panel.style.cssText = `
      background: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px solid #dee2e6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    
    const title = document.createElement('div');
    title.textContent = 'Массовый выбор ПК';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      text-align: center;
      color: #333;
    `;
    
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Например: 2-10 или 2,5,8-12';
    input.style.cssText = `
      width: 100%;
      padding: 12px 14px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      margin-bottom: 6px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      box-sizing: border-box;
      outline: none;
      transition: all 0.2s;
    `;
    
    input.addEventListener('focus', () => {
      input.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.3)';
    });
    
    input.addEventListener('blur', () => {
      input.style.boxShadow = 'none';
    });
    
    
    const hint = document.createElement('div');
    hint.textContent = 'Формат: 2-10, 2,5,8-12';
    hint.style.cssText = `
      font-size: 8px;
      color: #666;
      margin-bottom: 6px;
      text-align: center;
    `;
    
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    `;
    
    
    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Выбрать';
    selectBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    `;
    
    selectBtn.addEventListener('mouseenter', () => {
      selectBtn.style.transform = 'translateY(-2px)';
      selectBtn.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
    });
    
    selectBtn.addEventListener('mouseleave', () => {
      selectBtn.style.transform = 'translateY(0)';
      selectBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
    });
    
    selectBtn.addEventListener('click', () => {
      const range = input.value.trim();
      if (range) {
        selectPCsByRange(range, table);
      } else {
        showNotification('Введите диапазон или номера ПК', 'warning', 2000);
      }
    });
    
    
    const deselectBtn = document.createElement('button');
    deselectBtn.textContent = 'Снять';
    deselectBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    `;
    
    deselectBtn.addEventListener('mouseenter', () => {
      deselectBtn.style.transform = 'translateY(-2px)';
      deselectBtn.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.4)';
    });
    
    deselectBtn.addEventListener('mouseleave', () => {
      deselectBtn.style.transform = 'translateY(0)';
      deselectBtn.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
    });
    
    deselectBtn.addEventListener('click', () => {
      const range = input.value.trim();
      if (range) {
        deselectPCsByRange(range, table);
      } else {
        showNotification('Введите диапазон или номера ПК', 'warning', 2000);
      }
    });
    
    
    const quickButtons = document.createElement('div');
    quickButtons.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    `;
    
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = '✓ Все';
    selectAllBtn.style.cssText = createQuickButtonStyle('#17a2b8');
    selectAllBtn.addEventListener('click', () => selectAllPCs(table));
    addQuickButtonHover(selectAllBtn, '#17a2b8');
    
    
    const selectFreeBtn = document.createElement('button');
    selectFreeBtn.textContent = '✓ Свободные';
    selectFreeBtn.style.cssText = createQuickButtonStyle('#28a745');
    selectFreeBtn.addEventListener('click', () => selectFreePCs(table));
    addQuickButtonHover(selectFreeBtn, '#28a745');
    
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = '✗ Очистить';
    clearAllBtn.style.cssText = createQuickButtonStyle('#6c757d');
    clearAllBtn.addEventListener('click', () => clearAllPCs(table));
    addQuickButtonHover(clearAllBtn, '#6c757d');
    
    
    const invertBtn = document.createElement('button');
    invertBtn.textContent = '↔ Инверт';
    invertBtn.style.cssText = createQuickButtonStyle('#ffc107');
    invertBtn.addEventListener('click', () => invertSelection(table));
    addQuickButtonHover(invertBtn, '#ffc107');
    
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '−';
    toggleBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;
    
    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    let isMinimized = false;
    toggleBtn.addEventListener('click', () => {
      isMinimized = !isMinimized;
      if (isMinimized) {
        panel.style.width = '60px';
        panel.style.height = '60px';
        panel.style.padding = '10px';
        content.style.display = 'none';
        toggleBtn.textContent = '+';
        minimizedIcon.style.display = 'block';
      } else {
        panel.style.width = '';
        panel.style.height = '';
        panel.style.padding = '20px';
        content.style.display = 'block';
        toggleBtn.textContent = '−';
        minimizedIcon.style.display = 'none';
      }
    });
    
    
    const minimizedIcon = document.createElement('div');
    minimizedIcon.textContent = '🎯';
    minimizedIcon.style.cssText = `
      display: none;
      font-size: 32px;
      text-align: center;
    `;
    
    
    const content = document.createElement('div');
    
    
    buttonsContainer.appendChild(selectBtn);
    buttonsContainer.appendChild(deselectBtn);
    
    quickButtons.appendChild(selectAllBtn);
    quickButtons.appendChild(selectFreeBtn);
    quickButtons.appendChild(clearAllBtn);
    quickButtons.appendChild(invertBtn);
    
    content.appendChild(title);
    content.appendChild(input);
    content.appendChild(hint);
    content.appendChild(buttonsContainer);
    content.appendChild(quickButtons);
    
    panel.appendChild(content);
    
    
    const tableWrapper = table.closest('#dataTable_wrapper');
    if (tableWrapper) {
      tableWrapper.parentNode.insertBefore(panel, tableWrapper);
    } else {
      
      table.parentNode.insertBefore(panel, table);
    }
    
  }

  function createQuickButtonStyle(color) {
    return `
      padding: 8px;
      background: ${color};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
  }

  function addQuickButtonHover(button, color) {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    });
  }

  function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    element.addEventListener('mousedown', (e) => {
      
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      
      isDragging = true;
      initialX = e.clientX - element.offsetLeft;
      initialY = e.clientY - element.offsetTop;
      element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
        element.style.right = 'auto';
        element.style.transform = 'none';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = '';
      }
    });
  }

  function extractPCNumber(text) {
    
    
    const cleaned = text.trim();
    
    
    const numberMatch = cleaned.match(/\d+/);
    if (numberMatch) {
      return parseInt(numberMatch[0]);
    }
    
    return null;
  }

  function parseRange(rangeStr) {
    const numbers = new Set();
    const parts = rangeStr.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            numbers.add(i);
          }
        }
      } else {
        
        const num = parseInt(part.trim());
        if (!isNaN(num)) {
          numbers.add(num);
        }
      }
    }
    
    return Array.from(numbers).sort((a, b) => a - b);
  }

  function selectPCsByRange(rangeStr, table) {
    const numbers = parseRange(rangeStr);
    if (numbers.length === 0) {
      showNotification('Неверный формат диапазона', 'error', 2000);
      return;
    }
    
    let selectedCount = 0;
    
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      
      const pcNumberCell = row.querySelector('td[data-sort]');
      if (!pcNumberCell) return;
      
      
      const pcNumber = extractPCNumber(pcNumberCell.textContent);
      if (pcNumber !== null && numbers.includes(pcNumber)) {
        
        const checkbox = row.querySelector('input[type="checkbox"].el_pc');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          selectedCount++;
        }
      }
    });
    
    if (selectedCount > 0) {
      showNotification(`Выбрано ПК: ${numbers.join(', ')} (${selectedCount} шт.)`, 'success', 3000);
    } else {
      showNotification('Не найдено ПК с указанными номерами', 'warning', 2000);
    }
  }

  function deselectPCsByRange(rangeStr, table) {
    const numbers = parseRange(rangeStr);
    if (numbers.length === 0) {
      showNotification('Неверный формат диапазона', 'error', 2000);
      return;
    }
    
    let deselectedCount = 0;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const pcNumberCell = row.querySelector('td[data-sort]');
      if (!pcNumberCell) return;
      
      
      const pcNumber = extractPCNumber(pcNumberCell.textContent);
      if (pcNumber !== null && numbers.includes(pcNumber)) {
        const checkbox = row.querySelector('input[type="checkbox"].el_pc');
        if (checkbox && checkbox.checked) {
          checkbox.checked = false;
          deselectedCount++;
        }
      }
    });
    
    if (deselectedCount > 0) {
      showNotification(`Снят выбор с ПК: ${numbers.join(', ')} (${deselectedCount} шт.)`, 'success', 3000);
    } else {
      showNotification('Не найдено выбранных ПК с указанными номерами', 'warning', 2000);
    }
  }

  function selectAllPCs(table) {
    const checkboxes = table.querySelectorAll('tbody input[type="checkbox"].el_pc');
    let count = 0;
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        checkbox.checked = true;
        count++;
      }
    });
    showNotification(`Выбраны все ПК (${count} шт.)`, 'success', 2000);
  }

  function selectFreePCs(table) {
    const rows = table.querySelectorAll('tbody tr');
    let count = 0;
    
    rows.forEach(row => {
      
      if (row.classList.contains('bg-success')) {
        const checkbox = row.querySelector('input[type="checkbox"].el_pc');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          count++;
        }
      }
    });
    
    if (count > 0) {
      showNotification(`Выбраны свободные ПК (${count} шт.)`, 'success', 2000);
    } else {
      showNotification('Нет свободных ПК для выбора', 'warning', 2000);
    }
  }

  function clearAllPCs(table) {
    const checkboxes = table.querySelectorAll('tbody input[type="checkbox"].el_pc');
    let count = 0;
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkbox.checked = false;
        count++;
      }
    });
    showNotification(`Снят выбор со всех ПК (${count} шт.)`, 'success', 2000);
  }

  function invertSelection(table) {
    const checkboxes = table.querySelectorAll('tbody input[type="checkbox"].el_pc');
    let selectedCount = 0;
    let deselectedCount = 0;
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        selectedCount++;
      } else {
        deselectedCount++;
      }
    });
    
    showNotification(`Инвертирован выбор: +${selectedCount}, -${deselectedCount}`, 'success', 2000);
  }

  
  function showMassiveSelectionPanelForAllClubs() {
    
    if (document.getElementById('massive-pc-selection-panel-allclubs')) {
      const panel = document.getElementById('massive-pc-selection-panel-allclubs');
      panel.style.display = 'block';
      return;
    }
    
    createMassiveSelectionPanelForAllClubs();
  }
  
  function hideMassiveSelectionPanelForAllClubs() {
    const panel = document.getElementById('massive-pc-selection-panel-allclubs');
    if (panel) {
      panel.style.display = 'none';
    }
  }
  
  function restoreHiddenElements() {
    document.body.classList.remove('lan-search-hide-checkboxes');
    document.body.classList.remove('lan-search-hide-comments');

    try {
      localStorage.setItem('lanSearchHideCheckboxes', 'false');
      localStorage.setItem('lanSearchHideComments', 'false');
    } catch (_) {}
    try {
      chrome.storage.sync.set({ hideCheckboxes: false, hideComments: false });
    } catch (_) {}
    clearHideCheckboxesCache();
    clearHideCommentsCache();

    showNotification('Скрытые элементы восстановлены!', 'success', 3000);
  }
  
  function createMassiveSelectionPanelForAllClubs() {
    
    const leftColumn = document.querySelector('.row .col-12.col-lg-6');
    if (!leftColumn) {
      return;
    }
    
    
    const rowElement = leftColumn.closest('.row');
    if (!rowElement) {
      return;
    }
    
    
    const nextRowElement = rowElement.nextElementSibling;
    if (!nextRowElement || !nextRowElement.classList.contains('row')) {
      return;
    }
    
    
    if (!document.getElementById('massive-selection-allclubs-theme-styles')) {
      const themeStyle = document.createElement('style');
      themeStyle.id = 'massive-selection-allclubs-theme-styles';
      themeStyle.textContent = `
        #massive-pc-selection-panel-allclubs .panel-title {
          color: #333;
        }
        
        #massive-pc-selection-panel-allclubs .panel-input {
          background: white;
          color: #333;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }
        
        [data-theme="dark"] #massive-pc-selection-panel-allclubs {
          background: linear-gradient(135deg, rgba(45, 45, 45, 0.98), rgba(55, 55, 55, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        [data-theme="dark"] #massive-pc-selection-panel-allclubs:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        [data-theme="dark"] #massive-pc-selection-panel-allclubs .panel-input {
          background: rgba(60, 60, 60, 0.9);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        [data-theme="dark"] #massive-pc-selection-panel-allclubs .panel-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `;
      document.head.appendChild(themeStyle);
    }
    
    
    const panel = document.createElement('div');
    panel.id = 'massive-pc-selection-panel-allclubs';
    panel.style.cssText = `
      padding: 12px;
      border-radius: 8px;
      margin: 15px auto;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
    `;
    
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '2-10 или 2,5,8';
    input.className = 'panel-input';
    input.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 8px;
      box-sizing: border-box;
      outline: none;
      transition: all 0.2s;
    `;
    
    input.addEventListener('focus', () => {
      input.style.borderColor = '#4c8bf5';
      input.style.boxShadow = '0 0 0 2px rgba(76, 139, 245, 0.2)';
    });
    
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(0, 0, 0, 0.2)';
      input.style.boxShadow = 'none';
    });
    
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    `;
    
    const selectBtn = document.createElement('button');
    selectBtn.textContent = '✓';
    selectBtn.title = 'Выбрать';
    selectBtn.style.cssText = `
      flex: 1;
      padding: 6px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    selectBtn.addEventListener('mouseenter', () => {
      selectBtn.style.background = '#218838';
    });
    
    selectBtn.addEventListener('mouseleave', () => {
      selectBtn.style.background = '#28a745';
      selectBtn.style.transform = 'scale(1)';
    });
    
    selectBtn.addEventListener('click', () => {
      const range = input.value.trim();
      if (range) {
        selectPCsByRangeForAllClubs(range);
      } else {
        showNotification('Введите диапазон', 'warning', 2000);
      }
    });
    
    const deselectBtn = document.createElement('button');
    deselectBtn.textContent = '✗';
    deselectBtn.title = 'Снять';
    deselectBtn.style.cssText = `
      flex: 1;
      padding: 6px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    deselectBtn.addEventListener('mouseenter', () => {
      deselectBtn.style.background = '#c82333';
    });
    
    deselectBtn.addEventListener('mouseleave', () => {
      deselectBtn.style.background = '#dc3545';
      deselectBtn.style.transform = 'scale(1)';
    });
    
    deselectBtn.addEventListener('click', () => {
      const range = input.value.trim();
      if (range) {
        deselectPCsByRangeForAllClubs(range);
      } else {
        showNotification('Введите диапазон', 'warning', 2000);
      }
    });
    
    
    const quickButtons = document.createElement('div');
    quickButtons.style.cssText = `
      display: flex;
      gap: 6px;
      justify-content: center;
    `;
    
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Все';
    selectAllBtn.style.cssText = createCompactButtonStyle('#17a2b8');
    selectAllBtn.addEventListener('click', () => selectAllPCsForAllClubs());
    addCompactButtonHover(selectAllBtn, '#17a2b8', '#138496');
    
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Очистить';
    clearAllBtn.style.cssText = createCompactButtonStyle('#6c757d');
    clearAllBtn.addEventListener('click', () => clearAllPCsForAllClubs());
    addCompactButtonHover(clearAllBtn, '#6c757d', '#5a6268');
    
    
    const invertBtn = document.createElement('button');
    invertBtn.textContent = 'Инверт';
    invertBtn.style.cssText = createCompactButtonStyle('#ffc107');
    invertBtn.addEventListener('click', () => invertSelectionForAllClubs());
    addCompactButtonHover(invertBtn, '#ffc107', '#e0a800');
    
    

    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.className = 'lgs-massive-restore';
    restoreBtn.textContent = 'Восстановить скрытое';
    restoreBtn.title = 'Показать чекбоксы и комментарии ПК';
    restoreBtn.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: color-mix(in srgb, #17a2b8 70%, #000);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin: 0;
    `;
    restoreBtn.addEventListener('click', () => {
      restoreHiddenElements();
    });

    buttonsContainer.appendChild(selectBtn);
    buttonsContainer.appendChild(deselectBtn);

    quickButtons.appendChild(selectAllBtn);
    quickButtons.appendChild(clearAllBtn);
    quickButtons.appendChild(invertBtn);

    panel.appendChild(input);
    panel.appendChild(buttonsContainer);
    panel.appendChild(quickButtons);
    panel.appendChild(restoreBtn);
    
    
    nextRowElement.parentNode.insertBefore(panel, nextRowElement);
    
  }
  
  function createCompactButtonStyle(color) {
    return `
      flex: 1;
      padding: 6px 8px;
      background: ${color};
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    `;
  }
  
  function addCompactButtonHover(button, color, hoverColor) {
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = color;
      button.style.transform = 'scale(1)';
    });
  }
  
  
  function selectPCsByRangeForAllClubs(rangeStr) {
    const numbers = parseRange(rangeStr);
    if (numbers.length === 0) {
      showNotification('Неверный формат диапазона', 'error', 2000);
      return;
    }
    
    let selectedCount = 0;
    const pcForms = document.querySelectorAll('form.pc');
    
    pcForms.forEach(form => {
      
      const pcNameElement = form.querySelector('.pc_name');
      if (!pcNameElement) return;
      
      const pcText = pcNameElement.textContent.trim();
      const pcNumber = extractPCNumber(pcText);
      
      if (pcNumber !== null && numbers.includes(pcNumber)) {
        const checkbox = form.querySelector('.pc-selector');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          selectedCount++;
        }
      }
    });
    
    if (selectedCount > 0) {
      showNotification(`Выбрано ПК: ${numbers.join(', ')} (${selectedCount} шт.)`, 'success', 3000);
    } else {
      showNotification('Не найдено ПК с указанными номерами', 'warning', 2000);
    }
  }
  
  function deselectPCsByRangeForAllClubs(rangeStr) {
    const numbers = parseRange(rangeStr);
    if (numbers.length === 0) {
      showNotification('Неверный формат диапазона', 'error', 2000);
      return;
    }
    
    let deselectedCount = 0;
    const pcForms = document.querySelectorAll('form.pc');
    
    pcForms.forEach(form => {
      const pcNameElement = form.querySelector('.pc_name');
      if (!pcNameElement) return;
      
      const pcText = pcNameElement.textContent.trim();
      const pcNumber = extractPCNumber(pcText);
      
      if (pcNumber !== null && numbers.includes(pcNumber)) {
        const checkbox = form.querySelector('.pc-selector');
        if (checkbox && checkbox.checked) {
          checkbox.checked = false;
          deselectedCount++;
        }
      }
    });
    
    if (deselectedCount > 0) {
      showNotification(`Снят выбор с ПК: ${numbers.join(', ')} (${deselectedCount} шт.)`, 'success', 3000);
    } else {
      showNotification('Не найдено выбранных ПК с указанными номерами', 'warning', 2000);
    }
  }
  
  function selectAllPCsForAllClubs() {
    const checkboxes = document.querySelectorAll('form.pc .pc-selector');
    let count = 0;
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        checkbox.checked = true;
        count++;
      }
    });
    showNotification(`Выбраны все ПК (${count} шт.)`, 'success', 2000);
  }
  
  function clearAllPCsForAllClubs() {
    const checkboxes = document.querySelectorAll('form.pc .pc-selector');
    let count = 0;
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkbox.checked = false;
        count++;
      }
    });
    showNotification(`Снят выбор со всех ПК (${count} шт.)`, 'success', 2000);
  }
  
  function invertSelectionForAllClubs() {
    const checkboxes = document.querySelectorAll('form.pc .pc-selector');
    let selectedCount = 0;
    let deselectedCount = 0;
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        selectedCount++;
      } else {
        deselectedCount++;
      }
    });
    
    showNotification(`Инвертирован выбор: +${selectedCount}, -${deselectedCount}`, 'success', 2000);
  }

  function addSelectionStyles() {
    if (document.getElementById('pc-selection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pc-selection-styles';
    style.textContent = `
      .selection-mode form.pc {
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid transparent;
        border-radius: 8px;
      }
      
      .selection-mode form.pc:hover {
        border-color: #4c8bf5;
        background: rgba(76, 139, 245, 0.05);
        transform: scale(1.02);
      }
      
      .selection-mode form.pc:has(.pc-selector:checked) {
        border-color: #28a745;
        background: rgba(40, 167, 69, 0.1);
      }
      
      .selection-mode .checkbox-holder {
        display: block !important;
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
      }
      
      .selection-mode .pc-selector {
        transform: scale(1.2);
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('selection-mode');
  }

  function exitSelectionMode() {
    selectionMode = false;
    document.body.classList.remove('selection-mode');
    showNotification('вот бы пивка', 'warning', 2000);
    

    if (savedModalBypassState !== null) {
      if (savedModalBypassState) {

        if (window.lanSearchProcessButtons) {
          window.lanSearchProcessButtons();
        }
      }
      savedModalBypassState = null;
    }
  }

  
  function addCheckDisksButton(attempt = 0) {
    if (document.getElementById('checkDisksBtn')) return;

    const anchor =
      document.getElementById('selectPC') ||
      document.querySelector('.select-actions a, .select-actions button, a[href*="selectPC"]');

    if (!anchor) {
      if (attempt < 20) {
        setTimeout(() => addCheckDisksButton(attempt + 1), 250);
      }
      return;
    }

    const checkDisksBtn = document.createElement('button');
    checkDisksBtn.type = 'button';
    checkDisksBtn.id = 'checkDisksBtn';
    checkDisksBtn.className = 'btn btn-outline-info mb-3 mr-1';
    checkDisksBtn.innerHTML = '<i class="fa fa-hdd-o"></i> Проверить диски';
    checkDisksBtn.title = 'Проверить состояние дисков FreeNAS';

    anchor.parentNode.insertBefore(checkDisksBtn, anchor.nextSibling);

    checkDisksBtn.addEventListener('click', function(e) {
      e.preventDefault();
      checkDisksStatus();
    });
  }

  function resolveDiskClubId() {
    const isRealClubId = (value) => {
      if (value == null || value === '') return false;
      const s = String(value).trim();
      return s !== '' && s !== '0';
    };

    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('club_id');
    if (isRealClubId(fromUrl)) return String(fromUrl);

    const select =
      document.querySelector('select[name="club_id"]') ||
      document.querySelector('#club_id') ||
      document.querySelector('select.club_id, select[id*="club"]');
    if (select) {
      const firstReal = Array.from(select.options).find((opt) => isRealClubId(opt.value));
      if (firstReal) return String(firstReal.value);
      if (isRealClubId(select.value)) return String(select.value);
    }

    const dataClub = document.querySelector('[data-club-id]');
    if (dataClub && isRealClubId(dataClub.getAttribute('data-club-id'))) {
      return String(dataClub.getAttribute('data-club-id'));
    }

    const clubLink = document.querySelector('a[href*="club_id="]');
    if (clubLink) {
      try {
        const href = new URL(clubLink.href, window.location.origin);
        const id = href.searchParams.get('club_id');
        if (isRealClubId(id)) return String(id);
      } catch (_) {}
    }

    const hidden = document.querySelector('input[name="club_id"]');
    if (hidden && isRealClubId(hidden.value)) return String(hidden.value);

    // Без ?club_id= в URL — первый клуб (обычно 1)
    return '1';
  }

  function getPcFormUuid(form) {
    if (!form) return null;
    if (form.id && /[0-9a-f-]{8,}/i.test(form.id)) return form.id;

    const dataUuid =
      form.getAttribute('data-uuid') ||
      form.querySelector('[data-uuid]')?.getAttribute('data-uuid');
    if (dataUuid) return dataUuid;

    const remoteBtn = form.querySelector('[onclick*="StartRemote"]');
    const match = remoteBtn?.getAttribute('onclick')?.match(/StartRemote\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : null;
  }

  function extractSnapshotDate(statusText) {
    if (!statusText) return null;
    const match =
      String(statusText).match(/bigPool\/reference@(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/) ||
      String(statusText).match(/@(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/) ||
      String(statusText).match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
    return match ? match[1].substring(0, 16) : null;
  }

  function formatDiskStatus(pc) {
    const statusText = (pc.status_text || '').replace(/\s+/g, ' ').trim();
    const snapshotDate = extractSnapshotDate(statusText);
    if (snapshotDate) return { label: snapshotDate, ok: true };
    if (/не существует|not exist|error|ошиб/i.test(statusText)) {
      return { label: statusText.replace(/^[\s\-–—]+/, '') || 'Snapshot не найден', ok: false };
    }
    if (statusText && statusText !== '-') {
      return { label: statusText.replace(/^[\s\-–—]+/, ''), ok: !/не|error|ошиб/i.test(statusText) };
    }
    return { label: pc.disk_name ? `disk ${pc.disk_name}` : 'Нет данных', ok: false };
  }

  function extractLatestSnapshotFromApi(item) {
    const snapshots = Array.isArray(item?.snapshots) ? item.snapshots : [];
    let latestDate = null;
    let latestDateStr = null;

    snapshots.forEach((snap) => {
      const raw = [snap?.name, snap?.snapshot_name, snap?.created, snap?.date, snap?.text]
        .filter(Boolean)
        .join(' ');
      const dateMatch = String(raw).match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
      if (!dateMatch) return;
      const dateStr = dateMatch[1];
      const date = new Date(
        dateStr.split(' ')[0].split('.').reverse().join('-') + ' ' + dateStr.split(' ')[1]
      );
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestDateStr = dateStr.substring(0, 16);
      }
    });

    if (latestDateStr) return latestDateStr;
    if (item?.reference) {
      const fromRef = extractSnapshotDate(item.reference);
      if (fromRef) return fromRef;
    }
    return null;
  }

  async function checkDisksStatus() {
    const clubId = resolveDiskClubId();
    if (!clubId) {
      showNotification('Не удалось определить club_id для проверки дисков', 'error', 3000);
      return;
    }

    const checkDisksBtn = document.getElementById('checkDisksBtn');
    const originalText = checkDisksBtn ? checkDisksBtn.innerHTML : null;
    const restoreButton = () => {
      if (!checkDisksBtn || originalText == null) return;
      checkDisksBtn.innerHTML = originalText;
      checkDisksBtn.disabled = false;
      checkDisksBtn.style.opacity = '1';
    };

    if (checkDisksBtn) {
      checkDisksBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Проверяем...';
      checkDisksBtn.disabled = true;
      checkDisksBtn.style.opacity = '0.7';
    }

    showNotification(`Проверяем состояние дисков для клуба ${clubId}...`, 'success', 2000);

    try {
      const data = await masterApiRequest(`/freenas_wrap/${encodeURIComponent(clubId)}`);
      applyFreenasDiskData(data?.item || data);
      restoreButton();
    } catch (error) {
      console.error('Lan-Search: Ошибка при проверке дисков:', error);
      showNotification(error.message || 'Ошибка при проверке дисков', 'error', 3500);
      restoreButton();
    }
  }

  function applyFreenasDiskData(item) {
    if (!item || typeof item !== 'object') {
      showNotification('Пустой ответ FreeNAS', 'warning', 3000);
      return;
    }

    const pcs = Array.isArray(item.pcs) ? item.pcs : [];
    window.__lanSearchDiskPcs = pcs;

    const existingMgmt = document.getElementById('diskManagementBtn');
    if (existingMgmt) existingMgmt.remove();

    const latestSnapshot = extractLatestSnapshotFromApi(item);
    if (latestSnapshot) {
      addSnapshotInfoButton(latestSnapshot);
    } else {
      const oldSnap = document.getElementById('snapshotInfoBtn');
      if (oldSnap) oldSnap.remove();
    }

    if (item.truenas && item.truenas.is_alive === false && item.truenas.text) {
      showNotification(String(item.truenas.text).trim(), 'warning', 4000);
    }

    addDiskInfoToPCs(pcs);

    if (pcs.length === 0) {
      showNotification('ПК с дисками не найдены', 'warning', 3000);
    } else {
      showNotification(`Найдено ${pcs.length} дисков`, 'success', 2000);
    }
  }

  function addSnapshotInfoButton(latestDate) {
    const existingBtn = document.getElementById('snapshotInfoBtn');
    if (existingBtn) existingBtn.remove();

    const snapshotBtn = document.createElement('button');
    snapshotBtn.type = 'button';
    snapshotBtn.id = 'snapshotInfoBtn';
    snapshotBtn.className = 'btn btn-outline-success mb-3 mr-1';
    snapshotBtn.innerHTML = `<i class="fa fa-clock-o"></i> ${latestDate}`;
    snapshotBtn.title = 'Последний снимок FreeNAS';

    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(snapshotBtn, checkDisksBtn.nextSibling);
    }
  }

  function addDiskInfoToPCs(pcs) {
    const diskDataMap = new Map();
    (pcs || []).forEach((pc) => {
      if (!pc?.uuid) return;
      diskDataMap.set(String(pc.uuid).toUpperCase(), pc);
    });

    const pcForms = document.querySelectorAll('form.pc, .lan-search-pc-container');
    let matched = 0;

    pcForms.forEach((form) => {
      const uuid = getPcFormUuid(form);
      if (!uuid) return;

      const pc = diskDataMap.get(uuid.toUpperCase());
      if (!pc) return;
      matched += 1;

      const existingDiskInfo = form.querySelector('.disk-info');
      if (existingDiskInfo) existingDiskInfo.remove();

      const status = formatDiskStatus(pc);
      const diskInfo = document.createElement('div');
      diskInfo.className = 'disk-info';
      diskInfo.setAttribute('data-uuid', uuid);
      diskInfo.style.cssText = `
        margin-top: 5px;
        padding: 5px;
        font-size: 11px;
        color: #666;
        text-align: center;
      `;

      const statusColor = status.ok ? '#28a745' : '#dc3545';
      const nameLine = pc.name ? `<div style="font-size: 8px; color: #888;">${escapeHtml(String(pc.name))}</div>` : '';
      diskInfo.innerHTML = `
        ${nameLine}
        <div style="margin-top: 2px; font-size: 8px; color: ${statusColor}; font-weight: 500;">
          ${escapeHtml(status.label)}
        </div>
      `;

      const unlockButton = form.querySelector('[data-type="UnLock"]');
      const manageButton = form.querySelector('.lan-search-manage-btn');
      const insertAfter = manageButton || unlockButton;
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(diskInfo, insertAfter.nextSibling);
      } else {
        form.appendChild(diskInfo);
      }
    });

    if (matched === 0 && diskDataMap.size > 0) {
      showNotification('Данные дисков получены, но не сопоставлены с карточками ПК', 'warning', 3500);
    }
  }

  
  let pcStylesCache = null;
  let pcStylesCacheTime = 0;
  
  function getPCStylesSetting(callback) {
    const now = Date.now();
    
    
    if (pcStylesCache !== null && (now - pcStylesCacheTime) < CACHE_DURATION) {
      callback(pcStylesCache);
      return;
    }
    
    try {
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['pcStyles'], function(result) {
          try {
            const enabled = result.pcStyles || false;
            
            
            pcStylesCache = enabled;
            pcStylesCacheTime = now;
            
            
            try {
              localStorage.setItem('lanSearchPCStyles', enabled.toString());
            } catch (e) {
              
            }
            
            callback(enabled);
          } catch (e) {
            
            const localStyles = localStorage.getItem('lanSearchPCStyles');
            const enabled = localStyles === 'true';
            
            pcStylesCache = enabled;
            pcStylesCacheTime = now;
            
            callback(enabled);
          }
        });
      } else {
        
        const localStyles = localStorage.getItem('lanSearchPCStyles');
        const enabled = localStyles === 'true';
        
        pcStylesCache = enabled;
        pcStylesCacheTime = now;
        
        callback(enabled);
      }
    } catch (e) {
      pcStylesCache = false;
      pcStylesCacheTime = now;
      
      callback(false);
    }
  }
  
  function clearPCStylesCache() {
    pcStylesCache = null;
    pcStylesCacheTime = 0;
  }
  
  
  let tableOptimizationCache = null;
  let tableOptimizationCacheTime = 0;
  
  
  let hideCheckboxesCache = null;
  let hideCheckboxesCacheTime = 0;
  
  
  let hideCommentsCache = null;
  let hideCommentsCacheTime = 0;
  
  function getTableOptimizationSetting(callback) {
    const now = Date.now();
    
    
    if (tableOptimizationCache !== null && (now - tableOptimizationCacheTime) < CACHE_DURATION) {
      callback(tableOptimizationCache);
      return;
    }
    
    try {
      
      chrome.storage.sync.get(['tableOptimization'], function(result) {
        if (chrome.runtime.lastError) {
          
          
          const localOptimization = localStorage.getItem('lanSearchTableOptimization');
          const enabled = localOptimization === 'true';
          
          tableOptimizationCache = enabled;
          tableOptimizationCacheTime = now;
          
          callback(enabled);
        } else {
          const enabled = result.tableOptimization || false;
          
          
          tableOptimizationCache = enabled;
          tableOptimizationCacheTime = now;
          
          
          try {
            localStorage.setItem('lanSearchTableOptimization', enabled.toString());
          } catch (e) {
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      
      
      const localOptimization = localStorage.getItem('lanSearchTableOptimization');
      const enabled = localOptimization === 'true';
      
      tableOptimizationCache = enabled;
      tableOptimizationCacheTime = now;
      
      callback(enabled);
    }
  }
  
  function clearTableOptimizationCache() {
    tableOptimizationCache = null;
    tableOptimizationCacheTime = 0;
  }
  
  function applyTableOptimization() {
    
    if (!window.location.pathname.includes('/guests_search/')) {
      return;
    }
    
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      table.classList.add('lan-search-table-optimized');
      
      
      const headers = table.querySelectorAll('th.sorting div');
      headers.forEach(header => {
        const text = header.textContent.trim();
        if (text === 'Бонусный баланс') {
          header.textContent = 'Бонусы';
        } else if (text === 'Ручная группа') {
          header.textContent = 'Ручная Г.';
        } else if (text === 'Данные документа') {
          header.textContent = 'Данные Д.';
        } else if (text === 'Последняя авторизация') {
          header.textContent = 'Последн. Вход.';
        } else if (text === 'Дата регистрации') {
          header.textContent = 'Регистр.';
        }
      });
    });
    
    if (tables.length > 0) {

    }
  }
  
  function removeTableOptimization() {
    const tables = document.querySelectorAll('table.lan-search-table-optimized');
    tables.forEach(table => {
      table.classList.remove('lan-search-table-optimized');
      
      
      const headers = table.querySelectorAll('th.sorting div');
      headers.forEach(header => {
        const text = header.textContent.trim();
        if (text === 'Бонусы') {
          header.textContent = 'Бонусный баланс';
        } else if (text === 'Ручная Г.') {
          header.textContent = 'Ручная группа';
        } else if (text === 'Данные Д.') {
          header.textContent = 'Данные документа';
        } else if (text === 'Последн. Вход.') {
          header.textContent = 'Последняя авторизация';
        } else if (text === 'Регистр.') {
          header.textContent = 'Дата регистрации';
        }
      });
    });
    
    if (tables.length > 0) {

    }
  }
  
  function initTableOptimization() {
    if (!shouldAutoActivate()) return;
    
    let processingOptimization = false;
    
    function processOptimization() {
      if (processingOptimization) return;
      processingOptimization = true;
      
      getTableOptimizationSetting(function(optimizationEnabled) {
        
        if (optimizationEnabled) {
          applyTableOptimization();
        } else {
          removeTableOptimization();
        }
        
        processingOptimization = false;
      });
    }
    
    
    processOptimization();
    
    
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.tableOptimization) {
        clearTableOptimizationCache();
        processOptimization();
      }
    });
  }
  
  
  window.lanSearchSyncTableOptimization = function() {
    clearTableOptimizationCache();
    getTableOptimizationSetting(function(enabled) {
      if (enabled) {
        applyTableOptimization();
      } else {
        removeTableOptimization();
      }
    });
  };
  
  function getHideCheckboxesSetting(callback) {
    const now = Date.now();
    
    
    if (hideCheckboxesCache !== null && (now - hideCheckboxesCacheTime) < CACHE_DURATION) {
      callback(hideCheckboxesCache);
      return;
    }
    
    try {
      
      chrome.storage.sync.get(['hideCheckboxes'], function(result) {
        if (chrome.runtime.lastError) {
          const localHideCheckboxes = localStorage.getItem('lanSearchHideCheckboxes');
          const enabled = localHideCheckboxes === null ? true : localHideCheckboxes === 'true';
          hideCheckboxesCache = enabled;
          hideCheckboxesCacheTime = now;
          callback(enabled);
        } else {
          const missing = !result || result.hideCheckboxes === undefined;
          const enabled = missing ? true : !!result.hideCheckboxes;
          hideCheckboxesCache = enabled;
          hideCheckboxesCacheTime = now;
          try { localStorage.setItem('lanSearchHideCheckboxes', enabled.toString()); } catch (e) {}
          if (missing) {
            try { chrome.storage.sync.set({ hideCheckboxes: true }); } catch (_) {}
          }
          callback(enabled);
        }
      });
    } catch (e) {
      const localHideCheckboxes = localStorage.getItem('lanSearchHideCheckboxes');
      const enabled = localHideCheckboxes === null ? true : localHideCheckboxes === 'true';
      hideCheckboxesCache = enabled;
      hideCheckboxesCacheTime = now;
      callback(enabled);
    }
  }
  
  function clearHideCheckboxesCache() {
    hideCheckboxesCache = null;
    hideCheckboxesCacheTime = 0;
  }
  
  function refreshPcInfoRowsAfterHideChange() {
    if (!document.documentElement.classList.contains('lgs-new-ui-pc')) return;
    document.querySelectorAll('#layoutStatusPC form.pc').forEach((form) => {
      try { syncNewUiPcInfoRows(form); } catch (_) {}
    });
  }

  function applyHideCheckboxes() {
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;
    document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-checkboxes');
    refreshPcInfoRowsAfterHideChange();
  }

  function removeHideCheckboxes() {
    document.body.classList.remove('lan-search-hide-checkboxes');
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
    refreshPcInfoRowsAfterHideChange();
  }
  
  function initHideCheckboxes() {
    if (!shouldAutoActivate()) return;
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;

    let processingHideCheckboxes = false;

    function processHideCheckboxes() {
      if (processingHideCheckboxes) return;
      processingHideCheckboxes = true;

      getHideCheckboxesSetting(function(hideCheckboxesEnabled) {
        if (hideCheckboxesEnabled) {
          applyHideCheckboxes();
        } else {
          removeHideCheckboxes();
        }
        processingHideCheckboxes = false;
      });
    }

    processHideCheckboxes();

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideCheckboxes) {
        clearHideCheckboxesCache();
        processHideCheckboxes();
      }
    });
  }
  
  
  window.lanSearchSyncHideCheckboxes = function() {
    clearHideCheckboxesCache();
    getHideCheckboxesSetting(function(enabled) {
      if (enabled) {
        applyHideCheckboxes();
      } else {
        removeHideCheckboxes();
      }
    });
  };


  window.lanSearchGetHideCheckboxesSetting = getHideCheckboxesSetting;
  window.lanSearchGetHideCommentsSetting = getHideCommentsSetting;
  
  function getHideCommentsSetting(callback) {
    const now = Date.now();
    
    
    if (hideCommentsCache !== null && (now - hideCommentsCacheTime) < CACHE_DURATION) {
      callback(hideCommentsCache);
      return;
    }
    
    try {
      
      chrome.storage.sync.get(['hideComments'], function(result) {
        if (chrome.runtime.lastError) {
          const localHideComments = localStorage.getItem('lanSearchHideComments');
          const enabled = localHideComments === null ? true : localHideComments === 'true';
          hideCommentsCache = enabled;
          hideCommentsCacheTime = now;
          callback(enabled);
        } else {
          const missing = !result || result.hideComments === undefined;
          const enabled = missing ? true : !!result.hideComments;
          hideCommentsCache = enabled;
          hideCommentsCacheTime = now;
          try { localStorage.setItem('lanSearchHideComments', enabled.toString()); } catch (e) {}
          if (missing) {
            try { chrome.storage.sync.set({ hideComments: true }); } catch (_) {}
          }
          callback(enabled);
        }
      });
    } catch (e) {
      const localHideComments = localStorage.getItem('lanSearchHideComments');
      const enabled = localHideComments === null ? true : localHideComments === 'true';
      hideCommentsCache = enabled;
      hideCommentsCacheTime = now;
      callback(enabled);
    }
  }
  
  function clearHideCommentsCache() {
    hideCommentsCache = null;
    hideCommentsCacheTime = 0;
  }
  
  function applyHideComments() {
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;
    document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-comments');
    refreshPcInfoRowsAfterHideChange();
  }

  function removeHideComments() {
    document.body.classList.remove('lan-search-hide-comments');
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
    refreshPcInfoRowsAfterHideChange();
  }
  
  function initHideComments() {
    if (!shouldAutoActivate()) return;
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;

    let processingHideComments = false;

    function processHideComments() {
      if (processingHideComments) return;
      processingHideComments = true;

      getHideCommentsSetting(function(hideCommentsEnabled) {
        if (hideCommentsEnabled) {
          applyHideComments();
        } else {
          removeHideComments();
        }
        processingHideComments = false;
      });
    }

    processHideComments();

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideComments) {
        clearHideCommentsCache();
        processHideComments();
      }
    });
  }

  /* —— скрыть «ПО для управления» —— */
  let hideRemoteDownloadCache = null;
  let hideRemoteDownloadCacheTime = 0;

  function getHideRemoteDownloadSetting(callback) {
    const now = Date.now();
    if (hideRemoteDownloadCache !== null && (now - hideRemoteDownloadCacheTime) < CACHE_DURATION) {
      callback(hideRemoteDownloadCache);
      return;
    }
    try {
      chrome.storage.sync.get(['hideRemoteDownload'], function(result) {
        if (chrome.runtime.lastError) {
          const local = localStorage.getItem('lanSearchHideRemoteDownload');
          const enabled = local === null ? true : local === 'true';
          hideRemoteDownloadCache = enabled;
          hideRemoteDownloadCacheTime = now;
          callback(enabled);
        } else {
          const missing = !result || result.hideRemoteDownload === undefined;
          const enabled = missing ? true : !!result.hideRemoteDownload;
          hideRemoteDownloadCache = enabled;
          hideRemoteDownloadCacheTime = now;
          try { localStorage.setItem('lanSearchHideRemoteDownload', enabled.toString()); } catch (_) {}
          if (missing) {
            try { chrome.storage.sync.set({ hideRemoteDownload: true }); } catch (_) {}
          }
          callback(enabled);
        }
      });
    } catch (e) {
      const local = localStorage.getItem('lanSearchHideRemoteDownload');
      const enabled = local === null ? true : local === 'true';
      hideRemoteDownloadCache = enabled;
      hideRemoteDownloadCacheTime = now;
      callback(enabled);
    }
  }

  function applyHideRemoteDownload() {
    document.body.classList.add('lan-search-hide-remote-download');
  }

  function removeHideRemoteDownload() {
    document.body.classList.remove('lan-search-hide-remote-download');
  }

  function initHideRemoteDownload() {
    if (!shouldAutoActivate()) return;
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;

    function process() {
      getHideRemoteDownloadSetting(function(enabled) {
        if (enabled) applyHideRemoteDownload();
        else removeHideRemoteDownload();
      });
    }

    process();

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideRemoteDownload) {
        hideRemoteDownloadCache = null;
        hideRemoteDownloadCacheTime = 0;
        process();
      }
    });
  }

  window.lanSearchSyncHideRemoteDownload = function() {
    hideRemoteDownloadCache = null;
    hideRemoteDownloadCacheTime = 0;
    getHideRemoteDownloadSetting(function(enabled) {
      if (enabled) applyHideRemoteDownload();
      else removeHideRemoteDownload();
    });
  };
  
  
  window.lanSearchSyncHideComments = function() {
    clearHideCommentsCache();
    getHideCommentsSetting(function(enabled) {
      if (enabled) {
        applyHideComments();
      } else {
        removeHideComments();
      }
    });
  };
  
  
  function injectPCStyles() {
    if (document.getElementById('lan-search-pc-styles')) return;
    
    const link = document.createElement('link');
    link.id = 'lan-search-pc-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('style_pc.css');
    document.head.appendChild(link);
    
  }
  
  
  function removePCStyles() {
    const link = document.getElementById('lan-search-pc-styles');
    if (link) {
      link.remove();
    }
  }
  
  
  // Функция для обновления класса pc-manual-unlock
  function updateManualUnlockClass(form) {
    const timeLock = form.querySelector('.timeLock');
    if (timeLock && timeLock.textContent.trim().includes('Ручная разблокировка')) {
      form.classList.add('pc-manual-unlock');
    } else {
      form.classList.remove('pc-manual-unlock');
    }
  }

  // То же поведение меню, что у сетки Нового UI / style_pc
  function wirePcCardDropdown(dropdown, { restyleToggle = false } = {}) {
    if (!dropdown) return;

    dropdown.classList.add('lan-search-dropdown');

    const dropdownToggle = dropdown.querySelector('.btn-pc, #dropdownMenuButton, [data-toggle="dropdown"]');
    if (!dropdownToggle) return;

    dropdownToggle.classList.add('lan-search-dropdown-toggle');
    if (restyleToggle) {
      dropdownToggle.classList.remove('btn', 'btn-info', 'btn-sm', 'float-left');
    }

    if (dropdownToggle.dataset.lgsDropWired === '1') return;
    dropdownToggle.dataset.lgsDropWired = '1';

    dropdownToggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;

      document.querySelectorAll('.lan-search-dropdown .dropdown-menu.show').forEach((otherMenu) => {
        if (otherMenu === menu) return;
        otherMenu.classList.remove('show');
        otherMenu.style.removeProperty('display');
        otherMenu.style.removeProperty('transform');
        const otherDropdown = otherMenu.closest('.lan-search-dropdown');
        if (otherDropdown) otherDropdown.classList.remove('menu-open');
      });

      const willOpen = !menu.classList.contains('show');
      menu.classList.toggle('show', willOpen);
      menu.style.removeProperty('display');
      menu.style.removeProperty('transform');
      menu.style.removeProperty('top');
      menu.style.removeProperty('left');
      menu.style.removeProperty('will-change');
      dropdown.classList.toggle('menu-open', willOpen);
    });
  }
  
  function applyPCStyles() {

    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      return;
    }
    
    const pcForms = document.querySelectorAll('form.pc:not([data-lan-search-styled])');
    
    if (pcForms.length === 0) return;
    
    
    pcForms.forEach(form => {
      
      form.setAttribute('data-lan-search-styled', 'true');
      form.classList.add('lan-search-styled');
      
       
       form.classList.add('lan-search-pc-card');
       
       
       const parentContainer = form.closest('.float-left.m-1');
       if (parentContainer) {
         parentContainer.classList.remove('m-1');
       }
      
      
      const container = form.querySelector('.mb-3.border.border-dark');
      if (container) {
        container.classList.add('lan-search-pc-container');
        container.classList.remove('mb-3', 'border', 'border-dark');
      }
      
      
      const pcName = form.querySelector('.pc_name');
      if (pcName) {
        pcName.classList.add('lan-search-pc-number');
        pcName.classList.remove('bg-dark', 'text-white', 'p-0', 'w-100');
      }
      
      
      const status = form.querySelector('[data-type="status"]');
      if (status) {
        status.classList.add('lan-search-pc-status');
        const statusText = status.textContent.trim().toLowerCase();
        
        if (statusText.includes('свобод') || statusText.includes('free')) {
          status.classList.add('status-free');
        } else if (statusText.includes('занят') || statusText.includes('busy')) {
          status.classList.add('status-busy');
        } else {
          status.classList.add('status-connection');
        }
        
        status.classList.remove('bg-secondary', 'text-center');
      }
      
       
       const buttons = form.querySelectorAll('button.btn:not(.dropdown-menu button)');
       buttons.forEach(btn => {
         btn.classList.add('lan-search-btn');
         
         
         const buttonText = btn.textContent.trim();
         if (buttonText === 'Заблокировать') {
           btn.textContent = 'Заблок.';
         } else if (buttonText === 'Разблокировать') {
           btn.textContent = 'Разблок.';
         }
       });
       
       
       const divButtons = form.querySelectorAll('div.btn');
       divButtons.forEach(div => {
         
         const buttonText = div.textContent.trim();
         if (buttonText === 'Заблокировать') {
           div.textContent = 'Заблок.';
         } else if (buttonText === 'Разблокировать') {
           div.textContent = 'Разблок.';
         }
       });
      
      
      const commentInput = form.querySelector('.comment_input');
      if (commentInput) {
        commentInput.classList.add('lan-search-comment-input');
        commentInput.classList.remove('form-control', 'form-control-sm');
      }
      
       
       const checkboxContainers = form.querySelectorAll('.col-12.pl-4');
       checkboxContainers.forEach(container => {
         container.classList.remove('pl-4');
       });
      
      
      // Проверка на ручную разблокировку
      updateManualUnlockClass(form);
      
      const pcInfo = form.querySelector('.pc_info');
      if (pcInfo) {
        pcInfo.classList.add('lan-search-pc-info');
        
        pcInfo.style.minHeight = '15px';
        pcInfo.style.padding = '2px 4px';
        pcInfo.style.fontSize = '8px';
        pcInfo.style.lineHeight = '1.2';
      }
      
       
       const dropdown = form.querySelector('.pc-dropdow');
       if (dropdown) {
         wirePcCardDropdown(dropdown, { restyleToggle: true });
       }
      
      
      const version = form.querySelector('.version');
      if (version && version.parentElement) {
        version.parentElement.classList.add('lan-search-version');
      }
    });
    
    // Добавляем MutationObserver для отслеживания изменений timeLock
    if (pcForms.length > 0) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target;
            if (target.classList && target.classList.contains('timeLock')) {
              const form = target.closest('form.pc');
              if (form) {
                updateManualUnlockClass(form);
              }
            } else if (target.querySelector && target.querySelector('.timeLock')) {
              const forms = target.querySelectorAll('form.pc');
              forms.forEach(form => updateManualUnlockClass(form));
            }
          }
        });
      });
      
      // Наблюдаем за изменениями в элементах timeLock
      pcForms.forEach(form => {
        const timeLock = form.querySelector('.timeLock');
        if (timeLock) {
          observer.observe(timeLock, {
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      });
    }
  }
  
 
  function removePCStylesFromCards() {

    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      return;
    }
    
    const pcForms = document.querySelectorAll('form.pc[data-lan-search-styled]');
    
    if (pcForms.length === 0) return;
    
    
    pcForms.forEach(form => {
       
       form.removeAttribute('data-lan-search-styled');
       form.classList.remove('lan-search-styled', 'lan-search-pc-card');
       
       
       const parentContainer = form.closest('.float-left');
       if (parentContainer) {
         parentContainer.classList.add('m-1');
       }
      
      
      const container = form.querySelector('.lan-search-pc-container');
      if (container) {
        container.classList.remove('lan-search-pc-container');
        container.classList.add('mb-3', 'border', 'border-dark');
      }
      
      
      const pcName = form.querySelector('.lan-search-pc-number');
      if (pcName) {
        pcName.classList.remove('lan-search-pc-number');
        pcName.classList.add('bg-dark', 'text-white', 'p-0', 'w-100');
      }
      
      
      const status = form.querySelector('.lan-search-pc-status');
      if (status) {
        status.classList.remove('lan-search-pc-status', 'status-free', 'status-busy', 'status-connection');
        status.classList.add('bg-secondary', 'text-center');
      }
      
       
       const buttons = form.querySelectorAll('button.lan-search-btn:not(.dropdown-menu button)');
       buttons.forEach(btn => {
         btn.classList.remove('lan-search-btn');
         
         
         const buttonText = btn.textContent.trim();
         if (buttonText === 'Заблок.') {
           btn.textContent = 'Заблокировать';
         } else if (buttonText === 'Разблок.') {
           btn.textContent = 'Разблокировать';
         }
       });
       
       
       const divButtons = form.querySelectorAll('div.btn');
       divButtons.forEach(div => {
         
         const buttonText = div.textContent.trim();
         if (buttonText === 'Заблок.') {
           div.textContent = 'Заблокировать';
         } else if (buttonText === 'Разблок.') {
           div.textContent = 'Разблокировать';
         }
       });
      
      
      const commentInput = form.querySelector('.lan-search-comment-input');
      if (commentInput) {
        commentInput.classList.remove('lan-search-comment-input');
        commentInput.classList.add('form-control', 'form-control-sm');
      }
      
       
       const checkboxContainers = form.querySelectorAll('.col-12');
       checkboxContainers.forEach(container => {
         
         if (container.querySelector('.custom-control.custom-checkbox')) {
           container.classList.add('pl-4');
         }
       });
      
      
      const pcInfo = form.querySelector('.lan-search-pc-info');
      if (pcInfo) {
        pcInfo.classList.remove('lan-search-pc-info');
        
        pcInfo.style.minHeight = '';
        pcInfo.style.padding = '';
        pcInfo.style.fontSize = '';
        pcInfo.style.lineHeight = '';
      }
      
      
      const dropdown = form.querySelector('.lan-search-dropdown');
      if (dropdown) {
        dropdown.classList.remove('lan-search-dropdown');
        
        const dropdownToggle = dropdown.querySelector('.lan-search-dropdown-toggle');
        if (dropdownToggle) {
          dropdownToggle.classList.remove('lan-search-dropdown-toggle');
        }
      }
      
      
      const version = form.querySelector('.lan-search-version');
      if (version) {
        version.classList.remove('lan-search-version');
      }
    });
    
    if (pcForms.length > 0) {

    }
  }
  
  
  function addManageButtonsToPCs() {
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      return;
    }

    const pcForms = document.querySelectorAll('form.pc, .lan-search-pc-container');

    pcForms.forEach((form) => {
      if (form.querySelector('.lan-search-manage-btn')) return;

      const unlockButton =
        form.querySelector('[data-type="UnLock"]') ||
        form.querySelector('[data-type="Lock"]') ||
        form.querySelector('.teh_time_ullock, .teh_time_lock, .shutdown, .poweron');

      const manageButton =
        form.querySelector('button[onclick*="StartRemote"]') ||
        form.querySelector('[data-call="StartRemote"]') ||
        form.querySelector('button.connect_pc');

      let uuid = null;
      const onclickAttr = manageButton?.getAttribute('onclick') || '';
      const uuidMatch = onclickAttr.match(/StartRemote\(['"]([^'"]+)['"]\)/);
      if (uuidMatch) {
        uuid = uuidMatch[1];
      } else {
        uuid = getPcFormUuid(form);
      }
      if (!uuid) return;

      const insertTarget =
        unlockButton ||
        form.querySelector('.action.god') ||
        form.querySelector('.pc-telemetry') ||
        form;

      const newUiPcOn = document.documentElement.classList.contains('lgs-new-ui-pc');
      const newManageButton = document.createElement('button');
      newManageButton.type = 'button';
      newManageButton.className = newUiPcOn
        ? 'btn btn-primary lan-search-manage-btn lgs-pc-ico-btn'
        : 'btn btn-primary btn-block lan-search-manage-btn';
      newManageButton.innerHTML = newUiPcOn ? LGS_ICONS.monitor : '<i class="fa fa-desktop"></i> Управлять';
      newManageButton.title = 'Управлять ПК (Landesk)';
      newManageButton.setAttribute('aria-label', 'Управлять');
      newManageButton.setAttribute('data-call', 'StartRemote');
      newManageButton.setAttribute('onclick', `StartRemote("${uuid}")`);

      if (unlockButton && unlockButton.parentNode) {
        unlockButton.parentNode.insertBefore(newManageButton, unlockButton.nextSibling);
      } else if (insertTarget && insertTarget !== form && insertTarget.parentNode) {
        insertTarget.parentNode.insertBefore(newManageButton, insertTarget);
      } else {
        form.appendChild(newManageButton);
      }
    });
  }
  
  function initPCStyles() {
    if (!shouldAutoActivate()) return;
    
    
    let processingStyles = false;
    
    function processStyles() {
      if (processingStyles) return;
      processingStyles = true;
      
      getPCStylesSetting(function(stylesEnabled) {
        const newUiPcOn = document.documentElement.classList.contains('lgs-new-ui-pc');

        // сетка Нового UI сама раскладывает панель ПК — старый style_pc не трогаем
        if (newUiPcOn) {
          removePCStyles();
          prepareNewUiPcMap();
          processingStyles = false;
          return;
        }

        if (stylesEnabled) {
          injectPCStyles();
          applyPCStyles();
        } else {
          removePCStyles();
          removePCStylesFromCards();
        }
        processingStyles = false;
      });
    }
    
     
     processStyles();
     
     
     document.addEventListener('click', function(e) {
       if (e.target.closest('.lan-search-dropdown')) return;

       document.querySelectorAll('.lan-search-dropdown .dropdown-menu.show').forEach((menu) => {
         menu.classList.remove('show');
         menu.style.removeProperty('display');
         menu.style.removeProperty('transform');
         const dropdown = menu.closest('.lan-search-dropdown');
         if (dropdown) dropdown.classList.remove('menu-open');
       });
     });
     
     
    let observerTimeout;
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          
          const hasNewPCCards = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === 1 && (
              node.classList?.contains('pc') ||
              node.querySelector?.('form.pc')
            );
          });
          
          if (hasNewPCCards) {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
              processStyles();
              addManageButtonsToPCs();
            }, 500);
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.pcStyles) {
          clearPCStylesCache();
          processStyles();
        }
      });
    }
  }
  
  
  window.lanSearchSyncPCStyles = function() {
    clearPCStylesCache();
    getPCStylesSetting(function(enabled) {
      if (enabled) {
        injectPCStyles();
        applyPCStyles();
      } else {
        removePCStyles();
        removePCStylesFromCards();
      }
    });
  };

  function isAllClubsPcPage() {
    return (window.location.pathname || '').includes('/all_clubs_pc/');
  }

  function readLocalNewUiFlags() {
    let newUi = true;
    let newUiAllClubsPc = true;
    try {
      const ui = localStorage.getItem('lanSearchNewUi');
      newUi = ui === null ? true : ui === 'true';
      const pc = localStorage.getItem('lanSearchNewUiAllClubsPc');
      newUiAllClubsPc = pc === null ? newUi : pc === 'true';
    } catch (_) {}
    return { newUi, newUiAllClubsPc };
  }

  function writeLocalNewUiFlags(settings) {
    try {
      localStorage.setItem('lanSearchNewUi', (!!settings.newUi).toString());
      localStorage.setItem('lanSearchNewUiAllClubsPc', (!!settings.newUiAllClubsPc).toString());
    } catch (_) {}
  }

  function getNewUiSetting(callback) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['newUi', 'newUiAllClubsPc'], function(result) {
          if (chrome.runtime.lastError) {
            callback(readLocalNewUiFlags());
            return;
          }
          const newUi = result && result.newUi === undefined ? true : !!(result && result.newUi);
          const newUiAllClubsPc = result && result.newUiAllClubsPc === undefined
            ? newUi
            : !!(result && result.newUiAllClubsPc);
          const settings = { newUi, newUiAllClubsPc };
          writeLocalNewUiFlags(settings);
          if (result && (result.newUi === undefined || result.newUiAllClubsPc === undefined)) {
            try {
              chrome.storage.sync.set({
                newUi: settings.newUi,
                newUiAllClubsPc: settings.newUiAllClubsPc
              });
            } catch (_) {}
          }
          callback(settings);
        });
        return;
      }
    } catch (_) {}
    callback(readLocalNewUiFlags());
  }

  function iconifyPcCardToolbar(form) {
    if (!form) return;

    const box = form.querySelector(':scope > div.mb-3, :scope > div.border, :scope > div');
    if (!box) return;

    let toolbar = form.querySelector('.lgs-pc-actions');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'lgs-pc-actions';
    }

    const ensureRow = (cls) => {
      let row = toolbar.querySelector('.' + cls);
      if (!row) {
        row = document.createElement('div');
        row.className = cls;
      }
      return row;
    };

    const powerRow = ensureRow('lgs-pc-actions-power');
    const opsRow = ensureRow('lgs-pc-actions-ops');

    const placeIcoBtn = (btn, spec) => {
      if (!btn || btn.closest('.dropdown-menu')) return;
      btn.classList.remove('btn-block', 'col-12', 'text-truncate', 'mb-1', 'w-100', 'btn-group', 'lgs-pc-text-btn');
      btn.classList.add('lgs-pc-ico-btn');
      btn.title = spec.title;
      btn.setAttribute('aria-label', spec.title);
      if (spec.kind) btn.setAttribute('data-lgs-kind', spec.kind);
      else btn.removeAttribute('data-lgs-kind');
      if (!btn.querySelector('.lgs-ico')) {
        btn.innerHTML = LGS_ICONS[spec.icon] || '';
      }
      if (!spec.row.contains(btn)) spec.row.appendChild(btn);
    };

    // всё SVG: питание / управлять + тех / блок
    const specs = [
      { sel: '.session_stop', icon: 'reset', title: 'Сброс', row: powerRow },
      { sel: '.shutdown, [data-type="Shutdown"]', icon: 'power', title: 'Выключить', row: powerRow },
      { sel: '.poweron, [data-type="Poweron"]', icon: 'powerOn', title: 'Включить', row: powerRow },
      { sel: '.teh_time_ullock, [data-type="startTehTime"]', icon: 'wrench', title: 'Тех.старт', kind: 'tech-start', row: opsRow },
      { sel: '.teh_time_lock, [data-type="stopTehTime"]', icon: 'stop', title: 'Тех.стоп', kind: 'tech-stop', row: opsRow },
      // ПК: Lock/UnLock; ТВ/реле (name=rele_type): LockPS/UnLockPS
      { sel: '[data-type="Lock"], [data-type="LockPS"]', icon: 'lock', title: 'Заблокировать', kind: 'lock', row: opsRow },
      { sel: '[data-type="UnLock"], [data-type="UnLockPS"]', icon: 'unlock', title: 'Разблокировать', kind: 'unlock', row: opsRow }
    ];

    specs.forEach((spec) => placeIcoBtn(form.querySelector(spec.sel), spec));

    // Управлять: наша кнопка и/или landesk-ссылка connect_pc (Admin PC и т.п.)
    const manageSpec = { icon: 'monitor', title: 'Управлять', row: powerRow };
    const manageCandidates = [...form.querySelectorAll('.lan-search-manage-btn, a.connect_pc, .connect_pc')]
      .filter((el) => !el.closest('.dropdown-menu'));
    if (manageCandidates.length) {
      placeIcoBtn(manageCandidates[0], manageSpec);
      manageCandidates.slice(1).forEach((el) => {
        el.classList.add('lgs-pc-row-empty');
        el.style.display = 'none';
      });
    }

    const rows = [powerRow, opsRow].filter((row) => row.childElementCount);
    if (rows.length) {
      if (toolbar.querySelector('.lgs-pc-actions-power') !== powerRow || toolbar.querySelector('.lgs-pc-actions-ops') !== opsRow) {
        toolbar.replaceChildren(...rows);
      }

      if (!toolbar.isConnected) {
        const status = box.querySelector('[data-type="status"]');
        const anchorRow = status?.closest('.row') || box.querySelector('.pc_name')?.closest('.row');
        if (anchorRow && anchorRow.parentNode === box) {
          anchorRow.insertAdjacentElement('afterend', toolbar);
        } else {
          box.appendChild(toolbar);
        }
      }
    }

    // статус-строка даже если кнопок нет (Admin PC)
    syncNewUiPcInfoRows(form, box);

    form.dataset.lgsIcoToolbar = '1';
  }

  function shortenPcStatus(text) {
    const t = (text || '').trim();
    const map = {
      'Разблокирован': 'Разблок',
      'Заблокирован': 'Блок',
      'Свободен': 'Свободен',
      'Занят': 'Занят',
      'Тех.режим': 'Тех',
      'Тех режим': 'Тех',
      'Тех. время': 'Тех',
      'Тех.время': 'Тех',
      'Тех время': 'Тех',
      'Соединение': '…',
      'Offline': 'Offline',
      'Оффлайн': 'Оффлайн'
    };
    return map[t] || t;
  }

  function syncNewUiStatusLine(form) {
    const status = form.querySelector('[data-type="status"]');
    if (!status) return;

    status.classList.add('lgs-pc-status-src');
    let line = form.querySelector('.lgs-pc-status-line');
    if (!line) {
      line = document.createElement('div');
      line.className = 'lgs-pc-status-line';
      status.insertAdjacentElement('afterend', line);
    }

    // переносим цветовой класс статуса на строку
    line.className = 'lgs-pc-status-line';
    ['bg-success', 'bg-warning', 'bg-danger', 'bg-secondary', 'bg-info', 'bg-primary', 'bg-dark'].forEach((c) => {
      if (status.classList.contains(c)) line.classList.add(c);
    });

    const raw = (status.textContent || '').trim();
    const remain = (form.querySelector('.remain')?.textContent || '').trim();
    const timeLock = (form.querySelector('.timeLock')?.textContent || '').trim();
    const fio = (form.querySelector('.fio, .text.fio')?.textContent || '').replace(/\u00a0/g, ' ').trim();

    let text = shortenPcStatus(raw);
    if (remain) text += ' · ' + remain;
    line.textContent = text;
    line.title = [raw, remain, timeLock ? 'до ' + timeLock : '', fio].filter(Boolean).join(' · ');
  }

  function syncNewUiPcInfoRows(form, box) {
    box = box || form?.querySelector(':scope > div.mb-3, :scope > div.border, :scope > div');
    if (!box) return;

    syncNewUiStatusLine(form);

    box.querySelectorAll(':scope > .row').forEach((row) => {
      row.classList.remove('lgs-pc-row-empty');
      if (row.querySelector('.dropdown-menu, .pc-dropdow, .dropdow, .pc_name, [data-type="status"], .lgs-pc-actions, .lgs-pc-status-line')) {
        return;
      }

      // время ушло в статус-строку — pc_info всегда скрыт
      if (row.classList.contains('pc_info') || row.querySelector('.remain, .timeLock, .locker')) {
        row.style.minHeight = '';
        row.style.removeProperty('min-height');
        row.classList.add('lgs-pc-row-empty');
        return;
      }

      const fio = row.querySelector('.fio, .text.fio, .text-body.fio');
      if (fio) {
        // ФИО в title статус-строки; ряд не резервируем — ровная высота
        row.classList.add('lgs-pc-row-empty');
        return;
      }

      // чекбоксы / комментарии — только если включены соответствующие галочки
      const hasComment = row.querySelector('.comment_input, input[id^="comment_"]');
      const hasCheckbox = row.querySelector('.custom-checkbox');
      if (hasComment || hasCheckbox) {
        const hideCb = document.body.classList.contains('lan-search-hide-checkboxes');
        const hideCm = document.body.classList.contains('lan-search-hide-comments');
        if ((hasComment && hideCm) || (hasCheckbox && hideCb)) {
          if ((!hasComment || hideCm) && (!hasCheckbox || hideCb)) {
            row.classList.add('lgs-pc-row-empty');
          }
        }
        return;
      }
      // пустые spacer-ряды сайта (min-height: 45px)
      const leftover = row.querySelectorAll(
        'button:not(.lgs-pc-ico-btn):not(.pc-telemetry), .btn:not(.lgs-pc-ico-btn):not(.connect_pc), a.btn:not(.connect_pc), a.connect_pc:not(.lgs-pc-ico-btn)'
      );
      if (!leftover.length && !row.querySelector('.pc-telemetry')) {
        row.style.minHeight = '';
        row.style.removeProperty('min-height');
        row.classList.add('lgs-pc-row-empty');
      }
    });

    // прячем connect_pc вне тулбара (дубль «Управлять»)
    form.querySelectorAll('a.connect_pc, .connect_pc').forEach((el) => {
      if (el.classList.contains('lgs-pc-ico-btn') || el.closest('.lgs-pc-actions')) return;
      el.style.display = 'none';
    });

    const telemetry = form.querySelector('.pc-telemetry');
    if (telemetry) {
      telemetry.classList.add('lgs-pc-telemetry');
      if (telemetry.parentNode !== box || box.lastElementChild !== telemetry) {
        box.appendChild(telemetry);
      }
    }
  }

  function pairPcPowerButtons(form) {
    if (!form) return;

    // только Включить + Выключить (не «Сброс»)
    const off = form.querySelector('button.shutdown, .shutdown[data-type], [data-type="Shutdown"]');
    const on = form.querySelector('button.poweron, .poweron[data-type], [data-type="Poweron"]');

    let pair = form.querySelector(':scope > .lgs-pc-power-pair, :scope .lgs-pc-power-pair');

    // вытащить Сброс / чужие кнопки из пары
    if (pair) {
      [...pair.children].forEach((el) => {
        if (el === off || el === on) return;
        if (pair.parentNode) pair.parentNode.insertBefore(el, pair);
      });
    }

    if (!off || !on) {
      if (pair) {
        while (pair.firstChild && pair.parentNode) {
          pair.parentNode.insertBefore(pair.firstChild, pair);
        }
        pair.remove();
      }
      return;
    }

    if (!pair) {
      pair = document.createElement('div');
      pair.className = 'lgs-pc-power-pair';
    }

    const offGroup = off.closest('.btn-group');
    const onGroup = on.closest('.btn-group');
    const offRow = off.closest('.row');
    const onRow = on.closest('.row');
    const box = form.querySelector(':scope > div.mb-3, :scope > div.border, :scope > div') || form;
    const anchor = (onGroup && onGroup.parentNode === box && onGroup)
      || (offGroup && offGroup.parentNode === box && offGroup)
      || on.parentElement;

    // вынуть из bootstrap btn-group — иначе margin-left:-1px и кривые радиусы
    [on, off].forEach((btn) => {
      btn.classList.remove('col-12', 'btn-block', 'w-100', 'btn-group');
      btn.style.marginLeft = '';
    });

    if (!(pair.contains(on) && pair.contains(off) && pair.parentNode)) {
      const insertAt = (anchor && anchor.parentNode) ? anchor : box;
      if (insertAt && insertAt.parentNode && anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(pair, anchor);
      } else if (box) {
        box.appendChild(pair);
      }
      pair.appendChild(on);
      pair.appendChild(off);
    }

    [offGroup, onGroup].forEach((group) => {
      if (group && group !== pair && !group.querySelector('button, a, .btn')) group.remove();
    });
    [offRow, onRow].forEach((row) => {
      if (row && row !== pair.parentElement && !row.querySelector('button, a, .btn, input, .remain, .timeLock, .fio, .lgs-pc-power-pair')) {
        row.remove();
      }
    });
  }

  function enhancePcCardChrome() {
    if (!isAllClubsPcPage()) return;
    if (!document.documentElement.classList.contains('lgs-new-ui')) return;

    // меню ПК — как в сетке Нового UI (свой toggle, без bootstrap clip)
    document.querySelectorAll('#layoutStatusPC form.pc .pc-dropdow, #layoutStatusPC form.pc .dropdow').forEach((dropdown) => {
      wirePcCardDropdown(dropdown, { restyleToggle: false });
    });

    // сетка ПК — раскладка в .lgs-pc-actions, пары разбираем
    if (document.documentElement.classList.contains('lgs-new-ui-pc')) {
      document.querySelectorAll('#layoutStatusPC form.pc .lgs-pc-power-pair').forEach((pair) => {
        while (pair.firstChild && pair.parentNode) {
          pair.parentNode.insertBefore(pair.firstChild, pair);
        }
        pair.remove();
      });
      return;
    }

    // Новый UI без сетки — flatten + пара Вкл/Выкл
    document.querySelectorAll('#layoutStatusPC form.pc').forEach(pairPcPowerButtons);
  }

  function enhanceSelectActionsPanel() {
    const panel = document.querySelector('.select-actions');
    if (!panel) return;

    const visible = panel.style.display && panel.style.display !== 'none';
    panel.classList.toggle('lgs-select-open', !!visible);

    const filterIds = new Set([
      'cancelSelect', 'selectAllPC', 'selectAllFreePC', 'selectAllInTech', 'selectAllInUnlock'
    ]);

    // уже размечали, но фильтры ещё лежат снаружи обёрток — доберём
    if (panel.dataset.lgsSelectReady === '1') {
      const filters = panel.querySelector(':scope > .lgs-select-filters') || (() => {
        const el = document.createElement('div');
        el.className = 'lgs-select-filters';
        panel.insertBefore(el, panel.firstChild);
        return el;
      })();
      const commands = panel.querySelector(':scope > .lgs-select-commands');
      [...panel.children].forEach((child) => {
        if (child === filters || child === commands) return;
        if (child.tagName === 'DIV' && (child.getAttribute('style') || '').includes('clear')) {
          child.remove();
          return;
        }
        if (child.matches('a.btn, button.btn, .btn') && filterIds.has(child.id)) {
          filters.appendChild(child);
        }
      });
      return;
    }

    const filters = document.createElement('div');
    filters.className = 'lgs-select-filters';
    const commands = document.createElement('div');
    commands.className = 'lgs-select-commands';

    [...panel.children].forEach((child) => {
      if (child.tagName === 'DIV' && (child.getAttribute('style') || '').includes('clear')) {
        child.remove();
        return;
      }
      // только обёртка .mt-2.mb-2 — у самих ссылок тоже бывает mb-2, их нельзя remove()
      if (child.tagName === 'DIV' && (child.classList.contains('mt-2') || child.classList.contains('mb-2'))) {
        [...child.children].forEach((btn) => commands.appendChild(btn));
        child.remove();
        return;
      }
      if (child.matches('a.btn, button.btn, .btn')) {
        if (child.classList.contains('select-action')) {
          commands.appendChild(child);
        } else if (filterIds.has(child.id) || !child.classList.contains('select-action')) {
          filters.appendChild(child);
        }
        return;
      }
    });

    panel.querySelectorAll(':scope > .select-action, :scope > button.select-action, :scope > a.select-action').forEach((btn) => {
      commands.appendChild(btn);
    });

    if (filters.childElementCount) panel.appendChild(filters);
    if (commands.childElementCount) panel.appendChild(commands);
    panel.dataset.lgsSelectReady = '1';
  }

  function enhanceAllClubsToolbar() {
    if (!isAllClubsPcPage()) return;
    if (!document.documentElement.classList.contains('lgs-new-ui')) return;

    enhancePcCardChrome();
    enhanceSelectActionsPanel();

    const clubs = document.querySelector('.js-all-clubs-pc-clubs');
    if (!clubs) return;

    // клубы → внутренний GlassTabsBar (не тот же элемент что bootstrap col)
    if (!clubs.querySelector(':scope > .lgs-clubs-tabs')) {
      const track = document.createElement('div');
      track.className = 'lgs-clubs-tabs';
      [...clubs.children].forEach((child) => {
        if (child.matches('a.btn, button.btn, a.btn-outline-success, .btn')) {
          track.appendChild(child);
        }
      });
      if (track.childElementCount) clubs.insertBefore(track, clubs.firstChild);
    }

    const row = clubs.parentElement;
    const actionsCol = row && [...row.children].find((c) => c !== clubs);
    if (actionsCol && !actionsCol.querySelector(':scope > .lgs-clubs-actions')) {
      const bar = document.createElement('div');
      bar.className = 'lgs-clubs-actions';
      [...actionsCol.children].forEach((child) => {
        if (child.classList.contains('select-actions')) return;
        if (child.id === 'massive-pc-selection-panel-allclubs') return;
        if (child.classList.contains('lgs-clubs-actions')) return;
        bar.appendChild(child);
      });
      if (bar.childElementCount) actionsCol.insertBefore(bar, actionsCol.firstChild);
    }
  }

  function prepareNewUiPcMap() {
    if (!window.location.pathname.includes('/all_clubs_pc/')) return;
    enhanceAllClubsToolbar();
    if (!document.documentElement.classList.contains('lgs-new-ui-pc')) return;

    const layout = document.getElementById('layoutStatusPC');
    if (layout) {
      layout.classList.add('lgs-pc-map');
    }

    // Новый UI заменяет сломанный style_pc absolute/float-хак
    removePCStyles();
    document.querySelectorAll('form.pc.lan-search-pc-card').forEach((form) => {
      form.classList.remove('lan-search-pc-card');
    });

    document.querySelectorAll('#layoutStatusPC > .float-left').forEach((wrap) => {
      wrap.style.maxWidth = '';
      wrap.style.width = '';
    });

    addManageButtonsToPCs();

    document.querySelectorAll('#layoutStatusPC form.pc').forEach((form) => {
      if (form.dataset.lgsIcoToolbar === '1' && form.querySelector('.lgs-pc-actions')) {
        syncNewUiPcInfoRows(form);
      } else {
        iconifyPcCardToolbar(form);
      }
    });
  }

  function applyNewUiClass(settings) {
    const flags = settings && typeof settings === 'object'
      ? settings
      : { newUi: !!settings, newUiAllClubsPc: !!settings };

    document.documentElement.classList.toggle('lgs-new-ui', !!flags.newUi);

    const pcGridOn = isAllClubsPcPage() && !!flags.newUiAllClubsPc;
    document.documentElement.classList.toggle('lgs-new-ui-pc', pcGridOn);

    if (flags.newUi && isAllClubsPcPage()) {
      enhanceAllClubsToolbar();
    }

    if (pcGridOn) {
      prepareNewUiPcMap();
      return;
    }

    const layout = document.getElementById('layoutStatusPC');
    if (layout) layout.classList.remove('lgs-pc-map');
    // сетка выкл — вернуть старые стили ПК, если они включены
    if (isAllClubsPcPage()) {
      getPCStylesSetting(function(pcEnabled) {
        if (pcEnabled) {
          injectPCStyles();
          applyPCStyles();
        }
      });
    }
  }

  function initNewUi() {
    // сразу из localStorage — без ожидания chrome.storage (иначе «доезжает»)
    applyNewUiClass(readLocalNewUiFlags());

    getNewUiSetting(applyNewUiClass);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace !== 'sync') return;
        if (!changes.newUi && !changes.newUiAllClubsPc) return;
        getNewUiSetting(applyNewUiClass);
      });
    }

    // тулбар клубов — как только появится в DOM
    if (!window.__lgsClubsToolbarObserver && isAllClubsPcPage()) {
      const tryEnhance = () => {
        if (!document.documentElement.classList.contains('lgs-new-ui')) return;
        if (document.querySelector('.js-all-clubs-pc-clubs')) enhanceAllClubsToolbar();
      };
      tryEnhance();
      window.__lgsClubsToolbarObserver = new MutationObserver(tryEnhance);
      window.__lgsClubsToolbarObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // карточки ПК часто дорисовываются после загрузки — ловим сразу
    if (!window.__lgsNewUiPcObserver) {
      let t = 0;
      const schedule = () => {
        if (!document.documentElement.classList.contains('lgs-new-ui-pc')) return;
        clearTimeout(t);
        t = setTimeout(prepareNewUiPcMap, 60);
      };
      window.__lgsNewUiPcObserver = new MutationObserver(schedule);
      const bind = () => {
        const root = document.getElementById('layoutStatusPC');
        if (root) {
          window.__lgsNewUiPcObserver.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class', 'style']
          });
          schedule();
          return true;
        }
        return false;
      };
      if (!bind()) {
        const boot = new MutationObserver(() => {
          if (bind()) boot.disconnect();
        });
        boot.observe(document.documentElement, { childList: true, subtree: true });
      }
    }
  }

  window.lanSearchSyncNewUi = function() {
    getNewUiSetting(applyNewUiClass);
  };


  function initWebSocketPCData() {
    if (!window.location.pathname.includes('/freenas_wrap/')) {
      return;
    }
    
    


    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        if (response.url.includes('/wss/') || response.url.includes('websocket')) {
        }
        return response;
      });
    };
    
    // Перехватываем XMLHttpRequest для получения WebSocket данных
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('/wss/') || url.includes('websocket')) {
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
    

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (text && text.includes('UUID') && text.includes('isLock')) {
                try {
                  const data = JSON.parse(text);
                  window.lanSearchProcessPCData(data);
                } catch (e) {
                }
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    

    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);
      

      const originalOnMessage = ws.onmessage;
      ws.onmessage = function(event) {

        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
        

        try {
          const data = JSON.parse(event.data);
          window.lanSearchProcessPCData(data);
        } catch (e) {

        }
      };
      
      return ws;
    };
    

    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OriginalWebSocket.prototype,
      writable: false
    });
    


    setTimeout(() => {
      

      let foundWebSockets = 0;
      
      for (let prop in window) {
        try {
          const obj = window[prop];
          if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'WebSocket') {
            foundWebSockets++;
            
            if (obj.readyState === WebSocket.OPEN || obj.readyState === WebSocket.CONNECTING) {

              const originalOnMessage = obj.onmessage;
              obj.onmessage = function(event) {
                if (originalOnMessage) {
                  originalOnMessage.call(this, event);
                }
                try {
                  const data = JSON.parse(event.data);
                  window.lanSearchProcessPCData(data);
                } catch (e) {
                }
              };
            }
          }
        } catch (e) {

        }
      }
      
      

  const possibleWebSocketLocations = [
    'window.ws',
    'window.websocket', 
    'window.socket',
    'window.connection',
    'window.wsConnection',
    'window.websocketConnection',
    'window.socketConnection',
    'window.wsInstance',
    'window.websocketInstance',
    'window.socketInstance',
    'window._ws',
    'window._websocket',
    'window._socket',
    'window._connection',
    'window.ws_',
    'window.websocket_',
    'window.socket_',
    'window.connection_',
    'window.wsConn',
    'window.websocketConn',
    'window.socketConn',
    'window.wsInst',
    'window.websocketInst',
    'window.socketInst'
  ];
  
  possibleWebSocketLocations.forEach(location => {
    try {
      const value = eval(location);
      if (value && value.constructor && value.constructor.name === 'WebSocket') {
      }
    } catch (e) {

    }
  });
  

  const searchObjects = [
    'window.app',
    'window.application',
    'window.client',
    'window.connection',
    'window.connector',
    'window.manager',
    'window.service',
    'window.api',
    'window.network',
    'window.communication',
    'window.realtime',
    'window.live',
    'window.stream',
    'window.channel',
    'window.session',
    'window.user',
    'window.player',
    'window.game',
    'window.lobby',
    'window.room'
  ];
  
  searchObjects.forEach(objPath => {
    try {
      const obj = eval(objPath);
      if (obj && typeof obj === 'object') {
        for (let key in obj) {
          try {
            const value = obj[key];
            if (value && value.constructor && value.constructor.name === 'WebSocket') {
            }
          } catch (e) {

          }
        }
      }
    } catch (e) {

    }
  });
      

      if (!EventTarget.prototype._lanSearchWebSocketAddEventListenerIntercepted) {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'message' && this.constructor && this.constructor.name === 'WebSocket') {
      const wrappedListener = function(event) {
        

        let dataToProcess = null;
        
        if (typeof event.data === 'string') {
          try {
            dataToProcess = JSON.parse(event.data);
          } catch (e) {
          }
        } else if (typeof event.data === 'object' && event.data !== null) {

          dataToProcess = event.data;
        }
        
        if (dataToProcess && dataToProcess.UUID && (dataToProcess.isLock !== undefined || dataToProcess.tehnicalTime !== undefined || dataToProcess.status_pc)) {
          if (typeof window.lanSearchProcessPCData === 'function') {
            window.lanSearchProcessPCData(dataToProcess);
          }
        }
        
        return listener.call(this, event);
      };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
        };
        EventTarget.prototype._lanSearchWebSocketAddEventListenerIntercepted = true;
      }
    }, 1000);
    
  }
  
  
  

window.lanSearchProcessPCData = function processPCData(data) {
  

  if (!window.location.pathname.includes('/freenas_wrap/') && !window.location.pathname.includes('/pc_tasks/')) {
    return;
  }
  
    
    if (!data.UUID) {
      return;
    }
    

    const dataKey = `${data.UUID}_${data.isLock}_${data.guest_id}_${data.tehnicalTime}_${data.ManualUnlock}_${data.status_pc}`;
    if (window._lanSearchProcessedData && window._lanSearchProcessedData[dataKey]) {
      return;
    }
    

    if (!window._lanSearchProcessedData) {
      window._lanSearchProcessedData = {};
    }
    window._lanSearchProcessedData[dataKey] = true;
    
    
    

    const uuidCell = document.querySelector(`td[data-uuid="${data.UUID}"]`);
    if (uuidCell) {
      const row = uuidCell.closest('tr');
      if (row) {
        return processPCDataWithRow(data, row);
      }
    }
    

    const row = document.querySelector(`tr:has(td[data-uuid="${data.UUID}"])`);
    if (row) {
      return processPCDataWithRow(data, row);
    }
    
    

    const allUuidCells = document.querySelectorAll('td[data-uuid]');
    

    const partialMatch = Array.from(allUuidCells).find(td => 
      td.getAttribute('data-uuid') && td.getAttribute('data-uuid').includes(data.UUID.substring(0, 8))
    );
    if (partialMatch) {
      const row = partialMatch.closest('tr');
      if (row) {
        return processPCDataWithRow(data, row);
      }
    }
    
  }
  
  function processPCDataWithRow(data, row) {
    

    let statusText = '';
    let statusClass = '';
    
    if (data.status_pc === 'offline') {
      statusText = 'Офлайн';
      statusClass = 'bg-dark-light';
    } else if (data.tehnicalTime) {
      statusText = 'Тех.режим';
      statusClass = 'bg-info';
    } else if (data.ManualUnlock) {
      statusText = 'Руч.Разлок';
      statusClass = 'bg-warning';
    } else if (data.isLock && data.guest_id === 0) {
      statusText = 'Свободен';
      statusClass = 'bg-success';
    } else if (data.guest_id > 0) {
      statusText = 'Занят';
      statusClass = 'bg-warning';
    } else {
      statusText = 'Неизвестно';
    }
    
    

    const sortingCell = row.querySelector('td.sorting_1');
    if (sortingCell) {
      sortingCell.textContent = statusText;
    } else {
    }
    

    row.className = row.className.replace(/bg-\w+/g, '').trim() + ' ' + statusClass;
    
  }
  
  function updatePCStatusInTable(uuid, status) {

    const row = document.querySelector(`tr[id^="pcID-"] td[data-uuid="${uuid}"]`);
    if (!row) return;
    
    const tr = row.closest('tr');
    if (!tr) return;
    

    const statusCell = tr.querySelector('td.sorting_1');
    if (statusCell) {
      let statusText = '';
      let statusClass = '';
      
      switch (status) {
        case 'online':
          statusText = 'Онлайн';
          statusClass = 'bg-success';
          break;
        case 'offline':
          statusText = 'Офлайн';
          statusClass = 'bg-dark-light';
          break;
        case 'technical':
          statusText = 'Тех.режим';
          statusClass = 'bg-info';
          break;
        case 'manual_unlock':
          statusText = 'Руч.Разлок';
          statusClass = 'bg-warning';
          break;
        default:
          statusText = status;
      }
      
      statusCell.textContent = statusText;
      

      tr.className = tr.className.replace(/bg-\w+/g, '');
      if (statusClass) {
        tr.classList.add(statusClass);
      }
    }
  }
  
  function updatePCDetailedInfo(data) {
    

    const row = document.querySelector(`tr[id^="pcID-"] td[data-uuid="${data.UUID}"]`);
    if (!row) {
      return;
    }
    
    const tr = row.closest('tr');
    if (!tr) {
      return;
    }
    
    

    const statusCell = tr.querySelector('td.sorting_1');
    if (statusCell) {
      let statusText = '';
      let statusClass = '';
      

      if (data.isLock) {
        if (data.ManualUnlock) {
          statusText = 'Ручная разблокировка';
          statusClass = 'bg-info';
        } else {
          statusText = 'Заблокирован';
          statusClass = 'bg-warning';
        }
      } else {
        statusText = 'Разблокирован';
        statusClass = 'bg-success';
      }
      
      statusCell.textContent = statusText;
      

      tr.className = tr.className.replace(/bg-\w+/g, '');
      if (statusClass) {
        tr.classList.add(statusClass);
      }
    }
    

    if (data.tehnicalTime !== undefined) {
      
      const statusColumn = tr.querySelector('td:nth-child(3)');
      if (statusColumn) {

        const oldTechTime = statusColumn.querySelector('.tech-time-info');
        if (oldTechTime) {
          oldTechTime.remove();
        }
        
        const techTimeInfo = document.createElement('div');
        techTimeInfo.style.cssText = 'font-size: 10px; color: #666; margin-top: 2px;';
        techTimeInfo.textContent = `Тех.режим: ${data.tehnicalTime ? 'ВКЛ' : 'ВЫКЛ'}`;
        techTimeInfo.className = 'tech-time-info';
        statusColumn.appendChild(techTimeInfo);
        
      }
    }
    

    if (data.ManualUnlock !== undefined) {
      
      const statusColumn = tr.querySelector('td:nth-child(3)');
      if (statusColumn) {

        const oldManualUnlock = statusColumn.querySelector('.manual-unlock-info');
        if (oldManualUnlock) {
          oldManualUnlock.remove();
        }
        
        if (data.ManualUnlock) {
          const manualUnlockInfo = document.createElement('div');
          manualUnlockInfo.style.cssText = 'font-size: 10px; color: #007bff; margin-top: 2px; font-weight: bold;';
          manualUnlockInfo.textContent = 'Ручная разблокировка';
          manualUnlockInfo.className = 'manual-unlock-info';
          statusColumn.appendChild(manualUnlockInfo);
          
        }
      }
    }
  }

  if (shouldAutoActivate()) {
    

    getModalBypassSetting(function(enabled) {
    });
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initModalBypass();
        initPCSelection();
        initMassivePCSelection();
        initNewUi();
        initPCStyles();
        initTableOptimization();
        initHideCheckboxes();
        initHideComments();
        initHideRemoteDownload();
        initWebSocketPCData();

        handleHideStylesOnUrlChange();

        addManageButtonsToPCs();
        setTimeout(addManageButtonsToPCs, 500);
        setTimeout(addManageButtonsToPCs, 1500);
      });
    } else {
      initModalBypass();
      initPCSelection();
      initMassivePCSelection();
      initNewUi();
      initPCStyles();
      initTableOptimization();
      initHideCheckboxes();
      initHideComments();
      initHideRemoteDownload();
      initWebSocketPCData();

      handleHideStylesOnUrlChange();

      addManageButtonsToPCs();
      setTimeout(addManageButtonsToPCs, 500);
      setTimeout(addManageButtonsToPCs, 1500);
    }
  }

})(); 


let websocketCheckInterval = null;

function startWebSocketMonitoring() {

  if (!window.location.pathname.includes('/freenas_wrap/') && !window.location.pathname.includes('/pc_tasks/')) {
    return;
  }
  
  

  checkWebSocketConnections();
}

function checkWebSocketConnections() {

  let foundConnections = 0;
  
  

  const searchInObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    try {

      if (obj.constructor && obj.constructor.name === 'WebSocket') {
        foundConnections++;
        
        if (obj.readyState === WebSocket.OPEN || obj.readyState === WebSocket.CONNECTING) {
          

          if (!obj._lanSearchIntercepted) {
            const originalOnMessage = obj.onmessage;
            obj.onmessage = function(event) {
              if (originalOnMessage) {
                originalOnMessage.call(this, event);
              }
              try {
                const data = JSON.parse(event.data);
                if (data.UUID && (data.isLock !== undefined || data.tehnicalTime !== undefined || data.status_pc)) {
                  if (typeof window.lanSearchProcessPCData === 'function') {
                    window.lanSearchProcessPCData(data);
                  }
                }
              } catch (e) {
              }
            };
            obj._lanSearchIntercepted = true;
          }
        } else {
        }
      }
      

      if (path.split('.').length < 3) {
        for (let key in obj) {
          try {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
              searchInObject(obj[key], path ? `${path}.${key}` : key);
            }
          } catch (e) {

          }
        }
      }
    } catch (e) {

    }
  };
  

  searchInObject(window, 'window');
  

  searchInObject(document, 'document');
  

  try {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
      try {
        if (iframe.contentWindow) {
          searchInObject(iframe.contentWindow, `iframe[${index}]`);
        }
      } catch (e) {

      }
    });
  } catch (e) {

  }
  

  const globalObjects = ['navigator', 'screen', 'location', 'history', 'localStorage', 'sessionStorage'];
  globalObjects.forEach(objName => {
    try {
      if (window[objName]) {
        searchInObject(window[objName], objName);
      }
    } catch (e) {

    }
  });
  

  if (!window._lanSearchWebSocketIntercepted) {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      

        if (url.includes('wss://')) {
        }
      
      const ws = new OriginalWebSocket(url, protocols);
      

      const originalOnMessage = ws.onmessage;
      const originalOnOpen = ws.onopen;
      const originalOnClose = ws.onclose;
      const originalOnError = ws.onerror;
      
      ws.onmessage = function(event) {
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
        try {
          const data = JSON.parse(event.data);
          if (data.UUID && (data.isLock !== undefined || data.tehnicalTime !== undefined || data.status_pc)) {
            if (typeof window.lanSearchProcessPCData === 'function') {
              window.lanSearchProcessPCData(data);
            }
          }
        } catch (e) {
        }
      };
      
      ws.onopen = function(event) {
        if (originalOnOpen) {
          originalOnOpen.call(this, event);
        }
      };
      
      ws.onclose = function(event) {
        if (originalOnClose) {
          originalOnClose.call(this, event);
        }
      };
      
      ws.onerror = function(event) {
        if (originalOnError) {
          originalOnError.call(this, event);
        }
      };
      
      return ws;
    };
    

    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OriginalWebSocket.prototype,
      writable: false
    });
    
    window._lanSearchWebSocketIntercepted = true;
  }
  
  
  if (foundConnections === 0) {
    

    findAndConnectToWebSocket();
  } else {
  }
}


function findAndConnectToWebSocket() {
  

  if (window._lanSearchConnectionAttempts && window._lanSearchConnectionAttempts > 5) {
    return;
  }
  
  if (!window._lanSearchConnectionAttempts) {
    window._lanSearchConnectionAttempts = 0;
  }
  

  connectToWebSocket();
  window._lanSearchConnectionAttempts++;
}


function connectToWebSocket() {
  try {

    const domain = document.querySelector('meta[name="domain"]')?.getAttribute('content');
    if (!domain) {
      return;
    }
    

    const sessionId = session_id();
    if (!sessionId) {
      return;
    }
    

    const wsUrl = `wss://${domain}/wss/?client_guid=${sessionId}&type_client=browser`;
    

    const OriginalWebSocket = window._lanSearchOriginalWebSocket || window.WebSocket;
    const ws = new OriginalWebSocket(wsUrl);
    
    ws.onopen = function(event) {
      window._lanSearchWebSocket = ws; // Сохраняем соединение
      

      requestAllPCStatus();
    };
    
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        

        if (data.status_pc !== undefined) {
          if (typeof window.lanSearchProcessPCData === 'function') {
            window.lanSearchProcessPCData(data);
          }
          return;
        }
        

        switch (data.command) {
          case "showConfig":
            if (typeof window.lanSearchProcessPCData === 'function') {
              window.lanSearchProcessPCData(data);
            } else {
            }
            break;
        }
        
      } catch (e) {
      }
    };
    
    ws.onclose = function(event) {

      connectToWebSocket();
    };
    
    ws.onerror = function(event) {
      ws.close();
    };
    
  } catch (e) {
  }
}


function session_id() {
  return /SESS\w*ID=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
}


function sendPCCommand(uuid, command = 'showConfig') {
  if (!window._lanSearchWebSocket || window._lanSearchWebSocket.readyState !== WebSocket.OPEN) {
    return false;
  }
  
  const message = {
    client_guid: uuid,
    type: "command_api",
    command: command,
    who_send: session_id(),
    need_return: true
  };
  
  
  try {
    window._lanSearchWebSocket.send(JSON.stringify(message));
    return true;
  } catch (e) {
    return false;
  }
}


function requestAllPCStatus() {
  

  const pcRows = document.querySelectorAll('tr:has(td[data-uuid])');
  

  if (pcRows.length === 0) {
    const allRows = document.querySelectorAll('tr');
    

    allRows.forEach((row, index) => {
      const uuidCell = row.querySelector('td[data-uuid]');
      if (uuidCell) {
      }
    });
  }
  
  let emptyPCs = [];
  
  pcRows.forEach((row, index) => {

      const uuidCell = row.querySelector('td[data-uuid]');
      if (!uuidCell) return;
      
      const uuid = uuidCell.getAttribute('data-uuid');
      if (!uuid) return;
      

      const sortingCell = row.querySelector('td.sorting_1');
      if (sortingCell && sortingCell.textContent.trim() === '') {
        emptyPCs.push({uuid, index});
      } else {
      }
    });
    
    

    emptyPCs.forEach((pc, index) => {
      sendPCCommand(pc.uuid, 'showConfig');
    });
    
    if (emptyPCs.length === 0) {
    } else {
    }
}


function addPCStatusButton() {

  if (document.getElementById('lanSearchPCStatusBtn')) {
    return;
  }
  

  const statusBtn = document.createElement('button');
  statusBtn.id = 'lanSearchPCStatusBtn';
  statusBtn.className = 'btn btn-info mb-3 mr-2';
  statusBtn.innerHTML = '<i class="fa fa-refresh"></i> Запросить состояние ПК';
  statusBtn.title = 'Запросить актуальное состояние всех ПК через WebSocket';
  

  statusBtn.addEventListener('click', function(e) {
    e.preventDefault();
    requestAllPCStatus();

  });
  

  const checkDisksBtn = document.getElementById('checkDisksBtn');
  if (checkDisksBtn) {
    checkDisksBtn.parentNode.insertBefore(statusBtn, checkDisksBtn.nextSibling);
  } else {

    const container = document.querySelector('.container-fluid') || document.body;
    container.insertBefore(statusBtn, container.firstChild);
  }
  
}


window.testPCSearch = function() {
  
  const selectors = [
    'form.pc',
    'tr[data-uuid]',
    'td[data-uuid]',
    '[data-uuid]',
    'tr:has([data-uuid])',
    'tr:has(td[data-uuid])',
    'input[id*="03000200-0400-0500-0006-000700080009"]',
    'input[type="checkbox"][id]'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el, i) => {
        });
      }
    } catch (e) {
    }
  });
};


window.testEmptyPCs = function() {
  

  const selectors = [
    'tr:has(td[data-uuid])',
    'tr[data-uuid]',
    'tr'
  ];
  
  let pcRows = [];
  for (const selector of selectors) {
    try {
      pcRows = document.querySelectorAll(selector);
      if (pcRows.length > 0) break;
    } catch (e) {
    }
  }
  
  let emptyPCs = [];
  let filledPCs = [];
  
  pcRows.forEach((row, index) => {

    const uuidCell = row.querySelector('td[data-uuid]');
    if (!uuidCell) return;
    
    const uuid = uuidCell.getAttribute('data-uuid');
    if (!uuid) return;
    
    const sortingCell = row.querySelector('td.sorting_1');
    if (sortingCell && sortingCell.textContent.trim() === '') {
      emptyPCs.push({uuid, index});
    } else {
      filledPCs.push({uuid, index});
    }
  });
  
  
  return {emptyPCs, filledPCs};
};



if (window.location.pathname.includes('/freenas_wrap/') || window.location.pathname.includes('/pc_tasks/')) {
  

  startWebSocketMonitoring();


  addPCStatusButton();
} else {
} 


function checkWebSocketStatus() {
  if (window._lanSearchWebSocket) {
    const state = window._lanSearchWebSocket.readyState;
    const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return state === WebSocket.OPEN;
  }
  return false;
}


function reconnectWebSocket() {
  if (window._lanSearchWebSocket) {
    window._lanSearchWebSocket.close();
  }
  setTimeout(() => {
    if (typeof window.lanSearchCreateWebSocket === 'function') {
      window.lanSearchCreateWebSocket();
    } else {
    }
  }, 1000);
}


if (window.location.hostname.includes('langame') || window.location.hostname.includes('cls') || window.location.hostname.includes('f5center')) {
  console.log('Lan-Search: Создание WebSocket соединения для домена:', window.location.hostname);
  

  setTimeout(() => {
    if (typeof window.lanSearchCreateWebSocket === 'function') {
      window.lanSearchCreateWebSocket();
    } else {
    }
  }, 1000);
}


window.lanSearchWebSocket = {
  create: window.lanSearchCreateWebSocket,
  check: checkWebSocketStatus,
  reconnect: reconnectWebSocket,
  send: sendPCCommand,
  getSetting: window.lanSearchGetWebSocketSetting,
  clearCache: window.lanSearchClearWebSocketSettingCache
};


if (window.location.hostname.includes('f5center') && !document.getElementById('globalMenuSearchInput')) {
  const path = (window.location.pathname || '').toLowerCase();
  const isAuth = path.includes('/auth') || path.endsWith('auth.php');
  if (!isAuth) {
    console.log('Lan-Search: Повторная инициализация поиска для f5center.com...');
    setTimeout(() => {
      if (typeof window.lanSearchInit === 'function') {
        window.lanSearchInit();
      }
    }, 100);
  }
}


if (window.location.hostname.includes('f5center')) {
  console.log('Lan-Search: Инициализация поиска гостей для f5center.com...');
  setTimeout(() => {
    if (typeof window.lanSearchInitGuestSearch === 'function') {
      window.lanSearchInitGuestSearch();
    } else {
    }
  }, 200);
}


if (window.location.hostname.includes('f5center')) {
  console.log('Lan-Search: Инициализация вкладок и избранных для f5center.com...');
  setTimeout(() => {

    if (typeof initRecentTabsTracking === 'function') {
      initRecentTabsTracking();
    }
    

    if (typeof initFavoritesDragDrop === 'function') {
      initFavoritesDragDrop();
    }
    

    if (window.recentTabsManager) {
      window.recentTabsManager.displayOnMainPage();
    }
  }, 300);
}


if (window.location.hostname.includes('f5center')) {
  console.log('Lan-Search: Инициализация WebSocket для f5center.com...');
  setTimeout(() => {
    if (typeof window.lanSearchCreateWebSocket === 'function') {
      window.lanSearchCreateWebSocket();
    } else {
    }
  }, 500);
} 