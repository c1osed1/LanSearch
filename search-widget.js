(function() {
  {
    const h = (window.location.hostname || '').toLowerCase();
    if (
      h === 'msgtp.langame.ru'
      || h === 'msgpublic.langame.ru'
      || h.endsWith('.msgtp.langame.ru')
      || h.endsWith('.msgpublic.langame.ru')
    ) return;
  }

  let searchWidget;

  class SearchWidget {
  constructor() {
    this.searchData = {};
    this.searchInput = null;
    this.resultsContainer = null;
    this.isVisible = false;
    this.storageKey = 'lanSearchCollectedTexts';
    this.init();
  }

  async init() {

    await this.loadSearchData();
    

    this.createSearchWidget();
    

    this.initSearch();
    

    this.checkForHighlight();
  }


  async loadSearchData() {
    try {
      const response = await fetch(chrome.runtime.getURL('Search.json'));
      if (response.ok) {
        const data = await response.json();
        if (data.pages) {
          this.searchData = data.pages;
          console.log('SearchWidget: Загружены данные из Search.json', Object.keys(this.searchData).length, 'страниц');
        } else {
          console.log('SearchWidget: Search.json не содержит данных pages');
          this.searchData = {};
        }
      } else {
        console.log('SearchWidget: Не удалось загрузить Search.json');
        this.searchData = {};
      }
    } catch (e) {
      console.error('SearchWidget: Ошибка загрузки данных:', e);
      this.searchData = {};
    }
  }


  createSearchWidget() {
    if (document.querySelector('.search-widget-container[data-lgs-search-widget]')) return;

    const searchItem = document.createElement('div');
    searchItem.className = 'search-widget-container';
    searchItem.setAttribute('data-lgs-search-widget', '');

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Поиск по справке…';
    this.searchInput.className = 'search-input';
    this.searchInput.setAttribute('autocomplete', 'off');
    this.searchInput.setAttribute('spellcheck', 'false');

    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'search-results';
    this.resultsContainer.hidden = true;

    searchItem.appendChild(this.searchInput);
    searchItem.appendChild(this.resultsContainer);

    const mount = this.resolveSearchMount();
    if (!mount) {
      console.log('SearchWidget: контейнер шапки не найден');
      return;
    }
    mount.appendChild(searchItem);
    console.log('SearchWidget: Поисковый виджет создан');
  }

  resolveSearchMount() {
    // новый фронт: #js-header
    const header = document.querySelector('#js-header') || document.querySelector('.layout__header .header');
    if (header) {
      const row = header.querySelector('.row.gx-1, .row.align-items-center, .container-fluid > .row');
      const controlsCol = header.querySelector('.js-header-controls');
      if (row && controlsCol) {
        const titleCol = header.querySelector('.header__title')?.closest('.col, [class*="col"]');
        // отдельная колонка ломала ряд (перенос) — сажаем поиск в левый title-col
        const orphan = header.querySelector('.lgs-header-search-col');
        if (orphan && titleCol && orphan !== titleCol) {
          const widget = orphan.querySelector('.search-widget-container, [data-lgs-search-widget]');
          if (widget) titleCol.appendChild(widget);
          orphan.remove();
        }
        if (titleCol) {
          titleCol.classList.add('lgs-header-search-col', 'd-flex', 'align-items-center');
          return titleCol;
        }
        let mountCol = header.querySelector('.lgs-header-search-col');
        if (!mountCol) {
          mountCol = document.createElement('div');
          mountCol.className = 'col-auto lgs-header-search-col d-flex align-items-center';
          row.insertBefore(mountCol, controlsCol);
        }
        return mountCol;
      }
      const titleCol = header.querySelector('.header__title')?.closest('.col, [class*="col"]');
      if (titleCol) return titleCol;
      return header.querySelector('.container-fluid') || header;
    }

    // старый фронт: #mainNav (/all_clubs_pc/ и др.)
    const navbar = document.querySelector('#mainNav');
    if (navbar) {
      const resp = navbar.querySelector('#navbarResponsive') || navbar;
      let mount = resp.querySelector('.lgs-mainnav-search');
      if (!mount) {
        mount = document.createElement('div');
        mount.className = 'lgs-mainnav-search lgs-header-search-col';
        const existing = resp.querySelector('.search-widget-container, [data-lgs-search-widget]');
        if (existing && existing.parentElement === resp) {
          resp.insertBefore(mount, existing);
          mount.appendChild(existing);
        } else {
          const controls = resp.querySelector('.header-controls');
          if (controls) resp.insertBefore(mount, controls);
          else resp.appendChild(mount);
        }
      }
      return mount;
    }
    return null;
  }


  initSearch() {
    if (!this.searchInput) return;


    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        this.performSearch(query);
      } else {
        this.hideResults();
      }
    });


    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim().length >= 2) {
        this.showResults();
      }
    });


    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-widget-container')) {
        this.hideResults();
      }
    });


    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideResults();
        this.searchInput.blur();
      }
    });
  }


  performSearch(query) {
    const results = this.searchInData(query);
    this.displayResults(results);
    this.showResults();
  }


  searchInData(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    console.log('SearchWidget: Поиск по запросу:', query);
    console.log('SearchWidget: Данные для поиска:', this.searchData);

    const currentPageName = this.getCurrentPageName();

    Object.keys(this.searchData).forEach(pageName => {
      const pageData = this.searchData[pageName];
      if (!pageData.texts) return;

      pageData.texts.forEach(item => {
        if (item.text.toLowerCase().includes(lowerQuery)) {

          if (pageData.url && pageData.url.trim() !== '') {
            const result = {
              text: item.text,
              pageName: pageName,
              pageUrl: pageData.url,
              tag: item.tag,
              className: item.className,
              id: item.id,
              isCurrentPage: pageName === currentPageName
            };
            results.push(result);
            console.log('SearchWidget: Добавлен результат:', result);
          } else {
            console.log('SearchWidget: Пропущен результат с пустым URL:', pageName, pageData.url);
          }
        }
      });
    });


    return results.sort((a, b) => {

      if (a.isCurrentPage && !b.isCurrentPage) return -1;
      if (!a.isCurrentPage && b.isCurrentPage) return 1;
      

      const aExact = a.text.toLowerCase() === lowerQuery;
      const bExact = b.text.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      

      const aStartsWith = a.text.toLowerCase().startsWith(lowerQuery);
      const bStartsWith = b.text.toLowerCase().startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      

      return a.text.length - b.text.length;
    });
  }


  displayResults(results) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = '';

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'search-no-results';
      noResults.textContent = 'Ничего не найдено';
      this.resultsContainer.appendChild(noResults);
      return;
    }

    const limitedResults = results.slice(0, 10);

    limitedResults.forEach((result) => {
      const resultItem = document.createElement('button');
      resultItem.type = 'button';
      resultItem.className = 'search-result-item';
      if (result.isCurrentPage) resultItem.classList.add('is-current');

      const highlightedText = this.highlightMatch(result.text, this.searchInput.value);

      resultItem.innerHTML = `
        <span class="search-result-title">${highlightedText}</span>
        <span class="search-result-meta">
          <span class="search-result-dot ${result.isCurrentPage ? 'is-here' : ''}"></span>
          ${result.pageName} · ${result.tag}
        </span>
      `;

      resultItem.addEventListener('click', () => {
        this.navigateToPage(result.pageUrl, result.text);
        this.hideResults();
        this.searchInput.value = '';
      });

      this.resultsContainer.appendChild(resultItem);
    });
  }


  highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-result-mark">$1</mark>');
  }


  navigateToPage(url, searchText = '') {
    if (url) {
      console.log('SearchWidget: Переход на страницу:', url);
      console.log('SearchWidget: Текст для выделения:', searchText);

      if (searchText) {
        sessionStorage.setItem('lanSearchHighlightText', searchText);
        console.log('SearchWidget: Сохранен в sessionStorage:', searchText);
      }
      window.location.href = url;
    }
  }


  showResults() {
    if (this.resultsContainer) {
      this.resultsContainer.hidden = false;
      this.resultsContainer.classList.add('is-open');
      this.isVisible = true;
    }
  }


  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.hidden = true;
      this.resultsContainer.classList.remove('is-open');
      this.isVisible = false;
    }
  }


  getCurrentPageName() {
    const positionElement = document.getElementById('current_position');
    if (positionElement) {
      return positionElement.textContent.trim();
    }
    return document.title || window.location.pathname;
  }


  updateSearchData() {
    this.loadSearchData();
  }


  testHighlight(text) {
    console.log('SearchWidget: Тестируем выделение текста:', text);
    this.highlightTextOnPage(text);
  }


  checkForHighlight() {
    const highlightText = sessionStorage.getItem('lanSearchHighlightText');
    console.log('SearchWidget: Проверяем sessionStorage:', highlightText);
    console.log('SearchWidget: Все sessionStorage:', sessionStorage);
    
    if (highlightText) {
      console.log('SearchWidget: Найден текст для выделения:', highlightText);
      

      sessionStorage.removeItem('lanSearchHighlightText');
      

      setTimeout(() => {
        console.log('SearchWidget: Запускаем выделение через 500мс');
        this.highlightTextOnPage(highlightText);
      }, 500);
    } else {
      console.log('SearchWidget: Нет текста для выделения в sessionStorage');
    }
  }


  highlightTextOnPage(searchText) {
    if (!searchText) return;

    console.log('SearchWidget: Начинаем выделение текста:', searchText);


    this.addHighlightStyles();


    const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, td, th, li, strong, em, small, b, i, u');
    let foundMatches = 0;

    elements.forEach(element => {

      if (element.tagName === 'SCRIPT' || 
          element.tagName === 'STYLE' || 
          element.style.display === 'none' ||
          element.hidden ||
          element.offsetParent === null) {
        return;
      }


      if (element.querySelector('.lan-search-highlight')) {
        return;
      }

      const text = element.textContent;
      if (!text || text.trim().length === 0) return;


      const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      if (regex.test(text)) {

        if (element.children.length === 0) {
          const highlightedText = text.replace(regex, '<mark class="lan-search-highlight" style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px; animation: lan-search-pulse 2s ease-in-out;">$1</mark>');
          element.innerHTML = highlightedText;
          foundMatches++;
          console.log('SearchWidget: Выделен текст в элементе:', element.tagName, text.substring(0, 50));
        }
      }
    });

    console.log('SearchWidget: Найдено совпадений:', foundMatches);
    

    setTimeout(() => {
      this.scrollToFirstHighlight();
    }, 100);
  }


  highlightTextInElement(element, searchText) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {

          if (node.parentElement && node.parentElement.querySelector('.lan-search-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="lan-search-highlight" style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px; animation: lan-search-pulse 2s ease-in-out;">$1</mark>');
        
        if (highlightedText !== text) {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlightedText;
          textNode.parentNode.replaceChild(wrapper, textNode);
        }
      }
    });
  }


  addHighlightStyles() {
    if (document.getElementById('lan-search-highlight-styles')) return;

    const style = document.createElement('style');
    style.id = 'lan-search-highlight-styles';
    style.textContent = `
      @keyframes lan-search-pulse {
        0% { background: #ffeb3b; transform: scale(1); }
        50% { background: #ffc107; transform: scale(1.05); }
        100% { background: #ffeb3b; transform: scale(1); }
      }
      
      .lan-search-highlight {
        animation: lan-search-pulse 2s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }


  scrollToFirstHighlight() {
    const firstHighlight = document.querySelector('.lan-search-highlight');
    if (firstHighlight) {
      firstHighlight.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      

      setTimeout(() => {
        const highlights = document.querySelectorAll('.lan-search-highlight');
        highlights.forEach(highlight => {
          highlight.style.animation = 'none';
          highlight.style.background = '#ffeb3b';
        });
      }, 3000);
    }
  }
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      searchWidget = new SearchWidget();
      window.lanSearchWidget = searchWidget;
    });
  } else {
    searchWidget = new SearchWidget();
    window.lanSearchWidget = searchWidget;
  }
})();
