(function() {
  if (['msgtp.langame.ru', 'msgpublic.langame.ru'].includes(window.location.hostname.toLowerCase())) return;
  var searchWidget;
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

    const navbar = document.querySelector('#mainNav');
    if (!navbar) {
      console.log('SearchWidget: Навигация не найдена');
      return;
    }


    const navbarResponsive = navbar.querySelector('#navbarResponsive');
    if (!navbarResponsive) {
      console.log('SearchWidget: Контейнер navbarResponsive не найден');
      return;
    }


    const searchItem = document.createElement('div');
    searchItem.className = 'search-widget-container';
    searchItem.style.cssText = `
      position: absolute;
      top: 50%;
      left: 20px;
      transform: translateY(-50%);
      z-index: 10;
      display: inline-block;
    `;


    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Поиск... (beta)';
    this.searchInput.className = 'search-input';
    this.searchInput.style.cssText = `
      width:450px;
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      color: #333;
      font-size: 14px;
      outline: none;
    `;


    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'search-results';
    this.resultsContainer.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 450px;
      background: #fff;
      border: 1px solid #ccc;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;


    searchItem.appendChild(this.searchInput);
    searchItem.appendChild(this.resultsContainer);
    

    navbarResponsive.appendChild(searchItem);

    console.log('SearchWidget: Поисковый виджет создан');
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
      noResults.style.cssText = `
        padding: 10px;
        color: #666;
        text-align: center;
        font-style: italic;
      `;
      this.resultsContainer.appendChild(noResults);
      return;
    }


    const limitedResults = results.slice(0, 10);

    limitedResults.forEach((result, index) => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.style.cssText = `
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.2s;
      `;


      const highlightedText = this.highlightMatch(result.text, this.searchInput.value);
      
      resultItem.innerHTML = `
        <div style="font-weight: 500; color: #333; margin-bottom: 2px;">
          ${highlightedText}
        </div>
        <div style="font-size: 12px; color: #666;">
          ${result.isCurrentPage ? '🟢 ' : '🔵 '}${result.pageName} • ${result.tag}
        </div>
      `;


        resultItem.addEventListener('click', () => {
          this.navigateToPage(result.pageUrl, result.text);
          this.hideResults();
          this.searchInput.value = '';
        });


      resultItem.addEventListener('mouseenter', () => {
        resultItem.style.backgroundColor = '#f5f5f5';
      });

      resultItem.addEventListener('mouseleave', () => {
        resultItem.style.backgroundColor = 'transparent';
      });

      this.resultsContainer.appendChild(resultItem);
    });
  }


  highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
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
      this.resultsContainer.style.display = 'block';
      this.isVisible = true;
    }
  }


  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'none';
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


let searchWidget;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    searchWidget = new SearchWidget();
  });
} else {
  searchWidget = new SearchWidget();
}

window.lanSearchWidget = searchWidget;
})();
