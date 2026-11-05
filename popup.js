document.addEventListener('DOMContentLoaded', function() {
  function isLanSearchExcludedUrl(url) {
    try {
      const h = new URL(url || '').hostname.toLowerCase();
      return h === 'msgtp.langame.ru'
        || h === 'msgpublic.langame.ru'
        || h.endsWith('.msgtp.langame.ru')
        || h.endsWith('.msgpublic.langame.ru');
    } catch (_) {
      return false;
    }
  }

  function withActiveTab(fn) {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].id || isLanSearchExcludedUrl(tabs[0].url)) return;
      fn(tabs[0]);
    });
  }

  // Элементы интерфейса
  const authSection = document.getElementById('authSection');
  const loginBtn = document.getElementById('loginBtn');
  const pawsBtn = document.getElementById('pawsBtn');
  const manualAuthBlock = document.getElementById('manualAuthBlock');
  const manualTokenInput = document.getElementById('manualTokenInput');
  const manualTokenSubmit = document.getElementById('manualTokenSubmit');
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
  const newUiToggle = document.getElementById('newUiToggle');
  const newUiAllClubsPcToggle = document.getElementById('newUiAllClubsPcToggle');
  const pcStylesToggle = document.getElementById('pcStylesToggle');
  const tableOptimizationToggle = document.getElementById('tableOptimizationToggle');
  const hideCheckboxesToggle = document.getElementById('hideCheckboxesToggle');
  const hideCommentsToggle = document.getElementById('hideCommentsToggle');
  const hideRemoteDownloadToggle = document.getElementById('hideRemoteDownloadToggle');
  const customWebSocketToggle = document.getElementById('customWebSocketToggle');

  async function syncAuthFromStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await new Promise(function (resolve) {
        chrome.storage.local.get(['wikiToken', 'wikiUser', 'msgtpSessionToken'], resolve);
      });
      if (data.wikiToken && data.wikiUser) {
        localStorage.setItem('wikiToken', data.wikiToken);
        var userVal = data.wikiUser;
        localStorage.setItem('wikiUser', typeof userVal === 'string' ? userVal : JSON.stringify(userVal));
      }
      if (data.msgtpSessionToken) {
        localStorage.setItem('msgtpSessionToken', data.msgtpSessionToken);
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
    if (manualAuthBlock) {
      manualAuthBlock.style.display = 'none';
      if (manualTokenInput) manualTokenInput.value = '';
    }
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
    // Firefox использует moz-extension://; бэкенд должен редиректить на этот протокол
    const isFirefox = (chrome.runtime?.getURL?.('') || '').startsWith('moz-extension://');
    let ssoUrl = extId
      ? baseUrl + '/lansearch-sso?ext_id=' + encodeURIComponent(extId)
      : baseUrl + '/auth';
    if (extId && isFirefox) {
      ssoUrl += '&proto=moz-extension';
    }
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

  // «У меня лапки» — показать поле для ручного ввода токена
  if (pawsBtn && manualAuthBlock) {
    pawsBtn.addEventListener('click', function() {
      const isHidden = manualAuthBlock.style.display === 'none';
      manualAuthBlock.style.display = isHidden ? 'flex' : 'none';
      authError.style.display = 'none';
      if (isHidden && manualTokenInput) manualTokenInput.focus();
    });
  }

  // Войти по вставленному токену
  if (manualTokenSubmit && manualTokenInput) {
    manualTokenSubmit.addEventListener('click', async function() {
      const token = (manualTokenInput.value || '').trim();
      authError.style.display = 'none';
      if (!token) {
        showAuthError('Вставьте токен.');
        return;
      }
      wikiAPI.setToken(token);
      let user = null;
      try {
        user = await wikiAPI.getCurrentUser();
      } catch (e) {
        user = { username: 'По токену', id: 0 };
      }
      if (user) {
        wikiAPI.setUser(user);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ wikiToken: token, wikiUser: user });
        }
        showMainContent(user);
      } else {
        showAuthError('Не удалось получить данные пользователя. Токен сохранён.');
      }
    });
  }

  // Выход
  logoutBtn.addEventListener('click', function() {
    wikiAPI.logout();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['wikiToken', 'wikiUser', 'msgtpSessionToken']);
    }
    try {
      localStorage.removeItem('msgtpSessionToken');
    } catch (e) {}
    showAuthForm();
  });

  function setSwitchState(el, enabled) {
    if (!el) return;
    el.classList.toggle('enabled', !!enabled);
    el.setAttribute('aria-checked', enabled ? 'true' : 'false');
    el.textContent = enabled ? 'Включен' : 'Выключен';
  }

  // Переключение вкладок
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      document.getElementById(`${targetTab}Tab`).classList.add('active');
      
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

