
let domainInfoCache = null;
let domainInfoCacheTime = 0;
const DOMAIN_INFO_CACHE_DURATION = 5 * 60 * 1000; // 5 минут

(function () {
  const MENU_ID = "globalMenuAccordion";
  const SEARCH_ID = "globalMenuSearchInput";
  const STYLE_ID = "globalMenuSearchStyles";

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }


  function isSuitableDomain() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('langame') || hostname.includes('cls') || hostname.includes('f5center');
  }


  function setDomainAttribute() {
    if (isSuitableDomain()) {
      document.documentElement.setAttribute('data-lansearch-domain', 'true');
    } else {
      document.documentElement.setAttribute('data-lansearch-domain', 'false');
    }
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
        const savedTheme = localStorage.getItem('lanSearchTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
    
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .gms-container { 
        position: sticky; top: 0; z-index: 100; padding: 8px; 
        background: rgba(255,255,255,0.03); backdrop-filter: blur(6px);
        border-bottom: 1px solid rgba(0,0,0,0.08);
        margin-bottom: 8px;
      }
      .gms-input { 
        width: 100%; padding: 8px 12px; border-radius: 10px; 
        border: 1px solid rgba(0,0,0,0.2); outline: none;
        font-size: 14px; line-height: 20px;
        background: rgba(255,255,255,0.9);
        color: #333;
        padding-left: 32px; /* room for icon */
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line></svg>");
        background-repeat: no-repeat; background-position: 10px center; background-size: 16px;
      }
      .gms-input:focus { border-color: #4c8bf5; box-shadow: 0 0 0 3px rgba(76,139,245,0.2); }
      .gms-no-results { padding: 8px 12px; color: #888; font-size: 13px; }
      .gms-hidden { display: none !important; }
      
      /* Темная тема */
      [data-theme="dark"] .gms-container {
        background: rgba(45,45,45,0.95); backdrop-filter: blur(6px);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      [data-theme="dark"] .gms-input {
        background: rgba(45,45,45,0.9);
        border: 1px solid rgba(255,255,255,0.2);
        color: #ffffff;
      }
      [data-theme="dark"] .gms-input:focus {
        border-color: #4c8bf5;
        box-shadow: 0 0 0 3px rgba(76,139,245,0.3);
      }
      [data-theme="dark"] .gms-input::placeholder {
        color: rgba(255,255,255,0.6);
      }
      [data-theme="dark"] .gms-no-results {
        color: rgba(255,255,255,0.6);
      }
      
      /* Стили для блока информации по домену */
      #domainInfoContainer {
        --domain-info-bg: #f8f9fa;
        --domain-info-border: #e9ecef;
        --domain-info-color: #333333;
        --domain-info-title-color: #495057;
        --domain-info-block-bg: white;
        --domain-info-block-border: #dee2e6;
        --domain-info-label-color: #495057;
        --domain-info-value-color: #212529;
      }
      
      [data-theme="dark"] #domainInfoContainer {
        --domain-info-bg: #3a3a3a;
        --domain-info-border: #444444;
        --domain-info-color: #ffffff;
        --domain-info-title-color: #ffffff;
        --domain-info-block-bg: #2d2d2d;
        --domain-info-block-border: #444444;
        --domain-info-label-color: #ffffff;
        --domain-info-value-color: #ffffff;
      }
      
      /* Стили для кнопки обновления команды */
      #domainInfoContainer button {
        background: transparent;
        color: #28a745;
        border: 1px solid #28a745;
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 140px;
        height: 28px;
      }
      
      #domainInfoContainer button:hover:not(:disabled) {
        background: rgba(40, 167, 69, 0.1);
        border-color: #218838;
        color: #218838;
      }
      
      #domainInfoContainer button:active:not(:disabled) {
        background: rgba(40, 167, 69, 0.2);
      }
      
      #domainInfoContainer button:disabled {
        background: transparent;
        color: #6c757d;
        border-color: #6c757d;
        cursor: not-allowed;
      }
      
      /* Анимации */
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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
      const theme = localStorage.getItem('lanSearchTheme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {

      document.documentElement.setAttribute('data-theme', 'light');
    }
    

    getCurrentTheme((theme) => {
      document.documentElement.setAttribute('data-theme', theme);

      try {
        localStorage.setItem('lanSearchTheme', theme);
      } catch (e) {

      }
      

      applyThemeToNewElements();
    });
  }






  let currentTheme = 'light';
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
            currentTheme = result.theme || 'light';
            themeApplied = true;
            callback(currentTheme);
          } catch (e) {

            try {
              currentTheme = localStorage.getItem('lanSearchTheme') || 'light';
            } catch (e2) {
              currentTheme = 'light';
            }
            themeApplied = true;
            callback(currentTheme);
          }
        });
      } else {

        try {
          currentTheme = localStorage.getItem('lanSearchTheme') || 'light';
        } catch (e2) {
          currentTheme = 'light';
        }
        themeApplied = true;
        callback(currentTheme);
      }
    } catch (e) {

      try {
        currentTheme = localStorage.getItem('lanSearchTheme') || 'light';
      } catch (e2) {
        currentTheme = 'light';
      }
      themeApplied = true;
      callback(currentTheme);
    }
  }


  function applyThemeToNewElements() {

    getCurrentTheme((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
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

  function createSearchBar(menuRoot) {

    if (document.getElementById(SEARCH_ID)) return document.getElementById(SEARCH_ID);


    const container = document.createElement("div");
    container.className = "gms-container";

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Поиск по меню... /";
    input.id = SEARCH_ID;
    input.className = "gms-input";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Поиск по меню");

    container.appendChild(input);
    

    menuRoot.insertBefore(container, menuRoot.firstChild);
    
    return input;
  }

  function normalize(text) {
    return (text || "").toLowerCase().replace(/[\s_\-\u00A0]+/g, " ").trim();
  }

  function getItemLabel(el) {

    if (window.location.hostname.includes('f5center')) {

      const textSelectors = [
        '.nav-link-text', 'a', '.title', '.name', '.label', 
        '[role="menuitem"]', '.menu-text', '.item-text'
      ];
      
      for (const selector of textSelectors) {
        const labelNode = el.querySelector(selector);
        if (labelNode && labelNode.textContent.trim()) {
          return normalize(labelNode.textContent);
        }
      }
      

      return normalize(el.textContent);
    } else {

      const labelNode = el.querySelector(".nav-link-text") || el.querySelector("a");
      const text = labelNode ? labelNode.textContent : el.textContent;
    return normalize(text);
    }
  }

  function clearHighlights(root) {
    $all(".gms-highlight", root).forEach((el) => {
      const text = el.textContent;
      if (el.parentNode) el.replaceWith(document.createTextNode(text || ""));
    });
  }

  function highlightMatch() {

  }

  function expandAncestors(li) {
    let parent = li.parentElement;
    while (parent && parent !== document.body) {
      if (parent.classList.contains("collapse")) {
        parent.classList.add("show");
        parent.style.height = "auto";
      }
      if (parent.id && parent.id.startsWith("collapse")) {
        const trigger = document.querySelector(`[href="#${parent.id}"]`);
        if (trigger?.classList.contains("collapsed")) {
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
      if (wasShown) {
        el.classList.add("show");
        el.style.height = "auto";
        const trigger = document.querySelector(`[href="#${id}"]`);
        if (trigger) { trigger.classList.remove("collapsed"); trigger.setAttribute("aria-expanded", "true"); }
      } else {
        el.classList.remove("show");
        el.style.height = "";
        const trigger = document.querySelector(`[href="#${id}"]`);
        if (trigger) { trigger.classList.add("collapsed"); trigger.setAttribute("aria-expanded", "false"); }
      }
    });
  }

  function getVisibleLeafLinks(menuRoot) {
    let visibleElements = [];
    
    if (window.location.hostname.includes('f5center')) {

      visibleElements = $all("a, button, .nav-item, .menu-item, .link, [role='menuitem'], .card, .item", menuRoot)
        .filter((el) => !el.classList.contains("gms-hidden"));
    } else {

      visibleElements = $all("li", menuRoot).filter((li) => !li.classList.contains("gms-hidden"));
    }
    
    const links = [];
    visibleElements.forEach((el) => {
      let a;
      if (el.tagName === 'A') {
        a = el;
      } else {
        a = el.querySelector("a[href]");
      }
      if (a && !a.getAttribute("href")?.startsWith("#")) links.push({ li: el, a });
    });
    return links;
  }

  function filterMenu(menuRoot, queryRaw) {
    const query = normalize(queryRaw);
    

    let searchElements = [];
    if (window.location.hostname.includes('f5center')) {

      searchElements = $all("a, button, .nav-item, .menu-item, .link, [role='menuitem'], .card, .item", menuRoot);
    } else {

      searchElements = $all("li", menuRoot);
    }

    clearHighlights(menuRoot);

    if (!query) {
      searchElements.forEach((el) => el.classList.remove("gms-hidden"));
      const noRes = $(".gms-no-results", menuRoot.parentElement);
      if (noRes) noRes.remove();
      restoreInitialCollapseState(menuRoot);
      return;
    }

    let matches = [];

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

    matches.forEach((li) => {
      expandAncestors(li);
      let parent = li.parentElement;
      while (parent && parent !== menuRoot) {
        if (parent.tagName === "UL") parent.classList.remove("gms-hidden");
        if (parent.tagName === "LI") parent.classList.remove("gms-hidden");
        parent = parent.parentElement;
      }
    });

    let noRes = $(".gms-no-results", menuRoot.parentElement);
    if (!matches.length) {
      if (!noRes) {
        noRes = document.createElement("div");
        noRes.className = "gms-no-results";
        noRes.textContent = "Ничего не найдено";
        menuRoot.parentElement?.insertBefore(noRes, menuRoot);
      }
    } else if (noRes) {
      noRes.remove();
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

  function init() {
    let menuRoot = document.getElementById(MENU_ID);
    

    if (!menuRoot && window.location.hostname.includes('f5center')) {

      const possibleContainers = [
        'nav', 'header', 'main', '.navbar', '.menu', '.navigation',
        '.sidebar', '.nav-menu', '[role="navigation"]', '.main-content'
      ];
      
      for (const selector of possibleContainers) {
        menuRoot = document.querySelector(selector);
        if (menuRoot) {
          break;
        }
      }
      

      if (!menuRoot) {
        menuRoot = document.body;
      }
    }
    
    if (!menuRoot) {
      if (shouldAutoActivate()) {
        console.log("Lan-Search: элемент #globalMenuAccordion не найден на подходящем домене");
      }
      return;
    }


    if (document.getElementById(SEARCH_ID)) {
      return;
    }

    injectStylesOnce();
    const input = createSearchBar(menuRoot);
    

    if (document.getElementById(MENU_ID)) {
    captureInitialCollapseState(menuRoot);
    }

    let handle;
    input.addEventListener("input", (e) => {
      const value = e.target.value;
      clearTimeout(handle);
      handle = setTimeout(() => filterMenu(menuRoot, value), 120);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        filterMenu(menuRoot, "");
      } else if (e.key === "Enter") {
        const visible = getVisibleLeafLinks(menuRoot);
        if (visible.length === 1) {
          const { a } = visible[0];
          a.click();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          input.focus();
        }
      }
    });


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

          if (document.getElementById('recentTabsContainer') || document.getElementById('langameSubscriptionWrapper')) {
            initGuestSearchOnMainPage();
          } else {

            setTimeout(initGuestSearchOnMainPage, 50);
          }
        });
      } else {

        if (document.getElementById('recentTabsContainer') || document.getElementById('langameSubscriptionWrapper')) {
          initGuestSearchOnMainPage();
        } else {

          setTimeout(initGuestSearchOnMainPage, 50);
        }
      }
    }
  }


  initGuestSearch();


  window.lanSearchInit = init;
  

  window.lanSearchInitGuestSearch = initGuestSearchOnMainPage;
  
  
  window.initFavoritesDragDrop = initFavoritesDragDrop;
  

  window.lanSearchSyncModalBypass = function() {
    clearModalBypassCache();
    getModalBypassSetting(function(enabled) {
      if (enabled) {
        replaceButtonsWithDivs();
      } else {
        restoreDivsToButtons();
      }
    });
  };

  try {

    if (!shouldAutoActivate()) {

    }
  } catch (e) {
    console.error("Lan-Search init error", e);
  }


  function initRecentTabsTracking() {
    const menuRoot = document.getElementById(MENU_ID);
    if (!menuRoot) return;


    if (window.recentTabsManager) {
      window.recentTabsManager.startTracking(menuRoot);
    }
  }


  function createGuestSearchBlock() {
    const container = document.createElement('div');
    container.id = 'guestSearchContainer';
    container.className = 'card';
    container.style.cssText = `
      margin-top: 15px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: var(--bg-secondary, #ffffff);
    `;

    container.innerHTML = `
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fa fa-search"></i> Поиск гостей
        </h5>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-12">
            <div class="input-group">
              <input style="min-height: 38px;" type="text" id="guestSearchInput" class="form-control" placeholder="Введите номер телефона, ФИО или email гостя..." />
              <div class="input-group-append">
                <button class="btn btn-primary" type="button" id="searchGuestBtn" style="min-height: 38px; padding: 8px 16px;">
                  <i class="fa fa-search"></i> Найти
                </button>
              </div>
            </div>
          </div>
        </div>
        <div id="guestSearchResults" style="display: none;">
          <div class="table-responsive">
            <table class="table table-sm table-hover">
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
              <tbody id="guestSearchResultsBody">
              </tbody>
            </table>
          </div>
        </div>
        <div id="guestSearchNoResults" style="display: none;" class="alert alert-info">
          <i class="fa fa-info-circle"></i> Гости не найдены
        </div>
      </div>
    `;


    const modal = document.createElement('div');
    modal.id = 'addBalanceModal';
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
        modal.innerHTML = `
          <div class="modal-dialog modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Пополнить баланс</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div class="modal-body">
                <form name="addBalanceForm">
                  <input type="hidden" name="guest_id" value="">
                  <div class="form-group mb-2">
                    <label for="balanceAmount">Сумма:</label>
                    <input tabindex="0" type="number" class="form-control" max="999999" step="0.01" name="balance" placeholder="пополнить" autocomplete="off" required>
                  </div>
                  <button tabindex="1" type="submit" class="btn btn-primary mb-2 pull-right">Сохранить</button>
                </form>
              </div>
            </div>
          </div>
        `;


    document.body.appendChild(modal);


    const bonusModal = document.createElement('div');
    bonusModal.id = 'addBonusModal';
    bonusModal.className = 'modal fade';
    bonusModal.setAttribute('tabindex', '-1');
    bonusModal.setAttribute('role', 'dialog');
        bonusModal.innerHTML = `
          <div class="modal-dialog modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Управление бонусами</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div class="modal-body">
                <form name="addBonusForm">
                  <input type="hidden" name="guest_id" value="">
                  <input type="hidden" name="action" value="">
                  <div class="form-group mb-2">
                    <label for="bonusAmount">Сумма бонусов:</label>
                    <input tabindex="0" type="number" class="form-control" max="999999" step="0.01" name="bonus_balance" placeholder="сумма" autocomplete="off" required>
                  </div>
                  <button tabindex="1" type="submit" class="btn btn-primary mb-2 pull-right">Сохранить</button>
                </form>
              </div>
            </div>
          </div>
        `;


    document.body.appendChild(bonusModal);

    return container;
  }


  async function searchGuests(query) {
    if (!query || query.trim().length < 3) {
      showNotification('Введите минимум 3 символа для поиска', 'warning');
      return;
    }

    try {
      const response = await fetch('/guests_search/search.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: new URLSearchParams({
          'draw': '1',
          'columns[0][data]': '0',
          'columns[0][name]': '',
          'columns[0][searchable]': 'true',
          'columns[0][orderable]': 'true',
          'columns[0][search][value]': '',
          'columns[0][search][regex]': 'false',
          'columns[1][data]': '1',
          'columns[1][name]': '',
          'columns[1][searchable]': 'true',
          'columns[1][orderable]': 'true',
          'columns[1][search][value]': '',
          'columns[1][search][regex]': 'false',
          'columns[2][data]': '2',
          'columns[2][name]': '',
          'columns[2][searchable]': 'true',
          'columns[2][orderable]': 'true',
          'columns[2][search][value]': '',
          'columns[2][search][regex]': 'false',
          'columns[3][data]': '3',
          'columns[3][name]': '',
          'columns[3][searchable]': 'true',
          'columns[3][orderable]': 'true',
          'columns[3][search][value]': '',
          'columns[3][search][regex]': 'false',
          'columns[4][data]': '4',
          'columns[4][name]': '',
          'columns[4][searchable]': 'true',
          'columns[4][orderable]': 'true',
          'columns[4][search][value]': '',
          'columns[4][search][regex]': 'false',
          'columns[5][data]': '5',
          'columns[5][name]': '',
          'columns[5][searchable]': 'true',
          'columns[5][orderable]': 'true',
          'columns[5][search][value]': '',
          'columns[5][search][regex]': 'false',
          'columns[6][data]': '6',
          'columns[6][name]': '',
          'columns[6][searchable]': 'true',
          'columns[6][orderable]': 'true',
          'columns[6][search][value]': '',
          'columns[6][search][regex]': 'false',
          'columns[7][data]': '7',
          'columns[7][name]': '',
          'columns[7][searchable]': 'true',
          'columns[7][orderable]': 'true',
          'columns[7][search][value]': '',
          'columns[7][search][regex]': 'false',
          'columns[8][data]': '8',
          'columns[8][name]': '',
          'columns[8][searchable]': 'true',
          'columns[8][orderable]': 'true',
          'columns[8][search][value]': '',
          'columns[8][search][regex]': 'false',
          'columns[9][data]': '9',
          'columns[9][name]': '',
          'columns[9][searchable]': 'true',
          'columns[9][orderable]': 'false',
          'columns[9][search][value]': '',
          'columns[9][search][regex]': 'false',
          'columns[10][data]': '10',
          'columns[10][name]': '',
          'columns[10][searchable]': 'true',
          'columns[10][orderable]': 'false',
          'columns[10][search][value]': '',
          'columns[10][search][regex]': 'false',
          'columns[11][data]': '11',
          'columns[11][name]': '',
          'columns[11][searchable]': 'true',
          'columns[11][orderable]': 'true',
          'columns[11][search][value]': '',
          'columns[11][search][regex]': 'false',
          'columns[12][data]': '12',
          'columns[12][name]': '',
          'columns[12][searchable]': 'true',
          'columns[12][orderable]': 'true',
          'columns[12][search][value]': '',
          'columns[12][search][regex]': 'false',
          'columns[13][data]': '13',
          'columns[13][name]': '',
          'columns[13][searchable]': 'true',
          'columns[13][orderable]': 'true',
          'columns[13][search][value]': '',
          'columns[13][search][regex]': 'false',
          'columns[14][data]': '14',
          'columns[14][name]': '',
          'columns[14][searchable]': 'true',
          'columns[14][orderable]': 'false',
          'columns[14][search][value]': '',
          'columns[14][search][regex]': 'false',
          'order[0][column]': '0',
          'order[0][dir]': 'asc',
          'start': '0',
          'length': '10',
          'search[value]': query,
          'search[regex]': 'false',
          'guests_group': '0',
          'last_visit_from': '',
          'last_visit_to': '',
          'date_insert_from': '',
          'date_insert_to': '',
          'balance_from': '',
          'balance_to': '',
          'bonus_balance_from': '',
          'bonus_balance_to': '',
          'guests_group_hand': '0'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при поиске гостей:', error);
      showNotification('Ошибка при поиске гостей', 'error');
      return null;
    }
  }


  function displayGuestSearchResults(data) {
    const resultsContainer = document.getElementById('guestSearchResults');
    const noResultsContainer = document.getElementById('guestSearchNoResults');
    const resultsBody = document.getElementById('guestSearchResultsBody');

    if (!data || !data.data || data.data.length === 0) {
      resultsContainer.style.display = 'none';
      noResultsContainer.style.display = 'block';
      return;
    }

    resultsContainer.style.display = 'block';
    noResultsContainer.style.display = 'none';

    resultsBody.innerHTML = '';

    data.data.forEach(guest => {
      const row = document.createElement('tr');
      

      const nameMatch = guest[0]?.match(/onclick="showGuestAnketa\((\d+)\)">([^<]+)<\/div>/);
      const phoneMatch = guest[3]?.match(/onclick="showGuestAnketa\((\d+)\)">([^<]+)<\/div>/);
      const guestId = nameMatch ? nameMatch[1] : (phoneMatch ? phoneMatch[1] : '');
      const name = nameMatch ? nameMatch[2] : guest[0]?.replace(/<[^>]*>/g, '') || '';
      const phone = phoneMatch ? phoneMatch[2] : guest[3]?.replace(/<[^>]*>/g, '') || '';
      const email = guest[4] || '';
      const balance = guest[6] || '0';
      const bonusBalance = guest[7] || '0';

      row.innerHTML = `
        <td>${name}</td>
        <td>${phone}</td>
        <td>${email}</td>
        <td>${balance}</td>
        <td>${bonusBalance}</td>
        <td>
          <button class="btn btn-outline-success btn-sm addBalance" data-guest-id="${guestId}" title="Пополнить баланс">
            <i class="fa fa-plus"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm subBalance" data-guest-id="${guestId}" title="Списать баланс">
            <i class="fa fa-minus"></i>
          </button>
          <button class="btn btn-success btn-sm addBonusBalance" data-guest-id="${guestId}" title="Добавить бонусы">
            <i class="fa fa-gift"></i>
          </button>
          <button class="btn btn-danger btn-sm subBonusBalance" data-guest-id="${guestId}" title="Списать бонусы">
            <i class="fa fa-gift"></i>
          </button>
        </td>
      `;

      resultsBody.appendChild(row);
    });
  }


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
    } else {

      const langameWrapper = document.getElementById('langameSubscriptionWrapper');
      if (langameWrapper) {
        insertTarget = langameWrapper.parentNode;
        insertTarget.insertBefore(createGuestSearchBlock(), langameWrapper.nextSibling);
      } else {

        const containerFluid = document.querySelector('.container-fluid');
        if (containerFluid) {
          insertTarget = containerFluid;
          insertTarget.appendChild(createGuestSearchBlock());
        } else {

          if (attempts < 10) {
            setTimeout(() => initGuestSearchOnMainPage(attempts + 1), 200);
            return;
          } else {
          return;
          }
        }
      }
    }
    
    console.log('Lan-Search: Блок поиска гостей добавлен');


    const searchInput = document.getElementById('guestSearchInput');
    const searchBtn = document.getElementById('searchGuestBtn');

    if (searchInput && searchBtn) {
      const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Поиск...';

        try {
          const results = await searchGuests(query);
          if (results) {
            displayGuestSearchResults(results);
          }
        } finally {
          searchBtn.disabled = false;
          searchBtn.innerHTML = '<i class="fa fa-search"></i> Найти';
        }
      };

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }


    setTimeout(() => {
      addBalanceHandlers();
    }, 50);
    

    setTimeout(() => {
      addModalCloseHandlers();
    }, 50);
    

    const partnersDiv = document.getElementById('partners_div');
    if (partnersDiv) {
      partnersDiv.style.display = 'none';
    }
    

    const partnersHeading = document.querySelector('h3');
    if (partnersHeading && partnersHeading.textContent.includes('Предложения партнёров')) {
      partnersHeading.style.display = 'none';
    }
    

    const partnersDescription = document.querySelector('p');
    if (partnersDescription && partnersDescription.textContent.includes('Здесь мы собираем для пользователей LANGAME Software выгодные предложения от наших партнёров')) {
      partnersDescription.style.display = 'none';
    }
    

    const allHeadings = document.querySelectorAll('h3');
    const allParagraphs = document.querySelectorAll('p');
    
    allHeadings.forEach(heading => {
      if (heading.textContent.includes('Предложения партнёров')) {
        heading.style.display = 'none';
      }
    });
    
    allParagraphs.forEach(paragraph => {
      if (paragraph.textContent.includes('Здесь мы собираем для пользователей LANGAME Software выгодные предложения от наших партнёров')) {
        paragraph.style.display = 'none';
      }
    });
  }


  function addModalCloseHandlers() {

    const addBalanceModal = document.getElementById('addBalanceModal');
    if (addBalanceModal) {
      const closeBtn = addBalanceModal.querySelector('.close, [data-dismiss="modal"]');
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
              backdrop.style.display = 'none';
              backdrop.classList.remove('show');
            }
          }
        });
      }
    }


    const addBonusModal = document.getElementById('addBonusModal');
    if (addBonusModal) {
      const closeBtn = addBonusModal.querySelector('.close, [data-dismiss="modal"]');
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
              backdrop.style.display = 'none';
              backdrop.classList.remove('show');
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


  async function submitAddBalanceForm(guestId, formData, action = 'add') {
    try {
      const balance = formData.get('balance');
      const sum = action === 'sub' ? -parseFloat(balance) : parseFloat(balance);


      const authToken = getCookie('auth_token') || getCookie('token') || getCookie('access_token');
      
      const headers = {
        'content-type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/master_api/guests/${guestId}/balance`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({
          type: 'balance',
          sum: sum
        })
      });

      if (response.ok) {
        showNotification(`${action === 'sub' ? 'Баланс списан' : 'Баланс пополнен'} успешно`, 'success');

        const addBalanceModal = document.getElementById('addBalanceModal');
        if (addBalanceModal) {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#addBalanceModal').modal('hide');
          } else {
            addBalanceModal.style.display = 'none';
            addBalanceModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            

            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.style.display = 'none';
              backdrop.classList.remove('show');
            }
          }
        }

        const searchInput = document.getElementById('guestSearchInput');
        if (searchInput && searchInput.value.trim()) {
          const results = await searchGuests(searchInput.value.trim());
          if (results) {
            displayGuestSearchResults(results);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error_code === 9) {
          showNotification('Ошибка авторизации. Пожалуйста, войдите в систему заново', 'error');
        } else if (errorData.error_code === 4) {
          showNotification('Недостаточно средств для списания указанной суммы', 'error');
        } else {
          showNotification(errorData.error_message || 'Ошибка при пополнении баланса', 'error');
        }
        throw new Error(errorData.error_message || 'Ошибка при пополнении баланса');
      }
    } catch (error) {
      console.error('Ошибка при пополнении баланса:', error);
      if (!error.message.includes('Ошибка при пополнении баланса')) {
        showNotification('Ошибка при пополнении баланса', 'error');
      }
    }
  }


  async function submitBalanceForm(guestId, action, formData) {
    try {
      const response = await fetch('/guests_search/balance_update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams(formData)
      });

      if (response.ok) {
        showNotification(`${action === 'add' ? 'Баланс пополнен' : 'Баланс списан'} успешно`, 'success');

        const balanceModal = document.getElementById(`balanceModal_${guestId}_${action}`);
        if (balanceModal) {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $(`#balanceModal_${guestId}_${action}`).modal('hide');
          } else {
            balanceModal.style.display = 'none';
            balanceModal.classList.remove('show');
            document.body.classList.remove('modal-open');
          }
        }

        const searchInput = document.getElementById('guestSearchInput');
        if (searchInput && searchInput.value.trim()) {
          const results = await searchGuests(searchInput.value.trim());
          if (results) {
            displayGuestSearchResults(results);
          }
        }
      } else {
        throw new Error('Ошибка при обновлении баланса');
      }
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      showNotification('Ошибка при обновлении баланса', 'error');
    }
  }


  async function submitAddBonusForm(guestId, action, formData) {
    try {
      const bonusBalance = formData.get('bonus_balance');
      const sum = action === 'add' ? parseFloat(bonusBalance) : -parseFloat(bonusBalance);


      const authToken = getCookie('auth_token') || getCookie('token') || getCookie('access_token');
      
      const headers = {
        'content-type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/master_api/guests/${guestId}/balance`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({
          type: 'bonus_balance',
          sum: sum
        })
      });

      if (response.ok) {
        showNotification(`${action === 'add' ? 'Бонусы добавлены' : 'Бонусы списаны'} успешно`, 'success');

        const addBonusModal = document.getElementById('addBonusModal');
        if (addBonusModal) {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#addBonusModal').modal('hide');
          } else {
            addBonusModal.style.display = 'none';
            addBonusModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            

            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.style.display = 'none';
              backdrop.classList.remove('show');
            }
          }
        }

        const searchInput = document.getElementById('guestSearchInput');
        if (searchInput && searchInput.value.trim()) {
          const results = await searchGuests(searchInput.value.trim());
          if (results) {
            displayGuestSearchResults(results);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error_code === 9) {
          showNotification('Ошибка авторизации. Пожалуйста, войдите в систему заново', 'error');
        } else if (errorData.error_code === 4) {
          showNotification('Недостаточно бонусов для списания указанной суммы', 'error');
        } else {
          showNotification(errorData.error_message || 'Ошибка при обновлении бонусов', 'error');
        }
        throw new Error(errorData.error_message || 'Ошибка при обновлении бонусов');
      }
    } catch (error) {
      console.error('Ошибка при обновлении бонусов:', error);
      if (!error.message.includes('Ошибка при обновлении бонусов')) {
        showNotification('Ошибка при обновлении бонусов', 'error');
      }
    }
  }


  async function submitBonusForm(guestId, action, formData) {
    try {
      const response = await fetch('/guests_search/bonus_update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams(formData)
      });

      if (response.ok) {
        showNotification(`${action === 'add' ? 'Бонусы добавлены' : 'Бонусы списаны'} успешно`, 'success');

        const bonusModal = document.getElementById(`bonusModal_${guestId}_${action}`);
        if (bonusModal) {
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $(`#bonusModal_${guestId}_${action}`).modal('hide');
          } else {
            bonusModal.style.display = 'none';
            bonusModal.classList.remove('show');
            document.body.classList.remove('modal-open');
          }
        }

        const searchInput = document.getElementById('guestSearchInput');
        if (searchInput && searchInput.value.trim()) {
          const results = await searchGuests(searchInput.value.trim());
          if (results) {
            displayGuestSearchResults(results);
          }
        }
      } else {
        throw new Error('Ошибка при обновлении бонусов');
      }
    } catch (error) {
      console.error('Ошибка при обновлении бонусов:', error);
      showNotification('Ошибка при обновлении бонусов', 'error');
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
          const newTheme = changes.theme.newValue || 'light';
          currentTheme = newTheme; 
          document.documentElement.setAttribute('data-theme', newTheme);

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
    

    if (currentTheme === 'dark' && currentThemeAttr !== 'dark') {

      htmlElement.setAttribute('data-theme', 'dark');
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
    
    try {

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['modalBypass'], function(result) {
          try {
            const enabled = result.modalBypass || false;
            

            modalBypassCache = enabled;
            modalBypassCacheTime = now;
            

            try {
              localStorage.setItem('lanSearchModalBypass', enabled.toString());
            } catch (e) {

            }
            
            callback(enabled);
          } catch (e) {

            const localBypass = localStorage.getItem('lanSearchModalBypass');
            const enabled = localBypass === 'true';
            

            modalBypassCache = enabled;
            modalBypassCacheTime = now;
            
            callback(enabled);
          }
        });
      } else {

        const localBypass = localStorage.getItem('lanSearchModalBypass');
        const enabled = localBypass === 'true';
        

        modalBypassCache = enabled;
        modalBypassCacheTime = now;
        
        callback(enabled);
      }
    } catch (e) {
      modalBypassCache = false;
      modalBypassCacheTime = now;
      
      callback(false);
    }
  }
  

  function clearModalBypassCache() {
    modalBypassCache = null;
    modalBypassCacheTime = 0;
  }

  
  function setModalBypassSetting(enabled) {
    try {

      localStorage.setItem('lanSearchModalBypass', enabled.toString());
      

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ modalBypass: enabled }, function() {
        });
      }
      

      modalBypassCache = enabled;
      modalBypassCacheTime = Date.now();
      

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
  

  function replaceButtonsWithDivs() {
    const supportedCommands = ['startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC', 'Lock', 'UnLock', 'LockPS', 'UnLockPS'];
    
    
    const buttons = document.querySelectorAll('button[data-type]:not([data-lan-search-replaced])');
    
    buttons.forEach(button => {
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
        if (bypassEnabled) {
          replaceButtonsWithDivs();
        } else {
          restoreDivsToButtons();
        }
        processingButtons = false;
      });
    }
    

    window.lanSearchProcessButtons = processButtons;
    

    processButtons();
    

    let observerTimeout;
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          clearTimeout(observerTimeout);
          observerTimeout = setTimeout(processButtons, 500);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.modalBypass) {
          clearModalBypassCache();
          processButtons();
        }
      });
    }
    

    document.addEventListener('click', function(event) {
      const target = event.target;
      

      const dataType = target.getAttribute('data-type');
      const supportedCommands = ['startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC', 'Lock', 'UnLock', 'LockPS', 'UnLockPS'];
      
      if (target.tagName === 'DIV' && supportedCommands.includes(dataType) && target.hasAttribute('data-lan-search-replaced')) {
        getModalBypassSetting(function(bypassEnabled) {
          if (bypassEnabled) {
            

            
            const dataType = target.getAttribute('data-type');
            const clickId = dataType + '_' + Date.now();
            
            
            if (processedClicks.has(clickId)) {
              return;
            }
            
            
            processedClicks.add(clickId);
            

            setTimeout(() => {
              processedClicks.delete(clickId);
            }, 3000);
            

            const params = extractButtonParamsFromDiv(target);
            if (params) {
              

              const originalText = target.textContent;
              target.textContent = 'Выполняется...';
              target.style.pointerEvents = 'none';
              

              sendDirectCommand(params.uuid, params.command, params.whoSend)
                .then(response => response.json())
                .then(data => {
                  

                  target.textContent = originalText;
                  target.style.pointerEvents = '';
                  

                  if (data.status === true) {
                    
                    let successMessage = 'Команда выполнена успешно!';
                    switch (params.command) {
                      case 'startTehTime':
                        successMessage = 'Тех.Старт выполнен успешно!';
                        break;
                      case 'stopTehTime':
                        successMessage = 'Тех.Стоп выполнен успешно!';
                        break;
                      case 'rebootPC':
                        successMessage = 'Перезагрузка ПК выполнена успешно!';
                        break;
                      case 'shutdownPC':
                        successMessage = 'Выключение ПК выполнено успешно!';
                        break;
                      case 'Lock':
                        successMessage = 'ПК заблокирован успешно!';
                        break;
                      case 'UnLock':
                        successMessage = 'ПК разблокирован успешно!';
                        break;
                      case 'LockPS':
                        successMessage = 'ПК заблокирован успешно!';
                        break;
                      case 'UnLockPS':
                        successMessage = 'ПК разблокирован успешно!';
                        break;
                    }
                    showNotification(successMessage, 'success', 2000);
                    

                    const originalBg = target.style.backgroundColor;
                    const originalColor = target.style.color;
                    target.style.backgroundColor = '#28a745';
                    target.style.color = 'white';
                    setTimeout(() => {
                      target.style.backgroundColor = originalBg;
                      target.style.color = originalColor;
                    }, 1000);
                  } else {
                    
                    const errorMessage = data.textStatus || 'Неизвестная ошибка';
                    console.warn('Lan-Search: Сообщение от API:', errorMessage);
                    
                    let errorTitle = 'Ошибка выполнения команды';
                    switch (params.command) {
                      case 'startTehTime':
                        errorTitle = 'Ошибка Тех.Старта';
                        break;
                      case 'stopTehTime':
                        errorTitle = 'Ошибка Тех.Стопа';
                        break;
                      case 'rebootPC':
                        errorTitle = 'Ошибка перезагрузки ПК';
                        break;
                      case 'shutdownPC':
                        errorTitle = 'Ошибка выключения ПК';
                        break;
                      case 'Lock':
                        errorTitle = 'Ошибка блокировки ПК';
                        break;
                      case 'UnLock':
                        errorTitle = 'Ошибка разблокировки ПК';
                        break;
                      case 'LockPS':
                        errorTitle = 'Ошибка блокировки ПК';
                        break;
                      case 'UnLockPS':
                        errorTitle = 'Ошибка разблокировки ПК';
                        break;
                    }
                    
                    showNotification(`${errorTitle}: ${errorMessage}`, 'error', 5000);
                    

                    const originalBg = target.style.backgroundColor;
                    const originalColor = target.style.color;
                    target.style.backgroundColor = '#dc3545';
                    target.style.color = 'white';
                    setTimeout(() => {
                      target.style.backgroundColor = originalBg;
                      target.style.color = originalColor;
                    }, 1000);
                  }
                })
                .catch(error => {
                  console.warn('Lan-Search: Ошибка выполнения команды', error);
                  

                  target.textContent = originalText;
                  target.style.pointerEvents = '';
                  

                  
                  let errorTitle = 'Ошибка сети';
                  switch (params.command) {
                    case 'startTehTime':
                      errorTitle = 'Ошибка сети при Тех.Старте';
                      break;
                    case 'stopTehTime':
                      errorTitle = 'Ошибка сети при Тех.Стопе';
                      break;
                    case 'rebootPC':
                      errorTitle = 'Ошибка сети при перезагрузке ПК';
                      break;
                    case 'shutdownPC':
                      errorTitle = 'Ошибка сети при выключении ПК';
                      break;
                    case 'Lock':
                      errorTitle = 'Ошибка сети при блокировке ПК';
                      break;
                    case 'UnLock':
                      errorTitle = 'Ошибка сети при разблокировке ПК';
                      break;
                    case 'LockPS':
                      errorTitle = 'Ошибка сети при блокировке ПК';
                      break;
                    case 'UnLockPS':
                      errorTitle = 'Ошибка сети при разблокировке ПК';
                      break;
                  }
                  
                  showNotification(`${errorTitle}: ${error.message}`, 'error', 4000);
                  

                  const originalBg = target.style.backgroundColor;
                  const originalColor = target.style.color;
                  target.style.backgroundColor = '#dc3545';
                  target.style.color = 'white';
                  setTimeout(() => {
                    target.style.backgroundColor = originalBg;
                    target.style.color = originalColor;
                  }, 1000);
                });
            }
          }
        });
      }
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
        }
      }
      
      
      if (event.target && event.target.id === 'cancelSelect') {
        exitSelectionMode();
        if (window.location.pathname.includes('/all_clubs_pc/')) {
          hideMassiveSelectionPanelForAllClubs();
        }
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
    

    document.body.removeAttribute('data-page');
    

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
    restoreBtn.textContent = '🔄 Восстановить';
    restoreBtn.title = 'Восстановить скрытые элементы (чекбоксы и комментарии)';
    restoreBtn.style.cssText = `
      flex: 1;
      padding: 6px;
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 8px;
    `;
    
    restoreBtn.addEventListener('mouseenter', () => {
      restoreBtn.style.background = '#138496';
      restoreBtn.style.transform = 'scale(1.02)';
    });
    
    restoreBtn.addEventListener('mouseleave', () => {
      restoreBtn.style.background = '#17a2b8';
      restoreBtn.style.transform = 'scale(1)';
    });
    
    restoreBtn.addEventListener('click', () => {
      restoreHiddenElements();
    });
    
    buttonsContainer.appendChild(selectBtn);
    buttonsContainer.appendChild(deselectBtn);
    
    quickButtons.appendChild(selectAllBtn);
    quickButtons.appendChild(clearAllBtn);
    quickButtons.appendChild(invertBtn);
    
    panel.appendChild(input);
    panel.appendChild(restoreBtn);
    panel.appendChild(buttonsContainer);
    panel.appendChild(quickButtons);
    
    
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
    showNotification('Режим выбора отключен', 'warning', 2000);
    

    if (savedModalBypassState !== null) {
      if (savedModalBypassState) {

        if (window.lanSearchProcessButtons) {
          window.lanSearchProcessButtons();
        }
      }
      savedModalBypassState = null;
    }
  }

  
  function addCheckDisksButton() {
    
    if (document.getElementById('checkDisksBtn')) return;
    
    
    const selectPCBtn = document.getElementById('selectPC');
    if (!selectPCBtn) return;
    
    
    const checkDisksBtn = document.createElement('a');
    checkDisksBtn.id = 'checkDisksBtn';
    checkDisksBtn.href = '#';
    checkDisksBtn.className = 'btn btn-outline-info mb-3 mr-1';
    checkDisksBtn.innerHTML = '<i class="fa fa-hdd-o"></i> Проверить диски';
    checkDisksBtn.title = 'Проверить состояние дисков FreeNAS';
    
    
    selectPCBtn.parentNode.insertBefore(checkDisksBtn, selectPCBtn.nextSibling);
    
    
    checkDisksBtn.addEventListener('click', function(e) {
      e.preventDefault();
      checkDisksStatus();
    });
    
  }
  
  function getClubIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const clubId = urlParams.get('club_id');
    return clubId || '1';
  }
  
  function checkDisksStatus() {
    const clubId = getClubIdFromUrl();
    

    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {

      const originalText = checkDisksBtn.innerHTML;
      

      checkDisksBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Проверяем...';
      checkDisksBtn.disabled = true;
      checkDisksBtn.style.opacity = '0.7';
      

      const restoreButton = () => {
        checkDisksBtn.innerHTML = originalText;
        checkDisksBtn.disabled = false;
        checkDisksBtn.style.opacity = '1';
      };
    
    showNotification(`Проверяем состояние дисков для клуба ${clubId}...`, 'success', 2000);
    
      fetch('/freenas_wrap/', {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => response.text())
      .then(html => {
        parseDisksData(html);
        restoreButton();
      })
      .catch(error => {
        console.error('Lan-Search: Ошибка при проверке дисков:', error);
        showNotification('Ошибка при проверке дисков', 'error', 3000);
        restoreButton();
      });
    } else {

      showNotification(`Проверяем состояние дисков для клуба ${clubId}...`, 'success', 2000);
    
    fetch('/freenas_wrap/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.text())
    .then(html => {
      parseDisksData(html);
    })
    .catch(error => {
      console.error('Lan-Search: Ошибка при проверке дисков:', error);
      showNotification('Ошибка при проверке дисков', 'error', 3000);
    });
    }
  }
  
  function parseDisksData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr[id^="pcID-"]');
    
    if (rows.length === 0) {
      showNotification('Диски не найдены', 'warning', 3000);
      return;
    }
    
    
    const allHeadings = doc.querySelectorAll('.alert-heading');
    let snapshotAlert = null;
    
    
    allHeadings.forEach((heading, index) => {
      const text = heading.textContent.trim();
      
      if (text === 'Снимки') {
        snapshotAlert = heading.closest('.alert.alert-info');
      }
    });
    
    
    if (snapshotAlert) {
      const latestSnapshotDate = extractLatestSnapshotDate(snapshotAlert);
      
      if (latestSnapshotDate) {
        addSnapshotInfoButton(latestSnapshotDate);
      } else {
      }
    } else {
    }
    
    addDiskInfoToPCs(rows);
    addDiskManagementButton(rows);
    showNotification(`Найдено ${rows.length} дисков`, 'success', 2000);
  }
  
  function createDisksPanel(rows) {
    
    const existingPanel = document.getElementById('disksInfoPanel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'disksInfoPanel';
    panel.style.cssText = `
      background: linear-gradient(135deg, rgba(248, 249, 250, 0.98), rgba(255, 255, 255, 0.95));
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 15px;
      margin: 15px auto;
      max-width: 800px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;
    
    const title = document.createElement('h5');
    title.textContent = 'Состояние дисков FreeNAS';
    title.style.cssText = 'margin-bottom: 15px; text-align: center; color: #333;';
    
    const table = document.createElement('table');
    table.className = 'table table-sm table-striped';
    table.style.cssText = 'margin-bottom: 0;';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>ПК</th>
        <th>Snapshot</th>
        <th>Статус</th>
      </tr>
    `;
    
    const tbody = document.createElement('tbody');
    
    rows.forEach(row => {
      const pcCell = row.querySelector('td[data-uuid]');
      const statusCell = row.querySelector('td:nth-child(3)');
      const switchCell = row.querySelector('td .switch');
      
      if (!pcCell || !statusCell) return;
      
      const pcName = pcCell.textContent.trim();
      const uuid = pcCell.getAttribute('data-uuid');
      const status = statusCell.textContent.trim();
      const isExcluded = switchCell && switchCell.querySelector('input[type="checkbox"]').checked;
      const snapshotDate = extractSnapshotDate(status);
      
      
      const substitutionStatus = isExcluded ? 'Подмена отключена' : 'Подмена включена';
      const statusColor = isExcluded ? '#dc3545' : '#28a745'; 
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${pcName}</strong></td>
        <td>${snapshotDate}</td>
        <td style="color: ${statusColor}; font-weight: 500;">
          ${substitutionStatus}
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    `;
    closeBtn.addEventListener('click', () => panel.remove());
    
    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(table);
    
    
    const selectActions = document.querySelector('.select-actions');
    if (selectActions) {
      selectActions.parentNode.insertBefore(panel, selectActions.nextSibling);
    } else {
      document.body.appendChild(panel);
    }
  }
  
  function extractSnapshotDate(statusText) {

    const match = statusText.match(/bigPool\/reference@(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
    if (match) {
      const dateTime = match[1];

      return dateTime.substring(0, 16); 
    }
    return 'Не определено';
  }
  
  function extractLatestSnapshotDate(snapshotAlert) {
    const dateCells = snapshotAlert.querySelectorAll('.col-4');
    
    let latestDate = null;
    let latestDateStr = null;
    
    dateCells.forEach((cell, index) => {
      const dateText = cell.textContent.trim();
      
      const dateMatch = dateText.match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        
        const date = new Date(dateStr.split(' ')[0].split('.').reverse().join('-') + ' ' + dateStr.split(' ')[1]);
        
        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestDateStr = dateStr;
        }
      }
    });
    
    return latestDateStr;
  }
  
  function addSnapshotInfoButton(latestDate) {
    
    
    const existingBtn = document.getElementById('snapshotInfoBtn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    
    const snapshotBtn = document.createElement('a');
    snapshotBtn.id = 'snapshotInfoBtn';
    snapshotBtn.href = '#';
    snapshotBtn.className = 'btn btn-outline-success mb-3 mr-1';
    snapshotBtn.innerHTML = `<i class="fa fa-clock-o"></i> ${latestDate}`;
    snapshotBtn.title = 'Последний снимок FreeNAS';
    
    
    const checkDisksBtn = document.getElementById('checkDisksBtn');
    
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(snapshotBtn, checkDisksBtn.nextSibling);
    } else {
    }
  }
  
  function findLatestSnapshot(doc) {
    
    const alertBlock = doc.querySelector('.alert.alert-info');
    if (!alertBlock) return null;
    
    
    const dateRows = alertBlock.querySelectorAll('.row');
    let latestDate = null;
    let latestRow = null;
    
    dateRows.forEach(row => {
      const dateCell = row.querySelector('.col-4:first-child');
      if (dateCell) {
        const dateText = dateCell.textContent.trim();
        const dateMatch = dateText.match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const date = new Date(dateStr.split(' ')[0].split('.').reverse().join('-') + ' ' + dateStr.split(' ')[1]);
          
          if (!latestDate || date > latestDate) {
            latestDate = date;
            latestRow = row;
          }
        }
      }
    });
    
    return latestRow;
  }
  
  function showLatestSnapshot(snapshotRow) {
    
    const existingBlock = document.getElementById('latestSnapshotInfo');
    if (existingBlock) {
      existingBlock.remove();
    }
    
    
    const snapshotInfo = document.createElement('div');
    snapshotInfo.id = 'latestSnapshotInfo';
    snapshotInfo.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 4px;
      font-size: 12px;
      color: #0c5460;
    `;
    
    
    const dateCell = snapshotRow.querySelector('.col-4:first-child');
    const dateText = dateCell ? dateCell.textContent.trim() : 'Не определено';
    
    
    const cleanDate = dateText.replace(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}):\d{2}/, '$1');
    
    snapshotInfo.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 2px;">Самый свежий снимок:</div>
      <div style="font-size: 11px;">${cleanDate}</div>
    `;
    
    
    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(snapshotInfo, checkDisksBtn.nextSibling);
    }
  }
  
  function addDiskInfoToPCs(rows) {
    
    const diskDataMap = new Map();
    
    rows.forEach(row => {
      const pcCell = row.querySelector('td[data-uuid]');
      const statusCell = row.querySelector('td:nth-child(3)');
      const switchCell = row.querySelector('td .switch');
      
      if (!pcCell || !statusCell) return;
      
      const uuid = pcCell.getAttribute('data-uuid');
      const status = statusCell.textContent.trim();
      const isExcluded = switchCell && switchCell.querySelector('input[type="checkbox"]').checked;
      const snapshotDate = extractSnapshotDate(status);
      
      diskDataMap.set(uuid, {
        snapshotDate,
        isExcluded
      });
    });
    
    
    const pcForms = document.querySelectorAll('form.pc');
    pcForms.forEach(form => {
      const uuid = form.id;
      if (!uuid || !diskDataMap.has(uuid)) return;
      
      const diskData = diskDataMap.get(uuid);
      
      
      const existingDiskInfo = form.querySelector('.disk-info');
      if (existingDiskInfo) {
        existingDiskInfo.remove();
      }
      
      
      const diskInfo = document.createElement('div');
      diskInfo.className = 'disk-info';
      diskInfo.style.cssText = `
        margin-top: 5px;
        padding: 5px;
        font-size: 11px;
        color: #666;
        text-align: center;
      `;
      
      
      const substitutionStatus = diskData.isExcluded ? 'Подмена отключена' : 'Подмена включена';
      const statusColor = diskData.isExcluded ? '#dc3545' : '#28a745'; 
      
      diskInfo.innerHTML = `
        <div style="font-size: 8px; color: #666;">${diskData.snapshotDate}</div>
        <div style="margin-top: 3px; font-size: 8px; color: ${statusColor}; font-weight: 500;">
          ${substitutionStatus}
        </div>
      `;
      
      
      const allBrs = form.querySelectorAll('br');
      if (allBrs.length > 0) {
        const lastBr = allBrs[allBrs.length - 1];
        lastBr.remove();
      }
      
      
      const emptyDiv = form.querySelector('div.col-12.text-center');
      if (emptyDiv) {
        emptyDiv.remove();
      }
      
      const unlockButton = form.querySelector('[data-type="UnLock"]');
      if (unlockButton) {
        unlockButton.parentNode.insertBefore(diskInfo, unlockButton.nextSibling);
      } else {
        
        form.appendChild(diskInfo);
      }
    });
  }
  
  function addDiskManagementButton(rows) {

    const existingBtn = document.getElementById('diskManagementBtn');
    if (existingBtn) {
      existingBtn.remove();
    }
    

    const managementBtn = document.createElement('a');
    managementBtn.id = 'diskManagementBtn';
    managementBtn.href = '#';
    managementBtn.className = 'btn btn-outline-warning mb-3 mr-1';
    managementBtn.innerHTML = '<i class="fa fa-cogs"></i> Управлять дисками';
    managementBtn.title = 'Управление состоянием подмены дисков';
    

    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(managementBtn, checkDisksBtn.nextSibling);
    }
    

    managementBtn.addEventListener('click', function(e) {
      e.preventDefault();
      addDiskTogglesToPCForms(rows);
    });
    
  }
  
  function addDiskTogglesToPCForms(rows) {

    const pcForms = document.querySelectorAll('form.pc');
    pcForms.forEach(form => {
      const uuid = form.id;
      if (!uuid) return;
      

      const existingToggle = form.querySelector('.disk-toggle-container');
      if (existingToggle) {
        existingToggle.remove();
      }
      

      if (!document.getElementById('ios-toggle-styles')) {
        const style = document.createElement('style');
        style.id = 'ios-toggle-styles';
        style.textContent = `
          .disk-toggle-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 5px;
                margin-left: 20%;
          }
          
          .disk-toggle-label {
            font-size: 10px;
            color: #666;
            font-weight: 500;
          }
          
          .ios-toggle {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 24px;
              margin: 0;
          
            }
          
          .ios-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .ios-toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
          }
          
          .ios-toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }
          
          .ios-toggle input:checked + .ios-toggle-slider {
            background-color: #28a745;
          }
          
          .ios-toggle input:checked + .ios-toggle-slider:before {
            transform: translateX(16px);
          }
          
          .ios-toggle input:focus + .ios-toggle-slider {
            box-shadow: 0 0 1px #28a745;
          }
        `;
        document.head.appendChild(style);
      }
      

      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'disk-toggle-container';
      toggleContainer.setAttribute('data-uuid', uuid);
      

      const toggle = document.createElement('label');
      toggle.className = 'ios-toggle';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      

      const existingDiskInfo = form.querySelector('.disk-info');
      if (existingDiskInfo) {
        const statusText = existingDiskInfo.textContent;

        const isSubstitutionEnabled = statusText.includes('Подмена включена');
        checkbox.checked = isSubstitutionEnabled;
      }
      
      const slider = document.createElement('span');
      slider.className = 'ios-toggle-slider';
      
      toggle.appendChild(checkbox);
      toggle.appendChild(slider);
      
      toggleContainer.appendChild(toggle);
      

      toggleContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox') {
          const newValue = e.target.checked;
          
          
          toggleDiskExclusion(uuid, newValue, this);
        }
      });
      

      const targetDiskInfo = form.querySelector('.disk-info');
      if (targetDiskInfo) {
        targetDiskInfo.appendChild(toggleContainer);
      } else {
        form.appendChild(toggleContainer);
      }
    });
    
    showNotification('Переключатели управления дисками добавлены в формы ПК', 'success', 2000);
  }
  
  function toggleDiskExclusion(uuid, value, container) {
    const clubId = getClubIdFromUrl();

    const invertedValue = !value;
    const url = `/freenas_wrap/crud.php?action=toggle_exclusion&club_id=${clubId}&machine_id=${uuid}&value=${invertedValue}`;
    
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      
      if (response.status === 200) {
        showNotification(`Состояние диска обновлено: ${value ? 'включена' : 'отключена'}`, 'success', 2000);
      } else {
        showNotification('Ошибка при обновлении состояния диска', 'error', 3000);

        const checkbox = container.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !value;
        }
      }
    })
    .catch(error => {
      console.error('Lan-Search: Ошибка при переключении диска:', error);
      showNotification('Ошибка сети при обновлении диска', 'error', 3000);

      const checkbox = container.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !value;
      }
    });
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
          const enabled = localHideCheckboxes === 'true';
          
          hideCheckboxesCache = enabled;
          hideCheckboxesCacheTime = now;
          
          callback(enabled);
        } else {
          const enabled = result.hideCheckboxes || false;
          
          
          hideCheckboxesCache = enabled;
          hideCheckboxesCacheTime = now;
          
          
          try {
            localStorage.setItem('lanSearchHideCheckboxes', enabled.toString());
          } catch (e) {
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      
      
      const localHideCheckboxes = localStorage.getItem('lanSearchHideCheckboxes');
      const enabled = localHideCheckboxes === 'true';
      
      hideCheckboxesCache = enabled;
      hideCheckboxesCacheTime = now;
      
      callback(enabled);
    }
  }
  
  function clearHideCheckboxesCache() {
    hideCheckboxesCache = null;
    hideCheckboxesCacheTime = 0;
  }
  
  function applyHideCheckboxes() {
    console.log('applyHideCheckboxes called');
    console.log('Current pathname:', window.location.pathname);
    if (window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-checkboxes');
      console.log('Added data-page and lan-search-hide-checkboxes class to body');
      console.log('Body classes:', document.body.className);
      console.log('Body data-page:', document.body.getAttribute('data-page'));
    } else {
      console.log('Not on all_clubs_pc page');
    }
  }
  
  function removeHideCheckboxes() {
    document.body.classList.remove('lan-search-hide-checkboxes');

    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
  }
  
  function initHideCheckboxes() {
    console.log('initHideCheckboxes called');
    if (!shouldAutoActivate()) {
      console.log('shouldAutoActivate returned false');
      return;
    }
    
    console.log('Current pathname:', window.location.pathname);
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      console.log('Not on all_clubs_pc page, returning');
      return;
    }
    


    
    let processingHideCheckboxes = false;
    
    function processHideCheckboxes() {
      console.log('processHideCheckboxes called');
      if (processingHideCheckboxes) return;
      processingHideCheckboxes = true;
      
      getHideCheckboxesSetting(function(hideCheckboxesEnabled) {
        console.log('getHideCheckboxesSetting callback, enabled:', hideCheckboxesEnabled);
        if (hideCheckboxesEnabled) {
          applyHideCheckboxes();
        } else {
          removeHideCheckboxes();
        }
        
        processingHideCheckboxes = false;
      });
    }
    
    

    
    
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
          const enabled = localHideComments === 'true';
          
          hideCommentsCache = enabled;
          hideCommentsCacheTime = now;
          
          callback(enabled);
        } else {
          const enabled = result.hideComments || false;
          
          
          hideCommentsCache = enabled;
          hideCommentsCacheTime = now;
          
          
          try {
            localStorage.setItem('lanSearchHideComments', enabled.toString());
          } catch (e) {
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      
      
      const localHideComments = localStorage.getItem('lanSearchHideComments');
      const enabled = localHideComments === 'true';
      
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
    console.log('applyHideComments called');
    console.log('Current pathname:', window.location.pathname);
    if (window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-comments');
      console.log('Added data-page and lan-search-hide-comments class to body');
      console.log('Body classes:', document.body.className);
      console.log('Body data-page:', document.body.getAttribute('data-page'));
    } else {
      console.log('Not on all_clubs_pc page');
    }
  }
  
  function removeHideComments() {
    document.body.classList.remove('lan-search-hide-comments');

    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
  }
  
  function initHideComments() {
    console.log('initHideComments called');
    if (!shouldAutoActivate()) {
      console.log('shouldAutoActivate returned false');
      return;
    }
    
    console.log('Current pathname:', window.location.pathname);
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      console.log('Not on all_clubs_pc page, returning');
      return;
    }
    


    
    let processingHideComments = false;
    
    function processHideComments() {
      console.log('processHideComments called');
      if (processingHideComments) return;
      processingHideComments = true;
      
      getHideCommentsSetting(function(hideCommentsEnabled) {
        console.log('getHideCommentsSetting callback, enabled:', hideCommentsEnabled);
        if (hideCommentsEnabled) {
          applyHideComments();
        } else {
          removeHideComments();
        }
        
        processingHideComments = false;
      });
    }
    
    

    
    
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideComments) {
        clearHideCommentsCache();
        processHideComments();
      }
    });
  }
  
  
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
         dropdown.classList.add('lan-search-dropdown');
         
         const dropdownToggle = dropdown.querySelector('.btn-pc');
         if (dropdownToggle) {
           dropdownToggle.classList.add('lan-search-dropdown-toggle');
           
           dropdownToggle.classList.remove('btn', 'btn-info', 'btn-sm', 'float-left');
         }
         
         
         dropdownToggle.addEventListener('click', function(e) {
           e.preventDefault();
           e.stopPropagation();
           
           const menu = dropdown.querySelector('.dropdown-menu');
           if (menu) {
             

            document.querySelectorAll('.lan-search-dropdown .dropdown-menu.show').forEach(otherMenu => {
              if (otherMenu !== menu) {
                otherMenu.classList.remove('show');
                
                const otherDropdown = otherMenu.closest('.lan-search-dropdown');
                if (otherDropdown) {
                  otherDropdown.classList.remove('menu-open');
                }
              }
            });
             
             
             const isOpen = menu.classList.contains('show');
             menu.classList.toggle('show');
             
             
             if (menu.classList.contains('show')) {
               dropdown.classList.add('menu-open');
             } else {
               dropdown.classList.remove('menu-open');
             }
           }
         });
       }
      
      
      const version = form.querySelector('.version');
      if (version && version.parentElement) {
        version.parentElement.classList.add('lan-search-version');
      }
    });
    
    if (pcForms.length > 0) {

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
    console.log('addManageButtonsToPCs called');
    

    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      return;
    }
    

    const pcForms = document.querySelectorAll('form.pc, .lan-search-pc-container');
    
    pcForms.forEach(form => {

      const unlockButton = form.querySelector('[data-type="UnLock"]');
      if (!unlockButton) return;
      

      if (form.querySelector('.lan-search-manage-btn')) return;
      

      const manageButton = form.querySelector('button[onclick*="StartRemote"]');
      if (!manageButton) return;
      

      const onclickAttr = manageButton.getAttribute('onclick');
      const uuidMatch = onclickAttr.match(/StartRemote\('([^']+)'\)/);
      if (!uuidMatch) return;
      
      const uuid = uuidMatch[1];
      

      const newManageButton = document.createElement('button');
      newManageButton.className = 'btn btn-primary btn-block lan-search-manage-btn';
      newManageButton.innerHTML = '<i class="fa fa-desktop"></i> Управлять';
      newManageButton.title = 'Управлять ПК';
      newManageButton.setAttribute('onclick', `StartRemote('${uuid}')`);
      

      unlockButton.parentNode.insertBefore(newManageButton, unlockButton.nextSibling);
      

      const allBrs = form.querySelectorAll('br');
      allBrs.forEach(br => br.remove());
      
      console.log('Added manage button for PC:', uuid);
    });
  }
  
  function initPCStyles() {
    if (!shouldAutoActivate()) return;
    
    
    let processingStyles = false;
    
    function processStyles() {
      if (processingStyles) return;
      processingStyles = true;
      
      getPCStylesSetting(function(stylesEnabled) {
        
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
       if (!e.target.closest('.lan-search-dropdown')) {

        document.querySelectorAll('.lan-search-dropdown .dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
          
          const dropdown = menu.closest('.lan-search-dropdown');
          if (dropdown) {
            dropdown.classList.remove('menu-open');
          }
        });
       }
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
            observerTimeout = setTimeout(processStyles, 500);
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
        initPCStyles();
        initTableOptimization();
        initHideCheckboxes();
        initHideComments();
        initDomainInfo();
        initEnergySavingIgnore();
        initWebSocketPCData();
        

        handleHideStylesOnUrlChange();
        

        addManageButtonsToPCs();
      });
    } else {
      initModalBypass();
      initPCSelection();
      initMassivePCSelection();
      initPCStyles();
      initTableOptimization();
      initHideCheckboxes();
      initHideComments();
      initDomainInfo();
      initEnergySavingIgnore();
      initWebSocketPCData();
      

      handleHideStylesOnUrlChange();
      

      addManageButtonsToPCs();
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


function getDomainInfoSetting(callback) {
  const now = Date.now();
  
  if (domainInfoCache !== null && (now - domainInfoCacheTime) < DOMAIN_INFO_CACHE_DURATION) {
    callback(domainInfoCache);
    return;
  }
  
  try {
    chrome.storage.sync.get(['domainInfo'], function(result) {
      if (chrome.runtime.lastError) {
        
        const localDomainInfo = localStorage.getItem('lanSearchDomainInfo');
        const enabled = localDomainInfo === 'true';
        
        domainInfoCache = enabled;
        domainInfoCacheTime = now;
        
        callback(enabled);
      } else {
        const enabled = result.domainInfo || false;
        
        domainInfoCache = enabled;
        domainInfoCacheTime = now;
        
        try {
          localStorage.setItem('lanSearchDomainInfo', enabled.toString());
        } catch (e) {
        }
        
        callback(enabled);
      }
    });
  } catch (e) {
    
    const localDomainInfo = localStorage.getItem('lanSearchDomainInfo');
    const enabled = localDomainInfo === 'true';
    
    domainInfoCache = enabled;
    domainInfoCacheTime = now;
    
    callback(enabled);
  }
}

function clearDomainInfoCache() {
  domainInfoCache = null;
  domainInfoCacheTime = 0;
}


async function searchDomainViaAPI(domain) {
  try {
    

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    
    const apiUrl = `https://k-connect.ru/api/domain-search/${encodeURIComponent(cleanDomain)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lan-Search: API ошибка:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.full_row) {
      
      const row = data.data.full_row;
      

      row.forEach((item, index) => {
      });
      
      return {
        name: row[1] || '', // Клуб
        id: row[0] || '', // ID
        domain: data.data.domain || cleanDomain, // Домен
        value: row[3] || '', // Execute name
        alias: row[4] || '', // Anydesk
        ip: row[5] || '', // IP
        command: row[9] || '', // Команда (индекс 9, а не 6!)
        info: row[12] || '', // Дополнительная информация

        rowNumber: data.data.row_number || '',
        columnNumber: data.data.column_number || '',
        matchedCell: data.data.matched_cell || '',
        searchedDomain: data.searched_domain || cleanDomain
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Lan-Search: Ошибка API запроса:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Lan-Search: Возможная CORS ошибка или недоступность API');
    }
    return null;
  }
}


