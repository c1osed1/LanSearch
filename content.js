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
    // Отключаем расширение на странице /pc_tasks_config/ чтобы не ломать Bootstrap Select
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


  function handleHideStylesOnUrlChange() {
    // Проверяем настройки скрытия и применяем/убираем стили в зависимости от URL
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
        
        // НЕ обрабатываем стили скрытия при изменении URL
        // Стили работают только локально на вкладке
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

  
  function setModalBypassSetting(enabled) {
    try {
      // Сохраняем в localStorage
      localStorage.setItem('lanSearchModalBypass', enabled.toString());
      
      // Сохраняем в chrome.storage если доступен
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ modalBypass: enabled }, function() {
          console.log('Lan-Search: Настройка обхода модальных окон изменена:', enabled);
        });
      }
      
      // Обновляем кэш
      modalBypassCache = enabled;
      modalBypassCacheTime = Date.now();
      
      // Обрабатываем кнопки с новым состоянием
      if (window.lanSearchProcessButtons) {
        window.lanSearchProcessButtons();
      }
    } catch (e) {
      console.log('Lan-Search: Ошибка при изменении настройки обхода модальных окон:', e);
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
    
    // Делаем processButtons доступной глобально
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
        
        // Сохраняем текущее состояние обхода модальных окон и временно восстанавливаем кнопки
        getModalBypassSetting(function(currentState) {
          savedModalBypassState = currentState;
          if (currentState) {
            // Временно восстанавливаем кнопки без изменения настроек
            restoreDivsToButtons();
            console.log('Lan-Search: Кнопки временно восстановлены для режима выбора (настройки не изменены)');
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
  
  function restoreHiddenElements() {
    console.log('Lan-Search: Восстановление скрытых элементов');
    
    // Убираем классы скрытия
    document.body.classList.remove('lan-search-hide-checkboxes');
    document.body.classList.remove('lan-search-hide-comments');
    
    // Убираем атрибут data-page
    document.body.removeAttribute('data-page');
    
    // Показываем уведомление
    showNotification('Скрытые элементы восстановлены!', 'success', 3000);
    
    console.log('Lan-Search: Элементы восстановлены локально на этой вкладке');
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
    
    
    // Кнопка восстановления элементов
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
    
    // Применяем текущие настройки обхода модальных окон (не изменяем их)
    if (savedModalBypassState !== null) {
      if (savedModalBypassState) {
        // Применяем текущие настройки без их изменения
        if (window.lanSearchProcessButtons) {
          window.lanSearchProcessButtons();
        }
        console.log('Lan-Search: Применены текущие настройки обхода модальных окон');
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
    
    // Находим кнопку "Проверить диски"
    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {
      // Сохраняем оригинальный текст
      const originalText = checkDisksBtn.innerHTML;
      
      // Показываем индикатор загрузки
      checkDisksBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Проверяем...';
      checkDisksBtn.disabled = true;
      checkDisksBtn.style.opacity = '0.7';
      
      // Восстанавливаем кнопку после завершения запроса
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
      // Если кнопка не найдена, показываем только уведомление
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
    
    console.log('Lan-Search: Найдено заголовков:', allHeadings.length);
    
    allHeadings.forEach((heading, index) => {
      const text = heading.textContent.trim();
      console.log(`Lan-Search: Заголовок ${index}:`, text);
      
      if (text === 'Снимки') {
        snapshotAlert = heading.closest('.alert.alert-info');
        console.log('Lan-Search: Найден правильный заголовок "Снимки"');
      }
    });
    
    console.log('Lan-Search: Найден блок alert:', snapshotAlert);
    
    if (snapshotAlert) {
      console.log('Lan-Search: Содержимое блока alert:', snapshotAlert.innerHTML);
      const latestSnapshotDate = extractLatestSnapshotDate(snapshotAlert);
      console.log('Lan-Search: Извлеченная дата:', latestSnapshotDate);
      
      if (latestSnapshotDate) {
        addSnapshotInfoButton(latestSnapshotDate);
      } else {
        console.log('Lan-Search: Не удалось извлечь дату из блока alert');
      }
    } else {
      console.log('Lan-Search: Блок с заголовком "Снимки" не найден в HTML ответе');
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
    // Ищем дату в формате: bigPool/reference@10.10.2025 10:31:24
    const match = statusText.match(/bigPool\/reference@(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
    if (match) {
      const dateTime = match[1];
      // Убираем секунды, оставляем только дату и время до минут
      return dateTime.substring(0, 16); 
    }
    return 'Не определено';
  }
  
  function extractLatestSnapshotDate(snapshotAlert) {
    const dateCells = snapshotAlert.querySelectorAll('.col-4');
    console.log('Lan-Search: Найдено .col-4 элементов:', dateCells.length);
    
    let latestDate = null;
    let latestDateStr = null;
    
    dateCells.forEach((cell, index) => {
      const dateText = cell.textContent.trim();
      console.log(`Lan-Search: Элемент ${index}:`, dateText);
      
      const dateMatch = dateText.match(/(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        console.log('Lan-Search: Найдена дата:', dateStr);
        
        const date = new Date(dateStr.split(' ')[0].split('.').reverse().join('-') + ' ' + dateStr.split(' ')[1]);
        
        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestDateStr = dateStr;
          console.log('Lan-Search: Новая самая свежая дата:', dateStr);
        }
      }
    });
    
    console.log('Lan-Search: Итоговая самая свежая дата:', latestDateStr);
    return latestDateStr;
  }
  
  function addSnapshotInfoButton(latestDate) {
    console.log('Lan-Search: Создаем кнопку с датой:', latestDate);
    
    
    const existingBtn = document.getElementById('snapshotInfoBtn');
    if (existingBtn) {
      existingBtn.remove();
      console.log('Lan-Search: Удалена существующая кнопка snapshot');
    }
    
    
    const snapshotBtn = document.createElement('a');
    snapshotBtn.id = 'snapshotInfoBtn';
    snapshotBtn.href = '#';
    snapshotBtn.className = 'btn btn-outline-success mb-3 mr-1';
    snapshotBtn.innerHTML = `<i class="fa fa-clock-o"></i> ${latestDate}`;
    snapshotBtn.title = 'Последний снимок FreeNAS';
    
    
    const checkDisksBtn = document.getElementById('checkDisksBtn');
    console.log('Lan-Search: Найдена кнопка checkDisksBtn:', checkDisksBtn);
    
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(snapshotBtn, checkDisksBtn.nextSibling);
      console.log('Lan-Search: Кнопка с информацией о снимке добавлена:', latestDate);
    } else {
      console.log('Lan-Search: Кнопка checkDisksBtn не найдена, не удалось вставить snapshot кнопку');
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
  
  function addDiskManagementButton(rows) {
    // Удаляем существующую кнопку управления дисками
    const existingBtn = document.getElementById('diskManagementBtn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Создаем кнопку управления дисками
    const managementBtn = document.createElement('a');
    managementBtn.id = 'diskManagementBtn';
    managementBtn.href = '#';
    managementBtn.className = 'btn btn-outline-warning mb-3 mr-1';
    managementBtn.innerHTML = '<i class="fa fa-cogs"></i> Управлять дисками';
    managementBtn.title = 'Управление состоянием подмены дисков';
    
    // Добавляем кнопку после кнопки проверки дисков
    const checkDisksBtn = document.getElementById('checkDisksBtn');
    if (checkDisksBtn) {
      checkDisksBtn.parentNode.insertBefore(managementBtn, checkDisksBtn.nextSibling);
    }
    
    // Обработчик клика - добавляем переключатели в формы ПК
    managementBtn.addEventListener('click', function(e) {
      e.preventDefault();
      addDiskTogglesToPCForms(rows);
    });
    
    console.log('Lan-Search: Кнопка "Управлять дисками" добавлена');
  }
  
  function addDiskTogglesToPCForms(rows) {
    // Просто добавляем переключатели к существующим формам ПК
    const pcForms = document.querySelectorAll('form.pc');
    pcForms.forEach(form => {
      const uuid = form.id;
      if (!uuid) return;
      
      // Удаляем существующий переключатель
      const existingToggle = form.querySelector('.disk-toggle-container');
      if (existingToggle) {
        existingToggle.remove();
      }
      
      // Добавляем стили для iOS переключателя
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
      
      // Создаем контейнер переключателя
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'disk-toggle-container';
      toggleContainer.setAttribute('data-uuid', uuid);
      
      // Создаем переключатель
      const toggle = document.createElement('label');
      toggle.className = 'ios-toggle';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      
      // Определяем начальное состояние на основе существующей информации о подмене
      const existingDiskInfo = form.querySelector('.disk-info');
      if (existingDiskInfo) {
        const statusText = existingDiskInfo.textContent;
        // Если в тексте есть "Подмена включена", то переключатель должен быть включен
        const isSubstitutionEnabled = statusText.includes('Подмена включена');
        checkbox.checked = isSubstitutionEnabled;
        console.log('Lan-Search: Начальное состояние переключателя для', uuid, ':', isSubstitutionEnabled ? 'включен' : 'выключен');
      }
      
      const slider = document.createElement('span');
      slider.className = 'ios-toggle-slider';
      
      toggle.appendChild(checkbox);
      toggle.appendChild(slider);
      
      toggleContainer.appendChild(toggle);
      
      // Добавляем обработчик клика
      toggleContainer.addEventListener('click', function(e) {
        if (e.target.type === 'checkbox') {
          const newValue = e.target.checked;
          
          console.log('Lan-Search: Переключение диска для UUID:', uuid, 'Новое значение:', newValue);
          
          toggleDiskExclusion(uuid, newValue, this);
        }
      });
      
      // Вставляем переключатель в форму
      const targetDiskInfo = form.querySelector('.disk-info');
      if (targetDiskInfo) {
        targetDiskInfo.appendChild(toggleContainer);
      } else {
        form.appendChild(toggleContainer);
      }
    });
    
    showNotification('Переключатели управления дисками добавлены в формы ПК', 'success', 2000);
    console.log('Lan-Search: Переключатели управления дисками добавлены в формы ПК');
  }
  
  function toggleDiskExclusion(uuid, value, container) {
    const clubId = getClubIdFromUrl();
    const url = `/freenas_wrap/crud.php?action=toggle_exclusion&club_id=${clubId}&machine_id=${uuid}&value=${value}`;
    
    console.log('Lan-Search: Отправляем запрос на переключение диска:', url);
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      console.log('Lan-Search: Статус ответа:', response.status);
      
      if (response.status === 200) {
        showNotification(`Состояние диска обновлено: ${value ? 'включена' : 'отключена'}`, 'success', 2000);
      } else {
        showNotification('Ошибка при обновлении состояния диска', 'error', 3000);
        // Возвращаем переключатель в исходное состояние
        const checkbox = container.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !value;
        }
      }
    })
    .catch(error => {
      console.error('Lan-Search: Ошибка при переключении диска:', error);
      showNotification('Ошибка сети при обновлении диска', 'error', 3000);
      // Возвращаем переключатель в исходное состояние
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
          console.log('Lan-Search: Ошибка получения настроек оптимизации таблиц из chrome.storage:', chrome.runtime.lastError);
          
          
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
            console.log('Lan-Search: Не удалось сохранить настройки оптимизации таблиц в localStorage:', e);
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      console.log('Lan-Search: Ошибка при получении настроек оптимизации таблиц:', e);
      
      
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
      // Оптимизация применена
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
      // Названия восстановлены
    }
  }
  
  function initTableOptimization() {
    if (!shouldAutoActivate()) return;
    
    let processingOptimization = false;
    
    function processOptimization() {
      if (processingOptimization) return;
      processingOptimization = true;
      
      getTableOptimizationSetting(function(optimizationEnabled) {
        console.log('Lan-Search: Оптимизация таблиц:', optimizationEnabled ? 'ВКЛЮЧЕНА' : 'ОТКЛЮЧЕНА');
        
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
        console.log('Lan-Search: Обнаружено изменение настроек оптимизации таблиц');
        clearTableOptimizationCache();
        processOptimization();
      }
    });
  }
  
  
  window.lanSearchSyncTableOptimization = function() {
    console.log('Lan-Search: Принудительная синхронизация настроек оптимизации таблиц');
    clearTableOptimizationCache();
    getTableOptimizationSetting(function(enabled) {
      if (enabled) {
        console.log('Lan-Search: Синхронизация завершена - оптимизация таблиц ВКЛЮЧЕНА');
        applyTableOptimization();
      } else {
        console.log('Lan-Search: Синхронизация завершена - оптимизация таблиц ОТКЛЮЧЕНА');
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
          console.log('Lan-Search: Ошибка получения настроек скрытия чекбоксов из chrome.storage:', chrome.runtime.lastError);
          
          
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
            console.log('Lan-Search: Не удалось сохранить настройки скрытия чекбоксов в localStorage:', e);
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      console.log('Lan-Search: Ошибка при получении настроек скрытия чекбоксов:', e);
      
      
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
    // Применяем стили только на странице /all_clubs_pc/
    if (window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-checkboxes');
      console.log('Lan-Search: Скрытие чекбоксов ПК применено');
    } else {
      console.log('Lan-Search: Скрытие чекбоксов ПК не применено - не на странице /all_clubs_pc/');
    }
  }
  
  function removeHideCheckboxes() {
    document.body.classList.remove('lan-search-hide-checkboxes');
    // Убираем атрибут data-page только если мы не на странице /all_clubs_pc/
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
  }
  
  function initHideCheckboxes() {
    if (!shouldAutoActivate()) return;
    
    // Проверяем, что мы на правильной странице
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      console.log('Lan-Search: Скрытие чекбоксов ПК доступно только на странице /all_clubs_pc/');
      return;
    }
    
    // НЕ применяем стили автоматически при инициализации
    // Стили будут применяться только при явном вызове из popup
    console.log('Lan-Search: Инициализация скрытия чекбоксов ПК (без автоматического применения)');
    
    let processingHideCheckboxes = false;
    
    function processHideCheckboxes() {
      if (processingHideCheckboxes) return;
      processingHideCheckboxes = true;
      
      getHideCheckboxesSetting(function(hideCheckboxesEnabled) {
        console.log('Lan-Search: Скрытие чекбоксов ПК:', hideCheckboxesEnabled ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО');
        
        // НЕ применяем стили автоматически - только при явном вызове
        console.log('Lan-Search: Стили скрытия чекбоксов готовы к применению (не применены автоматически)');
        
        processingHideCheckboxes = false;
      });
    }
    
    
    // НЕ вызываем processHideCheckboxes() автоматически
    
    
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideCheckboxes) {
        console.log('Lan-Search: Обнаружено изменение настроек скрытия чекбоксов');
        clearHideCheckboxesCache();
        processHideCheckboxes();
      }
    });
  }
  
  
  window.lanSearchSyncHideCheckboxes = function() {
    console.log('Lan-Search: Принудительная синхронизация настроек скрытия чекбоксов');
    clearHideCheckboxesCache();
    getHideCheckboxesSetting(function(enabled) {
      if (enabled) {
        console.log('Lan-Search: Синхронизация завершена - скрытие чекбоксов ВКЛЮЧЕНО');
        applyHideCheckboxes();
      } else {
        console.log('Lan-Search: Синхронизация завершена - скрытие чекбоксов ОТКЛЮЧЕНО');
        removeHideCheckboxes();
      }
    });
  };

  // Глобальные функции для получения настроек скрытия
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
          console.log('Lan-Search: Ошибка получения настроек скрытия комментариев из chrome.storage:', chrome.runtime.lastError);
          
          
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
            console.log('Lan-Search: Не удалось сохранить настройки скрытия комментариев в localStorage:', e);
          }
          
          callback(enabled);
        }
      });
    } catch (e) {
      console.log('Lan-Search: Ошибка при получении настроек скрытия комментариев:', e);
      
      
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
    // Применяем стили только на странице /all_clubs_pc/
    if (window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.setAttribute('data-page', 'all_clubs_pc');
    document.body.classList.add('lan-search-hide-comments');
      console.log('Lan-Search: Скрытие комментариев ПК применено');
    } else {
      console.log('Lan-Search: Скрытие комментариев ПК не применено - не на странице /all_clubs_pc/');
    }
  }
  
  function removeHideComments() {
    document.body.classList.remove('lan-search-hide-comments');
    // Убираем атрибут data-page только если мы не на странице /all_clubs_pc/
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      document.body.removeAttribute('data-page');
    }
  }
  
  function initHideComments() {
    if (!shouldAutoActivate()) return;
    
    // Проверяем, что мы на правильной странице
    if (!window.location.pathname.includes('/all_clubs_pc/')) {
      console.log('Lan-Search: Скрытие комментариев ПК доступно только на странице /all_clubs_pc/');
      return;
    }
    
    // НЕ применяем стили автоматически при инициализации
    // Стили будут применяться только при явном вызове из popup
    console.log('Lan-Search: Инициализация скрытия комментариев ПК (без автоматического применения)');
    
    let processingHideComments = false;
    
    function processHideComments() {
      if (processingHideComments) return;
      processingHideComments = true;
      
      getHideCommentsSetting(function(hideCommentsEnabled) {
        console.log('Lan-Search: Скрытие комментариев ПК:', hideCommentsEnabled ? 'ВКЛЮЧЕНО' : 'ОТКЛЮЧЕНО');
        
        // НЕ применяем стили автоматически - только при явном вызове
        console.log('Lan-Search: Стили скрытия комментариев готовы к применению (не применены автоматически)');
        
        processingHideComments = false;
      });
    }
    
    
    // НЕ вызываем processHideComments() автоматически
    
    
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.hideComments) {
        console.log('Lan-Search: Обнаружено изменение настроек скрытия комментариев');
        clearHideCommentsCache();
        processHideComments();
      }
    });
  }
  
  
  window.lanSearchSyncHideComments = function() {
    console.log('Lan-Search: Принудительная синхронизация настроек скрытия комментариев');
    clearHideCommentsCache();
    getHideCommentsSetting(function(enabled) {
      if (enabled) {
        console.log('Lan-Search: Синхронизация завершена - скрытие комментариев ВКЛЮЧЕНО');
        applyHideComments();
      } else {
        console.log('Lan-Search: Синхронизация завершена - скрытие комментариев ОТКЛЮЧЕНО');
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
    
    console.log('Lan-Search: Стили карт ПК внедрены');
  }
  
  
  function removePCStyles() {
    const link = document.getElementById('lan-search-pc-styles');
    if (link) {
      link.remove();
      console.log('Lan-Search: Стили карт ПК удалены');
    }
  }
  
  
  function applyPCStyles() {
    const pcForms = document.querySelectorAll('form.pc:not([data-lan-search-styled])');
    
    if (pcForms.length === 0) return;
    
    console.log('Lan-Search: Применяем стили к', pcForms.length, 'карточкам ПК');
    
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
             
             document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
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
      // Стили применены
    }
  }
  
  
  function removePCStylesFromCards() {
    const pcForms = document.querySelectorAll('form.pc[data-lan-search-styled]');
    
    if (pcForms.length === 0) return;
    
    console.log('Lan-Search: Убираем стили с', pcForms.length, 'карточек ПК');
    
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
      // Стили восстановлены
    }
  }
  
  
  function initPCStyles() {
    if (!shouldAutoActivate()) return;
    
    
    let processingStyles = false;
    
    function processStyles() {
      if (processingStyles) return;
      processingStyles = true;
      
      getPCStylesSetting(function(stylesEnabled) {
        console.log('Lan-Search: Стили карт ПК:', stylesEnabled ? 'ВКЛЮЧЕНЫ' : 'ОТКЛЮЧЕНЫ');
        
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
         document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
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
          console.log('Lan-Search: Настройка стилей карт ПК изменилась, сбрасываем кэш');
          clearPCStylesCache();
          processStyles();
        }
      });
    }
  }
  
  
  window.lanSearchSyncPCStyles = function() {
    console.log('Lan-Search: Принудительная синхронизация настроек стилей ПК');
    clearPCStylesCache();
    getPCStylesSetting(function(enabled) {
      if (enabled) {
        console.log('Lan-Search: Синхронизация завершена - стили ВКЛЮЧЕНЫ');
        injectPCStyles();
        applyPCStyles();
      } else {
        console.log('Lan-Search: Синхронизация завершена - стили ОТКЛЮЧЕНЫ');
        removePCStyles();
        removePCStylesFromCards();
      }
    });
  };

  // WebSocket для получения данных о ПК
  function initWebSocketPCData() {
    console.log('Lan-Search: Проверяем путь:', window.location.pathname);
    if (!window.location.pathname.includes('/freenas_wrap/')) {
      console.log('Lan-Search: WebSocket инициализация пропущена - не на странице /freenas_wrap/');
      return;
    }
    
    console.log('Lan-Search: Инициализация прослушивания WebSocket сообщений');
    

    // Перехватываем fetch для получения WebSocket данных
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        if (response.url.includes('/wss/') || response.url.includes('websocket')) {
          console.log('Lan-Search: Обнаружен WebSocket запрос через fetch:', response.url);
        }
        return response;
      });
    };
    
    // Перехватываем XMLHttpRequest для получения WebSocket данных
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('/wss/') || url.includes('websocket')) {
        console.log('Lan-Search: Обнаружен WebSocket запрос через XMLHttpRequest:', url);
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
    
    // Добавляем MutationObserver для отслеживания изменений в DOM
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (text && text.includes('UUID') && text.includes('isLock')) {
                console.log('Lan-Search: Найдены WebSocket данные в DOM:', text);
                try {
                  const data = JSON.parse(text);
                  window.lanSearchProcessPCData(data);
                } catch (e) {
                  console.log('Lan-Search: Ошибка парсинга данных из DOM:', e);
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
    
    // Перехватываем WebSocket через переопределение конструктора
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);
      
      // Перехватываем onmessage
      const originalOnMessage = ws.onmessage;
      ws.onmessage = function(event) {
        // Вызываем оригинальный обработчик
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
        
        // Обрабатываем данные о ПК
        try {
          const data = JSON.parse(event.data);
          console.log('Lan-Search: Получены WebSocket данные:', data);
          window.lanSearchProcessPCData(data);
        } catch (e) {
          // Не JSON, пропускаем
        }
      };
      
      return ws;
    };
    
    // Копируем статические свойства
    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OriginalWebSocket.prototype,
      writable: false
    });
    
    // Также проверяем, есть ли уже существующие WebSocket соединения
    // Это может быть полезно, если WebSocket создается до инициализации нашего кода
    setTimeout(() => {
      console.log('Lan-Search: Поиск существующих WebSocket соединений...');
      
      // Ищем существующие WebSocket соединения в глобальных переменных
      console.log('Lan-Search: Поиск WebSocket в window свойствах...');
      let foundWebSockets = 0;
      
      for (let prop in window) {
        try {
          const obj = window[prop];
          if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'WebSocket') {
            foundWebSockets++;
            console.log('Lan-Search: Найден WebSocket:', prop, 'URL:', obj.url, 'состояние:', obj.readyState);
            
            if (obj.readyState === WebSocket.OPEN || obj.readyState === WebSocket.CONNECTING) {
              console.log('Lan-Search: WebSocket активен, перехватываем onmessage');
              // Перехватываем его onmessage
              const originalOnMessage = obj.onmessage;
              obj.onmessage = function(event) {
                console.log('Lan-Search: Получено сообщение от существующего WebSocket:', event.data);
                if (originalOnMessage) {
                  originalOnMessage.call(this, event);
                }
                try {
                  const data = JSON.parse(event.data);
                  console.log('Lan-Search: Получены данные от существующего WebSocket:', data);
                  window.lanSearchProcessPCData(data);
                } catch (e) {
                  console.log('Lan-Search: Ошибка парсинга WebSocket данных:', e);
                }
              };
            }
          }
        } catch (e) {
          // Игнорируем ошибки доступа к свойствам
        }
      }
      
      console.log('Lan-Search: Найдено WebSocket соединений в window:', foundWebSockets);
      
  // Дополнительный поиск в возможных местах
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
  
  console.log('Lan-Search: Дополнительный поиск WebSocket в возможных местах...');
  possibleWebSocketLocations.forEach(location => {
    try {
      const value = eval(location);
      if (value && value.constructor && value.constructor.name === 'WebSocket') {
        console.log('Lan-Search: Найден WebSocket в:', location, 'URL:', value.url, 'состояние:', value.readyState);
      }
    } catch (e) {
      // Игнорируем ошибки доступа
    }
  });
  
  // Поиск в объектах, которые могут содержать WebSocket
  console.log('Lan-Search: Поиск WebSocket в объектах...');
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
        console.log('Lan-Search: Проверяем объект:', objPath);
        for (let key in obj) {
          try {
            const value = obj[key];
            if (value && value.constructor && value.constructor.name === 'WebSocket') {
              console.log('Lan-Search: Найден WebSocket в объекте:', objPath + '.' + key, 'URL:', value.url, 'состояние:', value.readyState);
            }
          } catch (e) {
            // Игнорируем ошибки доступа
          }
        }
      }
    } catch (e) {
      // Игнорируем ошибки доступа
    }
  });
      
      // Также перехватываем addEventListener для WebSocket
      if (!EventTarget.prototype._lanSearchWebSocketAddEventListenerIntercepted) {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'message' && this.constructor && this.constructor.name === 'WebSocket') {
          console.log('Lan-Search: Перехватываем addEventListener для WebSocket');
      const wrappedListener = function(event) {
        console.log('Lan-Search: Получено сообщение через addEventListener:', event.data);
        
        // Проверяем тип данных перед парсингом
        let dataToProcess = null;
        
        if (typeof event.data === 'string') {
          try {
            dataToProcess = JSON.parse(event.data);
          } catch (e) {
            console.log('Lan-Search: Ошибка парсинга строки через addEventListener:', e);
          }
        } else if (typeof event.data === 'object' && event.data !== null) {
          // Если это уже объект, используем его напрямую
          dataToProcess = event.data;
        }
        
        if (dataToProcess && dataToProcess.UUID && (dataToProcess.isLock !== undefined || dataToProcess.tehnicalTime !== undefined || dataToProcess.status_pc)) {
          console.log('Lan-Search: Обрабатываем данные через addEventListener:', dataToProcess);
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
  
  
  
// Делаем функцию глобально доступной сразу
window.lanSearchProcessPCData = function processPCData(data) {
  console.log('Lan-Search: === НАЧАЛО processPCData ===');
  console.log('Lan-Search: Получены данные:', data);
  
  // Проверяем, что мы на правильной странице
  if (!window.location.pathname.includes('/freenas_wrap/') && !window.location.pathname.includes('/pc_tasks/')) {
    console.log('Lan-Search: Обработка данных ПК отключена для страницы:', window.location.pathname);
    return;
  }
  
  console.log('Lan-Search: Обрабатываем данные о ПК:', data);
    
    if (!data.UUID) {
      console.log('Lan-Search: Нет UUID в данных');
      return;
    }
    
    // Проверяем, не обрабатывали ли мы уже эти данные
    const dataKey = `${data.UUID}_${data.isLock}_${data.guest_id}_${data.tehnicalTime}_${data.ManualUnlock}_${data.status_pc}`;
    if (window._lanSearchProcessedData && window._lanSearchProcessedData[dataKey]) {
      console.log('Lan-Search: Данные уже обработаны для UUID:', data.UUID);
      return;
    }
    
    // Сохраняем ключ обработанных данных
    if (!window._lanSearchProcessedData) {
      window._lanSearchProcessedData = {};
    }
    window._lanSearchProcessedData[dataKey] = true;
    
    // Ищем строку таблицы с данным UUID
    console.log('Lan-Search: Ищем строку для UUID:', data.UUID);
    
    // Сначала пробуем найти td с data-uuid
    const uuidCell = document.querySelector(`td[data-uuid="${data.UUID}"]`);
    if (uuidCell) {
      const row = uuidCell.closest('tr');
      if (row) {
        console.log('Lan-Search: Найдена строка через td[data-uuid]');
        return processPCDataWithRow(data, row);
      }
    }
    
    // Если не нашли, пробуем через tr:has (может не поддерживаться)
    const row = document.querySelector(`tr:has(td[data-uuid="${data.UUID}"])`);
    if (row) {
      console.log('Lan-Search: Найдена строка через tr:has');
      return processPCDataWithRow(data, row);
    }
    
    console.log('Lan-Search: Не найдена строка для UUID:', data.UUID);
    console.log('Lan-Search: Всего td с data-uuid:', document.querySelectorAll('td[data-uuid]').length);
    console.log('Lan-Search: Всего строк в таблице:', document.querySelectorAll('tr').length);
    
    // Показываем все найденные UUID для отладки
    const allUuidCells = document.querySelectorAll('td[data-uuid]');
    console.log('Lan-Search: Найденные UUID в таблице:', Array.from(allUuidCells).map(td => td.getAttribute('data-uuid')));
    
    // Пробуем найти строку по частичному совпадению UUID
    const partialMatch = Array.from(allUuidCells).find(td => 
      td.getAttribute('data-uuid') && td.getAttribute('data-uuid').includes(data.UUID.substring(0, 8))
    );
    if (partialMatch) {
      console.log('Lan-Search: Найдено частичное совпадение UUID');
      const row = partialMatch.closest('tr');
      if (row) {
        return processPCDataWithRow(data, row);
      }
    }
    
    console.log('Lan-Search: === КОНЕЦ processPCData (строка не найдена) ===');
  }
  
  function processPCDataWithRow(data, row) {
    console.log('Lan-Search: Обрабатываем данные для строки:', data.UUID);
    console.log('Lan-Search: Параметры:', {
      status_pc: data.status_pc,
      tehnicalTime: data.tehnicalTime,
      ManualUnlock: data.ManualUnlock,
      isLock: data.isLock,
      guest_id: data.guest_id
    });
    
    // Определяем статус ПК по техническим параметрам
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
    
    console.log('Lan-Search: Определен статус:', statusText, 'класс:', statusClass);
    
    // Обновляем первую колонку (sorting_1) с информацией о состоянии
    const sortingCell = row.querySelector('td.sorting_1');
    if (sortingCell) {
      console.log('Lan-Search: Найдена ячейка sorting_1, обновляем текст');
      sortingCell.textContent = statusText;
      console.log('Lan-Search: Обновлен статус ПК', data.UUID, ':', statusText);
    } else {
      console.log('Lan-Search: Не найдена ячейка sorting_1 в строке');
      console.log('Lan-Search: Всего ячеек в строке:', row.querySelectorAll('td').length);
      console.log('Lan-Search: Классы ячеек:', Array.from(row.querySelectorAll('td')).map(td => td.className));
    }
    
    // Обновляем класс строки
    row.className = row.className.replace(/bg-\w+/g, '').trim() + ' ' + statusClass;
    
    console.log('Lan-Search: Обновлена строка ПК', data.UUID, 'статус:', statusText, 'класс:', statusClass);
    console.log('Lan-Search: === КОНЕЦ processPCDataWithRow (успешно) ===');
  }
  
  function updatePCStatusInTable(uuid, status) {
    // Находим строку таблицы по UUID
    const row = document.querySelector(`tr[id^="pcID-"] td[data-uuid="${uuid}"]`);
    if (!row) return;
    
    const tr = row.closest('tr');
    if (!tr) return;
    
    // Обновляем статус в первой колонке
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
      
      // Обновляем классы строки
      tr.className = tr.className.replace(/bg-\w+/g, '');
      if (statusClass) {
        tr.classList.add(statusClass);
      }
    }
  }
  
  function updatePCDetailedInfo(data) {
    console.log('Lan-Search: Обновляем детальную информацию для UUID:', data.UUID);
    
    // Находим строку таблицы по UUID
    const row = document.querySelector(`tr[id^="pcID-"] td[data-uuid="${data.UUID}"]`);
    if (!row) {
      console.log('Lan-Search: Строка таблицы не найдена для UUID:', data.UUID);
      return;
    }
    
    const tr = row.closest('tr');
    if (!tr) {
      console.log('Lan-Search: TR элемент не найден для UUID:', data.UUID);
      return;
    }
    
    console.log('Lan-Search: Найдена строка таблицы для UUID:', data.UUID);
    
    // Обновляем статус блокировки
    const statusCell = tr.querySelector('td.sorting_1');
    if (statusCell) {
      let statusText = '';
      let statusClass = '';
      
      // Определяем статус на основе isLock и ManualUnlock
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
      
      console.log('Lan-Search: Обновляем статус:', statusText, 'класс:', statusClass);
      statusCell.textContent = statusText;
      
      // Обновляем классы строки
      tr.className = tr.className.replace(/bg-\w+/g, '');
      if (statusClass) {
        tr.classList.add(statusClass);
      }
    }
    
    // Добавляем информацию о техническом времени
    if (data.tehnicalTime !== undefined) {
      console.log('Lan-Search: Обновляем тех.время для UUID:', data.UUID, 'значение:', data.tehnicalTime);
      
      const statusColumn = tr.querySelector('td:nth-child(3)');
      if (statusColumn) {
        // Удаляем старую информацию о тех.времени
        const oldTechTime = statusColumn.querySelector('.tech-time-info');
        if (oldTechTime) {
          oldTechTime.remove();
        }
        
        const techTimeInfo = document.createElement('div');
        techTimeInfo.style.cssText = 'font-size: 10px; color: #666; margin-top: 2px;';
        techTimeInfo.textContent = `Тех.режим: ${data.tehnicalTime ? 'ВКЛ' : 'ВЫКЛ'}`;
        techTimeInfo.className = 'tech-time-info';
        statusColumn.appendChild(techTimeInfo);
        
        console.log('Lan-Search: Добавлена информация о тех.режиме:', data.tehnicalTime ? 'ВКЛ' : 'ВЫКЛ');
      }
    }
    
    // Добавляем информацию о ручной разблокировке
    if (data.ManualUnlock !== undefined) {
      console.log('Lan-Search: Обновляем ручную разблокировку для UUID:', data.UUID, 'значение:', data.ManualUnlock);
      
      const statusColumn = tr.querySelector('td:nth-child(3)');
      if (statusColumn) {
        // Удаляем старую информацию о ручной разблокировке
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
          
          console.log('Lan-Search: Добавлена информация о ручной разблокировке');
        }
      }
    }
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
        initPCStyles();
        initTableOptimization();
        initHideCheckboxes();
        initHideComments();
        initWebSocketPCData();
      });
    } else {
      initModalBypass();
      initPCSelection();
      initMassivePCSelection();
      initPCStyles();
      initTableOptimization();
      initHideCheckboxes();
      initHideComments();
      initWebSocketPCData();
    }
  }

})(); 