async function initScripts() {

    const manager = new ScriptManager("scriptsList");

    await manager.load();

}


  // ========== НАСТРОЙКИ ==========
  
  // Инициализация всех настроек
  function initSettings() {
    initModalBypass();
    initNewUi();
    initPCStyles();
    initTableOptimization();
    initHideCheckboxes();
    initHideComments();
    initHideRemoteDownload();
    initCustomWebSocket();
  }

 
  // Обход модальных окон
  let modalBypassEnabled = false;
  
  function initModalBypass() {
    const apply = (enabled) => {
      modalBypassEnabled = !!enabled;
      setModalBypassState(modalBypassEnabled);
      try {
        localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
      } catch (_) {}
    };

    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        apply(localStorage.getItem('lanSearchModalBypass') === 'true');
        return;
      }

      chrome.storage.local.get(['modalBypass'], function(localResult) {
        if (!chrome.runtime.lastError && localResult && localResult.modalBypass !== undefined) {
          apply(localResult.modalBypass);
          return;
        }
        chrome.storage.sync.get(['modalBypass'], function(syncResult) {
          if (!chrome.runtime.lastError && syncResult && syncResult.modalBypass !== undefined) {
            apply(syncResult.modalBypass);
            try { chrome.storage.local.set({ modalBypass: !!syncResult.modalBypass }); } catch (_) {}
            return;
          }
          apply(localStorage.getItem('lanSearchModalBypass') === 'true');
        });
      });
    } catch (e) {
      apply(false);
    }
  }

  function setModalBypassState(enabled) {
    setSwitchState(modalBypassToggle, enabled);
  }

  function syncModalBypassToActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || isLanSearchExcludedUrl(tabs[0].url)) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        world: 'ISOLATED',
        func: () => {
          if (window.lanSearchSyncModalBypass) window.lanSearchSyncModalBypass();
        }
      }).catch(() => {});
    });
  }

  function toggleModalBypass() {
    modalBypassEnabled = !modalBypassEnabled;
    setModalBypassState(modalBypassEnabled);
    try {
      localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
    } catch (_) {}

    const payload = { modalBypass: modalBypassEnabled };
    const afterStore = () => syncModalBypassToActiveTab();

    if (typeof chrome !== 'undefined' && chrome.storage) {
      let pending = 0;
      const done = () => {
        pending -= 1;
        if (pending <= 0) afterStore();
      };
      try {
        pending += 1;
        chrome.storage.local.set(payload, done);
      } catch (_) {}
      try {
        pending += 1;
        chrome.storage.sync.set(payload, done);
      } catch (_) {}
      if (pending === 0) afterStore();
    } else {
      afterStore();
    }
  }

  modalBypassToggle.addEventListener('click', toggleModalBypass);

  // Новый UI — отдельно общий и /all_clubs_pc/
  let newUiEnabled = false;
  let newUiAllClubsPcEnabled = false;

  function syncNewUiToActiveTab() {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || isLanSearchExcludedUrl(tabs[0].url)) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          if (window.lanSearchSyncNewUi) window.lanSearchSyncNewUi();
        }
      }).catch(() => {});
    });
  }

  function persistNewUiFlags() {
    try {
      localStorage.setItem('lanSearchNewUi', newUiEnabled.toString());
      localStorage.setItem('lanSearchNewUiAllClubsPc', newUiAllClubsPcEnabled.toString());
    } catch (_) {}
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({
        newUi: newUiEnabled,
        newUiAllClubsPc: newUiAllClubsPcEnabled
      }, syncNewUiToActiveTab);
    } else {
      syncNewUiToActiveTab();
    }
  }

  function initNewUi() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['newUi', 'newUiAllClubsPc'], function(result) {
          newUiEnabled = result && result.newUi === undefined ? true : !!(result && result.newUi);
          newUiAllClubsPcEnabled = result && result.newUiAllClubsPc === undefined
            ? newUiEnabled
            : !!(result && result.newUiAllClubsPc);
          setNewUiState(newUiEnabled);
          setNewUiAllClubsPcState(newUiAllClubsPcEnabled);
          try {
            localStorage.setItem('lanSearchNewUi', newUiEnabled.toString());
            localStorage.setItem('lanSearchNewUiAllClubsPc', newUiAllClubsPcEnabled.toString());
          } catch (_) {}
          if (result && (result.newUi === undefined || result.newUiAllClubsPc === undefined)) {
            chrome.storage.sync.set({
              newUi: newUiEnabled,
              newUiAllClubsPc: newUiAllClubsPcEnabled
            });
          }
        });
        return;
      }

      const localNewUi = localStorage.getItem('lanSearchNewUi');
      const localPc = localStorage.getItem('lanSearchNewUiAllClubsPc');
      newUiEnabled = localNewUi === null ? true : localNewUi === 'true';
      newUiAllClubsPcEnabled = localPc === null ? newUiEnabled : localPc === 'true';
      setNewUiState(newUiEnabled);
      setNewUiAllClubsPcState(newUiAllClubsPcEnabled);
    } catch (e) {
      newUiEnabled = true;
      newUiAllClubsPcEnabled = true;
      setNewUiState(true);
      setNewUiAllClubsPcState(true);
    }
  }

  function setNewUiState(enabled) {
    setSwitchState(newUiToggle, enabled);
  }

  function setNewUiAllClubsPcState(enabled) {
    setSwitchState(newUiAllClubsPcToggle, enabled);
  }

  function toggleNewUi() {
    newUiEnabled = !newUiEnabled;
    setNewUiState(newUiEnabled);
    persistNewUiFlags();
  }

  function toggleNewUiAllClubsPc() {
    newUiAllClubsPcEnabled = !newUiAllClubsPcEnabled;
    setNewUiAllClubsPcState(newUiAllClubsPcEnabled);
    persistNewUiFlags();
  }

  if (newUiToggle) {
    newUiToggle.addEventListener('click', toggleNewUi);
  }
  if (newUiAllClubsPcToggle) {
    newUiAllClubsPcToggle.addEventListener('click', toggleNewUiAllClubsPc);
  }

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
    setSwitchState(pcStylesToggle, enabled);
  }

  function togglePCStyles() {
    pcStylesEnabled = !pcStylesEnabled;
    setPCStylesState(pcStylesEnabled);
    localStorage.setItem('lanSearchPCStyles', pcStylesEnabled.toString());
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ pcStyles: pcStylesEnabled }, function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
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
    setSwitchState(tableOptimizationToggle, enabled);
  }

  function toggleTableOptimization() {
    tableOptimizationEnabled = !tableOptimizationEnabled;
    setTableOptimizationState(tableOptimizationEnabled);
    localStorage.setItem('lanSearchTableOptimization', tableOptimizationEnabled.toString());
    
    chrome.storage.sync.set({ tableOptimization: tableOptimizationEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
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
  let hideCheckboxesEnabled = true;
  
  function initHideCheckboxes() {
    try {
      const localHideCheckboxes = localStorage.getItem('lanSearchHideCheckboxes');
      if (localHideCheckboxes !== null) {
        hideCheckboxesEnabled = localHideCheckboxes === 'true';
        setHideCheckboxesState(hideCheckboxesEnabled);
        return;
      }
      
      chrome.storage.sync.get(['hideCheckboxes'], function(result) {
        const missing = !result || result.hideCheckboxes === undefined;
        hideCheckboxesEnabled = missing ? true : !!result.hideCheckboxes;
        setHideCheckboxesState(hideCheckboxesEnabled);
        if (missing) {
          try { chrome.storage.sync.set({ hideCheckboxes: true }); } catch (_) {}
          try { localStorage.setItem('lanSearchHideCheckboxes', 'true'); } catch (_) {}
        }
      });
    } catch (error) {
      hideCheckboxesEnabled = true;
      setHideCheckboxesState(true);
    }
  }

  function setHideCheckboxesState(enabled) {
    setSwitchState(hideCheckboxesToggle, enabled);
  }

  function toggleHideCheckboxes() {
    hideCheckboxesEnabled = !hideCheckboxesEnabled;
    setHideCheckboxesState(hideCheckboxesEnabled);
    localStorage.setItem('lanSearchHideCheckboxes', hideCheckboxesEnabled.toString());
    
    chrome.storage.sync.set({ hideCheckboxes: hideCheckboxesEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
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
  let hideCommentsEnabled = true;
  
  function initHideComments() {
    try {
      const localHideComments = localStorage.getItem('lanSearchHideComments');
      if (localHideComments !== null) {
        hideCommentsEnabled = localHideComments === 'true';
        setHideCommentsState(hideCommentsEnabled);
        return;
      }
      
      chrome.storage.sync.get(['hideComments'], function(result) {
        const missing = !result || result.hideComments === undefined;
        hideCommentsEnabled = missing ? true : !!result.hideComments;
        setHideCommentsState(hideCommentsEnabled);
        if (missing) {
          try { chrome.storage.sync.set({ hideComments: true }); } catch (_) {}
          try { localStorage.setItem('lanSearchHideComments', 'true'); } catch (_) {}
        }
      });
    } catch (error) {
      hideCommentsEnabled = true;
      setHideCommentsState(true);
    }
  }

  function setHideCommentsState(enabled) {
    setSwitchState(hideCommentsToggle, enabled);
  }

  function toggleHideComments() {
    hideCommentsEnabled = !hideCommentsEnabled;
    setHideCommentsState(hideCommentsEnabled);
    localStorage.setItem('lanSearchHideComments', hideCommentsEnabled.toString());
    
    chrome.storage.sync.set({ hideComments: hideCommentsEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
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

  // Скрыть «ПО для управления»
  let hideRemoteDownloadEnabled = true;

  function initHideRemoteDownload() {
    if (!hideRemoteDownloadToggle) return;
    try {
      const local = localStorage.getItem('lanSearchHideRemoteDownload');
      if (local !== null) {
        hideRemoteDownloadEnabled = local === 'true';
        setHideRemoteDownloadState(hideRemoteDownloadEnabled);
        return;
      }
      chrome.storage.sync.get(['hideRemoteDownload'], function(result) {
        const missing = !result || result.hideRemoteDownload === undefined;
        hideRemoteDownloadEnabled = missing ? true : !!result.hideRemoteDownload;
        setHideRemoteDownloadState(hideRemoteDownloadEnabled);
        if (missing) {
          try { chrome.storage.sync.set({ hideRemoteDownload: true }); } catch (_) {}
          try { localStorage.setItem('lanSearchHideRemoteDownload', 'true'); } catch (_) {}
        }
      });
    } catch (error) {
      hideRemoteDownloadEnabled = true;
      setHideRemoteDownloadState(true);
    }
  }

  function setHideRemoteDownloadState(enabled) {
    if (!hideRemoteDownloadToggle) return;
    hideRemoteDownloadToggle.textContent = enabled ? 'Включен' : 'Выключен';
    hideRemoteDownloadToggle.classList.toggle('enabled', enabled);
    hideRemoteDownloadToggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
  }

  function toggleHideRemoteDownload() {
    hideRemoteDownloadEnabled = !hideRemoteDownloadEnabled;
    setHideRemoteDownloadState(hideRemoteDownloadEnabled);
    localStorage.setItem('lanSearchHideRemoteDownload', hideRemoteDownloadEnabled.toString());
    chrome.storage.sync.set({ hideRemoteDownload: hideRemoteDownloadEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              if (window.lanSearchSyncHideRemoteDownload) {
                window.lanSearchSyncHideRemoteDownload();
              }
            }
          }).catch(() => {});
        }
      });
    });
  }

  if (hideRemoteDownloadToggle) {
    hideRemoteDownloadToggle.addEventListener('click', toggleHideRemoteDownload);
  }

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
    setSwitchState(customWebSocketToggle, enabled);
  }

  function toggleCustomWebSocket() {
    customWebSocketEnabled = !customWebSocketEnabled;
    setCustomWebSocketState(customWebSocketEnabled);
    localStorage.setItem('lanSearchCustomWebSocket', customWebSocketEnabled.toString());
    
    chrome.storage.sync.set({ customWebSocket: customWebSocketEnabled }, function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && !isLanSearchExcludedUrl(tabs[0].url)) {
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
            const missing = !result || result.theme === undefined;
            currentTheme = missing ? 'dark' : result.theme;
            setThemeButton(currentTheme);
            if (missing) {
              try { chrome.storage.sync.set({ theme: 'dark' }); } catch (_) {}
            }
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
    if (!themeToggle) return;
    const label = theme === 'amoled' ? 'AMOLED' : theme === 'light' ? 'Светлая' : 'Тёмная';
    themeToggle.textContent = label;
    themeToggle.title = 'Сменить тему: светлая → тёмная → AMOLED';
  }
  
  function toggleTheme() {
    const order = ['light', 'dark', 'amoled'];
    const idx = order.indexOf(currentTheme);
    const newTheme = order[(idx < 0 ? 1 : idx + 1) % order.length];
    
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
              if (!tab.id || isLanSearchExcludedUrl(tab.url)) return;
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (theme) => {
                  if (!document.documentElement) return;
                  const attr = theme === 'amoled' ? 'dark' : theme;
                  const darkLike = theme === 'dark' || theme === 'amoled';
                  document.documentElement.setAttribute('data-theme', attr);
                  document.documentElement.classList.toggle('lgs-amoled', theme === 'amoled');
                  if (document.body) {
                    document.body.classList.toggle('dark_theme', darkLike);
                    document.body.classList.toggle('light_theme', !darkLike);
                  }
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
  initScripts();
});
