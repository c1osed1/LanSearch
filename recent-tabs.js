// Управление последними использованными вкладками
(function() {
  if (['msgtp.langame.ru', 'msgpublic.langame.ru'].includes(window.location.hostname.toLowerCase())) return;
  class RecentTabsManager {
  constructor() {
    this.storageKey = 'lanSearchRecentTabs';
    this.favoritesKey = 'lanSearchFavoriteTabs';
    this.maxTabs = 10;
    this.maxFavorites = 20;
    
    // Кэш для избранных вкладок
    this.favoritesCache = null;
    this.favoritesCacheTime = 0;
    this.CACHE_DURATION = 1000; // 1 секунда
    
    // Проверяем доступность chrome.storage
    if (!chrome.storage || !chrome.storage.local) {
      console.warn('Lan-Search: chrome.storage.local недоступен');
    }
    
    // Доступные цвета для избранных
    this.availableColors = [
      { name: 'Красный', value: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 1)' },
      { name: 'Оранжевый', value: '#ffa726', bg: 'rgba(255, 167, 38, 0.1)', border: 'rgba(255, 167, 38, 1)' },
      { name: 'Желтый', value: '#ffd54f', bg: 'rgba(255, 213, 79, 0.1)', border: 'rgba(255, 213, 79, 1)' },
      { name: 'Зеленый', value: '#66bb6a', bg: 'rgba(102, 187, 106, 0.1)', border: 'rgba(102, 187, 106, 1)' },
      { name: 'Голубой', value: '#4fc3f7', bg: 'rgba(79, 195, 247, 0.1)', border: 'rgba(79, 195, 247, 1)' },
      { name: 'Синий', value: '#42a5f5', bg: 'rgba(66, 165, 245, 0.1)', border: 'rgba(66, 165, 245, 1)' },
      { name: 'Фиолетовый', value: '#ab47bc', bg: 'rgba(171, 71, 188, 0.1)', border: 'rgba(171, 71, 188, 1 )' },
      { name: 'Розовый', value: '#ec407a', bg: 'rgba(236, 64, 122, 0.1)', border: 'rgba(236, 64, 122, 1)' }
    ];
  }

  // Функция для определения подходящих доменов
  isSuitableDomain(hostname) {
    if (!hostname) return false;
    const domain = hostname.toLowerCase();
    return domain.includes('langame') || domain.includes('cls') || domain.includes('f5center');
  }

  // Получение текущего домена
  getCurrentDomain() {
    return window.location.hostname.toLowerCase();
  }

  // Проверка, подходит ли текущий домен
  isCurrentDomainSuitable() {
    return this.isSuitableDomain(this.getCurrentDomain());
  }

  // Получение списка всех подходящих доменов
  getSuitableDomains() {
    return ['langame', 'cls', 'f5center'];
  }

  // Проверка, содержит ли домен любой из подходящих поддоменов
  isSuitableDomainWithSubdomains(hostname) {
    if (!hostname) return false;
    const domain = hostname.toLowerCase();
    const suitableDomains = this.getSuitableDomains();
    return suitableDomains.some(suitable => domain.includes(suitable));
  }

  // Сохранение вкладки в историю
  saveTab(tabInfo) {
    try {
      this.getRecentTabs().then(recentTabs => {
        // Проверяем, находится ли вкладка в избранном
        this.isFavorite(tabInfo.id).then(isFavorite => {
          // Удаляем дубликаты
          const filteredTabs = recentTabs.filter(tab => tab.id !== tabInfo.id);
          
          // Добавляем новую вкладку в начало с правильным статусом избранного
          const updatedTabInfo = { ...tabInfo, isFavorite };
          filteredTabs.unshift(updatedTabInfo);
          
          // Ограничиваем до максимального количества
          const limitedTabs = filteredTabs.slice(0, this.maxTabs);
          
          chrome.storage.local.set({ [this.storageKey]: limitedTabs }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка сохранения в recent tabs:', chrome.runtime.lastError);
            }
          });
        });
      });
      return true;
    } catch (error) {
      console.error('Ошибка сохранения вкладки:', error);
      return false;
    }
  }

  // Получение списка последних вкладок
  getRecentTabs() {
    return new Promise((resolve) => {
      try {
        // Проверяем, доступен ли chrome.storage
        if (!chrome.storage || !chrome.storage.local) {
          console.warn('chrome.storage.local недоступен');
          resolve([]);
          return;
        }
        
        chrome.storage.local.get([this.storageKey], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Ошибка chrome.storage.local.get:', chrome.runtime.lastError);
            resolve([]);
            return;
          }
          const tabs = result[this.storageKey] || [];
          resolve(tabs);
        });
      } catch (error) {
        console.error('Ошибка получения истории вкладок:', error);
        resolve([]);
      }
    });
  }

  // Очистка истории
  clearHistory() {
    try {
      chrome.storage.local.remove([this.storageKey]);
      return true;
    } catch (error) {
      console.error('Ошибка очистки истории:', error);
      return false;
    }
  }

  // Удаление конкретной вкладки
  removeTab(tabId) {
    try {
      this.getRecentTabs().then(recentTabs => {
        const filteredTabs = recentTabs.filter(tab => tab.id !== tabId);
                  chrome.storage.local.set({ [this.storageKey]: filteredTabs }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка сохранения в recent tabs (removeTab):', chrome.runtime.lastError);
            }
          });
      });
      return true;
    } catch (error) {
      console.error('Ошибка удаления вкладки:', error);
      return false;
    }
  }

  // Получение списка избранных вкладок
  getFavoriteTabs() {
    return new Promise((resolve) => {
      try {
        const now = Date.now();
        
        // Проверяем кэш
        if (this.favoritesCache !== null && (now - this.favoritesCacheTime) < this.CACHE_DURATION) {
          resolve(this.favoritesCache);
          return;
        }
        
        // Проверяем, доступен ли chrome.storage
        if (!chrome.storage || !chrome.storage.local) {
          console.warn('chrome.storage.local недоступен');
          resolve([]);
          return;
        }
        
        chrome.storage.local.get([this.favoritesKey], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Ошибка chrome.storage.local.get:', chrome.runtime.lastError);
            resolve([]);
            return;
          }
          const tabs = result[this.favoritesKey] || [];
          
          // Обновляем кэш
          this.favoritesCache = tabs;
          this.favoritesCacheTime = now;
          
          resolve(tabs);
        });
      } catch (error) {
        console.error('Ошибка получения избранных вкладок:', error);
        resolve([]);
      }
    });
  }

  // Добавление в избранное
  addToFavorites(tabInfo) {
    return new Promise((resolve) => {
      try {
        this.getFavoriteTabs().then(favorites => {
          // Проверяем, не превышен ли лимит
          if (favorites.length >= this.maxFavorites) {
            resolve({ success: false, message: 'Достигнут лимит избранных вкладок (20)' });
            return;
          }
          
          // Проверяем, не добавлена ли уже
          const exists = favorites.find(tab => tab.id === tabInfo.id);
          if (exists) {
            resolve({ success: false, message: 'Вкладка уже в избранном' });
            return;
          }
          
          // Добавляем в избранное
          favorites.push({ ...tabInfo, isFavorite: true });
          chrome.storage.local.set({ [this.favoritesKey]: favorites }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка сохранения в favorites (addToFavorites):', chrome.runtime.lastError);
            } else {
              // Обновляем кэш
              this.favoritesCache = favorites;
              this.favoritesCacheTime = Date.now();
            }
          });
          
                      // Обновляем статус в недавних вкладках
            this.getRecentTabs().then(recentTabs => {
              const updatedRecentTabs = recentTabs.map(tab => 
                tab.id === tabInfo.id ? { ...tab, isFavorite: true } : tab
              );
              chrome.storage.local.set({ [this.storageKey]: updatedRecentTabs }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Ошибка обновления recent tabs (addToFavorites):', chrome.runtime.lastError);
                }
              });
            });
          
          resolve({ success: true, message: 'Добавлено в избранное' });
        });
      } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        resolve({ success: false, message: 'Ошибка добавления в избранное' });
      }
    });
  }

  // Удаление из избранного
  removeFromFavorites(tabId) {
    return new Promise((resolve) => {
      try {
        this.getFavoriteTabs().then(favorites => {
          const filteredFavorites = favorites.filter(tab => tab.id !== tabId);
          chrome.storage.local.set({ [this.favoritesKey]: filteredFavorites }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка сохранения в favorites (removeFromFavorites):', chrome.runtime.lastError);
            } else {
              // Обновляем кэш
              this.favoritesCache = filteredFavorites;
              this.favoritesCacheTime = Date.now();
            }
          });
          
                      // Обновляем статус в недавних вкладках
            this.getRecentTabs().then(recentTabs => {
              const updatedRecentTabs = recentTabs.map(tab => 
                tab.id === tabId ? { ...tab, isFavorite: false } : tab
              );
              chrome.storage.local.set({ [this.storageKey]: updatedRecentTabs }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Ошибка обновления recent tabs (removeFromFavorites):', chrome.runtime.lastError);
                }
              });
            });
          
          resolve(true);
        });
      } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        resolve(false);
      }
    });
  }

  // Проверка, находится ли вкладка в избранном
  isFavorite(tabId) {
    return new Promise((resolve) => {
      this.getFavoriteTabs().then(favorites => {
        const isFavorite = favorites.some(tab => tab.id === tabId);
        resolve(isFavorite);
      });
    });
  }

  // Установка цвета для избранной вкладки
  setFavoriteColor(tabId, colorValue) {
    return new Promise((resolve) => {
      try {
        this.getFavoriteTabs().then(favorites => {
          const updatedFavorites = favorites.map(tab => 
            tab.id === tabId ? { ...tab, color: colorValue } : tab
          );
          chrome.storage.local.set({ [this.favoritesKey]: updatedFavorites }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка сохранения цвета (setFavoriteColor):', chrome.runtime.lastError);
            } else {
              // Обновляем кэш
              this.favoritesCache = updatedFavorites;
              this.favoritesCacheTime = Date.now();
            }
          });
          resolve({ success: true, message: 'Цвет установлен' });
        });
      } catch (error) {
        console.error('Ошибка установки цвета:', error);
        resolve({ success: false, message: 'Ошибка установки цвета' });
      }
    });
  }

  // Удаление цвета из избранной вкладки
  removeFavoriteColor(tabId) {
    return new Promise((resolve) => {
      try {
        this.getFavoriteTabs().then(favorites => {
          const updatedFavorites = favorites.map(tab => {
            if (tab.id === tabId) {
              const { color, ...tabWithoutColor } = tab;
              return tabWithoutColor;
            }
            return tab;
          });
          chrome.storage.local.set({ [this.favoritesKey]: updatedFavorites }, () => {
            if (chrome.runtime.lastError) {
              console.error('Ошибка удаления цвета (removeFavoriteColor):', chrome.runtime.lastError);
            } else {
              // Обновляем кэш
              this.favoritesCache = updatedFavorites;
              this.favoritesCacheTime = Date.now();
            }
          });
          resolve({ success: true, message: 'Цвет удален' });
        });
      } catch (error) {
        console.error('Ошибка удаления цвета:', error);
        resolve({ success: false, message: 'Ошибка удаления цвета' });
      }
    });
  }

  // Получение информации о вкладке из DOM элемента
  extractTabInfo(linkElement) {
    const href = linkElement.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return null;
    }

    const title = linkElement.getAttribute('title') || linkElement.textContent.trim();
    const id = linkElement.getAttribute('id') || href;
    
    // Получаем data-icon атрибут для определения иконки
    let dataIcon = linkElement.getAttribute('data-icon');
    
    // Если у ссылки нет data-icon, ищем у родительской категории
    if (!dataIcon) {
      let parent = linkElement.parentElement;
      while (parent && parent.tagName === 'LI') {
        const categoryLink = parent.querySelector('a[data-icon]');
        if (categoryLink) {
          dataIcon = categoryLink.getAttribute('data-icon');
          if (dataIcon) break;
        }
        parent = parent.parentElement;
      }
    }

    // Получаем стили иконки из CSS
    let iconStyles = this.getIconStyles(dataIcon);

    return {
      id: id,
      title: title,
      href: href,
      icon: dataIcon,
      iconStyles: iconStyles,
      timestamp: Date.now(),
      isFavorite: false
    };
  }

  // Получение CSS стилей для иконки на основе data-icon
  getIconStyles(dataIcon) {
    if (!dataIcon) return null;

    // Получаем все стили из document
    const styles = Array.from(document.styleSheets);
    let iconStyles = null;

    // Ищем CSS правила для данного data-icon
    for (const sheet of styles) {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.includes(`[data-icon="${dataIcon}"]`)) {
            // Находим правило с :before
            if (rule.selectorText.includes(':before')) {
              iconStyles = {
                backgroundImage: rule.style.backgroundImage,
                backgroundSize: rule.style.backgroundSize,
                backgroundPosition: rule.style.backgroundPosition,
                backgroundRepeat: rule.style.backgroundRepeat,
                width: rule.style.width,
                height: rule.style.height,
                display: rule.style.display || 'inline-block'
              };
              break;
            }
          }
        }
        if (iconStyles) break;
      } catch (e) {
        // Пропускаем CORS ошибки
        continue;
      }
    }

    return iconStyles;
  }

  // Fallback функция для получения эмодзи иконки
  getFallbackIcon(dataIcon) {
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

  // отслеживание кликов по навигации на сайте хз, может и не нужно
  startTracking(menuRoot) {
    if (!menuRoot) return;

    const handleNavClick = (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const tabInfo = this.extractTabInfo(link);
      if (tabInfo) {
        this.saveTab(tabInfo);
      }
    };

    menuRoot.addEventListener('click', handleNavClick);
  }

    // Отображение последних вкладок на главной странице для удобства или кому либо лишнее будет не ебу
        displayOnMainPage() {
          // Проверяем, что мы на подходящем домене
          if (!this.isCurrentDomainSuitable()) {
            return;
          }

    if (window.location.pathname !== '/' && window.location.pathname !== '/dashboard/') {
      return;
    }

    Promise.all([this.getRecentTabs(), this.getFavoriteTabs()]).then(([recentTabs, favoriteTabs]) => {
      if (recentTabs.length === 0 && favoriteTabs.length === 0) return;

      console.log('Lan-Search: Отображение избранных вкладок в порядке:', favoriteTabs.map(f => f.title));

    const langameSubscriptionWrapper = document.getElementById('langameSubscriptionWrapper');
    if (!langameSubscriptionWrapper) return;

    if (document.getElementById('recentTabsContainer')) return;

    const container = this.createTabsContainer(recentTabs, favoriteTabs);
    langameSubscriptionWrapper.parentNode.insertBefore(container, langameSubscriptionWrapper.nextSibling);
  });
  }

  createTabsContainer(recentTabs, favoriteTabs) {
    const container = document.createElement('div');
    container.id = 'recentTabsContainer';
    container.style.cssText = `
      margin: 20px 0;
      padding: 0 10px;
    `;

    if (favoriteTabs.length > 0) {
      const favoritesSection = document.createElement('div');
      favoritesSection.style.cssText = `
        margin-bottom: 30px;
      `;

      const favoritesTitle = document.createElement('h3');
      favoritesTitle.textContent = 'Избранные вкладки ';
      favoritesTitle.style.cssText = `
        margin: 10px 0;
        color: var(--text-color, #333);
        font-size: 18px;
        font-weight: 600;
      `;

      const favoritesGrid = document.createElement('div');
      favoritesGrid.className = 'favorites-grid';
      favoritesGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        margin-top: 15px;
      `;

      favoriteTabs.forEach(tab => {
        const card = this.createTabCard(tab, true);
        favoritesGrid.appendChild(card);
      });

      favoritesSection.appendChild(favoritesTitle);
      favoritesSection.appendChild(favoritesGrid);
      container.appendChild(favoritesSection);
    }

    // Секция недавних вкладок
    if (recentTabs.length > 0) {
      const recentSection = document.createElement('div');

      const recentTitle = document.createElement('h3');
      recentTitle.textContent = 'Последние используемые вкладки';
      recentTitle.style.cssText = `
        margin: 10px 0;
        color: var(--text-color, #333);
        font-size: 18px;
        font-weight: 600;
      `;

      const recentGrid = document.createElement('div');
      recentGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        margin-top: 15px;
      `;

      recentTabs.forEach(tab => {
        const card = this.createTabCard(tab, false);
        recentGrid.appendChild(card);
      });

      recentSection.appendChild(recentTitle);
      recentSection.appendChild(recentGrid);
      container.appendChild(recentSection);
    }

    return container;
  }

  // Создание карточки вкладки
  createTabCard(tab, isFavorite = false) {
    const card = document.createElement('div');
    
    // Добавляем класс для избранных карточек
    if (isFavorite) {
      card.classList.add('favorite-card');
      card.setAttribute('data-favorite', 'true');
    }
    
    // Применяем цвет если он установлен для избранной вкладки
    let cardStyle = `
      background: var(--bg-secondary, rgba(151, 151, 151, 0.5));
      backdrop-filter: blur(6px);
      border: 1px solid var(--border-color, rgba(36, 36, 36, 0.57));
      border-radius: 10px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    `;
    
    if (isFavorite && tab.color) {
      const colorConfig = this.availableColors.find(c => c.value === tab.color);
      if (colorConfig) {
        cardStyle = `
          background: ${colorConfig.bg};
          backdrop-filter: blur(6px);
          border: 1px solid ${colorConfig.border};
          border-radius: 10px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        `;
      }
    }
    
    card.style.cssText = cardStyle;

    // Эффекты при наведении
    card.addEventListener('mouseenter', () => {
      if (isFavorite && tab.color) {
        const colorConfig = this.availableColors.find(c => c.value === tab.color);
        if (colorConfig) {
          card.style.background = colorConfig.bg.replace('0.1', '0.2');
        } else {
          card.style.background = 'rgba(255,255,255,0.1)';
        }
      } else {
        card.style.background = 'rgba(255,255,255,0.1)';
      }
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      if (isFavorite && tab.color) {
        const colorConfig = this.availableColors.find(c => c.value === tab.color);
        if (colorConfig) {
          card.style.background = colorConfig.bg;
        } else {
          card.style.background = 'rgba(151, 151, 151, 0.5)';
        }
      } else {
        card.style.background = 'rgba(151, 151, 151, 0.5)';
      }
      card.style.transform = 'translateY(0)';
    });

    // Переход по клику
    card.addEventListener('click', () => {
      window.location.href = tab.href;
    });

    // Иконка
    if (tab.iconStyles) {
      const icon = document.createElement('span');
      icon.style.cssText = `
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-image: ${tab.iconStyles.backgroundImage || 'none'};
        background-size: ${tab.iconStyles.backgroundSize || 'contain'};
        background-position: ${tab.iconStyles.backgroundPosition || 'center'};
        background-repeat: ${tab.iconStyles.backgroundRepeat || 'no-repeat'};
        width: ${tab.iconStyles.width || '24px'};
        height: ${tab.iconStyles.height || '24px'};
      `;
      card.appendChild(icon);
    } else if (tab.icon) {
      // Fallback - создаем эмодзи на основе data-icon
      const icon = document.createElement('span');
      icon.textContent = this.getFallbackIcon(tab.icon);
      icon.style.cssText = `
        font-size: 20px;
        min-width: 24px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      card.appendChild(icon);
    }

    // Информация о вкладке
    const info = document.createElement('div');
    info.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const title = document.createElement('div');
    title.textContent = tab.title;
    title.style.cssText = `
      font-weight: 600;
      color: var(--text-color, #333);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    const path = document.createElement('div');
    path.textContent = tab.href;
    path.style.cssText = `
      font-size: 12px;
      color: var(--text-secondary, #666);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    info.appendChild(title);
    info.appendChild(path);
    card.appendChild(info);

    // Кнопки управления
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      display: none;
      gap: 4px;
    `;

    // Кнопка избранного
    const favoriteBtn = document.createElement('button');
    favoriteBtn.textContent = isFavorite ? '⭐' : '☆';
    favoriteBtn.style.cssText = `
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;

    favoriteBtn.addEventListener('mouseenter', () => {
      favoriteBtn.style.background = 'rgba(255, 193, 7, 0.2)';
    });

    favoriteBtn.addEventListener('mouseleave', () => {
      favoriteBtn.style.background = 'rgba(255, 193, 7, 0.1)';
    });

    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (isFavorite) {
        // Удаляем из избранного
        this.removeFromFavorites(tab.id).then(success => {
          if (success) {
            favoriteBtn.textContent = '☆';
            isFavorite = false;
            // Обновляем отображение
            this.refreshDisplay();
          }
        });
      } else {
        // Добавляем в избранное
        this.addToFavorites(tab).then(result => {
          if (result.success) {
            favoriteBtn.textContent = '⭐';
            isFavorite = true;
            // Показываем уведомление
            this.showNotification(result.message, 'success');
            // Обновляем отображение
            this.refreshDisplay();
          } else {
            this.showNotification(result.message, 'error');
          }
        });
      }
    });

    // Кнопка выбора цвета (только для избранных вкладок)
    if (isFavorite) {
      const colorBtn = document.createElement('button');
      colorBtn.textContent = '🎨';
      colorBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(108, 117, 125, 0.1);
        color: #6c757d;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;

      colorBtn.addEventListener('mouseenter', () => {
        colorBtn.style.background = 'rgba(108, 117, 125, 0.2)';
      });

      colorBtn.addEventListener('mouseleave', () => {
        colorBtn.style.background = 'rgba(108, 117, 125, 0.1)';
      });

      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showColorPicker(tab, card);
      });

      buttonsContainer.appendChild(colorBtn);
    }

    // Кнопка удаления (только для недавних вкладок)
    if (!isFavorite) {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;

      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.background = 'rgba(220, 53, 69, 0.2)';
      });

      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.background = 'rgba(220, 53, 69, 0.1)';
      });

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.removeTab(tab.id)) {
          card.remove();
          // Обновляем отображение, если карточек не осталось
          Promise.all([this.getRecentTabs(), this.getFavoriteTabs()]).then(([recentTabs, favoriteTabs]) => {
            const container = document.getElementById('recentTabsContainer');
            if (container && recentTabs.length === 0 && favoriteTabs.length === 0) {
              container.remove();
            }
          });
        }
      });

      buttonsContainer.appendChild(removeBtn);
    }

    buttonsContainer.appendChild(favoriteBtn);
    card.appendChild(buttonsContainer);

    // Показываем кнопки при наведении
    card.addEventListener('mouseenter', () => {
      buttonsContainer.style.display = 'flex';
    });

    card.addEventListener('mouseleave', () => {
      buttonsContainer.style.display = 'none';
    });

    return card;
  }

  // Обновление отображения
  refreshDisplay() {
    const container = document.getElementById('recentTabsContainer');
    if (container) {
      container.remove();
      this.displayOnMainPage();
      
      // Инициализируем drag & drop для новых карточек
      setTimeout(() => {
        if (window.initFavoritesDragDrop) {
          window.initFavoritesDragDrop();
        }
      }, 500);
    }
  }

  // Функция для показа палитры цветов
  showColorPicker(tab, card) {
    // Удаляем существующие палитры
    const existingPickers = document.querySelectorAll('.lan-search-color-picker');
    existingPickers.forEach(picker => picker.remove());

    const picker = document.createElement('div');
    picker.className = 'lan-search-color-picker';
    picker.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 20px;
      z-index: 10001;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 300px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Выберите цвет для избранной вкладки';
    title.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #333;
      text-align: center;
    `;
    picker.appendChild(title);

    const colorsGrid = document.createElement('div');
    colorsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    `;

    // Добавляем опцию "Без цвета"
    const noColorBtn = document.createElement('button');
    noColorBtn.textContent = 'Без цвета';
    noColorBtn.style.cssText = `
      padding: 10px;
      border: 2px solid #e0e0e0;
      background: #f8f9fa;
      color: #666;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    `;

    noColorBtn.addEventListener('mouseenter', () => {
      noColorBtn.style.background = '#e9ecef';
    });

    noColorBtn.addEventListener('mouseleave', () => {
      noColorBtn.style.background = '#f8f9fa';
    });

    noColorBtn.addEventListener('click', () => {
      this.removeFavoriteColor(tab.id).then(result => {
        if (result.success) {
          this.showNotification(result.message, 'success');
          this.refreshDisplay();
        } else {
          this.showNotification(result.message, 'error');
        }
        picker.remove();
        overlay.remove();
      });
    });

    colorsGrid.appendChild(noColorBtn);

    // Добавляем цветовые опции
    this.availableColors.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.style.cssText = `
        width: 50px;
        height: 50px;
        border: 2px solid ${color.value};
        background: ${color.bg};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      `;

      colorBtn.addEventListener('mouseenter', () => {
        colorBtn.style.transform = 'scale(1.1)';
      });

      colorBtn.addEventListener('mouseleave', () => {
        colorBtn.style.transform = 'scale(1)';
      });

      colorBtn.addEventListener('click', () => {
        this.setFavoriteColor(tab.id, color.value).then(result => {
          if (result.success) {
            this.showNotification(result.message, 'success');
            this.refreshDisplay();
          } else {
            this.showNotification(result.message, 'error');
          }
          picker.remove();
          overlay.remove();
        });
      });

      // Добавляем название цвета при наведении
      const tooltip = document.createElement('div');
      tooltip.textContent = color.name;
      tooltip.style.cssText = `
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      `;

      colorBtn.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
      });

      colorBtn.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });

      colorBtn.appendChild(tooltip);
      colorsGrid.appendChild(colorBtn);
    });

    picker.appendChild(colorsGrid);

    // Кнопка закрытия
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.cssText = `
      width: 100%;
      padding: 10px;
      border: none;
      background: #6c757d;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#5a6268';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#6c757d';
    });

    closeBtn.addEventListener('click', () => {
      picker.remove();
      overlay.remove();
    });

    picker.appendChild(closeBtn);

    // Закрытие при клике вне палитры
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
    `;

    overlay.addEventListener('click', () => {
      picker.remove();
      overlay.remove();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(picker);
  }

  // Показ уведомлений
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;

    if (type === 'success') {
      notification.style.background = '#28a745';
    } else if (type === 'error') {
      notification.style.background = '#dc3545';
    } else {
      notification.style.background = '#17a2b8';
    }

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматическое удаление
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Функция для подключения темы
function injectThemeCSS() {
  if (!document.getElementById('lan-search-theme-css')) {
    const themeLink = document.createElement("link");
    themeLink.id = 'lan-search-theme-css';
    themeLink.rel = "stylesheet";
    themeLink.href = chrome.runtime.getURL("theme.css");
    document.head.appendChild(themeLink);
  }
}

// Создаем глобальный экземпляр
window.recentTabsManager = new RecentTabsManager();

// Глобальные переменные для кэширования темы
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

// Функция для применения темы к странице
function applyThemeToPage() {
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
  });
}