// Автоматическая проверка WebSocket каждые 3 секунды
let websocketCheckInterval = null;

function startWebSocketMonitoring() {
  // Проверяем, что мы на правильной странице
  if (!window.location.pathname.includes('/freenas_wrap/') && !window.location.pathname.includes('/pc_tasks/')) {
    console.log('Lan-Search: WebSocket мониторинг отключен для страницы:', window.location.pathname);
    return;
  }
  
  console.log('Lan-Search: Запуск мониторинга WebSocket...');
  
  // Проверяем WebSocket соединения сразу
  console.log('Lan-Search: Проверка WebSocket соединений...');
  checkWebSocketConnections();
}

function checkWebSocketConnections() {
  // Ищем WebSocket соединения в глобальных переменных
  let foundConnections = 0;
  
  console.log('Lan-Search: Начинаем поиск WebSocket соединений...');
  
  // Расширенный поиск WebSocket соединений
  const searchInObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    try {
      // Проверяем сам объект
      if (obj.constructor && obj.constructor.name === 'WebSocket') {
        foundConnections++;
        console.log('Lan-Search: Найден WebSocket:', path, 'URL:', obj.url, 'состояние:', obj.readyState);
        
        if (obj.readyState === WebSocket.OPEN || obj.readyState === WebSocket.CONNECTING) {
          console.log('Lan-Search: WebSocket активен, перехватываем onmessage');
          
          // Перехватываем onmessage если еще не перехвачен
          if (!obj._lanSearchIntercepted) {
            const originalOnMessage = obj.onmessage;
            obj.onmessage = function(event) {
              console.log('Lan-Search: Получено сообщение от WebSocket:', event.data);
              if (originalOnMessage) {
                originalOnMessage.call(this, event);
              }
              try {
                const data = JSON.parse(event.data);
                if (data.UUID && (data.isLock !== undefined || data.tehnicalTime !== undefined || data.status_pc)) {
                  console.log('Lan-Search: Обрабатываем WebSocket данные:', data);
                  if (typeof window.lanSearchProcessPCData === 'function') {
                    window.lanSearchProcessPCData(data);
                  }
                }
              } catch (e) {
                console.log('Lan-Search: Ошибка парсинга WebSocket данных:', e);
              }
            };
            obj._lanSearchIntercepted = true;
            console.log('Lan-Search: WebSocket перехвачен:', path);
          }
        } else {
          console.log('Lan-Search: WebSocket неактивен:', path, 'состояние:', obj.readyState);
        }
      }
      
      // Рекурсивно ищем в свойствах объекта (ограничиваем глубину)
      if (path.split('.').length < 3) {
        for (let key in obj) {
          try {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
              searchInObject(obj[key], path ? `${path}.${key}` : key);
            }
          } catch (e) {
            // Игнорируем ошибки доступа
          }
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }
  };
  
  // Ищем в window и его основных объектах
  searchInObject(window, 'window');
  
  // Ищем в document
  searchInObject(document, 'document');
  
  // Ищем в iframe
  try {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
      try {
        if (iframe.contentWindow) {
          searchInObject(iframe.contentWindow, `iframe[${index}]`);
        }
      } catch (e) {
        // Игнорируем ошибки доступа к iframe
      }
    });
  } catch (e) {
    // Игнорируем ошибки
  }
  
  // Ищем в основных глобальных объектах
  const globalObjects = ['navigator', 'screen', 'location', 'history', 'localStorage', 'sessionStorage'];
  globalObjects.forEach(objName => {
    try {
      if (window[objName]) {
        searchInObject(window[objName], objName);
      }
    } catch (e) {
      // Игнорируем ошибки
    }
  });
  
  // Также перехватываем все новые WebSocket через переопределение конструктора
  if (!window._lanSearchWebSocketIntercepted) {
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      console.log('Lan-Search: Создается новое WebSocket соединение:', url);
      console.log('Lan-Search: WebSocket протоколы:', protocols);
      console.log('Lan-Search: WebSocket стек вызовов:', new Error().stack);
      
        // Проверяем, содержит ли URL wss://
        if (url.includes('wss://')) {
          console.log('Lan-Search: Найдено WebSocket соединение с wss://:', url);
          console.log('Lan-Search: WebSocket протокол:', url.split('://')[0]);
          console.log('Lan-Search: WebSocket хост:', url.split('://')[1]);
        }
      
      const ws = new OriginalWebSocket(url, protocols);
      
      // Перехватываем все события WebSocket
      const originalOnMessage = ws.onmessage;
      const originalOnOpen = ws.onopen;
      const originalOnClose = ws.onclose;
      const originalOnError = ws.onerror;
      
      ws.onmessage = function(event) {
        console.log('Lan-Search: Получено сообщение от нового WebSocket:', event.data);
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
        try {
          const data = JSON.parse(event.data);
          if (data.UUID && (data.isLock !== undefined || data.tehnicalTime !== undefined || data.status_pc)) {
            console.log('Lan-Search: Обрабатываем данные от нового WebSocket:', data);
            if (typeof window.lanSearchProcessPCData === 'function') {
              window.lanSearchProcessPCData(data);
            }
          }
        } catch (e) {
          console.log('Lan-Search: Ошибка парсинга данных от нового WebSocket:', e);
        }
      };
      
      ws.onopen = function(event) {
        console.log('Lan-Search: WebSocket соединение открыто:', ws.url);
        if (originalOnOpen) {
          originalOnOpen.call(this, event);
        }
      };
      
      ws.onclose = function(event) {
        console.log('Lan-Search: WebSocket соединение закрыто:', ws.url, 'код:', event.code, 'причина:', event.reason);
        if (originalOnClose) {
          originalOnClose.call(this, event);
        }
      };
      
      ws.onerror = function(event) {
        console.log('Lan-Search: WebSocket ошибка:', ws.url, 'событие:', event);
        if (originalOnError) {
          originalOnError.call(this, event);
        }
      };
      
      return ws;
    };
    
    // Копируем статические свойства
    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OriginalWebSocket.prototype,
      writable: false
    });
    
    window._lanSearchWebSocketIntercepted = true;
    console.log('Lan-Search: WebSocket конструктор перехвачен');
  }
  
  console.log('Lan-Search: Поиск завершен. Найдено WebSocket соединений:', foundConnections);
  
  if (foundConnections === 0) {
    console.log('Lan-Search: WebSocket соединения не найдены в глобальных переменных');
    console.log('Lan-Search: Пытаемся найти WebSocket URL и подключиться...');
    
    // Пытаемся найти WebSocket URL и подключиться
    findAndConnectToWebSocket();
  } else {
    console.log('Lan-Search: Найдено WebSocket соединений:', foundConnections);
  }
}

