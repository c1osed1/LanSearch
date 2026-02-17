document.addEventListener('DOMContentLoaded', function() {
  // Элементы интерфейса
  const authSection = document.getElementById('authSection');
  const loginBtn = document.getElementById('loginBtn');
  const authError = document.getElementById('authError');
  
  const accountInfo = document.getElementById('accountInfo');
  const accountUsername = document.getElementById('accountUsername');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const mainContent = document.getElementById('mainContent');
  const favoritesTab = document.getElementById('favoritesTab');
  const searchTab = document.getElementById('searchTab');
  const settingsTab = document.getElementById('settingsTab');
  const favoritesList = document.getElementById('favoritesList');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultsCount = document.getElementById('searchResultsCount');
  
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Данные для поиска
  let allWikiFiles = [];
  let categories = [];
  
  // Элементы настроек
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const updateStatus = document.getElementById('updateStatus');
  const themeToggle = document.getElementById('themeToggle');
  const modalBypassToggle = document.getElementById('modalBypassToggle');
  const pcStylesToggle = document.getElementById('pcStylesToggle');
  const tableOptimizationToggle = document.getElementById('tableOptimizationToggle');
  const hideCheckboxesToggle = document.getElementById('hideCheckboxesToggle');
  const hideCommentsToggle = document.getElementById('hideCommentsToggle');
  const domainInfoToggle = document.getElementById('domainInfoToggle');
  const customWebSocketToggle = document.getElementById('customWebSocketToggle');
  const energySavingIgnoreToggle = document.getElementById('energySavingIgnoreToggle');
  const updaters3000Toggle = document.getElementById('updaters3000Toggle');

  async function syncAuthFromStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await new Promise(function (resolve) {
        chrome.storage.local.get(['wikiToken', 'wikiUser'], resolve);
      });
      if (data.wikiToken && data.wikiUser) {
        localStorage.setItem('wikiToken', data.wikiToken);
        localStorage.setItem('wikiUser', data.wikiUser);
      }
    }
  }

  // Проверка авторизации при загрузке
  async function checkAuth() {
    await syncAuthFromStorage();
    if (wikiAPI.isAuthenticated()) {
      const user = wikiAPI.getUser();
      showMainContent(user);
    } else {
      showAuthForm();
    }
  }

  // Показать форму авторизации
  function showAuthForm() {
    authSection.style.display = 'block';
    accountInfo.classList.remove('visible');
    mainContent.style.display = 'none';
    authError.style.display = 'none';
  }

  // Показать основной контент
  function showMainContent(user) {
    authSection.style.display = 'none';
    accountInfo.classList.add('visible');
    accountUsername.textContent = user.username || 'Пользователь';
    mainContent.style.display = 'block';
    
    // Загружаем избранные файлы если открыта вкладка избранных
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.tab === 'favorites') {
      loadFavoriteFiles();
    }
  }

  // SSO: открыть страницу авторизации на msgtp
  loginBtn.addEventListener('click', function() {
    authError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Открываю...';
    const extId = chrome.runtime?.id;
    const baseUrl = 'https://msgtp.langame.ru';
    const ssoUrl = extId
      ? baseUrl + '/lansearch-sso?ext_id=' + encodeURIComponent(extId)
      : baseUrl + '/auth';
    chrome.tabs.create({ url: ssoUrl }, function() {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Авторизоваться через msgtp';
      window.close();
    });
  });

  // Показать ошибку авторизации
  function showAuthError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
  }

  // Выход
  logoutBtn.addEventListener('click', function() {
    wikiAPI.logout();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['wikiToken', 'wikiUser']);
    }
    showAuthForm();
  });

  // Переключение вкладок
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Обновляем активные классы
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      this.classList.add('active');
      document.getElementById(`${targetTab}Tab`).classList.add('active');
      
      // Загружаем данные при переключении на вкладку
      if (targetTab === 'favorites') {
        loadFavoriteFiles();
      } else if (targetTab === 'search') {
        loadSearchData();
      }
    });
  });

  // Загрузка избранных файлов
  async function loadFavoriteFiles() {
    favoritesList.innerHTML = '<div class="loading">Загрузка избранных файлов...</div>';
    
    try {
      const files = await wikiAPI.getFavoriteFiles();
      
      if (files.length === 0) {
        favoritesList.innerHTML = `
          <div class="empty-favorites">
            <div class="empty-favorites-icon">⭐</div>
            <div>Нет избранных файлов</div>
            <div style="margin-top: 8px; font-size: 11px; color: #666;">Добавьте файлы в избранное в Wiki</div>
          </div>
        `;
        return;
      }
      
      favoritesList.innerHTML = '';
      files.forEach(file => {
        const item = createFavoriteItem(file);
        favoritesList.appendChild(item);
      });
    } catch (error) {
      favoritesList.innerHTML = `
        <div class="empty-favorites">
          <div style="color: #dc3545;">Ошибка загрузки: ${error.message}</div>
        </div>
      `;
    }
  }

  // Создание элемента избранного файла
  function createFavoriteItem(file) {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    
    // Форматируем размер файла
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    // Форматируем дату
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    };
    
    item.innerHTML = `
      <div class="favorite-item-name">${escapeHtml(file.original_filename)}</div>
      <div class="favorite-item-footer">
        <div class="favorite-item-meta">
          ${formatFileSize(file.file_size)} • ${formatDate(file.created_at)}
        </div>
        <div class="favorite-item-actions">
          <button class="favorite-btn" data-action="download" data-file-id="${file.id}">Скачать</button>
          <button class="favorite-btn secondary" data-action="copy" data-file-id="${file.id}">Скопировать</button>
        </div>
      </div>
    `;
    
    // Обработчики кнопок
    const downloadBtn = item.querySelector('[data-action="download"]');
    const copyBtn = item.querySelector('[data-action="copy"]');
    
    downloadBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      try {
        await wikiAPI.downloadFile(file);
      } catch (error) {
        alert('Ошибка скачивания: ' + error.message);
      }
    });
    
    copyBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      try {
        const success = await wikiAPI.copyCommand(file);
        if (success) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Скопировано!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        } else {
          alert('Не удалось скопировать команду');
        }
      } catch (error) {
        alert('Ошибка копирования: ' + error.message);
      }
    });
    
    return item;
  }

  // Экранирование HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Загрузка данных для поиска
  async function loadSearchData() {
    try {
      // Загружаем файлы и категории параллельно
      const [files, cats] = await Promise.all([
        wikiAPI.getWikiFiles(),
        wikiAPI.getCategories()
      ]);
      
      allWikiFiles = files;
      categories = cats;
      
      // Заполняем селект категорий
      categorySelect.innerHTML = '<option value="">Все категории</option><option value="-1">Без категории</option>';
      cats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });
      
      // Применяем текущие фильтры
      performSearch();
    } catch (error) {
      searchResultsList.innerHTML = `
        <div class="empty-favorites">
          <div style="color: #dc3545;">Ошибка загрузки: ${error.message}</div>
        </div>
      `;
    }
  }

  // Выполнение поиска
  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    
    let filteredFiles = allWikiFiles;
    
    // Фильтр по категории
    if (selectedCategory !== '') {
      if (selectedCategory === '-1') {
        // Файлы без категории
        filteredFiles = filteredFiles.filter(file => 
          !file.category_id && (!file.category_ids || file.category_ids.length === 0)
        );
      } else {
        const categoryId = parseInt(selectedCategory);
        filteredFiles = filteredFiles.filter(file => 
          file.category_id === categoryId || 
          (file.category_ids && file.category_ids.includes(categoryId))
        );
      }
    }
    
    // Фильтр по поисковому запросу
    if (query) {
      filteredFiles = filteredFiles.filter(file => 
        file.original_filename.toLowerCase().includes(query) ||
        (file.short_description && file.short_description.toLowerCase().includes(query)) ||
        (file.full_description && file.full_description.toLowerCase().includes(query))
      );
    }
    
    // Показываем результаты
    displaySearchResults(filteredFiles);
  }

  // Отображение результатов поиска
  function displaySearchResults(files) {
    if (files.length === 0) {
      searchResultsList.innerHTML = `
        <div class="empty-favorites">
          <div class="empty-favorites-icon">🔍</div>
          <div>Ничего не найдено</div>
        </div>
      `;
      searchResultsCount.textContent = 'Найдено: 0';
      return;
    }
    
    searchResultsCount.textContent = `Найдено: ${files.length}`;
    searchResultsList.innerHTML = '';
    
    files.forEach(file => {
      const item = createFavoriteItem(file);
      searchResultsList.appendChild(item);
    });
  }

  // Обработчики поиска
  searchInput.addEventListener('input', performSearch);
  categorySelect.addEventListener('change', performSearch);

  // ========== НАСТРОЙКИ ==========
  
  // Инициализация всех настроек
  function initSettings() {
    initModalBypass();
    initPCStyles();
    initTableOptimization();
    initHideCheckboxes();
    initHideComments();
    initDomainInfo();
    initCustomWebSocket();
    initEnergySavingIgnore();
    initUpdaters3000();
  }

  // Обход модальных окон
  let modalBypassEnabled = false;
  
  function initModalBypass() {
    try {
      const localBypass = localStorage.getItem('lanSearchModalBypass');
      if (localBypass !== null) {
        modalBypassEnabled = localBypass === 'true';
        setModalBypassState(modalBypassEnabled);
        return;
      }
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['modalBypass'], function(result) {
          modalBypassEnabled = result.modalBypass || false;
          setModalBypassState(modalBypassEnabled);
          localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
        });
      } else {
        modalBypassEnabled = false;
        setModalBypassState(false);
      }
    } catch (e) {
      modalBypassEnabled = false;
      setModalBypassState(false);
    }
  }

  function setModalBypassState(enabled) {
    modalBypassToggle.textContent = enabled ? 'Включен' : 'Выключен';
    modalBypassToggle.classList.toggle('enabled', enabled);
  }

  function toggleModalBypass() {
    modalBypassEnabled = !modalBypassEnabled;
    setModalBypassState(modalBypassEnabled);
    localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ modalBypass: modalBypassEnabled }, function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                if (window.lanSearchSyncModalBypass) {
                  window.lanSearchSyncModalBypass();
                }
              }
            }).catch(() => {});
          }
        });
      });
    }
  }

  modalBypassToggle.addEventListener('click', toggleModalBypass);

  // Стили карт ПК
  let pcStylesEnabled = false;
  
  function initPCStyles() {
    try {
      const localStyles = localStorage.getItem('lanSearchPCStyles');
      if (localStyles !== null) {
        pcStylesEnabled = localStyles === 'true';
        setPCStylesState(pcStylesEnabled);
        return;
      }
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['pcStyles'], function(result) {
          pcStylesEnabled = result.pcStyles || false;
          setPCStylesState(pcStylesEnabled);
          localStorage.setItem('lanSearchPCStyles', pcStylesEnabled.toString());
        });
      } else {
        pcStylesEnabled = false;
        setPCStylesState(false);
      }
    } catch (e) {
      pcStylesEnabled = false;
      setPCStylesState(false);
    }
  }

  function setPCStylesState(enabled) {
    pcStylesToggle.textContent = enabled ? 'Включен' : 'Выключен';
    pcStylesToggle.classList.toggle('enabled', enabled);
  }

  function togglePCStyles() {
    pcStylesEnabled = !pcStylesEnabled;
    setPCStylesState(pcStylesEnabled);
    localStorage.setItem('lanSearchPCStyles', pcStylesEnabled.toString());
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ pcStyles: pcStylesEnabled }, function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                if (window.lanSearchSyncPCStyles) {
                  window.lanSearchSyncPCStyles();
                }
              }
            }).catch(() => {});
          }
        });
      });
    }
  }

  pcStylesToggle.addEventListener('click', togglePCStyles);

  // Оптимизация таблиц
  let tableOptimizationEnabled = false;
  
  function initTableOptimization() {
    try {
      const localOptimization = localStorage.getItem('lanSearchTableOptimization');
      if (localOptimization !== null) {
        tableOptimizationEnabled = localOptimization === 'true';
        setTableOptimizationState(tableOptimizationEnabled);
        return;
      }
      
      chrome.storage.sync.get(['tableOptimization'], function(result) {
        tableOptimizationEnabled = result.tableOptimization || false;
        setTableOptimizationState(tableOptimizationEnabled);
      });
    } catch (error) {
      tableOptimizationEnabled = false;
      setTableOptimizationState(false);
    }
  }

  function setTableOptimizationState(enabled) {
    tableOptimizationToggle.textContent = enabled ? 'Включен' : 'Выключен';
    tableOptimizationToggle.classList.toggle('enabled', enabled);
  }

  function toggleTableOptimization() {
    tableOptimizationEnabled = !tableOptimizationEnabled;
    setTableOptimizationState(tableOptimizationEnabled);
    localStorage.setItem('lanSearchTableOptimization', tableOptimizationEnabled.toString());
    
    chrome.storage.sync.set({ tableOptimization: tableOptimizationEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncTableOptimization) {
                window.lanSearchSyncTableOptimization();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  tableOptimizationToggle.addEventListener('click', toggleTableOptimization);

  // Скрытие чекбоксов
  let hideCheckboxesEnabled = false;
  
  function initHideCheckboxes() {
    try {
      const localHideCheckboxes = localStorage.getItem('lanSearchHideCheckboxes');
      if (localHideCheckboxes !== null) {
        hideCheckboxesEnabled = localHideCheckboxes === 'true';
        setHideCheckboxesState(hideCheckboxesEnabled);
        return;
      }
      
      chrome.storage.sync.get(['hideCheckboxes'], function(result) {
        hideCheckboxesEnabled = result.hideCheckboxes || false;
        setHideCheckboxesState(hideCheckboxesEnabled);
      });
    } catch (error) {
      hideCheckboxesEnabled = false;
      setHideCheckboxesState(false);
    }
  }

  function setHideCheckboxesState(enabled) {
    hideCheckboxesToggle.textContent = enabled ? 'Включен' : 'Выключен';
    hideCheckboxesToggle.classList.toggle('enabled', enabled);
  }

  function toggleHideCheckboxes() {
    hideCheckboxesEnabled = !hideCheckboxesEnabled;
    setHideCheckboxesState(hideCheckboxesEnabled);
    localStorage.setItem('lanSearchHideCheckboxes', hideCheckboxesEnabled.toString());
    
    chrome.storage.sync.set({ hideCheckboxes: hideCheckboxesEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncHideCheckboxes) {
                window.lanSearchSyncHideCheckboxes();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  hideCheckboxesToggle.addEventListener('click', toggleHideCheckboxes);

  // Скрытие комментариев
  let hideCommentsEnabled = false;
  
  function initHideComments() {
    try {
      const localHideComments = localStorage.getItem('lanSearchHideComments');
      if (localHideComments !== null) {
        hideCommentsEnabled = localHideComments === 'true';
        setHideCommentsState(hideCommentsEnabled);
        return;
      }
      
      chrome.storage.sync.get(['hideComments'], function(result) {
        hideCommentsEnabled = result.hideComments || false;
        setHideCommentsState(hideCommentsEnabled);
      });
    } catch (error) {
      hideCommentsEnabled = false;
      setHideCommentsState(false);
    }
  }

  function setHideCommentsState(enabled) {
    hideCommentsToggle.textContent = enabled ? 'Включен' : 'Выключен';
    hideCommentsToggle.classList.toggle('enabled', enabled);
  }

  function toggleHideComments() {
    hideCommentsEnabled = !hideCommentsEnabled;
    setHideCommentsState(hideCommentsEnabled);
    localStorage.setItem('lanSearchHideComments', hideCommentsEnabled.toString());
    
    chrome.storage.sync.set({ hideComments: hideCommentsEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncHideComments) {
                window.lanSearchSyncHideComments();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  hideCommentsToggle.addEventListener('click', toggleHideComments);

  // Информация по домену
  let domainInfoEnabled = false;
  
  function initDomainInfo() {
    try {
      const localDomainInfo = localStorage.getItem('lanSearchDomainInfo');
      if (localDomainInfo !== null) {
        domainInfoEnabled = localDomainInfo === 'true';
        setDomainInfoState(domainInfoEnabled);
        return;
      }
      
      chrome.storage.sync.get(['domainInfo'], function(result) {
        domainInfoEnabled = result.domainInfo || false;
        setDomainInfoState(domainInfoEnabled);
      });
    } catch (error) {
      domainInfoEnabled = false;
      setDomainInfoState(false);
    }
  }

  function setDomainInfoState(enabled) {
    domainInfoToggle.textContent = enabled ? 'Включен' : 'Выключен';
    domainInfoToggle.classList.toggle('enabled', enabled);
  }

  function toggleDomainInfo() {
    domainInfoEnabled = !domainInfoEnabled;
    setDomainInfoState(domainInfoEnabled);
    localStorage.setItem('lanSearchDomainInfo', domainInfoEnabled.toString());
    
    chrome.storage.sync.set({ domainInfo: domainInfoEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncDomainInfo) {
                window.lanSearchSyncDomainInfo();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  domainInfoToggle.addEventListener('click', toggleDomainInfo);

  // WebSocket
  let customWebSocketEnabled = false;
  
  function initCustomWebSocket() {
    try {
      const localWebSocket = localStorage.getItem('lanSearchCustomWebSocket');
      if (localWebSocket !== null) {
        customWebSocketEnabled = localWebSocket === 'true';
        setCustomWebSocketState(customWebSocketEnabled);
        return;
      }
      
      chrome.storage.sync.get(['customWebSocket'], function(result) {
        customWebSocketEnabled = result.customWebSocket || false;
        setCustomWebSocketState(customWebSocketEnabled);
      });
    } catch (error) {
      customWebSocketEnabled = false;
      setCustomWebSocketState(false);
    }
  }

  function setCustomWebSocketState(enabled) {
    customWebSocketToggle.textContent = enabled ? 'Включен' : 'Выключен';
    customWebSocketToggle.classList.toggle('enabled', enabled);
  }

  function toggleCustomWebSocket() {
    customWebSocketEnabled = !customWebSocketEnabled;
    setCustomWebSocketState(customWebSocketEnabled);
    localStorage.setItem('lanSearchCustomWebSocket', customWebSocketEnabled.toString());
    
    chrome.storage.sync.set({ customWebSocket: customWebSocketEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchWebSocket) {
                if (window.lanSearchWebSocket.clearCache) {
                  window.lanSearchWebSocket.clearCache();
                }
                if (window.lanSearchWebSocket.getSetting) {
                  window.lanSearchWebSocket.getSetting((enabled) => {
                    if (enabled && window.lanSearchWebSocket.create) {
                      window.lanSearchWebSocket.create();
                    } else if (!enabled && window._lanSearchWebSocket) {
                      window._lanSearchWebSocket.close();
                    }
                  });
                }
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  customWebSocketToggle.addEventListener('click', toggleCustomWebSocket);

  // Игнорирование энергосбережения
  let energySavingIgnoreEnabled = false;
  
  function initEnergySavingIgnore() {
    try {
      const localEnergySaving = localStorage.getItem('lanSearchEnergySavingIgnore');
      if (localEnergySaving !== null) {
        energySavingIgnoreEnabled = localEnergySaving === 'true';
        setEnergySavingIgnoreState(energySavingIgnoreEnabled);
        return;
      }
      
      chrome.storage.sync.get(['energySavingIgnore'], function(result) {
        energySavingIgnoreEnabled = result.energySavingIgnore || false;
        setEnergySavingIgnoreState(energySavingIgnoreEnabled);
      });
    } catch (error) {
      energySavingIgnoreEnabled = false;
      setEnergySavingIgnoreState(false);
    }
  }

  function setEnergySavingIgnoreState(enabled) {
    energySavingIgnoreToggle.textContent = enabled ? 'Включен' : 'Выключен';
    energySavingIgnoreToggle.classList.toggle('enabled', enabled);
  }

  function toggleEnergySavingIgnore() {
    energySavingIgnoreEnabled = !energySavingIgnoreEnabled;
    setEnergySavingIgnoreState(energySavingIgnoreEnabled);
    localStorage.setItem('lanSearchEnergySavingIgnore', energySavingIgnoreEnabled.toString());
    
    chrome.storage.sync.set({ energySavingIgnore: energySavingIgnoreEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncEnergySavingIgnore) {
                window.lanSearchSyncEnergySavingIgnore();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  energySavingIgnoreToggle.addEventListener('click', toggleEnergySavingIgnore);

  // Обновляторы3000
  let updaters3000Enabled = false;
  
  function initUpdaters3000() {
    try {
      const localUpdaters3000 = localStorage.getItem('lanSearchUpdaters3000');
      if (localUpdaters3000 !== null) {
        updaters3000Enabled = localUpdaters3000 === 'true';
        setUpdaters3000State(updaters3000Enabled);
        return;
      }
      
      chrome.storage.sync.get(['updaters3000'], function(result) {
        updaters3000Enabled = result.updaters3000 || false;
        setUpdaters3000State(updaters3000Enabled);
      });
    } catch (error) {
      updaters3000Enabled = false;
      setUpdaters3000State(false);
    }
  }

  function setUpdaters3000State(enabled) {
    updaters3000Toggle.textContent = enabled ? 'Включен' : 'Выключен';
    updaters3000Toggle.classList.toggle('enabled', enabled);
  }

  function toggleUpdaters3000() {
    updaters3000Enabled = !updaters3000Enabled;
    setUpdaters3000State(updaters3000Enabled);
    localStorage.setItem('lanSearchUpdaters3000', updaters3000Enabled.toString());
    
    chrome.storage.sync.set({ updaters3000: updaters3000Enabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncUpdaters3000) {
                window.lanSearchSyncUpdaters3000();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  updaters3000Toggle.addEventListener('click', toggleUpdaters3000);

  // Проверка обновлений
  async function checkForUpdates() {
    try {
      checkUpdateBtn.disabled = true;
      checkUpdateBtn.textContent = 'Проверяю...';
      updateStatus.textContent = 'Проверяем наличие обновлений...';
      
      const manifest = chrome.runtime.getManifest();
      const currentVersion = manifest.version;
      
      const response = await fetch('https://api.github.com/repos/c1osed1/LanSearch/commits?per_page=1');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const commits = await response.json();
      
      if (commits.length === 0) {
        updateStatus.textContent = 'Не удалось получить информацию о коммитах';
        return;
      }
      
      const latestCommit = commits[0];
      const latestCommitSha = latestCommit.sha.substring(0, 7);
      const commitDate = new Date(latestCommit.commit.author.date);
      const commitMessage = latestCommit.commit.message.split('\n')[0];
      
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      updateStatus.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Последняя проверка:</strong> ${formatDate(new Date())}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Последнее обновление на GitHub:</strong><br>
          ${formatDate(commitDate)} (${latestCommitSha})
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Сообщение коммита:</strong><br>
          ${escapeHtml(commitMessage)}
        </div>
        <div style="margin-bottom: 8px; font-weight: 600;">
          ✅ У вас последняя версия: ${currentVersion}
        </div>
        <button id="downloadUpdateBtn" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
          Скачать обновление
        </button>
      `;
      
      const downloadBtn = document.getElementById('downloadUpdateBtn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://github.com/c1osed1/LanSearch/archive/refs/heads/main.zip' });
        });
      }
      
    } catch (error) {
      console.error('Ошибка проверки обновлений:', error);
      updateStatus.innerHTML = `
        <div style="margin-bottom: 8px; color: #dc3545;">
          Ошибка проверки обновлений: ${escapeHtml(error.message)}
        </div>
        <button id="downloadUpdateBtn" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
          Скачать обновление
        </button>
      `;
      
      const downloadBtn = document.getElementById('downloadUpdateBtn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://github.com/c1osed1/LanSearch/archive/refs/heads/main.zip' });
        });
      }
    } finally {
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.textContent = 'Проверить';
    }
  }

  checkUpdateBtn.addEventListener('click', checkForUpdates);

  // Функции для работы с темой (только для сайта, не для popup)
  let currentTheme = 'dark';
  
  function initTheme() {
    try {
      const localTheme = localStorage.getItem('lanSearchTheme');
      if (localTheme) {
        currentTheme = localTheme;
        setThemeButton(localTheme);
        return;
      }
      
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['theme'], function(result) {
          try {
            currentTheme = result.theme || 'dark';
            setThemeButton(currentTheme);
            
            try {
              localStorage.setItem('lanSearchTheme', currentTheme);
            } catch (e) {}
          } catch (e) {
            currentTheme = 'dark';
            setThemeButton('dark');
          }
        });
      } else {
        currentTheme = 'dark';
        setThemeButton('dark');
      }
    } catch (e) {
      currentTheme = 'dark';
      setThemeButton('dark');
    }
  }
  
  function setThemeButton(theme) {
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? 'Темная' : 'Светлая';
      themeToggle.title = theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему';
    }
  }
  
  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    currentTheme = newTheme;
    setThemeButton(newTheme);
    
    // Сохраняем настройку темы
    try {
      localStorage.setItem('lanSearchTheme', newTheme);
    } catch (e) {}
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ theme: newTheme }, function() {
          // Применяем тему на всех открытых вкладках
          chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (theme) => {
                  if (document.documentElement) {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                  // Также обновляем через localStorage на странице
                  try {
                    localStorage.setItem('lanSearchTheme', theme);
                  } catch (e) {}
                },
                args: [newTheme]
              }).catch(() => {});
            });
          });
        });
      }
    } catch (e) {}
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Инициализация
  checkAuth();
  initSettings();
  initTheme();
});
