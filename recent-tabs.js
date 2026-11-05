// Управление последними использованными вкладками
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
    if (
      domain === 'msgtp.langame.ru'
      || domain === 'msgpublic.langame.ru'
      || domain.endsWith('.msgtp.langame.ru')
      || domain.endsWith('.msgpublic.langame.ru')
    ) {
      return false;
    }
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

  getUseHref(el) {
    if (!el) return null;
    const use = el.querySelector ? el.querySelector('use') : null;
    if (!use) return null;
    const href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
    const id = href.replace(/^#/, '').trim();
    return id || null;
  }

  symbolExists(id) {
    return !!(id && document.getElementById(id));
  }

  // Новый фронт: SVG-спрайт #aside-icon-*, иначе legacy data-icon
  extractSvgIconId(linkElement) {
    if (!linkElement) return null;

    const own =
      this.getUseHref(linkElement.querySelector('.nav__link-icon')) ||
      this.getUseHref(linkElement);
    if (own) return own;

    const navItem = linkElement.closest('li.nav__item');
    if (navItem) {
      const parentIcon =
        this.getUseHref(navItem.querySelector(':scope > .nav__link .nav__link-icon')) ||
        this.getUseHref(navItem.querySelector(':scope > .nav__link'));
      if (parentIcon) return parentIcon;
    }

    let dataIcon = linkElement.getAttribute('data-icon');
    if (!dataIcon) {
      let parent = linkElement.parentElement;
      while (parent) {
        const categoryLink = parent.querySelector?.(':scope > a[data-icon], :scope > .nav__link[data-icon]');
        if (categoryLink?.getAttribute('data-icon')) {
          dataIcon = categoryLink.getAttribute('data-icon');
          break;
        }
        if (parent.classList?.contains('nav__item')) {
          const useId = this.getUseHref(parent.querySelector(':scope > .nav__link'));
          if (useId) return useId;
        }
        parent = parent.parentElement;
        if (parent && (parent.id === 'nav-accordion-parent' || parent.classList?.contains('nav__content'))) break;
      }
    }

    if (dataIcon) {
      const candidate = dataIcon.startsWith('aside-icon-') ? dataIcon : `aside-icon-${dataIcon}`;
      if (this.symbolExists(candidate)) return candidate;
    }

    if (linkElement.id) {
      const byId = `aside-icon-${linkElement.id}`;
      if (this.symbolExists(byId)) return byId;
    }

    return null;
  }

  resolveIconSvgId(tab) {
    if (!tab) return null;
    if (tab.iconSvgId && this.symbolExists(tab.iconSvgId)) return tab.iconSvgId;

    if (tab.icon) {
      const fromLegacy = tab.icon.startsWith('aside-icon-') ? tab.icon : `aside-icon-${tab.icon}`;
      if (this.symbolExists(fromLegacy)) return fromLegacy;
    }

    if (tab.id) {
      const byId = `aside-icon-${tab.id}`;
      if (this.symbolExists(byId)) return byId;
    }

    // Дотянуть иконку из текущего меню (для старых записей в storage)
    try {
      const href = tab.href;
      let link = null;
      if (tab.id) link = document.getElementById(tab.id);
      if (!link && href) {
        link = document.querySelector(`#nav-accordion-parent a[href="${CSS.escape(href)}"], .nav__content a[href="${CSS.escape(href)}"]`);
      }
      if (!link && href) {
        const path = href.split('?')[0];
        link = [...document.querySelectorAll('#nav-accordion-parent a[href], .nav__content a[href]')]
          .find(a => (a.getAttribute('href') || '').split('?')[0] === path);
      }
      if (link) return this.extractSvgIconId(link);
    } catch (e) {
      // ignore
    }

    return tab.iconSvgId || null;
  }

  extractTabInfo(linkElement) {
    const href = linkElement.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return null;
    }

    const title = linkElement.getAttribute('title') || linkElement.textContent.trim();
    const id = linkElement.getAttribute('id') || href;
    const iconSvgId = this.extractSvgIconId(linkElement);
    const dataIcon = linkElement.getAttribute('data-icon') || (iconSvgId ? iconSvgId.replace(/^aside-icon-/, '') : null);
    const iconStyles = this.getIconStyles(dataIcon);

    return {
      id: id,
      title: title,
      href: href,
      icon: dataIcon,
      iconSvgId: iconSvgId,
      iconStyles: iconStyles,
      timestamp: Date.now(),
      isFavorite: false
    };
  }

  getIconStyles(dataIcon) {
    if (!dataIcon) return null;

    const styles = Array.from(document.styleSheets);
    let iconStyles = null;

    for (const sheet of styles) {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.includes(`[data-icon="${dataIcon}"]`)) {
            if (rule.selectorText.includes(':before') && rule.style.backgroundImage) {
              iconStyles = {
                backgroundImage: rule.style.backgroundImage,
                backgroundSize: '18px 18px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              };
              break;
            }
          }
        }
        if (iconStyles) break;
      } catch (e) {
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
        displayOnMainPage(attempts = 0) {
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

    if (document.getElementById('recentTabsContainer')) return;

    // Контейнер собираем только когда якорь уже найден: иначе на каждой
    // неудачной попытке создавался и выбрасывался лишний DOM.
    const guestSearch = document.getElementById('guestSearchContainer');
    if (guestSearch && guestSearch.parentNode) {
      guestSearch.parentNode.insertBefore(this.createTabsContainer(recentTabs, favoriteTabs), guestSearch);
      return;
    }

    const legacy = document.getElementById('langameSubscriptionWrapper');
    if (legacy && legacy.parentNode) {
      legacy.parentNode.insertBefore(this.createTabsContainer(recentTabs, favoriteTabs), legacy.nextSibling);
      return;
    }

    const insertMainDashboardWidget = window.lanSearchInsertMainDashboardWidget;
    if (typeof insertMainDashboardWidget === 'function' &&
        insertMainDashboardWidget(this.createTabsContainer(recentTabs, favoriteTabs))) {
      return;
    }

    if (attempts < 15) {
      setTimeout(() => this.displayOnMainPage(attempts + 1), 200);
    } else {
      console.warn('Lan-Search: не удалось вставить блок recent tabs (нет якоря на главной)');
    }
  });
  }

  createTabsContainer(recentTabs, favoriteTabs) {
    const container = document.createElement('div');
    container.id = 'recentTabsContainer';
    container.className = 'lgs-tabs-panel';

    if (favoriteTabs.length > 0) {
      const favoritesSection = document.createElement('section');
      favoritesSection.className = 'lgs-tabs-section';

      const favoritesHeader = document.createElement('div');
      favoritesHeader.className = 'lgs-tabs-header';
      favoritesHeader.innerHTML = `
        <div class="lgs-tabs-title-wrap">
          <h3 class="lgs-tabs-title">Избранные вкладки</h3>
        </div>
      `;

      const favoritesGrid = document.createElement('div');
      favoritesGrid.className = 'favorites-grid lgs-tabs-grid';

      favoriteTabs.forEach(tab => {
        favoritesGrid.appendChild(this.createTabCard(tab, true));
      });

      favoritesSection.appendChild(favoritesHeader);
      favoritesSection.appendChild(favoritesGrid);
      container.appendChild(favoritesSection);
    }

    if (recentTabs.length > 0) {
      const recentSection = document.createElement('section');
      recentSection.className = 'lgs-tabs-section';

      const recentHeader = document.createElement('div');
      recentHeader.className = 'lgs-tabs-header';
      recentHeader.innerHTML = `
        <div class="lgs-tabs-title-wrap">
          <h3 class="lgs-tabs-title">Последние вкладки</h3>
        </div>
      `;

      const recentGrid = document.createElement('div');
      recentGrid.className = 'lgs-tabs-grid';

      recentTabs.forEach(tab => {
        recentGrid.appendChild(this.createTabCard(tab, false));
      });

      recentSection.appendChild(recentHeader);
      recentSection.appendChild(recentGrid);
      container.appendChild(recentSection);
    }

    return container;
  }

  createTabCard(tab, isFavorite = false) {
    const card = document.createElement('div');
    card.className = 'lgs-tab-card';
    if (isFavorite) {
      card.classList.add('favorite-card');
      card.setAttribute('data-favorite', 'true');
    }

    if (isFavorite && tab.color) {
      const colorConfig = this.availableColors.find(c => c.value === tab.color);
      if (colorConfig) {
        card.classList.add('has-color');
        card.style.setProperty('--lgs-tab-accent', colorConfig.value);
        card.style.setProperty('--lgs-tab-tint', colorConfig.bg);
        card.style.setProperty('--lgs-tab-border', colorConfig.border);
      }
    }

    card.addEventListener('click', () => {
      window.location.href = tab.href;
    });

    const icon = document.createElement('span');
    icon.className = 'lgs-tab-icon';
    icon.setAttribute('aria-hidden', 'true');

    const svgId = this.resolveIconSvgId(tab);
    if (svgId && this.symbolExists(svgId)) {
      const symbol = document.getElementById(svgId);
      const viewBox = symbol?.getAttribute('viewBox') || '0 0 24 24';
      icon.innerHTML = `<svg class="lgs-tab-svg" viewBox="${viewBox}" focusable="false" aria-hidden="true"><use href="#${svgId}" xlink:href="#${svgId}"></use></svg>`;
    } else if (tab.iconStyles?.backgroundImage && tab.iconStyles.backgroundImage !== 'none') {
      icon.classList.add('has-bg');
      icon.style.backgroundImage = tab.iconStyles.backgroundImage;
    } else if (tab.icon) {
      icon.classList.add('is-fallback');
      icon.textContent = this.getFallbackIcon(tab.icon);
    } else {
      icon.classList.add('is-placeholder');
      icon.innerHTML = `
        <svg class="lgs-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
          <path d="M3 7h18M3 12h18M3 17h12"></path>
        </svg>
      `;
    }
    card.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'lgs-tab-info';

    const title = document.createElement('div');
    title.className = 'lgs-tab-name';
    title.textContent = tab.title;

    const path = document.createElement('div');
    path.className = 'lgs-tab-path';
    path.textContent = tab.href;

    info.appendChild(title);
    info.appendChild(path);
    card.appendChild(info);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'lgs-tab-actions';

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'lgs-tab-action is-favorite' + (isFavorite ? ' is-active' : '');
    favoriteBtn.title = isFavorite ? 'Убрать из избранного' : 'В избранное';
    favoriteBtn.setAttribute('aria-label', favoriteBtn.title);
    favoriteBtn.innerHTML = isFavorite
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z"/></svg>';

    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (isFavorite) {
        this.removeFromFavorites(tab.id).then(success => {
          if (success) this.refreshDisplay();
        });
      } else {
        this.addToFavorites(tab).then(result => {
          if (result.success) {
            this.showNotification(result.message, 'success');
            this.refreshDisplay();
          } else {
            this.showNotification(result.message, 'error');
          }
        });
      }
    });

    if (isFavorite) {
      const colorBtn = document.createElement('button');
      colorBtn.type = 'button';
      colorBtn.className = 'lgs-tab-action is-color';
      colorBtn.title = 'Цвет';
      colorBtn.setAttribute('aria-label', 'Выбрать цвет');
      colorBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path></svg>';
      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showColorPicker(tab, card);
      });
      buttonsContainer.appendChild(colorBtn);
    }

    if (!isFavorite) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'lgs-tab-action is-remove';
      removeBtn.title = 'Удалить';
      removeBtn.setAttribute('aria-label', 'Удалить из недавних');
      removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.removeTab(tab.id)) {
          card.remove();
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

  showColorPicker(tab, card) {
    document.querySelectorAll('.lan-search-color-picker, .lgs-tabs-picker-overlay').forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'lgs-tabs-picker-overlay';

    const picker = document.createElement('div');
    picker.className = 'lan-search-color-picker lgs-tabs-picker';
    picker.innerHTML = `
      <h3 class="lgs-tabs-picker-title">Цвет избранной вкладки</h3>
      <div class="lgs-tabs-picker-grid"></div>
      <button type="button" class="lgs-tabs-picker-close">Закрыть</button>
    `;

    const colorsGrid = picker.querySelector('.lgs-tabs-picker-grid');

    const noColorBtn = document.createElement('button');
    noColorBtn.type = 'button';
    noColorBtn.className = 'lgs-tabs-picker-none';
    noColorBtn.textContent = 'Без цвета';
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

    this.availableColors.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.type = 'button';
      colorBtn.className = 'lgs-tabs-picker-swatch';
      colorBtn.title = color.name;
      colorBtn.style.setProperty('--swatch', color.value);
      colorBtn.style.setProperty('--swatch-bg', color.bg);
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
      colorsGrid.appendChild(colorBtn);
    });

    picker.querySelector('.lgs-tabs-picker-close').addEventListener('click', () => {
      picker.remove();
      overlay.remove();
    });

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
    if (theme === 'dark' || theme === 'amoled') {
      // Применяем темную тему ко всем элементам, которые могут быть добавлены динамически
      const elementsToStyle = document.querySelectorAll(`
        .content-wrapper, .main-content, .container-fluid, .container,
        .wrapper, .page-wrapper, .app-wrapper, .main, .content, .section,
        .panel, .block, .box, .sidebar-wrapper, .nav-wrapper, .menu-wrapper,
        .footer, .footer-wrapper, .header, .header-wrapper,
        .card, .card-header, .form-control, .form-select, .btn-light,
        .navbar, .dropdown-menu, .modal-content, .modal-header, .modal-footer,
        .table, .list-group-item, .alert-light, .badge-light, .alert-info,
        .progress, .page-link, .tooltip-inner, .popover, .popover-header,
        .popover-body, select.form-control, select.form-select, .form-check-input,
        textarea.form-control, .bg-light, .bg-white, .text-dark, .text-muted,
        .dt-container, .dt-input, .dt-paging-button,
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
            // container-fluid в шапке — тот же цвет, иначе полоски
            const inHeader = element.closest('#js-header, .header, .header-wrapper, .layout__header');
            const amoled = document.documentElement.classList.contains('lgs-amoled');
            element.style.backgroundColor = amoled
              ? '#000000'
              : (inHeader ? 'var(--bg-secondary)' : 'var(--bg-color)');
            if (amoled) {
              element.style.setProperty('background-color', '#000000', 'important');
            }
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
          element.style.borderColor = 'transparent';
        }
        
        if (element.classList.contains('card')) {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.borderColor = 'var(--border-color)';
        }
        
        if (element.classList.contains('form-control') || element.classList.contains('form-select') || element.tagName === 'SELECT') {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.borderColor = 'var(--border-color)';
          element.style.color = 'var(--text-color)';
        }

        if (element.classList.contains('alert-info')) {
          element.style.backgroundColor = 'color-mix(in srgb, #17a2b8 18%, var(--bg-color))';
          element.style.borderColor = 'color-mix(in srgb, #17a2b8 35%, transparent)';
          element.style.color = 'var(--text-color)';
        }

        if (element.classList.contains('dt-container')) {
          element.style.backgroundColor = 'var(--bg-secondary)';
          element.style.color = 'var(--text-color)';
        }

        if (element.classList.contains('dt-input')) {
          element.style.backgroundColor = 'var(--bg-color)';
          element.style.borderColor = 'var(--border-color)';
          element.style.color = 'var(--text-color)';
        }

        if (element.classList.contains('dt-paging-button')) {
          element.style.backgroundColor = 'var(--bg-color)';
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

          // Стили для ячеек таблиц (td) — не затираем цветные строки лога баланса
          if (element.tagName === 'TD' && 
              (element.closest('#dataTable tbody tr') || 
               element.closest('table.table tbody tr') || 
               element.closest('table.dataTable tbody tr'))) {
            const row = element.parentElement;
            if (row && (
              row.classList.contains('guests-log-balance__tr--refill') ||
              row.classList.contains('guests-log-balance__tr--withdraw')
            )) {
              // не затираем tint сайта inline-фоном
              element.style.removeProperty('background-color');
              element.style.removeProperty('background');
              element.style.color = 'var(--text-color)';
              element.style.borderColor = 'var(--border-color)';
            } else {
              element.style.backgroundColor = 'var(--bg-color)';
              element.style.borderColor = 'var(--border-color)';
              element.style.color = 'var(--text-color)';
            }
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