// Функция для поиска WebSocket URL и подключения
function findAndConnectToWebSocket() {
  console.log('Lan-Search: Поиск WebSocket URL...');
  
  // Ограничиваем количество попыток подключения
  if (window._lanSearchConnectionAttempts && window._lanSearchConnectionAttempts > 5) {
    console.log('Lan-Search: Превышено максимальное количество попыток подключения');
    return;
  }
  
  if (!window._lanSearchConnectionAttempts) {
    window._lanSearchConnectionAttempts = 0;
  }
  
  // Пытаемся подключиться по принципу оригинала
  console.log('Lan-Search: Пытаемся подключиться по принципу оригинала...');
  connectToWebSocket();
  window._lanSearchConnectionAttempts++;
}

// Функция для подключения к WebSocket (по принципу оригинала)
function connectToWebSocket() {
  try {
    // Получаем domain из мета-тега (как в оригинале)
    const domain = document.querySelector('meta[name="domain"]')?.getAttribute('content');
    if (!domain) {
      console.log('Lan-Search: Не найден мета-тег domain, используем fallback');
      return;
    }
    
    // Получаем session_id
    const sessionId = session_id();
    if (!sessionId) {
      console.log('Lan-Search: Не найден session_id в cookies');
      return;
    }
    
    // Создаем URL для WebSocket (как в оригинале)
    const wsUrl = `wss://${domain}/wss/?client_guid=${sessionId}&type_client=browser`;
    console.log('Lan-Search: Подключаемся к WebSocket:', wsUrl);
    
    // Используем оригинальный WebSocket конструктор
    const OriginalWebSocket = window._lanSearchOriginalWebSocket || window.WebSocket;
    const ws = new OriginalWebSocket(wsUrl);
    
    ws.onopen = function(event) {
      console.log('Lan-Search: Успешно подключились к WebSocket:', wsUrl);
      window._lanSearchWebSocket = ws; // Сохраняем соединение
      
      // Запрашиваем состояние всех ПК сразу после подключения
      requestAllPCStatus();
    };
    
    ws.onmessage = function(event) {
      console.log('Lan-Search: Получено сообщение от WebSocket:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        // Обрабатываем данные о ПК (как в оригинале)
        if (data.status_pc !== undefined) {
          console.log('Lan-Search: Получены данные о статусе ПК:', data);
          if (typeof window.lanSearchProcessPCData === 'function') {
            window.lanSearchProcessPCData(data);
          }
          return;
        }
        
        // Обрабатываем команды (как в оригинале)
        switch (data.command) {
          case "showConfig":
            console.log('Lan-Search: Получен ответ на команду showConfig:', data);
            console.log('Lan-Search: Вызываем processPCData для данных:', data);
            if (typeof window.lanSearchProcessPCData === 'function') {
              window.lanSearchProcessPCData(data);
            } else {
              console.log('Lan-Search: window.lanSearchProcessPCData не является функцией!');
            }
            break;
        }
        
      } catch (e) {
        console.log('Lan-Search: Ошибка парсинга WebSocket данных:', e);
      }
    };
    
    ws.onclose = function(event) {
      console.log('Lan-Search: WebSocket соединение закрыто:', wsUrl, 'код:', event.code, 'причина:', event.reason);
      // Автоматическое переподключение сразу
      console.log('Lan-Search: Переподключаемся к WebSocket...');
      connectToWebSocket();
    };
    
    ws.onerror = function(event) {
      console.log('Lan-Search: WebSocket ошибка:', wsUrl, 'событие:', event);
      ws.close();
    };
    
  } catch (e) {
    console.log('Lan-Search: Ошибка создания WebSocket:', e);
  }
}

