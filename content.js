(function () {
  const MENU_ID = "globalMenuAccordion";
  const SEARCH_ID = "globalMenuSearchInput";
  const STYLE_ID = "globalMenuSearchStyles";
  const HEADER_CONTAINER_SELECTOR = "#navbarResponsive .header-controls";
  const HEADER_LI_ID = "globalMenuSearchHeaderLi";

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .gms-container { 
        position: sticky; top: 0; z-index: 100; padding: 8px; 
        background: rgba(255,255,255,0.03); backdrop-filter: blur(6px);
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }
      .gms-input { 
        width: 100%; padding: 8px 12px; border-radius: 10px; 
        border: 1px solid rgba(0,0,0,0.2); outline: none;
        font-size: 14px; line-height: 20px;
        background: rgba(255,255,255,0.9);
      }
      .gms-input:focus { border-color: #4c8bf5; box-shadow: 0 0 0 3px rgba(76,139,245,0.2); }
      .gms-no-results { padding: 8px 12px; color: #888; font-size: 13px; }
      .gms-hidden { display: none !important; }

      /* Header placement */
      #${HEADER_LI_ID} { display: flex; align-items: center; }
      #${HEADER_LI_ID} .gms-input { 
        width: 260px; max-width: 32vw; margin: 0 8px 0 0; border-radius: 8px;
        padding-left: 32px; /* room for icon */
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line></svg>");
        background-repeat: no-repeat; background-position: 10px center; background-size: 16px;
      }
      @media (max-width: 992px) {
        #${HEADER_LI_ID} .gms-input { width: 52vw; max-width: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function createSearchBar(menuRoot) {
    const headerControls = document.querySelector(HEADER_CONTAINER_SELECTOR);
    if (headerControls && !document.getElementById(HEADER_LI_ID)) {
      const li = document.createElement("li");
      li.id = HEADER_LI_ID;
      const input = document.createElement("input");
      input.type = "search";
      input.placeholder = "Поиск по меню... /";
      input.id = SEARCH_ID;
      input.className = "gms-input";
      input.autocomplete = "off";
      input.setAttribute("aria-label", "Поиск по меню");
      li.appendChild(input);
      headerControls.insertBefore(li, headerControls.firstChild);
      return input;
    }

    if (document.getElementById(SEARCH_ID)) return document.getElementById(SEARCH_ID);

    const container = document.createElement("div");
    container.className = "gms-container";

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Поиск по меню...";
    input.id = SEARCH_ID;
    input.className = "gms-input";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Поиск по меню");

    container.appendChild(input);
    menuRoot.parentElement?.insertBefore(container, menuRoot);
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
    // Fallback если функция недоступна
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('langame') || hostname.includes('cls');
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

  // Инициализируем отслеживание вкладок
  if (shouldAutoActivate()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initRecentTabsTracking();
        if (window.recentTabsManager) {
          window.recentTabsManager.displayOnMainPage();
        }
      });
    } else {
      initRecentTabsTracking();
      if (window.recentTabsManager) {
        window.recentTabsManager.displayOnMainPage();
      }
    }
  }

})(); 