// Функция для применения темы к новым элементам
function applyThemeToNewElements() {
  getCurrentTheme((theme) => {
    if (theme === 'dark') {
      // Применяем темную тему ко всем элементам, которые могут быть добавлены динамически
      const elementsToStyle = document.querySelectorAll(`
        .content-wrapper, .main-content, .container-fluid, .container,
        .wrapper, .page-wrapper, .app-wrapper, .main, .content, .section,
        .panel, .block, .box, .sidebar-wrapper, .nav-wrapper, .menu-wrapper,
        .footer, .footer-wrapper, .header, .header-wrapper,
        .card, .card-header, .form-control, .btn-light,
        .navbar, .dropdown-menu, .modal-content, .modal-header, .modal-footer,
        .table, .list-group-item, .alert-light, .badge-light,
        .progress, .page-link, .tooltip-inner, .popover, .popover-header,
        .popover-body, select.form-control, .form-check-input,
        textarea.form-control, .bg-light, .bg-white, .text-dark, .text-muted,
        .border, .langame-content, .langame-wrapper, .cls-content, .cls-wrapper,
        .px-1, .p-lg-3, .container-fluid.px-1, .container-fluid.p-lg-3, .container-fluid.px-1.p-lg-3,
        #dataTable thead tr th>div, table.table thead tr th>div, table.dataTable thead tr th>div,
        #dataTable thead tr th, table.table thead tr th, table.dataTable thead tr th,
        #dataTable tbody tr td, table.table tbody tr td, table.dataTable tbody tr td
      `);
      
              elementsToStyle.forEach(element => {
          // Применяем базовые стили темной темы
          if (element.classList.contains('content-wrapper') || 
              element.classList.contains('main-content') ||
              element.classList.contains('container-fluid') ||
              element.classList.contains('container') ||
              element.classList.contains('wrapper') ||
              element.classList.contains('page-wrapper') ||
              element.classList.contains('app-wrapper') ||
              element.classList.contains('main') ||
              element.classList.contains('content') ||
              element.classList.contains('section') ||
              element.classList.contains('px-1') ||
              element.classList.contains('p-lg-3')) {
            element.style.backgroundColor = 'var(--bg-color)';
          }
        
        if (element.classList.contains('panel') ||
            element.classList.contains('block') ||
            element.classList.contains('box') ||
            element.classList.contains('sidebar-wrapper') ||
            element.classList.contains('nav-wrapper') ||
            element.classList.contains('menu-wrapper') ||
            element.classList.contains('footer') ||
            element.classList.contains('footer-wrapper') ||
            element.classList.contains('header') ||
            element.classList.contains('header-wrapper')) {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.borderColor = 'var(--border-color)';
        }
        
        if (element.classList.contains('card')) {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.borderColor = 'var(--border-color)';
        }
        
        if (element.classList.contains('form-control')) {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.borderColor = 'var(--border-color)';
          element.style.color = 'var(--text-color)';
        }
        
                  if (element.classList.contains('btn-light')) {
            element.style.backgroundColor = 'var(--bg-secondary)';
            element.style.borderColor = 'var(--border-color)';
            element.style.color = 'var(--text-color)';
          }

          // Стили для заголовков таблиц
          if (element.tagName === 'DIV' && 
              (element.closest('#dataTable thead tr th') || 
               element.closest('table.table thead tr th') || 
               element.closest('table.dataTable thead tr th'))) {
            element.style.backgroundColor = 'var(--bg-secondary)';
            element.style.padding = '13px 5px';
          }

          // Стили для заголовков таблиц (th)
          if (element.tagName === 'TH' && 
              (element.closest('#dataTable thead tr') || 
               element.closest('table.table thead tr') || 
               element.closest('table.dataTable thead tr'))) {
            element.style.backgroundColor = 'var(--bg-secondary)';
            element.style.borderColor = 'var(--border-color)';
            element.style.color = 'var(--text-color)';
          }

          // Стили для ячеек таблиц (td)
          if (element.tagName === 'TD' && 
              (element.closest('#dataTable tbody tr') || 
               element.closest('table.table tbody tr') || 
               element.closest('table.dataTable tbody tr'))) {
            element.style.backgroundColor = 'var(--bg-color)';
            element.style.borderColor = 'var(--border-color)';
            element.style.color = 'var(--text-color)';
          }
      });
    }
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

// Подключаем CSS темы и применяем тему при загрузке
injectThemeCSS();
applyThemeToPage();
observeDOMChanges();

// Слушатель изменений темы
try {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync' && changes.theme) {
        const newTheme = changes.theme.newValue || 'light';
        currentTheme = newTheme; // Обновляем глобальную переменную
        document.documentElement.setAttribute('data-theme', newTheme);
        // Применяем тему к новым элементам при изменении темы
        setTimeout(applyThemeToNewElements, 100);
      }
    });
  }
} catch (e) {
  // Игнорируем ошибки если chrome.storage недоступен
}