// Функция для получения session_id (как в оригинале)
function session_id() {
  return /SESS\w*ID=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
}

// Функция для отправки команд к ПК через WebSocket (по принципу оригинала)
function sendPCCommand(uuid, command = 'showConfig') {
  if (!window._lanSearchWebSocket || window._lanSearchWebSocket.readyState !== WebSocket.OPEN) {
    console.log('Lan-Search: WebSocket соединение не активно, не можем отправить команду');
    return false;
  }
  
  const message = {
    client_guid: uuid,
    type: "command_api",
    command: command,
    who_send: session_id(),
    need_return: true
  };
  
  console.log('Lan-Search: Отправляем команду к ПК:', uuid, 'команда:', command);
  console.log('Lan-Search: Сообщение:', message);
  
  try {
    window._lanSearchWebSocket.send(JSON.stringify(message));
    console.log('Lan-Search: Команда отправлена успешно');
    return true;
  } catch (e) {
    console.log('Lan-Search: Ошибка отправки команды:', e);
    return false;
  }
}

// Функция для получения состояния всех ПК
function requestAllPCStatus() {
  console.log('Lan-Search: Запрашиваем состояние ПК с пустым состоянием...');
  
  // Ищем все строки таблицы с ПК - ищем по td с data-uuid
  const pcRows = document.querySelectorAll('tr:has(td[data-uuid])');
  console.log('Lan-Search: Найдено строк ПК:', pcRows.length);
  
  // Если не нашли, пробуем другой способ
  if (pcRows.length === 0) {
    const allRows = document.querySelectorAll('tr');
    console.log('Lan-Search: Всего строк в таблице:', allRows.length);
    
    // Ищем строки, которые содержат td с data-uuid
    allRows.forEach((row, index) => {
      const uuidCell = row.querySelector('td[data-uuid]');
      if (uuidCell) {
        console.log('Lan-Search: Найдена строка с UUID:', uuidCell.getAttribute('data-uuid'), 'в строке', index);
      }
    });
  }
  
  let emptyPCs = [];
  
  pcRows.forEach((row, index) => {
      // Получаем UUID из td внутри строки
      const uuidCell = row.querySelector('td[data-uuid]');
      if (!uuidCell) return;
      
      const uuid = uuidCell.getAttribute('data-uuid');
      if (!uuid) return;
      
      // Проверяем, есть ли пустая ячейка sorting_1 (первая колонка)
      const sortingCell = row.querySelector('td.sorting_1');
      if (sortingCell && sortingCell.textContent.trim() === '') {
        console.log('Lan-Search: Найден ПК с пустым состоянием:', uuid);
        emptyPCs.push({uuid, index});
      } else {
        console.log('Lan-Search: ПК', uuid, 'уже имеет состояние:', sortingCell ? sortingCell.textContent.trim() : 'не найдена ячейка');
      }
    });
    
    console.log('Lan-Search: Найдено ПК с пустым состоянием:', emptyPCs.length);
    
    // Отправляем команды только к ПК с пустым состоянием
    emptyPCs.forEach((pc, index) => {
      console.log('Lan-Search: Запрашиваем состояние ПК:', pc.uuid);
      sendPCCommand(pc.uuid, 'showConfig');
    });
    
    if (emptyPCs.length === 0) {
      console.log('Lan-Search: Все ПК уже имеют состояние, запрос не нужен');
    } else {
      console.log(`Lan-Search: Запрашиваем состояние ${emptyPCs.length} ПК с пустым состоянием`);
    }
}

