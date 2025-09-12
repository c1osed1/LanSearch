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
    return hostname.includes('langame') || hostname.includes('cls');
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
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http:
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

  function getItemLabel(li) {
    const labelNode = li.querySelector(".nav-link-text") || li.querySelector("a");
    const text = labelNode ? labelNode.textContent : li.textContent;
    return normalize(text);
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
    const visibleLis = $all("li", menuRoot).filter((li) => !li.classList.contains("gms-hidden"));
    const links = [];
    visibleLis.forEach((li) => {
      const a = li.querySelector("a[href]");
      if (a && !a.getAttribute("href")?.startsWith("#")) links.push({ li, a });
    });
    return links;
  }

  function filterMenu(menuRoot, queryRaw) {
    const query = normalize(queryRaw);
    const listItems = $all("li", menuRoot);

    clearHighlights(menuRoot);

    if (!query) {
      listItems.forEach((li) => li.classList.remove("gms-hidden"));
      const noRes = $(".gms-no-results", menuRoot.parentElement);
      if (noRes) noRes.remove();
      restoreInitialCollapseState(menuRoot);
      return;
    }

    let matches = [];

    listItems.forEach((li) => {
      const label = getItemLabel(li);
      const isMatch = label.includes(query);
      if (isMatch) {
        li.classList.remove("gms-hidden");
        matches.push(li);
      } else {
        li.classList.add("gms-hidden");
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
    if (window.lanSearchIsCurrentDomainSuitable) {
      return window.lanSearchIsCurrentDomainSuitable();
    }

    return isSuitableDomain();
  }

  function init() {
    const menuRoot = document.getElementById(MENU_ID);
    if (!menuRoot) {
      if (shouldAutoActivate()) {
        console.log("Lan-Search: элемент #globalMenuAccordion не найден на langame или cls домене");
      }
      return;
    }


    if (document.getElementById(SEARCH_ID)) {
      return;
    }

    injectStylesOnce();
    const input = createSearchBar(menuRoot);
    captureInitialCollapseState(menuRoot);

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


  if (shouldAutoActivate()) {

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }


  window.lanSearchInit = init;
  

  window.lanSearchSyncModalBypass = function() {
    console.log('Lan-Search: Принудительная синхронизация настроек модального обхода');
    clearModalBypassCache();
    getModalBypassSetting(function(enabled) {
      if (enabled) {
        console.log('Lan-Search: Синхронизация завершена - обход ВКЛЮЧЕН, заменяем кнопки на div');
        replaceButtonsWithDivs();
      } else {
        console.log('Lan-Search: Синхронизация завершена - обход ОТКЛЮЧЕН, восстанавливаем кнопки');
        restoreDivsToButtons();
      }
    });
  };
  
  
  window.lanSearchTestButtonReplacement = function() {
    console.log('Lan-Search: Ручное тестирование замены кнопок');
    replaceButtonsWithDivs();
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


  function setTabTitleToUrl() {
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    

    if (hostname.includes('langame') || hostname.includes('cls')) {

      const domain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      

      document.title = domain;
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

    console.log('Chrome storage not available, using localStorage fallback');
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
    
    console.log('Lan-Search: Отправляем запрос на URL:', url);
    console.log('Lan-Search: Тело запроса:', body);
    
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
    const command = button.getAttribute('data-type');
    if (!command) return null;
    
    let uuid = null;
    let whoSend = null;
    
    
    const onclick = button.getAttribute('onclick');
    if (onclick) {
      const uuidMatch = onclick.match(/['"]([A-F0-9a-f-]{36})['\"]/i);
      if (uuidMatch) {
        uuid = uuidMatch[1];
      }
    }
    
    if (!uuid) {
      let parent = button.parentElement;
      while (parent && parent !== document.body) {
        const parentId = parent.getAttribute('id');
        if (parentId && parentId.match(/^[A-F0-9a-f-]{36}$/i)) {
          uuid = parentId;
          console.log('Lan-Search: UUID найден в родительском элементе:', uuid);
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
            console.log('Lan-Search: UUID найден в другой кнопке:', uuid);
            break;
          }
        }
      }
    }
    
    if (!uuid) {
      console.warn('Lan-Search: UUID не найден для команды:', command);
      return null;
    }
    
    
    whoSend = getCookieValue('PHPSESSID') || getSessionId();
    
    console.log('Lan-Search: Извлеченные параметры - UUID:', uuid, 'Command:', command, 'WhoSend:', whoSend);
    
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
          console.log('Lan-Search: UUID найден в родительском элементе для div:', uuid);
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
            console.log('Lan-Search: UUID найден в другой кнопке для div:', uuid);
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
    
    console.log('Lan-Search: Извлеченные параметры из div - UUID:', uuid, 'Command:', command, 'WhoSend:', whoSend);
    
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
  

  function replaceButtonsWithDivs() {
    const supportedCommands = ['startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC', 'Lock', 'UnLock'];
    console.log('Lan-Search: Начинаем замену кнопок на div элементы');
    
    
    const buttons = document.querySelectorAll('button[data-type]');
    console.log('Lan-Search: Найдено кнопок с data-type:', buttons.length);
    buttons.forEach(button => {
      console.log('Lan-Search: Кнопка с data-type:', button.getAttribute('data-type'), 'Текст:', button.textContent.trim());
    });
    
    
    const allButtons = document.querySelectorAll('button');
    console.log('Lan-Search: Всего кнопок на странице:', allButtons.length);
    
    const lockButtons = Array.from(allButtons).filter(button => {
      const text = button.textContent.trim().toLowerCase();
      const isLockButton = text === 'заблокировать' || text === 'разблокировать';
      if (isLockButton) {
        console.log('Lan-Search: Найдена кнопка Lock/UnLock по тексту:', text, 'data-type:', button.getAttribute('data-type'));
      }
      return isLockButton;
    });
    console.log('Lan-Search: Найдено кнопок Lock/UnLock по тексту:', lockButtons.length);
    
    
    const allButtonsToProcess = [...new Set([...buttons, ...lockButtons])];
    console.log('Lan-Search: Всего кнопок для обработки:', allButtonsToProcess.length);
    
    allButtonsToProcess.forEach((button, index) => {
      console.log(`Lan-Search: Обрабатываем кнопку ${index + 1}/${allButtonsToProcess.length}`);
      
      
      if (button.getAttribute('data-lan-search-replaced') === 'true') {
        console.log('Lan-Search: Кнопка уже заменена, пропускаем');
        return;
      }
      
      const dataType = button.getAttribute('data-type');
      const buttonText = button.textContent.trim();
      console.log('Lan-Search: Обрабатываем кнопку - data-type:', dataType, 'Текст:', buttonText);
      
      let command = dataType;
      
      
      if (!command) {
        if (buttonText.toLowerCase() === 'заблокировать') {
          command = 'Lock';
        } else if (buttonText.toLowerCase() === 'разблокировать') {
          command = 'UnLock';
        }
      }
      
      console.log('Lan-Search: Определенная команда:', command);
      
      if (supportedCommands.includes(command)) {
        console.log('Lan-Search: Заменяем кнопку на div для команды:', command);
        
        
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
        } else {
          
          div.setAttribute('data-original-onclick', '');
        }
        
        
        div.setAttribute('data-lan-search-replaced', 'true');
        
        
        div.innerHTML = button.innerHTML;
        
        
        div.style.cssText = button.style.cssText;
        
        
        div.style.cursor = 'pointer';
        
        
        button.parentNode.replaceChild(div, button);
        console.log('Lan-Search: Кнопка успешно заменена на div для команды:', command);
      } else {
        console.log('Lan-Search: Кнопка не поддерживается, команда:', command);
      }
    });
    
    console.log('Lan-Search: Замена кнопок завершена');
  }


  function restoreDivsToButtons() {

    const divs = document.querySelectorAll('div[data-lan-search-replaced="true"]');
    divs.forEach(div => {
      console.log('Lan-Search: Восстанавливаем div обратно в кнопку');
      

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
    

    function processButtons() {
      getModalBypassSetting(function(bypassEnabled) {
        if (bypassEnabled) {
          replaceButtonsWithDivs();
        } else {
          restoreDivsToButtons();
        }
      });
    }
    

    processButtons();
    

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(processButtons, 100);
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
          console.log('Lan-Search: Настройка обхода изменилась, сбрасываем кэш и обрабатываем кнопки');
          clearModalBypassCache();
          processButtons();
        }
      });
    }
    

    document.addEventListener('click', function(event) {
      const target = event.target;
      

      const dataType = target.getAttribute('data-type');
      const supportedCommands = ['startTehTime', 'stopTehTime', 'rebootPC', 'shutdownPC', 'Lock', 'UnLock'];
      
      if (target.tagName === 'DIV' && supportedCommands.includes(dataType) && target.hasAttribute('data-lan-search-replaced')) {
        getModalBypassSetting(function(bypassEnabled) {
          if (bypassEnabled) {
            console.log('Lan-Search: Клик по заменённому div элементу, отправляем API запрос');
            

            const clickId = target.getAttribute('data-original-onclick') + '_' + Date.now();
            

            if (processedClicks.has(clickId.split('_')[0])) {
              console.log('Lan-Search: Клик уже обрабатывается, пропускаем');
              return;
            }
            

            processedClicks.add(clickId.split('_')[0]);
            

            setTimeout(() => {
              processedClicks.delete(clickId.split('_')[0]);
            }, 3000);
            

            const params = extractButtonParamsFromDiv(target);
            if (params) {
              console.log('Lan-Search: Отправляем API запрос для div элемента');
              

              const originalText = target.textContent;
              target.textContent = 'Выполняется...';
              target.style.pointerEvents = 'none';
              

              sendDirectCommand(params.uuid, params.command, params.whoSend)
                .then(response => response.json())
                .then(data => {
                  console.log('Lan-Search: Ответ от API:', data);
                  

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


  if (shouldAutoActivate()) {
    console.log('Lan-Search: Инициализация обхода модальных окон на домене:', window.location.hostname);
    

    getModalBypassSetting(function(enabled) {
      console.log('Lan-Search: Настройка обхода модальных окон:', enabled ? 'ВКЛЮЧЕНА' : 'ОТКЛЮЧЕНА');
    });
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModalBypass);
    } else {
      initModalBypass();
    }
  }

})(); 