async function processDomainInfoAPI(currentDomain) {
  
  const domainInfo = await searchDomainViaAPI(currentDomain);
  if (!domainInfo) {
    return;
  }
  
  

  domainInfoCache = domainInfo;
  domainInfoCacheTime = Date.now();
  

  if (document.getElementById('domainInfoContainer')) {
    return;
  }
  
  

  const guestSearchContainer = document.getElementById('guestSearchContainer');
  
  if (guestSearchContainer) {
    guestSearchContainer.parentNode.insertBefore(createDomainInfoBlock(domainInfo), guestSearchContainer.nextSibling);
  } else {
    

    const recentTabsContainer = document.getElementById('recentTabsContainer');
    
    if (recentTabsContainer) {
      recentTabsContainer.parentNode.insertBefore(createDomainInfoBlock(domainInfo), recentTabsContainer.nextSibling);
    } else {
      const langameWrapper = document.getElementById('langameSubscriptionWrapper');
      
      if (langameWrapper) {
        langameWrapper.parentNode.insertBefore(createDomainInfoBlock(domainInfo), langameWrapper.nextSibling);
      } else {
        const containerFluid = document.querySelector('.container-fluid');
        
        if (containerFluid) {
          containerFluid.appendChild(createDomainInfoBlock(domainInfo));
        } else {
          

          document.body.appendChild(createDomainInfoBlock(domainInfo));
        }
      }
    }
  }
}