// Функция для добавления кнопки запроса состояния ПК
function addPCStatusButton() {
  // Проверяем, есть ли уже кнопка
  if (document.getElementById('lanSearchPCStatusBtn')) {
    return;
  }
  
  // Создаем кнопку
  const statusBtn = document.createElement('button');
  statusBtn.id = 'lanSearchPCStatusBtn';
  statusBtn.className = 'btn btn-info mb-3 mr-2';
  statusBtn.innerHTML = '<i class="fa fa-refresh"></i> Запросить состояние ПК';
  statusBtn.title = 'Запросить актуальное состояние всех ПК через WebSocket';
  
  // Добавляем обработчик события
  statusBtn.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Lan-Search: Ручной запрос состояния ПК');
    requestAllPCStatus();
    // Убираем showNotification, так как функция уже показывает alert
  });
  
  // Ищем место для вставки кнопки
  const checkDisksBtn = document.getElementById('checkDisksBtn');
  if (checkDisksBtn) {
    checkDisksBtn.parentNode.insertBefore(statusBtn, checkDisksBtn.nextSibling);
  } else {
    // Если кнопка "Проверить диски" не найдена, добавляем в начало страницы
    const container = document.querySelector('.container-fluid') || document.body;
    container.insertBefore(statusBtn, container.firstChild);
  }
  
  console.log('Lan-Search: Кнопка запроса состояния ПК добавлена');
}

