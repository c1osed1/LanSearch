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
  
  
  window.initFavoritesDragDrop = initFavoritesDragDrop;
  

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
      
      console.log('Lan-Search: Drag start - globalDraggedElement:', globalDraggedElement);
      console.log('Lan-Search: Drag start - globalDraggedIndex:', globalDraggedIndex);
      
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.outerHTML);
    });
    
    card.addEventListener('dragend', function(e) {
      this.classList.remove('dragging');
      console.log('Lan-Search: Drag end - сбрасываем глобальные переменные');
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
      
      console.log('Lan-Search: Drop event triggered');
      console.log('Lan-Search: globalDraggedElement:', globalDraggedElement);
      console.log('Lan-Search: this (target):', this);
      console.log('Lan-Search: this !== globalDraggedElement:', this !== globalDraggedElement);
      
      if (this !== globalDraggedElement && globalDraggedElement) {
        
        const currentDraggedIndex = Array.from(this.parentNode.children).indexOf(globalDraggedElement);
        const dropIndex = Array.from(this.parentNode.children).indexOf(this);
        
        console.log('Lan-Search: Перемещение с индекса', currentDraggedIndex, 'на индекс', dropIndex);
        console.log('Lan-Search: globalDraggedElement до перемещения:', globalDraggedElement);
        
        
        if (currentDraggedIndex < dropIndex) {
          
          console.log('Lan-Search: Перемещение вниз - вставляем после');
          this.parentNode.insertBefore(globalDraggedElement, this.nextSibling);
        } else {
          
          console.log('Lan-Search: Перемещение вверх - вставляем перед');
          this.parentNode.insertBefore(globalDraggedElement, this);
        }
        
        console.log('Lan-Search: globalDraggedElement после перемещения:', globalDraggedElement);
        console.log('Lan-Search: Новый индекс globalDraggedElement:', Array.from(this.parentNode.children).indexOf(globalDraggedElement));
        
        
        globalDraggedIndex = Array.from(this.parentNode.children).indexOf(globalDraggedElement);
        
        
        saveFavoritesOrder();
        
        
        showNotification('Порядок избранных вкладок изменен', 'success', 2000);
      } else {
        console.log('Lan-Search: Drop не выполнен - условия не выполнены');
        console.log('Lan-Search: globalDraggedElement равен null или this === globalDraggedElement');
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
    
    console.log('Lan-Search: Найдено карточек для сохранения:', cards.length);
    
    
    window.recentTabsManager.getFavoriteTabs().then(favorites => {
      console.log('Lan-Search: Текущие избранные:', favorites.map(f => f.title));
      
      
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
        
        console.log(`Lan-Search: Карточка ${index}, найденный заголовок: "${cardTitle}"`);
        
        if (cardTitle) {
          const favorite = favorites.find(fav => fav.title === cardTitle);
          if (favorite) {
            reorderedFavorites.push(favorite);
            console.log(`Lan-Search: Позиция ${index}: ${favorite.title}`);
          } else {
            console.log(`Lan-Search: Не найден favorite для заголовка: "${cardTitle}"`);
          }
        }
      });
      
      
      favorites.forEach(favorite => {
        if (!reorderedFavorites.find(fav => fav.title === favorite.title)) {
          reorderedFavorites.push(favorite);
          console.log('Lan-Search: Добавлен оставшийся элемент:', favorite.title);
        }
      });
      
      console.log('Lan-Search: Финальный порядок:', reorderedFavorites.map(f => f.title));
      
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 
          'lanSearchFavoriteTabs': reorderedFavorites 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Ошибка сохранения порядка избранных:', chrome.runtime.lastError);
          } else {
            console.log('Lan-Search: Порядок избранных сохранен успешно');
            
            
            if (window.recentTabsManager && window.recentTabsManager.favoritesCache) {
              window.recentTabsManager.favoritesCache = reorderedFavorites;
              console.log('Lan-Search: Кэш избранных обновлен');
            }
          }
        });
      }
    });
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
          console.log('Lan-Search: Настройка обхода изменилась, сбрасываем кэш и обрабатываем кнопки');
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
            console.log('Lan-Search: Клик по заменённому div элементу, отправляем API запрос');
            

            
            const dataType = target.getAttribute('data-type');
            const clickId = dataType + '_' + Date.now();
            
            
            if (processedClicks.has(clickId)) {
              console.log('Lan-Search: Клик уже обрабатывается, пропускаем');
              return;
            }
            
            
            processedClicks.add(clickId);
            

            setTimeout(() => {
              processedClicks.delete(clickId);
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
      console.log('Lan-Search: Массовый выбор ПК доступен только на странице /pc_tasks/');
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
      font-size: 10px;
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
    
    console.log('Lan-Search: Панель массового выбора ПК создана и вставлена перед таблицей');
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
  
  function createMassiveSelectionPanelForAllClubs() {
    
    const leftColumn = document.querySelector('.row .col-12.col-lg-6');
    if (!leftColumn) {
      console.log('Lan-Search: Не найден левый блок для панели массового выбора');
      return;
    }
    
    
    const rowElement = leftColumn.closest('.row');
    if (!rowElement) {
      console.log('Lan-Search: Не найден родительский .row элемент');
      return;
    }
    
    
    const nextRowElement = rowElement.nextElementSibling;
    if (!nextRowElement || !nextRowElement.classList.contains('row')) {
      console.log('Lan-Search: Не найден следующий .row элемент');
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
    
    
    buttonsContainer.appendChild(selectBtn);
    buttonsContainer.appendChild(deselectBtn);
    
    quickButtons.appendChild(selectAllBtn);
    quickButtons.appendChild(clearAllBtn);
    quickButtons.appendChild(invertBtn);
    
    panel.appendChild(input);
    panel.appendChild(buttonsContainer);
    panel.appendChild(quickButtons);
    
    
    nextRowElement.parentNode.insertBefore(panel, nextRowElement);
    console.log('Lan-Search: Панель массового выбора вставлена между .row блоками');
    
    console.log('Lan-Search: Минималистичная панель массового выбора создана для /all_clubs_pc/');
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
    
    console.log('Lan-Search: Кнопка "Проверить диски" добавлена');
  }
  
  function getClubIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const clubId = urlParams.get('club_id');
    return clubId || '1';
  }
  
  function checkDisksStatus() {
    const clubId = getClubIdFromUrl();
    console.log('Lan-Search: Проверяем диски для club_id:', clubId);
    
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
  
  function parseDisksData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr[id^="pcID-"]');
    
    if (rows.length === 0) {
      showNotification('Диски не найдены', 'warning', 3000);
      return;
    }
    
    
    
    addDiskInfoToPCs(rows);
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
    return match ? match[1] : 'Не определено';
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
        <div style="font-size: 10px; color: #666;">${diskData.snapshotDate}</div>
        <div style="margin-top: 3px; font-size: 10px; color: ${statusColor}; font-weight: 500;">
          ${substitutionStatus}
        </div>
      `;
      
      
      const allBrs = form.querySelectorAll('br');
      if (allBrs.length > 0) {
        const lastBr = allBrs[allBrs.length - 1];
        lastBr.remove();
        console.log('Lan-Search: Удален последний <br> из формы', uuid);
      }
      
      
      const emptyDiv = form.querySelector('div.col-12.text-center');
      if (emptyDiv) {
        emptyDiv.remove();
        console.log('Lan-Search: Удален div.col-12.text-center из формы', uuid);
      }
      
      const unlockButton = form.querySelector('[data-type="UnLock"]');
      if (unlockButton) {
        unlockButton.parentNode.insertBefore(diskInfo, unlockButton.nextSibling);
      } else {
        
        form.appendChild(diskInfo);
      }
    });
  }
  

  if (shouldAutoActivate()) {
    console.log('Lan-Search: Инициализация обхода модальных окон на домене:', window.location.hostname);
    

    getModalBypassSetting(function(enabled) {
      console.log('Lan-Search: Настройка обхода модальных окон:', enabled ? 'ВКЛЮЧЕНА' : 'ОТКЛЮЧЕНА');
    });
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initModalBypass();
        initPCSelection();
        initMassivePCSelection();
      });
    } else {
      initModalBypass();
      initPCSelection();
      initMassivePCSelection();
    }
  }

})(); 