// Периодическое применение темы для динамически загружаемого контента
setInterval(function() {
  if (currentTheme === 'dark') {
    applyThemeToNewElements();
  }
}, 2000); // Проверяем каждые 2 секунды

// Слушатель для событий навигации (для SPA)
window.addEventListener('popstate', function() {
  setTimeout(applyThemeToNewElements, 500);
});

// Перехватываем pushState и replaceState для SPA
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  setTimeout(applyThemeToNewElements, 500);
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  setTimeout(applyThemeToNewElements, 500);
};

// Слушатель для AJAX запросов (если используется XMLHttpRequest)
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  this.addEventListener('load', function() {
    setTimeout(applyThemeToNewElements, 100);
  });
  originalXHROpen.apply(this, args);
};

// Слушатель для fetch запросов
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args).then(response => {
    setTimeout(applyThemeToNewElements, 100);
    return response;
  });
};

// Экспортируем функции для совместимости
window.lanSearchSaveTab = (tabInfo) => window.recentTabsManager.saveTab(tabInfo);
window.lanSearchGetRecentTabs = () => window.recentTabsManager.getRecentTabs();
window.lanSearchDisplayRecentTabs = () => window.recentTabsManager.displayOnMainPage();
window.lanSearchGetFavoriteTabs = () => window.recentTabsManager.getFavoriteTabs();
window.lanSearchAddToFavorites = (tabInfo) => window.recentTabsManager.addToFavorites(tabInfo);
window.lanSearchRemoveFromFavorites = (tabId) => window.recentTabsManager.removeFromFavorites(tabId);

// Экспортируем функции для определения подходящих доменов
window.lanSearchIsSuitableDomain = (hostname) => window.recentTabsManager.isSuitableDomain(hostname);
window.lanSearchGetCurrentDomain = () => window.recentTabsManager.getCurrentDomain();
window.lanSearchIsCurrentDomainSuitable = () => window.recentTabsManager.isCurrentDomainSuitable();
window.lanSearchGetSuitableDomains = () => window.recentTabsManager.getSuitableDomains();
window.lanSearchIsSuitableDomainWithSubdomains = (hostname) => window.recentTabsManager.isSuitableDomainWithSubdomains(hostname);

// Экспортируем функции для работы с цветами избранных
window.lanSearchSetFavoriteColor = (tabId, colorValue) => window.recentTabsManager.setFavoriteColor(tabId, colorValue);
window.lanSearchRemoveFavoriteColor = (tabId) => window.recentTabsManager.removeFavoriteColor(tabId);
})();