function createDomainInfoBlock(domainInfo) {
  const container = document.createElement('div');
  container.id = 'domainInfoContainer';
  

  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark' || 
                     document.body.classList.contains('dark-theme') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  container.style.cssText = `
    margin-top: 15px;
    padding: 15px;
    background: var(--domain-info-bg, #f8f9fa);
    border: 1px solid var(--domain-info-border, #e9ecef);
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--domain-info-color, #333333);
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
    
  `;
  
  const title = document.createElement('h4');
  title.textContent = 'Информация по домену';
  title.style.cssText = `margin: 0 0 10px 0; color: var(--domain-info-title-color, #495057); font-size: 13px; transition: color 0.3s ease;`;
  

  const updateCommandBtn = document.createElement('button');
  updateCommandBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
      <path d="M23 4v6h-6"></path>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
    Обновить команду
  `;
  updateCommandBtn.style.cssText = `
    background: transparent;
    color: #28a745;
    border: 1px solid #28a745;
    border-radius: 4px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 10px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
    height: 28px;
  `;
  updateCommandBtn.title = 'Обновить команду через API (если CMD не работает)';
  

  updateCommandBtn.addEventListener('click', async () => {
    try {
      updateCommandBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; animation: spin 1s linear infinite;">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        Обновление...
      `;
      updateCommandBtn.style.background = 'transparent';
      updateCommandBtn.style.color = '#6c757d';
      updateCommandBtn.style.borderColor = '#6c757d';
      updateCommandBtn.disabled = true;
      
      const response = await fetch('https://k-connect.ru/api/domain-search/update-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: window.location.hostname,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        updateCommandBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          Обновлено!
        `;
        updateCommandBtn.style.background = 'transparent';
        updateCommandBtn.style.color = '#28a745';
        updateCommandBtn.style.borderColor = '#28a745';
        

        const reloadMessage = document.createElement('div');
        reloadMessage.textContent = 'Перезагрузите страницу для применения изменений';
        reloadMessage.style.cssText = `
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          color: #155724;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 10px;
          font-weight: 500;
          text-align: center;
          animation: fadeIn 0.3s ease;
        `;
        

        const titleContainer = updateCommandBtn.parentElement;
        titleContainer.appendChild(reloadMessage);
        
        setTimeout(() => {
          updateCommandBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Обновить команду
          `;
          updateCommandBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
          updateCommandBtn.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.3)';
          updateCommandBtn.disabled = false;
          reloadMessage.remove();
        }, 3000);
      } else {
        throw new Error('Ошибка обновления команды');
      }
    } catch (error) {
      console.error('Ошибка при обновлении команды:', error);
      updateCommandBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Ошибка!
      `;
      updateCommandBtn.style.background = 'transparent';
      updateCommandBtn.style.color = '#dc3545';
      updateCommandBtn.style.borderColor = '#dc3545';
      setTimeout(() => {
        updateCommandBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <path d="M23 4v6h-6"></path>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Обновить команду
        `;
        updateCommandBtn.style.background = 'transparent';
        updateCommandBtn.style.color = '#28a745';
        updateCommandBtn.style.borderColor = '#28a745';
        updateCommandBtn.disabled = false;
      }, 2000);
    }
  });
  

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
  titleContainer.appendChild(title);
  titleContainer.appendChild(updateCommandBtn);
  

  function createInfoBlock(label, value, isMultiline = false) {
    if (!value || value === 'Не указано' || value === '') return null;
    
    const block = document.createElement('div');
    block.style.cssText = `
      margin-bottom: 8px; 
      padding: 6px; 
      background: var(--domain-info-block-bg, white); 
      border-radius: 3px; 
      border: 1px solid var(--domain-info-block-border, #dee2e6);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;';
    
    const labelEl = document.createElement('strong');
    labelEl.textContent = label + ':';
    labelEl.style.cssText = `color: var(--domain-info-label-color, #495057); font-size: 11px; transition: color 0.3s ease;`;
    
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 4px 6px;
      font-size: 0;
      cursor: pointer;
      margin-left: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      min-height: 20px;
    `;
    copyBtn.title = 'Копировать';
    
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        copyBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        copyBtn.style.background = '#28a745';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
          copyBtn.style.background = '#007bff';
        }, 1000);
      } catch (err) {
        console.error('Ошибка копирования:', err);

        const textArea = document.createElement('textarea');
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        copyBtn.style.background = '#28a745';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
          copyBtn.style.background = '#007bff';
        }, 1000);
      }
    });
    
    header.appendChild(labelEl);
    header.appendChild(copyBtn);
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.cssText = `
      color: var(--domain-info-value-color, #212529);
      font-size: 10px;
      word-break: break-all;
      white-space: ${isMultiline ? 'pre-wrap' : 'nowrap'};
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: ${isMultiline ? '80px' : 'auto'};
      overflow-y: ${isMultiline ? 'auto' : 'hidden'};
      transition: color 0.3s ease;
    `;
    
    block.appendChild(header);
    block.appendChild(valueEl);
    
    return block;
  }
  

  const blocks = [
    createInfoBlock('Название клуба', domainInfo.name || 'Не указано'),
    createInfoBlock('ID', domainInfo.id || 'Не указано'),
    createInfoBlock('Домен', domainInfo.domain || 'Не указано'),
    createInfoBlock('Anydesk', domainInfo.alias || 'Не указано'),
    createInfoBlock('Команда', domainInfo.command || 'Не указано', true),
  ].filter(block => block !== null);
  
  container.appendChild(titleContainer);
  
  if (blocks.length === 0) {
    const noData = document.createElement('div');
    noData.textContent = 'Информация не найдена';
    noData.style.cssText = `color: ${isDarkTheme ? '#cccccc' : '#6c757d'}; font-style: italic; text-align: center; padding: 20px;`;
    container.appendChild(noData);
  } else {
    blocks.forEach(block => container.appendChild(block));
  }
  
  return container;
}

function initDomainInfo() {

  const isMainPage = window.location.pathname === '/' || 
                     window.location.pathname === '/dashboard/';
  
  if (!isMainPage) {
    return;
  }
  

  setTimeout(() => {
    getDomainInfoSetting(function(domainInfoEnabled) {
      if (!domainInfoEnabled) {
        return;
      }
      

      const currentDomain = window.location.hostname;
      

      const now = Date.now();
      if (domainInfoCache && domainInfoCacheTime && (now - domainInfoCacheTime) < DOMAIN_INFO_CACHE_DURATION) {
        processDomainInfoAPI(currentDomain);
        return;
      }
      

      processDomainInfoAPI(currentDomain);
    });
  }, 1000); // Задержка в 1 секунду для полной загрузки страницы
}


window.lanSearchSyncDomainInfo = function() {
  clearDomainInfoCache();
  getDomainInfoSetting(function(enabled) {
    if (enabled) {

      const isMainPage = window.location.pathname === '/' || 
                         window.location.pathname === '/dashboard/';
      
      if (isMainPage) {
        initDomainInfo();
      } else {
      }
    } else {
      const domainInfoContainer = document.getElementById('domainInfoContainer');
      if (domainInfoContainer) {
        domainInfoContainer.remove();
      }
    }
  });
};


function getEnergySavingIgnoreSetting(callback) {
  try {
    chrome.storage.sync.get(['energySavingIgnore'], function(result) {
      if (chrome.runtime.lastError) {
        const localEnergySaving = localStorage.getItem('lanSearchEnergySavingIgnore');
        const enabled = localEnergySaving === 'true';
        callback(enabled);
      } else {
        const enabled = result.energySavingIgnore || false;
        callback(enabled);
      }
    });
  } catch (e) {
    const localEnergySaving = localStorage.getItem('lanSearchEnergySavingIgnore');
    const enabled = localEnergySaving === 'true';
    callback(enabled);
  }
}

function initEnergySavingIgnore() {
  if (!window.location.pathname.includes('/all_clubs_pc/')) {
    return;
  }
  
  getEnergySavingIgnoreSetting(function(enabled) {
    if (enabled) {
      addEnergySavingIgnoreButtons();
      

      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {

            const hasNewDropdowns = Array.from(mutation.addedNodes).some(node => {
              return node.nodeType === 1 && (
                node.classList?.contains('dropdown-menu') ||
                node.querySelector?.('.dropdown-menu')
              );
            });
            
            if (hasNewDropdowns) {

              setTimeout(() => {
                addEnergySavingIgnoreButtons();
              }, 100);
            }
          }
        });
      });
      

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      

      window._lanSearchEnergySavingObserver = observer;
    } else {
      removeEnergySavingIgnoreButtons();
      

      if (window._lanSearchEnergySavingObserver) {
        window._lanSearchEnergySavingObserver.disconnect();
        window._lanSearchEnergySavingObserver = null;
      }
    }
  });
}

function addEnergySavingIgnoreButtons() {

  if (!window.location.pathname.includes('/all_clubs_pc/')) {
    return;
  }

  removeEnergySavingIgnoreButtons();
  

  const dropdownMenus = document.querySelectorAll('.dropdown-menu');
  
  dropdownMenus.forEach(menu => {

    const manageButton = menu.querySelector('button[onclick*="StartRemote"]');
    if (manageButton) {

      const onclickAttr = manageButton.getAttribute('onclick');
      const uuidMatch = onclickAttr.match(/StartRemote\('([^']+)'\)/);
      if (uuidMatch) {
        const uuid = uuidMatch[1];
        

        if (!menu.querySelector('.lan-search-energy-saving-btn')) {

          const energyButton = document.createElement('button');
          energyButton.className = 'btn btn-warning btn-block lan-search-energy-saving-btn';
          energyButton.innerHTML = '<i class="fa fa-power-off"></i>&nbsp;Игн. перевод в спящий';
          energyButton.title = 'Отключить энергосбережение монитора и ПК';
          

          energyButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleEnergySavingIgnore(uuid);
          });
          

          manageButton.parentNode.insertBefore(energyButton, manageButton.nextSibling);
          

          updateDropdownEventHandlers(menu);
        }
      }
    }
  });
}

function updateDropdownEventHandlers(menu) {

  const toggleButton = menu.closest('.dropdown, .btn-group')?.querySelector('[data-toggle="dropdown"], .dropdown-toggle');
  if (!toggleButton) return;
  

  toggleButton.addEventListener('click', function() {
    menu.classList.add('show');
  });
}

function removeEnergySavingIgnoreButtons() {
  const existingButtons = document.querySelectorAll('.lan-search-energy-saving-btn');
  existingButtons.forEach(button => button.remove());
  

  if (window._lanSearchEnergySavingObserver) {
    window._lanSearchEnergySavingObserver.disconnect();
    window._lanSearchEnergySavingObserver = null;
  }
}

function handleEnergySavingIgnore(uuid) {

  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('club_id') || '1';
  

  const endpoints = [
    '/monitor_ignore/crud.php',
    '/pc_energy_saving_ignore/crud.php'
  ];
  
  const requests = endpoints.map(endpoint => {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'ru,en-US;q=0.9,en;q=0.8,uk;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: `command=addClient&club_id=${clubId}&client=${uuid}`,
      mode: 'cors',
      credentials: 'include'
    });
  });
  

  Promise.all(requests)
    .then(responses => {
      const allSuccessful = responses.every(response => response.ok);
      if (allSuccessful) {
        showNotification('Энергосбережение отключено для монитора и ПК', 'success', 3000);
      } else {
        showNotification('Ошибка при отключении энергосбережения', 'error', 3000);
      }
    })
    .catch(error => {
      console.error('Ошибка при отключении энергосбережения:', error);
      showNotification('Ошибка при отключении энергосбережения', 'error', 3000);
    });
}


window.lanSearchSyncEnergySavingIgnore = function() {
  if (window.location.pathname.includes('/all_clubs_pc/')) {
    initEnergySavingIgnore();
  }
};


window.lanSearchGetDomainInfoSetting = getDomainInfoSetting;


window.lanSearchTestDomainInfo = function() {
  

  const testInfo = {
    name: 'Тестовое название',
    id: 'Тестовый ID',
    ip: '192.168.1.1',
    info: 'Тестовая информация'
  };
  
  const testBlock = createDomainInfoBlock(testInfo);
  

  const guestSearchContainer = document.getElementById('guestSearchContainer');
  if (guestSearchContainer) {
    guestSearchContainer.parentNode.insertBefore(testBlock, guestSearchContainer.nextSibling);
  } else {
    document.body.appendChild(testBlock);
  }
};


window.lanSearchTestAPI = async function(domain) {
  
  const testDomain = domain || window.location.hostname;
  const result = await searchDomainViaAPI(testDomain);
  
  if (result && result.command) {
  } else {
  }
  
  return result;
};


window.lanSearchTestCORS = async function() {
  
  try {
    const healthUrl = 'https://k-connect.ru/api/domain-search/health';
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data };
    } else {
      const errorText = await response.text();
      console.error('Lan-Search: Health check failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('Lan-Search: CORS/API test error:', error);
    return { success: false, error: error.message };
  }
};


window.lanSearchReloadData = async function() {
  

  clearDomainInfoCache();
  

  const existingBlock = document.getElementById('domainInfoContainer');
  if (existingBlock) {
    existingBlock.remove();
  }
  

  setTimeout(() => {

    const isMainPage = window.location.pathname === '/' || 
                       window.location.pathname === '/dashboard/';
    
    if (isMainPage) {
      initDomainInfo();
    } else {
    }
  }, 1000);
};


window.lanSearchDebugAPI = async function(domain) {
  
  const testDomain = domain || window.location.hostname;
  const cleanDomain = testDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
  
  try {
    const apiUrl = `https://k-connect.ru/api/domain-search/${encodeURIComponent(cleanDomain)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data && data.data.full_row) {
        data.data.full_row.forEach((item, index) => {
        });
      }
    } else {
      const errorText = await response.text();
      console.error('Lan-Search: Debug API error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Lan-Search: Debug API error:', error);
  }
};


console.log('Lan-Search: Принудительная инициализация для Firefox');
setTimeout(() => {
  console.log('Lan-Search: Запуск принудительной инициализации...');

  const isMainPage = window.location.pathname === '/' || 
                     window.location.pathname === '/dashboard/';
  
  if (isMainPage) {
    initDomainInfo();
  } else {
    console.log('Lan-Search: Принудительная инициализация пропущена - не главная страница');
  }
}, 2000);


setTimeout(() => {
  

  const isMainPage = window.location.pathname === '/' || 
                     window.location.pathname === '/dashboard/';
  
  if (isMainPage && !document.getElementById('domainInfoContainer')) {
    initDomainInfo();
  } else if (!isMainPage) {
  }
}, 5000); 


if (window.location.hostname.includes('f5center') && !document.getElementById('globalMenuSearchInput')) {
  console.log('Lan-Search: Повторная инициализация поиска для f5center.com...');

  setTimeout(() => {
    if (typeof window.lanSearchInit === 'function') {
      window.lanSearchInit();
    } else {
    }
  }, 100);
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