// Функция для тестирования поиска ПК (можно вызвать из консоли)
window.testPCSearch = function() {
  console.log('Lan-Search: Тестирование поиска ПК...');
  
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
      console.log('Lan-Search: Селектор "' + selector + '":', elements.length, 'элементов');
      if (elements.length > 0) {
        elements.forEach((el, i) => {
          console.log('Lan-Search: Элемент', i + ':', el);
          console.log('Lan-Search: - ID:', el.id);
          console.log('Lan-Search: - data-uuid:', el.getAttribute('data-uuid'));
          console.log('Lan-Search: - innerHTML:', el.innerHTML.substring(0, 100) + '...');
        });
      }
    } catch (e) {
      console.log('Lan-Search: Ошибка с селектором "' + selector + '":', e);
    }
  });
};

// Функция для тестирования поиска пустых ПК (можно вызвать из консоли)
window.testEmptyPCs = function() {
  console.log('Lan-Search: Тестирование поиска пустых ПК...');
  
  // Пробуем разные селекторы
  const selectors = [
    'tr:has(td[data-uuid])',
    'tr[data-uuid]',
    'tr'
  ];
  
  let pcRows = [];
  for (const selector of selectors) {
    try {
      pcRows = document.querySelectorAll(selector);
      console.log('Lan-Search: Селектор "' + selector + '":', pcRows.length, 'строк');
      if (pcRows.length > 0) break;
    } catch (e) {
      console.log('Lan-Search: Ошибка с селектором "' + selector + '":', e);
    }
  }
  
  let emptyPCs = [];
  let filledPCs = [];
  
  pcRows.forEach((row, index) => {
    // Ищем td с data-uuid внутри строки
    const uuidCell = row.querySelector('td[data-uuid]');
    if (!uuidCell) return;
    
    const uuid = uuidCell.getAttribute('data-uuid');
    if (!uuid) return;
    
    const sortingCell = row.querySelector('td.sorting_1');
    if (sortingCell && sortingCell.textContent.trim() === '') {
      console.log('Lan-Search: ПУСТОЙ ПК:', uuid);
      emptyPCs.push({uuid, index});
    } else {
      console.log('Lan-Search: ЗАПОЛНЕННЫЙ ПК:', uuid, 'состояние:', sortingCell ? sortingCell.textContent.trim() : 'не найдена ячейка');
      filledPCs.push({uuid, index});
    }
  });
  
  console.log('Lan-Search: Итого пустых ПК:', emptyPCs.length);
  console.log('Lan-Search: Итого заполненных ПК:', filledPCs.length);
  
  return {emptyPCs, filledPCs};
};

