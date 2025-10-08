document.addEventListener('DOMContentLoaded', function() {
  const activateBtn = document.getElementById('activateBtn');
  const statusDiv = document.getElementById('status');
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const updateStatus = document.getElementById('updateStatus');
  const themeToggle = document.getElementById('themeToggle');
  const modalBypassToggle = document.getElementById('modalBypassToggle');
  const pcStylesToggle = document.getElementById('pcStylesToggle');
  
  // Глобальная переменная для кэширования темы
  let currentTheme = 'light';
  let themeApplied = false;
  
  // Функции для работы с темной темой
  function initTheme() {
    if (themeApplied) {
      setTheme(currentTheme);
      return;
    }
    
    try {
      // Сначала проверяем localStorage для быстрого доступа
      const localTheme = localStorage.getItem('lanSearchTheme');
      if (localTheme) {
        currentTheme = localTheme;
        themeApplied = true;
        setTheme(localTheme);
        return;
      }
      
      // Затем проверяем chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['theme'], function(result) {
          try {
            currentTheme = result.theme || 'light';
            themeApplied = true;
            setTheme(currentTheme);
            // Сохраняем в localStorage для быстрого доступа
            try {
              localStorage.setItem('lanSearchTheme', currentTheme);
            } catch (e) {
              // Игнорируем ошибки localStorage
            }
          } catch (e) {
            // Fallback при ошибке
            currentTheme = 'light';
            themeApplied = true;
            setTheme('light');
          }
        });
      } else {
        // Fallback если chrome.storage недоступен
        currentTheme = 'light';
        themeApplied = true;
        setTheme('light');
      }
    } catch (e) {
      // Fallback при любой ошибке
      currentTheme = 'light';
      themeApplied = true;
      setTheme('light');
    }
  }
  
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему';
  }
  
  function toggleTheme() {
    const currentThemeAttr = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentThemeAttr === 'light' ? 'dark' : 'light';
    
    // Обновляем кэш
    currentTheme = newTheme;
    
    setTheme(newTheme);
    
    // Сохраняем в localStorage для быстрого доступа
    try {
      localStorage.setItem('lanSearchTheme', newTheme);
    } catch (e) {
      // Игнорируем ошибки localStorage
    }
    
    // Сохраняем в chrome.storage с обработкой ошибок
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ theme: newTheme });
      }
    } catch (e) {
      // Игнорируем ошибки chrome.storage
      console.log('Chrome storage not available, using localStorage only');
    }
  }
  
  // Инициализация темы
  initTheme();
  
  // Обработчик переключения темы
  themeToggle.addEventListener('click', toggleTheme);
  
  // Функции для работы с обходом модальных окон
  let modalBypassEnabled = false;
  
  function initModalBypass() {
    try {
      // Проверяем localStorage для быстрого доступа
      const localBypass = localStorage.getItem('lanSearchModalBypass');
      if (localBypass !== null) {
        modalBypassEnabled = localBypass === 'true';
        setModalBypassState(modalBypassEnabled);
        return;
      }
      
      // Затем проверяем chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['modalBypass'], function(result) {
          try {
            modalBypassEnabled = result.modalBypass || false;
            setModalBypassState(modalBypassEnabled);
            // Сохраняем в localStorage для быстрого доступа
            try {
              localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
            } catch (e) {
              // Игнорируем ошибки localStorage
            }
          } catch (e) {
            // Fallback при ошибке
            modalBypassEnabled = false;
            setModalBypassState(false);
          }
        });
      } else {
        // Fallback если chrome.storage недоступен
        modalBypassEnabled = false;
        setModalBypassState(false);
      }
    } catch (e) {
      // Fallback при любой ошибке
      modalBypassEnabled = false;
      setModalBypassState(false);
    }
  }
  
  function setModalBypassState(enabled) {
    modalBypassToggle.textContent = enabled ? 'Включен' : 'Выключен';
    modalBypassToggle.style.background = enabled ? '#28a745' : '#dc3545';
    modalBypassToggle.title = enabled ? 'Отключить обход модальных окон' : 'Включить обход модальных окон';
  }
  
  function toggleModalBypass() {
    modalBypassEnabled = !modalBypassEnabled;
    
    setModalBypassState(modalBypassEnabled);
    
    // Сохраняем в localStorage для быстрого доступа
    try {
      localStorage.setItem('lanSearchModalBypass', modalBypassEnabled.toString());
    } catch (e) {
      // Игнорируем ошибки localStorage
    }
    
    // Сохраняем в chrome.storage с обработкой ошибок
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ modalBypass: modalBypassEnabled }, function() {
          console.log('Popup: Настройка сохранена в chrome.storage:', modalBypassEnabled);
          
          // Принудительно синхронизируем настройки на активной вкладке
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                  if (window.lanSearchSyncModalBypass) {
                    window.lanSearchSyncModalBypass();
                  }
                }
              }).catch(err => {
                console.log('Popup: Не удалось синхронизировать настройки на вкладке:', err);
              });
            }
          });
        });
      }
    } catch (e) {
      // Игнорируем ошибки chrome.storage
      console.log('Chrome storage not available, using localStorage only');
    }
  }
  
  // Инициализация состояния обхода модальных окон
  initModalBypass();
  
  // Обработчик переключения обхода модальных окон
  modalBypassToggle.addEventListener('click', toggleModalBypass);
  
  // Функции для работы со стилями карт ПК
  let pcStylesEnabled = false;
  
  function initPCStyles() {
    try {
      // Проверяем localStorage для быстрого доступа
      const localStyles = localStorage.getItem('lanSearchPCStyles');
      if (localStyles !== null) {
        pcStylesEnabled = localStyles === 'true';
        setPCStylesState(pcStylesEnabled);
        return;
      }
      
      // Затем проверяем chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['pcStyles'], function(result) {
          try {
            pcStylesEnabled = result.pcStyles || false;
            setPCStylesState(pcStylesEnabled);
            // Сохраняем в localStorage для быстрого доступа
            try {
              localStorage.setItem('lanSearchPCStyles', pcStylesEnabled.toString());
            } catch (e) {
              // Игнорируем ошибки localStorage
            }
          } catch (e) {
            // Fallback при ошибке
            pcStylesEnabled = false;
            setPCStylesState(false);
          }
        });
      } else {
        // Fallback если chrome.storage недоступен
        pcStylesEnabled = false;
        setPCStylesState(false);
      }
    } catch (e) {
      // Fallback при любой ошибке
      pcStylesEnabled = false;
      setPCStylesState(false);
    }
  }
  
  function setPCStylesState(enabled) {
    pcStylesToggle.textContent = enabled ? 'Включен' : 'Выключен';
    pcStylesToggle.style.background = enabled ? '#28a745' : '#dc3545';
    pcStylesToggle.title = enabled ? 'Отключить стили карт ПК' : 'Включить стили карт ПК';
  }
  
  function togglePCStyles() {
    pcStylesEnabled = !pcStylesEnabled;
    
    setPCStylesState(pcStylesEnabled);
    
    // Сохраняем в localStorage для быстрого доступа
    try {
      localStorage.setItem('lanSearchPCStyles', pcStylesEnabled.toString());
    } catch (e) {
      // Игнорируем ошибки localStorage
    }
    
    // Сохраняем в chrome.storage с обработкой ошибок
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ pcStyles: pcStylesEnabled }, function() {
          console.log('Popup: Настройка стилей ПК сохранена в chrome.storage:', pcStylesEnabled);
          
          // Принудительно синхронизируем настройки на активной вкладке
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                  if (window.lanSearchSyncPCStyles) {
                    window.lanSearchSyncPCStyles();
                  }
                }
              }).catch(err => {
                console.log('Popup: Не удалось синхронизировать стили ПК на вкладке:', err);
              });
            }
          });
        });
      }
    } catch (e) {
      // Игнорируем ошибки chrome.storage
      console.log('Chrome storage not available, using localStorage only');
    }
  }
  
  // Инициализация состояния стилей ПК
  initPCStyles();
  
  // Обработчик переключения стилей ПК
  pcStylesToggle.addEventListener('click', togglePCStyles);
  
  // Принудительная синхронизация при открытии popup
  setTimeout(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            if (window.lanSearchSyncModalBypass) {
              window.lanSearchSyncModalBypass();
            }
            if (window.lanSearchSyncPCStyles) {
              window.lanSearchSyncPCStyles();
            }
          }
        }).catch(err => {
          console.log('Popup: Не удалось синхронизировать настройки при открытии popup:', err);
        });
      }
    });
  }, 100);
  
  // Проверяем текущую вкладку
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        showStatus('Не удалось получить активную вкладку', 'manual');
        return;
      }

      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();
      
      // Проверяем домен через функцию расширения
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (hostname) => {
          if (window.lanSearchIsSuitableDomain) {
            return window.lanSearchIsSuitableDomain(hostname);
          }
          // Fallback если функция недоступна
          return hostname.includes('langame') || hostname.includes('cls');
        },
        args: [hostname]
      });

      const isSuitable = result[0]?.result || false;
      
      if (isSuitable) {
        showStatus('Автоматическая активация на подходящем домене', 'auto');
        activateBtn.disabled = true;
        activateBtn.textContent = 'Автоактивация';
      } else {
        showStatus('Ручная активация', 'manual');
        activateBtn.disabled = false;
        activateBtn.textContent = 'Активировать поиск';
      }
      
    } catch (error) {
      console.error('Ошибка проверки вкладки:', error);
      showStatus('Ошибка проверки домена', 'manual');
    }
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }
  
  activateBtn.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        alert('Не удалось получить активную вкладку');
        return;
      }

      // Вызываем функцию инициализации на странице
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.lanSearchInit) {
            window.lanSearchInit();
          }
        }
      });

      showStatus('Поиск активирован!', 'auto');
      setTimeout(() => window.close(), 1000);
      
    } catch (error) {
      console.error('Ошибка активации поиска:', error);
      alert('Ошибка при активации поиска: ' + error.message);
    }
  });

  // Fallback функция для получения эмодзи иконки
  function getFallbackIcon(dataIcon) {
    if (!dataIcon) return '📄';

    // Маппинг data-icon на эмодзи
    const iconMap = {
      'dashboard': '📊',
      'partners': '🤝',
      'help': '❓',
      'cat_global_settings': '⚙️',
      'cat_deal_with_staff': '👥',
      'cat_deal_with_guests': '👤',
      'cat_games_accounts': '🎮',
      'cat_process_control': '🔧',
      'cat_advertising': '📢',
      'cat_boss_tools': '👑',
      'cat_products': '🛍️',
      'cat_mails': '📧',
      'cat_more_modals': '🔌',
      'cat_analytics': '📈',
      'cat_domain_teh_stat': '📊',
      'all_clubs_pc': '💻',
      'cat_guests': '👥',
      'cat_documents': '📋',
      'cat_statistics': '📊',
      'cat_lockers': '🔒',
      'reservation': '📅',
      'messages': '💬',
      'ticked_control': '🎫',
      'global_config': '⚙️',
      'list_clubs': '🏢',
      'packets_type_PC': '💻',
      'client_is_version': '🔗',
      'tariff': '💰',
      'payments_config': '💳',
      'list_expenses_income_param_dir': '📊',
      'list_working_shift_expenses_income': '💰',
      'certificates_config': '🎁',
      'config_temperature': '🌡️',
      'deleting_at_startup': '🗑️',
      'freeze_exclude_registry': '🔒',
      'freeze_exclude': '❄️',
      'freeze_config': '❄️',
      'subscription': '💳',
      'connection_sbp': '🏦',
      'terminals': '🏧',
      'hosts_overrides': '🌐',
      'tablets': '📱',
      'administrators': '👨‍💼',
      'global_menu': '🔐',
      'messages_control': '🔔',
      'alert4admins': '📢',
      'ticked_config': '🎫',
      'working_shift_calc_zp': '💰',
      'guests_groups': '👥',
      'autobonuses_rules': '🎁',
      'guests_search': '🔍',
      'guests_visits_history': '📋',
      'temp_guests_log': '📝',
      'guests': '👤',
      'guests_log_balance': '💰',
      'guests_log_food_sale': '🍔',
      'guests_log_to_admin': '🔗',
      'anketa_config': '📋',
      'refunds_log': '↩️',
      'black_list_phone': '🚫',
      'guests_lost_item': '🔍',
      'cert_creator': '🎁',
      'guests_notifications': '📢',
      'loyality_report': '💎',
      'sound_notifs': '🔊',
      'mlm_config': '🌐',
      'mlm_activation_log': '🔗',
      'mlm_reward_log': '💰',
      'black_list_log': '🚫',
      'guests_log_import': '📥',
      'acc_games': '🎮',
      'acc_steam': '🎮',
      'games_accounts_config': '⚙️',
      'acc_email_steam_guard': '📧',
      'logs_game_acc_request': '📋',
      'lack_of_accounts': '⚠️',
      'launchers_accounts_unbound': '🔗',
      'session_games_chart': '📊',
      'process_groups': '🔧',
      'process_monitor': '👁️',
      'process_exclude': '✅',
      'process_kill': '❌',
      'advertising': '📢',
      'langame_news': '📰',
      'advertising_mfu': '📱',
      'advertising_terminal': '🏧',
      'shop_banners': '🛍️',
      'cashbox_director': '💰',
      'reports_working_shift_week': '📊',
      'cashbox_analytics': '📈',
      'reports_working_shift': '📊',
      'report_food_expense': '🍔',
      'refunds_requests': '↩️',
      'terminals_encashments': '🏧',
      'bonus_operations_log': '💰',
      'all_operations_log': '📋',
      'products': '🛍️',
      'products_groups': '📁',
      'products_suppliers': '🚚',
      'products_list': '📋',
      'products_orders': '📦',
      'products_arrival': '📥',
      'products_invent': '📊',
      'products_invent_list': '📋',
      'products_writeoffs': '🗑️',
      'products_adjusted': '📋',
      'products_sales_by_stock_price': '💰',
      'products_vending_filling': '🏪',
      'products_auto_order': '🤖',
      'products_auto_order_requisites': '📋',
      'products_stock_logs': '📋',
      'products_settings': '⚙️',
      'email': '📧',
      'telegram': '📱',
      'monitor_ignore': '🖥️',
      'pc_energy_saving_ignore': '💡',
      'club_schema': '🗺️',
      'club_schema_admin': '🗺️',
      'guests_phone_codes': '📞',
      'freenas_wrap': '💾',
      'nicehash': '⛏️',
      'computers_rent': '💻',
      'booking_calc': '🧮',
      'logs': '📋',
      'service_stop_analytic': '⏹️',
      'teh_PC': '🔧',
      'tehstatus_analytic': '📊',
      'pc_block_analytic': '🔓',
      'reservation_analytics': '📅',
      'log_balance_by_card': '💳',
      'guests_log_report_problems': '⚠️',
      'pc_conf_change_log': '🔧',
      'loading': '📊',
      'temperature_control': '🌡️',
      'guests_visits': '📊',
      'bad_words': '🚫',
      'admin_events': '👨‍💼',
      'analytics_average_session_duration': '⏱️',
      'analytics_sticky_factor': '📈',
      'analytics_rolling_retention': '📊',
      'analytics_new_guests': '👤',
      'analytics_balance_up': '💰',
      'analitycs_profit': '💰',
      'analytics_sessions_reg_to_sessions_full': '📊',
      'analytics_sessions_sum': '📊',
      'analytics_uniq_session_guests': '👥',
      'analytics_avg_balance_up': '💰',
      'analytics_packet_used': '📦',
      'analytics_average_session_duration_by_type': '⏱️',
      'analytics_balance_up_percent': '📊',
      'analytics_rezerv_type_percent': '📅',
      'analytics_depth_rezerv_time': '⏰',
      'analytics_arpu': '💰',
      'analytics_frequency_of_visits': '📊',
      'analytics_qr_auth': '📱',
      'analytics_average_session_duration_visit': '⏱️',
      'analytics_change_pwd_before_session': '🔐',
      'analytics_avg_output_pc': '💻',
      'analitycs_profit_refills': '💰',
      'tariff_purchases': '💰',
      'analytics_mlm_activations': '🔗',
      'analytics_mlm_revenue': '💰',
      'analytics_mlm_dashboard': '📊',
      'remote_access_log': '🔗',
      'analytics_device_temperatures': '🌡️',
      'logs_map_club_auth': '🔐',
      'call_services_analytics': '📞',
      'cp_transactions_info': '💳',
      'refunds': '↩️',
      'use_rights': '📋',
      'book_rights': '📋',
      'public_offer': '📄',
      'gpo_info': 'ℹ️',
      'gpo_vacancies': '💼',
      'gpo_help': '❓',
      'gpo_privacy': '🔒',
      'gpo_faq': '❓',
      'gpo_price_list': '💰',
      'loading_channel': '📊',
      'lockers_settings': '🔒',
      'lockers_history': '📋'
    };

    return iconMap[dataIcon] || '📄';
  }

  // Функция создания элемента вкладки
  function createTabItem(tab, isFavorite = false) {
    const tabItem = document.createElement('div');
    
    // Применяем цвет если он установлен для избранной вкладки
    let tabStyle = `
      padding: 8px 12px;
      margin: 4px 0;
      background: ${isFavorite ? '#fff3cd' : '#f8f9fa'};
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      border: 1px solid ${isFavorite ? '#ffeaa7' : '#e9ecef'};
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    if (isFavorite && tab.color) {
      // Находим конфигурацию цвета
      const availableColors = [
        { name: 'Красный', value: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 0.3)' },
        { name: 'Оранжевый', value: '#ffa726', bg: 'rgba(255, 167, 38, 0.1)', border: 'rgba(255, 167, 38, 0.3)' },
        { name: 'Желтый', value: '#ffd54f', bg: 'rgba(255, 213, 79, 0.1)', border: 'rgba(255, 213, 79, 0.3)' },
        { name: 'Зеленый', value: '#66bb6a', bg: 'rgba(102, 187, 106, 0.1)', border: 'rgba(102, 187, 106, 0.3)' },
        { name: 'Голубой', value: '#4fc3f7', bg: 'rgba(79, 195, 247, 0.1)', border: 'rgba(79, 195, 247, 0.3)' },
        { name: 'Синий', value: '#42a5f5', bg: 'rgba(66, 165, 245, 0.1)', border: 'rgba(66, 165, 245, 0.3)' },
        { name: 'Фиолетовый', value: '#ab47bc', bg: 'rgba(171, 71, 188, 0.1)', border: 'rgba(171, 71, 188, 0.3)' },
        { name: 'Розовый', value: '#ec407a', bg: 'rgba(236, 64, 122, 0.1)', border: 'rgba(236, 64, 122, 0.3)' }
      ];
      
      const colorConfig = availableColors.find(c => c.value === tab.color);
      if (colorConfig) {
        tabStyle = `
          padding: 8px 12px;
          margin: 4px 0;
          background: ${colorConfig.bg};
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          border: 1px solid ${colorConfig.border};
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
      }
    }
    
    tabItem.style.cssText = tabStyle;

    tabItem.addEventListener('mouseenter', () => {
      if (isFavorite && tab.color) {
        const availableColors = [
          { name: 'Красный', value: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 0.3)' },
          { name: 'Оранжевый', value: '#ffa726', bg: 'rgba(255, 167, 38, 0.1)', border: 'rgba(255, 167, 38, 0.3)' },
          { name: 'Желтый', value: '#ffd54f', bg: 'rgba(255, 213, 79, 0.1)', border: 'rgba(255, 213, 79, 0.3)' },
          { name: 'Зеленый', value: '#66bb6a', bg: 'rgba(102, 187, 106, 0.1)', border: 'rgba(102, 187, 106, 0.3)' },
          { name: 'Голубой', value: '#4fc3f7', bg: 'rgba(79, 195, 247, 0.1)', border: 'rgba(79, 195, 247, 0.3)' },
          { name: 'Синий', value: '#42a5f5', bg: 'rgba(66, 165, 245, 0.1)', border: 'rgba(66, 165, 245, 0.3)' },
          { name: 'Фиолетовый', value: '#ab47bc', bg: 'rgba(171, 71, 188, 0.1)', border: 'rgba(171, 71, 188, 0.3)' },
          { name: 'Розовый', value: '#ec407a', bg: 'rgba(236, 64, 122, 0.1)', border: 'rgba(236, 64, 122, 0.3)' }
        ];
        
        const colorConfig = availableColors.find(c => c.value === tab.color);
        if (colorConfig) {
          tabItem.style.background = colorConfig.bg.replace('0.1', '0.2');
        } else {
          tabItem.style.background = '#ffeaa7';
        }
      } else {
        tabItem.style.background = isFavorite ? '#ffeaa7' : '#e9ecef';
      }
    });

    tabItem.addEventListener('mouseleave', () => {
      if (isFavorite && tab.color) {
        const availableColors = [
          { name: 'Красный', value: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 0.3)' },
          { name: 'Оранжевый', value: '#ffa726', bg: 'rgba(255, 167, 38, 0.1)', border: 'rgba(255, 167, 38, 0.3)' },
          { name: 'Желтый', value: '#ffd54f', bg: 'rgba(255, 213, 79, 0.1)', border: 'rgba(255, 213, 79, 0.3)' },
          { name: 'Зеленый', value: '#66bb6a', bg: 'rgba(102, 187, 106, 0.1)', border: 'rgba(102, 187, 106, 0.3)' },
          { name: 'Голубой', value: '#4fc3f7', bg: 'rgba(79, 195, 247, 0.1)', border: 'rgba(79, 195, 247, 0.3)' },
          { name: 'Синий', value: '#42a5f5', bg: 'rgba(66, 165, 245, 0.1)', border: 'rgba(66, 165, 245, 0.3)' },
          { name: 'Фиолетовый', value: '#ab47bc', bg: 'rgba(171, 71, 188, 0.1)', border: 'rgba(171, 71, 188, 0.3)' },
          { name: 'Розовый', value: '#ec407a', bg: 'rgba(236, 64, 122, 0.1)', border: 'rgba(236, 64, 122, 0.3)' }
        ];
        
        const colorConfig = availableColors.find(c => c.value === tab.color);
        if (colorConfig) {
          tabItem.style.background = colorConfig.bg;
        } else {
          tabItem.style.background = '#fff3cd';
        }
      } else {
        tabItem.style.background = isFavorite ? '#fff3cd' : '#f8f9fa';
      }
    });

    tabItem.addEventListener('click', async () => {
      try {
        await chrome.tabs.create({ url: tab.href });
        window.close();
      } catch (error) {
        console.error('Ошибка открытия вкладки:', error);
      }
    });

    // Иконка
    if (tab.iconStyles) {
      const icon = document.createElement('span');
      icon.style.cssText = `
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-image: ${tab.iconStyles.backgroundImage || 'none'};
        background-size: ${tab.iconStyles.backgroundSize || 'contain'};
        background-position: ${tab.iconStyles.backgroundPosition || 'center'};
        background-repeat: ${tab.iconStyles.backgroundRepeat || 'no-repeat'};
        width: ${tab.iconStyles.width || '20px'};
        height: ${tab.iconStyles.height || '20px'};
      `;
      tabItem.appendChild(icon);
    } else if (tab.icon) {
      // Fallback - создаем эмодзи на основе data-icon
      const icon = document.createElement('span');
      icon.textContent = getFallbackIcon(tab.icon);
      icon.style.cssText = `
        font-size: 16px;
        min-width: 20px;
        text-align: center;
      `;
      tabItem.appendChild(icon);
    }

    // Контейнер для текста
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const tabTitle = document.createElement('div');
    tabTitle.textContent = tab.title;
    tabTitle.style.cssText = `
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    const tabPath = document.createElement('div');
    tabPath.textContent = tab.href;
    tabPath.style.cssText = `
      font-size: 10px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    textContainer.appendChild(tabTitle);
    textContainer.appendChild(tabPath);
    tabItem.appendChild(textContainer);
    return tabItem;
  }

  // Функция для отображения последних вкладок
  async function displayRecentTabs() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) return;

      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();
      
      // Проверяем домен через функцию расширения
      const domainCheck = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (hostname) => {
          if (window.lanSearchIsSuitableDomain) {
            return window.lanSearchIsSuitableDomain(hostname);
          }
          // Fallback если функция недоступна
          return hostname.includes('langame') || hostname.includes('cls');
        },
        args: [hostname]
      });

      const isSuitable = domainCheck[0]?.result || false;
      
      // Показываем только на подходящих доменах
      if (!isSuitable) return;

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const recentTabs = window.lanSearchGetRecentTabs ? window.lanSearchGetRecentTabs() : [];
          const favoriteTabs = window.lanSearchGetFavoriteTabs ? window.lanSearchGetFavoriteTabs() : [];
          return { recentTabs, favoriteTabs };
        }
      });

      const { recentTabs, favoriteTabs } = result[0]?.result || { recentTabs: [], favoriteTabs: [] };
      
      if (recentTabs.length === 0 && favoriteTabs.length === 0) return;

      // Создаем контейнер для последних вкладок
      const recentTabsContainer = document.createElement('div');
      recentTabsContainer.style.cssText = `
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
      `;

      // Секция избранных вкладок
      if (favoriteTabs.length > 0) {
        const favoritesTitle = document.createElement('h4');
        favoritesTitle.textContent = ' Избранные:';
        favoritesTitle.style.cssText = `
          margin: 15px 0 8px 0;
          font-size: 13px;
          color: #333;
          font-weight: 600;
        `;

        const favoritesList = document.createElement('div');
        favoritesList.style.cssText = `
          max-height: 120px;
          overflow-y: auto;
          margin-bottom: 10px;
        `;

        favoriteTabs.forEach(tab => {
          const tabItem = createTabItem(tab, true);
          favoritesList.appendChild(tabItem);
        });

        recentTabsContainer.appendChild(favoritesTitle);
        recentTabsContainer.appendChild(favoritesList);
      }

      // Секция недавних вкладок
      if (recentTabs.length > 0) {
        const recentTitle = document.createElement('h4');
        recentTitle.textContent = 'Недавние:';
        recentTitle.style.cssText = `
          margin: 15px 0 8px 0;
          font-size: 13px;
          color: #333;
          font-weight: 600;
        `;

        const tabsList = document.createElement('div');
        tabsList.style.cssText = `
          max-height: 120px;
          overflow-y: auto;
        `;

        recentTabs.slice(0, 5).forEach(tab => {
          const tabItem = createTabItem(tab, false);
          tabsList.appendChild(tabItem);
        });

        recentTabsContainer.appendChild(recentTitle);
        recentTabsContainer.appendChild(tabsList);
      }

      // Добавляем кнопку очистки истории
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Очистить историю';
      clearBtn.style.cssText = `
        margin-top: 10px;
        padding: 6px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      `;

      clearBtn.addEventListener('click', async () => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              localStorage.removeItem('lanSearchRecentTabs');
              localStorage.removeItem('lanSearchFavoriteTabs');
            }
          });
          recentTabsContainer.remove();
        } catch (error) {
          console.error('Ошибка очистки истории:', error);
        }
      });

      recentTabsContainer.appendChild(clearBtn);

      // Вставляем после статуса
      statusDiv.parentNode.insertBefore(recentTabsContainer, statusDiv.nextSibling);

    } catch (error) {
      console.error('Ошибка отображения последних вкладок:', error);
    }
  }
  
  // Функция для извлечения версии из сообщения коммита
  function extractVersionFromCommit(commitMessage) {
    // Ищем версию в формате X.Y.Z или X.Y
    const versionMatch = commitMessage.match(/(\d+\.\d+(?:\.\d+)?)/);
    return versionMatch ? versionMatch[1] : null;
  }

  // Функция для сравнения версий
  function compareVersions(version1, version2) {
    if (!version1 || !version2) return 0;
    
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    // Дополняем до одинаковой длины
    while (v1Parts.length < v2Parts.length) v1Parts.push(0);
    while (v2Parts.length < v1Parts.length) v2Parts.push(0);
    
    for (let i = 0; i < v1Parts.length; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    
    return 0;
  }

  // Функция проверки обновлений
  async function checkForUpdates() {
    try {
      checkUpdateBtn.disabled = true;
      checkUpdateBtn.textContent = 'Проверяю...';
      updateStatus.textContent = 'Проверяем наличие обновлений...';
      
      // Получаем информацию о текущей версии расширения
      const manifest = chrome.runtime.getManifest();
      const currentVersion = manifest.version;
      
      // Получаем последний коммит с GitHub
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
      const latestCommitSha = latestCommit.sha.substring(0, 7); // Короткий SHA
      const commitDate = new Date(latestCommit.commit.author.date);
      const commitMessage = latestCommit.commit.message.split('\n')[0]; // Первая строка сообщения
      const latestVersion = extractVersionFromCommit(commitMessage);
      
      // Получаем сохраненную информацию
      const stored = await chrome.storage.local.get(['lastKnownCommit', 'lastUpdateCheck']);
      
      // Сохраняем информацию о последнем коммите и времени проверки
      await chrome.storage.local.set({
        'lastKnownCommit': {
          sha: latestCommitSha,
          version: latestVersion,
          message: commitMessage
        },
        'lastUpdateCheck': new Date().toISOString()
      });
      
      // Форматируем даты
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
      
      // Проверяем, есть ли новая версия
      let hasNewVersion = false;
      let versionComparison = '';
      
      if (latestVersion) {
        // Всегда сравниваем с текущей версией из manifest
        const comparison = compareVersions(latestVersion, currentVersion);
        hasNewVersion = comparison > 0;
        
        if (comparison > 0) {
          versionComparison = `⚠️ Доступна новая версия: ${latestVersion} (у вас ${currentVersion})`;
        } else if (comparison < 0) {
          versionComparison = `ℹ️ У вас более новая версия: ${currentVersion} (на GitHub ${latestVersion})`;
        } else {
          versionComparison = `✅ У вас последняя версия: ${currentVersion}`;
        }
      } else {
        versionComparison = `ℹ️ Не удалось определить версию из коммита`;
      }
      
      // Создаем элементы программно вместо innerHTML для безопасности
      updateStatus.textContent = '';
      
      // Создаем контейнер для информации
      const infoContainer = document.createElement('div');
      infoContainer.style.cssText = 'margin-bottom: 12px; font-size: 11px; line-height: 1.4;';
      
      // Добавляем информацию о последней проверке
      const lastCheckDiv = document.createElement('div');
      lastCheckDiv.style.cssText = 'margin-bottom: 6px;';
      const lastCheckStrong = document.createElement('strong');
      lastCheckStrong.textContent = 'Последняя проверка:';
      lastCheckDiv.appendChild(lastCheckStrong);
      lastCheckDiv.appendChild(document.createTextNode(` ${formatDate(new Date())}`));
      infoContainer.appendChild(lastCheckDiv);
      
      // Добавляем информацию о последнем обновлении
      const lastUpdateDiv = document.createElement('div');
      lastUpdateDiv.style.cssText = 'margin-bottom: 6px;';
      const lastUpdateStrong = document.createElement('strong');
      lastUpdateStrong.textContent = 'Последнее обновление на GitHub:';
      lastUpdateDiv.appendChild(lastUpdateStrong);
      lastUpdateDiv.appendChild(document.createElement('br'));
      lastUpdateDiv.appendChild(document.createTextNode(`${formatDate(commitDate)} (${latestCommitSha})`));
      infoContainer.appendChild(lastUpdateDiv);
      
      // Добавляем сообщение коммита
      const commitDiv = document.createElement('div');
      commitDiv.style.cssText = 'margin-bottom: 6px;';
      const commitStrong = document.createElement('strong');
      commitStrong.textContent = 'Сообщение коммита:';
      commitDiv.appendChild(commitStrong);
      commitDiv.appendChild(document.createElement('br'));
      commitDiv.appendChild(document.createTextNode(commitMessage));
      infoContainer.appendChild(commitDiv);
      
      // Добавляем сравнение версий
      const versionDiv = document.createElement('div');
      versionDiv.style.cssText = 'margin-bottom: 8px; font-weight: 600;';
      versionDiv.textContent = versionComparison;
      infoContainer.appendChild(versionDiv);
      
      updateStatus.appendChild(infoContainer);
      
      // Создаем кнопку скачивания
      const downloadBtn = document.createElement('button');
      downloadBtn.id = 'downloadUpdateBtn';
      downloadBtn.textContent = 'Скачать обновление';
      downloadBtn.style.cssText = 'padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;';
      updateStatus.appendChild(downloadBtn);
      
      // Добавляем обработчик для кнопки скачивания
      setTimeout(() => {
        const downloadBtn = document.getElementById('downloadUpdateBtn');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://github.com/c1osed1/LanSearch/archive/refs/heads/main.zip' });
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Ошибка проверки обновлений:', error);
      // Создаем элементы программно вместо innerHTML для безопасности
      updateStatus.textContent = '';
      
      // Создаем контейнер для ошибки
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'margin-bottom: 8px; color: #dc3545;';
      errorDiv.textContent = `Ошибка проверки обновлений: ${error.message}`;
      updateStatus.appendChild(errorDiv);
      
      // Создаем кнопку скачивания
      const downloadBtn = document.createElement('button');
      downloadBtn.id = 'downloadUpdateBtn';
      downloadBtn.textContent = 'Скачать обновление';
      downloadBtn.style.cssText = 'padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;';
      updateStatus.appendChild(downloadBtn);
      
      setTimeout(() => {
        const downloadBtn = document.getElementById('downloadUpdateBtn');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://github.com/c1osed1/LanSearch/archive/refs/heads/main.zip' });
          });
        }
      }, 100);
    } finally {
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.textContent = 'Проверить';
    }
  }
  
  // Обработчик кнопки проверки обновлений
  checkUpdateBtn.addEventListener('click', checkForUpdates);
  

  
  // Проверяем статус при загрузке
  checkCurrentTab();
  
  // Отображаем последние вкладки
  displayRecentTabs();
  
  // Автоматически проверяем обновления при загрузке
  checkForUpdates();
}); 