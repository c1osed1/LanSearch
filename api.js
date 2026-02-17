// API модуль для работы с backendwiki
class WikiAPI {
  constructor() {
    // Определяем базовый URL API
    // В расширении Chrome используем относительный путь или можно задать через настройки
    this.baseURL = this.getBaseURL();
  }

  getBaseURL() {
    // Пытаемся получить из localStorage
    const savedURL = localStorage.getItem('wikiApiUrl');
    if (savedURL) {
      return savedURL;
    }
    
    // В расширении Chrome window.location.origin возвращает chrome-extension://...
    // Поэтому используем явный URL по умолчанию
    return 'https://lantp.ru';
  }
  
  // Асинхронный метод для получения URL из активной вкладки (если нужно)
  async getBaseURLFromActiveTab() {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        
        if (tabs && tabs.length > 0 && tabs[0].url) {
          const url = new URL(tabs[0].url);
          return `${url.protocol}//${url.host}`;
        }
      }
    } catch (e) {
      console.error('Ошибка получения URL из вкладки:', e);
    }
    
    // Fallback на дефолтный URL
    return this.getBaseURL();
  }

  setBaseURL(url) {
    localStorage.setItem('wikiApiUrl', url);
    this.baseURL = url;
  }

  getToken() {
    return localStorage.getItem('wikiToken');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('wikiToken', token);
    } else {
      localStorage.removeItem('wikiToken');
    }
  }

  getUser() {
    const userStr = localStorage.getItem('wikiUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('wikiUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('wikiUser');
    }
  }

  async request(endpoint, options = {}) {
    // Убеждаемся, что baseURL установлен
    if (!this.baseURL || this.baseURL.startsWith('chrome-extension://')) {
      // Если URL не установлен или это chrome-extension, пытаемся получить из вкладки
      this.baseURL = await this.getBaseURLFromActiveTab();
    }
    
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Токен недействителен, очищаем данные
        this.setToken(null);
        this.setUser(null);
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }
      
      const error = await response.json().catch(() => ({
        detail: `Ошибка: ${response.status} ${response.statusText}`,
      }));
      
      throw new Error(error.detail || 'Произошла ошибка');
    }

    return response.json();
  }

  // SSO: авторизация через msgtp (лентинг из popup, токен сохраняется в callback.html)
  // Метод login удалён — используется только SSO.

  // Выход
  logout() {
    this.setToken(null);
    this.setUser(null);
  }

  // Проверка авторизации
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }

  // Получение информации о текущем пользователе
  async getCurrentUser() {
    return this.request('/api/me');
  }

  // Получение списка файлов Wiki (все файлы, избранные помечены флагом is_favorite)
  async getWikiFiles() {
    return this.request('/api/wiki/files');
  }

  // Получение только избранных файлов
  async getFavoriteFiles() {
    const files = await this.getWikiFiles();
    return files.filter(file => file.is_favorite === true);
  }

  // Генерация URL для скачивания файла
  getWikiFileDownloadUrl(fileId, filename) {
    if (filename) {
      // Создаем slug из имени файла
      const slug = filename
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      return `${this.baseURL}/download/wiki/${fileId}-${slug}`;
    }
    return `${this.baseURL}/api/wiki/files/${fileId}/download`;
  }

  // Генерация команды cmd для файла
  generateCmdCommand(file) {
    const url = this.getWikiFileDownloadUrl(file.id, file.original_filename);
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const filename = file.original_filename;
    return `cmd /c curl -L "${fullUrl}" -o "%TEMP%\\${filename}" && "%TEMP%\\${filename}"`;
  }

  // Скачивание файла
  async downloadFile(file) {
    const url = this.getWikiFileDownloadUrl(file.id, file.original_filename);
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Добавляем токен в заголовки если есть
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Открываем ссылку для скачивания
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = file.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Копирование команды в буфер обмена
  async copyCommand(file) {
    const command = this.generateCmdCommand(file);
    try {
      await navigator.clipboard.writeText(command);
      return true;
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = command;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (e) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }

  // Получение категорий
  async getCategories() {
    return this.request('/api/categories');
  }
}

// Создаем и экспортируем экземпляр API
const wikiAPI = new WikiAPI();

// Экспортируем для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WikiAPI, wikiAPI };
}