// Функция для простого тестирования поиска строк (можно вызвать из консоли)
window.testTableRows = function() {
  console.log('Lan-Search: Тестирование поиска строк таблицы...');
  
  const allRows = document.querySelectorAll('tr');
  console.log('Lan-Search: Всего строк в таблице:', allRows.length);
  
  allRows.forEach((row, index) => {
    const uuidCell = row.querySelector('td[data-uuid]');
    if (uuidCell) {
      const uuid = uuidCell.getAttribute('data-uuid');
      const sortingCell = row.querySelector('td.sorting_1');
      const sortingContent = sortingCell ? sortingCell.textContent.trim() : 'не найдена';
      
      console.log('Lan-Search: Строка', index + ':', {
        uuid: uuid,
        sortingContent: sortingContent,
        isEmpty: sortingContent === '',
        row: row
      });
    }
  });
};

// Сохраняем оригинальный WebSocket конструктор
if (!window._lanSearchOriginalWebSocket) {
  window._lanSearchOriginalWebSocket = window.WebSocket;
  console.log('Lan-Search: Оригинальный WebSocket конструктор сохранен');
}

// Простой и надежный перехват WebSocket через переопределение конструктора
if (!window._lanSearchWebSocketConstructorIntercepted) {
  console.log('Lan-Search: Перехватываем WebSocket конструктор...');
  
  const OriginalWebSocket = window._lanSearchOriginalWebSocket;
  
  window.WebSocket = function(url, protocols) {
    console.log('Lan-Search: Создается WebSocket соединение:', url);
    console.log('Lan-Search: WebSocket протоколы:', protocols);
    
    // Создаем WebSocket
    const ws = new OriginalWebSocket(url, protocols);
    
    // Перехватываем все события
    const originalOnMessage = ws.onmessage;
    const originalOnOpen = ws.onopen;
    const originalOnClose = ws.onclose;
    const originalOnError = ws.onerror;
    
    ws.onmessage = function(event) {
      console.log('Lan-Search: Получено сообщение от WebSocket:', event.data);
      
      // Вызываем оригинальный обработчик
      if (originalOnMessage) {
        originalOnMessage.call(this, event);
      }
      
      // Обрабатываем данные
      try {
        const data = JSON.parse(event.data);
        if (data.UUID && (data.isLock !== undefined || data.tehnicalTime !== undefined || data.status_pc)) {
          console.log('Lan-Search: Обрабатываем WebSocket данные:', data);
          if (typeof window.lanSearchProcessPCData === 'function') {
            window.lanSearchProcessPCData(data);
          }
        }
      } catch (e) {
        console.log('Lan-Search: Ошибка парсинга WebSocket данных:', e);
      }
    };
    
    ws.onopen = function(event) {
      console.log('Lan-Search: WebSocket соединение открыто:', ws.url);
      if (originalOnOpen) {
        originalOnOpen.call(this, event);
      }
    };
    
    ws.onclose = function(event) {
      console.log('Lan-Search: WebSocket соединение закрыто:', ws.url, 'код:', event.code);
      if (originalOnClose) {
        originalOnClose.call(this, event);
      }
    };
    
    ws.onerror = function(event) {
      console.log('Lan-Search: WebSocket ошибка:', ws.url, 'событие:', event);
      if (originalOnError) {
        originalOnError.call(this, event);
      }
    };
    
    return ws;
  };
  
  // Копируем статические свойства
  Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
  Object.defineProperty(window.WebSocket, 'prototype', {
    value: OriginalWebSocket.prototype,
    writable: false
  });
  
  window._lanSearchWebSocketConstructorIntercepted = true;
  console.log('Lan-Search: WebSocket конструктор перехвачен');
}

