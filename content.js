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

  // Функция для проверки подходящего домена
  function isSuitableDomain() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('langame') || hostname.includes('cls');
  }

  // Устанавливаем атрибут домена для CSS селекторов
  function setDomainAttribute() {
    if (isSuitableDomain()) {
      document.documentElement.setAttribute('data-lansearch-domain', 'true');
    } else {
      document.documentElement.setAttribute('data-lansearch-domain', 'false');
    }
  }

  // Вызываем сразу при загрузке скрипта
  setDomainAttribute();



  function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    
    // Подключаем файл с темной темой только на подходящих доменах
    if (isSuitableDomain()) {
      const themeLink = document.createElement("link");
      themeLink.rel = "stylesheet";
      themeLink.href = chrome.runtime.getURL("theme.css");
      document.head.appendChild(themeLink);
      
      // Применяем тему сразу при загрузке скрипта
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
    `;
    document.head.appendChild(style);
  }

  // Функция для создания оверлея загрузки
  function createLoadingOverlay() {
    // Удаляем существующий оверлей если есть
    const existingOverlay = document.getElementById('lansearch-loading-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Ищем .content-wrapper
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) {
      return null; // Если нет .content-wrapper, не показываем оверлей
    }

    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.id = 'lansearch-loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #2d2d2d;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

    // Убеждаемся, что .content-wrapper имеет position: relative
    if (getComputedStyle(contentWrapper).position === 'static') {
      contentWrapper.style.position = 'relative';
    }

    // Создаем контейнер для спиннера и текста
    const content = document.createElement('div');
    content.style.cssText = `
      text-align: center;
      color: #ffffff;
    `;

    // Создаем спиннер
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid #444444;
      border-top: 4px solid #4c8bf5;
      border-radius: 50%;
      animation: lansearch-spin 1s linear infinite;
      margin: 0 auto 20px;
    `;

    // Создаем текст загрузки
    const text = document.createElement('div');
    text.textContent = 'Загрузка...';
    text.style.cssText = `
      font-size: 16px;
      color: #cccccc;
    `;

    // Добавляем CSS анимацию
    const style = document.createElement('style');
    style.textContent = `
      @keyframes lansearch-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    // Собираем оверлей
    content.appendChild(spinner);
    content.appendChild(text);
    overlay.appendChild(content);
    document.head.appendChild(style);
    contentWrapper.appendChild(overlay);


    return overlay;
  }

  // Функция для скрытия оверлея загрузки
  function hideLoadingOverlay() {
    const overlay = document.getElementById('lansearch-loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  // Функция для применения темы к странице
  function applyThemeToPage() {
    // Создаем оверлей загрузки сразу
    const loadingOverlay = createLoadingOverlay();
    
    // Сначала применяем тему синхронно для предотвращения FOUC
    try {
      const theme = localStorage.getItem('lanSearchTheme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // Fallback если localStorage недоступен
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Затем получаем актуальную тему из chrome.storage
    getCurrentTheme((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      // Сохраняем в localStorage для быстрого доступа
      try {
        localStorage.setItem('lanSearchTheme', theme);
      } catch (e) {
        // Игнорируем ошибки localStorage
      }
      
      // Применяем стили к существующим элементам
      applyThemeToNewElements();

      // Скрываем оверлей загрузки после применения темы
      setTimeout(() => {
        hideLoadingOverlay();
      }, 500);
    });
  }




  // Глобальная переменная для хранения текущей темы
  let currentTheme = 'light';
  let themeApplied = false;

  // Функция для получения темы из storage
  function getCurrentTheme(callback) {
    if (themeApplied) {
      callback(currentTheme);
      return;
    }
    
    try {
      // Проверяем доступность chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['theme'], function(result) {
          try {
            currentTheme = result.theme || 'light';
            themeApplied = true;
            callback(currentTheme);
          } catch (e) {
            // Fallback при ошибке в callback
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
        // Fallback если chrome.storage недоступен
        try {
          currentTheme = localStorage.getItem('lanSearchTheme') || 'light';
        } catch (e2) {
          currentTheme = 'light';
        }
        themeApplied = true;
        callback(currentTheme);
      }
    } catch (e) {
      // Fallback на localStorage
      try {
        currentTheme = localStorage.getItem('lanSearchTheme') || 'light';
      } catch (e2) {
        currentTheme = 'light';
      }
      themeApplied = true;
      callback(currentTheme);
    }
  }

  // Функция для применения темы к новым элементам
  function applyThemeToNewElements() {
    // Просто устанавливаем атрибут data-theme, остальное делает CSS
    getCurrentTheme((theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    });
  }

  // Функция для наблюдения за изменениями DOM
  function observeDOMChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Применяем тему к новым элементам
          setTimeout(applyThemeToNewElements, 100);
        }
      });
    });

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Функция для наблюдения за изменениями атрибута data-theme
  function observeThemeAttribute() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const htmlElement = document.documentElement;
          const currentTheme = htmlElement.getAttribute('data-theme');
          const oldTheme = mutation.oldValue;
          
          // Если атрибут data-theme пропал или изменился с dark на что-то другое
          if ((oldTheme === 'dark' && currentTheme !== 'dark') || 
              (oldTheme === 'dark' && !currentTheme)) {
            
            // Показываем оверлей загрузки
            createLoadingOverlay();
            
            // Применяем тему заново
            setTimeout(() => {
              applyThemeToNewElements();
              hideLoadingOverlay();
            }, 200);
          }
        }
      });
    });

    // Начинаем наблюдение за изменениями атрибута data-theme на html элементе
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
      attributeOldValue: true
    });
  }

  function createSearchBar(menuRoot) {
    // Проверяем, не создан ли уже поисковик
    if (document.getElementById(SEARCH_ID)) return document.getElementById(SEARCH_ID);

    // Создаем контейнер для поисковика
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
    
    // Вставляем поисковик в самое начало аккордеонного меню
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
    // highlighting removed per request
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
    // Используем нашу функцию проверки домена
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

    // Проверяем, не был ли уже инициализирован поиск
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

    // Автофокус только при ручной активации
    if (!shouldAutoActivate()) {
      input.focus();
    }
  }

      // Автоматическая активация на langame или cls доменах
  if (shouldAutoActivate()) {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Экспортируем функцию для ручной активации
  window.lanSearchInit = init;

  try {
    // Если не автоактивация, инициализируем только при вызове
    if (!shouldAutoActivate()) {
      // Функция будет вызвана из popup.js
    }
  } catch (e) {
    console.error("Lan-Search init error", e);
  }

  // Функциональность отслеживания последних использованных вкладок
  function initRecentTabsTracking() {
    const menuRoot = document.getElementById(MENU_ID);
    if (!menuRoot) return;

    // Используем менеджер последних вкладок
    if (window.recentTabsManager) {
      window.recentTabsManager.startTracking(menuRoot);
    }
  }

  // Функция для изменения заголовка вкладки на URL
  function setTabTitleToUrl() {
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    
    // Проверяем, что это подходящий домен
    if (hostname.includes('langame') || hostname.includes('cls')) {
      // Извлекаем только домен (без протокола и пути)
      const domain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      
      // Изменяем заголовок страницы напрямую в HTML
      document.title = domain;
    }
  }

  // Функция для инициализации отслеживания изменений URL
  function initUrlTracking() {
    let currentUrl = window.location.href;
    
    // Функция для проверки и обновления заголовка
    const checkAndUpdateTitle = () => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        setTabTitleToUrl();
        
        // Показываем оверлей загрузки при изменении URL
        if (currentTheme === 'dark') {
          createLoadingOverlay();
          // Скрываем через небольшую задержку
          setTimeout(() => {
            hideLoadingOverlay();
          }, 300);
        }
      }
    };

    // Отслеживаем изменения URL через History API
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

    // Отслеживаем событие popstate (навигация назад/вперед)
    window.addEventListener('popstate', () => {
      setTimeout(checkAndUpdateTitle, 100);
    });

    // Периодическая проверка (на случай если другие методы не сработают)
    setInterval(checkAndUpdateTitle, 1000);

    // Принудительно устанавливаем заголовок каждые 500мс
    setInterval(() => {
      const domain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      if (document.title !== domain) {
        document.title = domain;
      }
    }, 500);
  }

      // Инициализируем отслеживание вкладок
  if (shouldAutoActivate()) {
    // Показываем оверлей загрузки только если есть .content-wrapper
    if (document.querySelector('.content-wrapper')) {
      createLoadingOverlay();
    }
    
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

  // Слушатель изменений темы
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.theme) {
          const newTheme = changes.theme.newValue || 'light';
          currentTheme = newTheme; // Обновляем глобальную переменную
          document.documentElement.setAttribute('data-theme', newTheme);
          // Применяем тему к новым элементам при изменении темы
          setTimeout(() => {
            applyThemeToNewElements();
          }, 100);
        }
      });
    }
  } catch (e) {
    // Игнорируем ошибки если chrome.storage недоступен
    console.log('Chrome storage not available, using localStorage fallback');
  }

  // Периодическая проверка атрибута data-theme (дополнительная защита)
  setInterval(function() {
    const htmlElement = document.documentElement;
    const currentThemeAttr = htmlElement.getAttribute('data-theme');
    
    // Если тема должна быть dark, но атрибут отсутствует или неправильный
    if (currentTheme === 'dark' && currentThemeAttr !== 'dark') {
      // Показываем оверлей загрузки
      createLoadingOverlay();
      
      // Восстанавливаем атрибут
      htmlElement.setAttribute('data-theme', 'dark');
      
      // Скрываем оверлей
      setTimeout(() => {
        hideLoadingOverlay();
      }, 200);
    }
  }, 1000); // Проверяем каждую секунду

  // Слушатель для событий навигации (для SPA)
  window.addEventListener('popstate', function() {
    // Показываем оверлей загрузки сразу при навигации
    if (currentTheme === 'dark') {
      createLoadingOverlay();
    }
    
    // Применяем тему сразу
    applyThemeToNewElements();
    
    // Скрываем оверлей загрузки через небольшую задержку
    setTimeout(() => {
      hideLoadingOverlay();
    }, 200);
  });

  // Перехватываем pushState и replaceState для SPA
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    
    // Показываем оверлей загрузки сразу при навигации
    if (currentTheme === 'dark') {
      createLoadingOverlay();
    }
    
    // Применяем тему сразу
    applyThemeToNewElements();
    
    // Скрываем оверлей загрузки через небольшую задержку
    setTimeout(() => {
      hideLoadingOverlay();
    }, 200);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    
    // Показываем оверлей загрузки сразу при навигации
    if (currentTheme === 'dark') {
      createLoadingOverlay();
    }
    
    // Применяем тему сразу
    applyThemeToNewElements();
    
    // Скрываем оверлей загрузки через небольшую задержку
    setTimeout(() => {
      hideLoadingOverlay();
    }, 200);
  };

  // Слушатель для AJAX запросов (если используется XMLHttpRequest)
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(...args) {
    // Показываем оверлей загрузки при AJAX запросах
    if (currentTheme === 'dark') {
      createLoadingOverlay();
    }
    
    this.addEventListener('load', function() {
      setTimeout(() => {
        applyThemeToNewElements();
        
        // Скрываем оверлей загрузки
        setTimeout(() => {
          hideLoadingOverlay();
        }, 200);
      }, 100);
    });
    originalXHROpen.apply(this, args);
  };

  // Слушатель для fetch запросов
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    // Показываем оверлей загрузки при fetch запросах
    if (currentTheme === 'dark') {
      createLoadingOverlay();
    }
    
    return originalFetch.apply(this, args).then(response => {
      setTimeout(() => {
        applyThemeToNewElements();
        
        // Скрываем оверлей загрузки
        setTimeout(() => {
          hideLoadingOverlay();
        }, 200);
      }, 100);
      return response;
    });
  };

})();