// Перехват на уровне сети
if (!window._lanSearchNetworkIntercepted) {
  // Перехватываем fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
        if (response.url.includes('wss://') || response.url.includes('websocket') || response.url.includes('/wss/')) {
          console.log('Lan-Search: Обнаружен WebSocket запрос через fetch:', response.url);
          console.log('Lan-Search: Fetch статус:', response.status);
          console.log('Lan-Search: Fetch тип:', response.type);
        }
      return response;
    });
  };
  
  // Перехватываем XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('wss://') || url.includes('websocket') || url.includes('/wss/')) {
        console.log('Lan-Search: Обнаружен WebSocket запрос через XMLHttpRequest:', url);
        console.log('Lan-Search: XMLHttpRequest метод:', method);
        console.log('Lan-Search: XMLHttpRequest URL:', url);
      }
    return originalXHROpen.call(this, method, url, ...args);
  };
  
  // Перехватываем все события на странице
  if (!EventTarget.prototype._lanSearchAddEventListenerIntercepted) {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'message') {
      console.log('Lan-Search: Перехватываем addEventListener для message:', this.constructor.name);
      const wrappedListener = function(event) {
        console.log('Lan-Search: Получено сообщение через addEventListener:', event.data);
        
        // Проверяем тип данных перед парсингом
        let dataToProcess = null;
        
        if (typeof event.data === 'string') {
          try {
            dataToProcess = JSON.parse(event.data);
          } catch (e) {
            console.log('Lan-Search: Ошибка парсинга строки через addEventListener:', e);
          }
        } else if (typeof event.data === 'object' && event.data !== null) {
          // Если это уже объект, используем его напрямую
          dataToProcess = event.data;
        }
        
        if (dataToProcess && dataToProcess.UUID && (dataToProcess.isLock !== undefined || dataToProcess.tehnicalTime !== undefined || dataToProcess.status_pc)) {
          console.log('Lan-Search: Обрабатываем данные через addEventListener:', dataToProcess);
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
    EventTarget.prototype._lanSearchAddEventListenerIntercepted = true;
  }
  
  // Перехватываем все события на window
  if (!window._lanSearchWindowAddEventListenerIntercepted) {
    const originalWindowAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
    if (type === 'message') {
      console.log('Lan-Search: Перехватываем window.addEventListener для message');
      const wrappedListener = function(event) {
        console.log('Lan-Search: Получено сообщение через window.addEventListener:', event.data);
        
        // Проверяем тип данных перед парсингом
        let dataToProcess = null;
        
        if (typeof event.data === 'string') {
          try {
            dataToProcess = JSON.parse(event.data);
          } catch (e) {
            console.log('Lan-Search: Ошибка парсинга строки через window.addEventListener:', e);
          }
        } else if (typeof event.data === 'object' && event.data !== null) {
          // Если это уже объект, используем его напрямую
          dataToProcess = event.data;
        }
        
        if (dataToProcess && dataToProcess.UUID && (dataToProcess.isLock !== undefined || dataToProcess.tehnicalTime !== undefined || dataToProcess.status_pc)) {
          console.log('Lan-Search: Обрабатываем данные через window.addEventListener:', dataToProcess);
          if (typeof window.lanSearchProcessPCData === 'function') {
            window.lanSearchProcessPCData(dataToProcess);
          }
        }
        
        return listener.call(this, event);
      };
      return originalWindowAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalWindowAddEventListener.call(this, type, listener, options);
    };
    window._lanSearchWindowAddEventListenerIntercepted = true;
  }
  
  window._lanSearchNetworkIntercepted = true;
  console.log('Lan-Search: Сетевой перехват активирован');
}



// Запускаем WebSocket мониторинг для страниц /freenas_wrap/ и /pc_tasks/
if (window.location.pathname.includes('/freenas_wrap/') || window.location.pathname.includes('/pc_tasks/')) {
  console.log('Lan-Search: WebSocket мониторинг активирован для:', window.location.pathname);
  
  // Запускаем мониторинг сразу
  startWebSocketMonitoring();

  // Добавляем кнопку запроса состояния ПК сразу
  addPCStatusButton();
} else {
  console.log('Lan-Search: WebSocket мониторинг отключен для страницы:', window.location.pathname);
} 