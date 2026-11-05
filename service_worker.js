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

// Обработчик клика по иконке расширения
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  if (isLanSearchExcludedUrl(tab.url)) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch (e) {
    console.error("Global Menu Search: inject error", e);
  }
});

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
    const response = await fetch('https://api.github.com/repos/c1osed1/LanSearch/commits?per_page=1');
    
    if (!response.ok) {
      console.error('Ошибка проверки обновлений:', response.status);
      return;
    }
    
    const commits = await response.json();
    
    if (commits.length === 0) {
      return;
    }
    
    const latestCommit = commits[0];
    const latestCommitSha = latestCommit.sha.substring(0, 7);
    const commitMessage = latestCommit.commit.message.split('\n')[0];
    const latestVersion = extractVersionFromCommit(commitMessage);
    
    // Получаем текущую версию расширения
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    // Получаем сохраненную информацию
    const stored = await chrome.storage.local.get(['lastKnownCommit', 'updateNotificationShown', 'currentVersion']);
    
    // Проверяем, есть ли новая версия
    let hasNewVersion = false;
    
    if (latestVersion) {
      // Всегда сравниваем с текущей версией из manifest
      hasNewVersion = compareVersions(latestVersion, currentVersion) > 0;
    }
    
    if (hasNewVersion && !stored.updateNotificationShown) {
      // Показываем уведомление о новом обновлении
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/logo48.png',
        title: `Lan-Search: Доступна версия ${latestVersion}!`,
        message: `Текущая версия: ${currentVersion}\nНовая версия: ${latestVersion}\n${commitMessage}`,
        buttons: [
          { title: 'Скачать' },
          { title: 'Позже' }
        ]
      });
      
      // Сохраняем информацию о показанном уведомлении
      await chrome.storage.local.set({ 
        'updateNotificationShown': true,
        'lastKnownCommit': {
          sha: latestCommitSha,
          version: latestVersion,
          message: commitMessage
        }
      });
    } else if (!stored.lastKnownCommit) {
      // Первый запуск - сохраняем информацию о коммите
      await chrome.storage.local.set({
        'lastKnownCommit': {
          sha: latestCommitSha,
          version: latestVersion,
          message: commitMessage
        }
      });
    }
    
  } catch (error) {
    console.error('Ошибка проверки обновлений:', error);
  }
}

// Обработчик уведомлений
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // Кнопка "Скачать"
    chrome.tabs.create({ url: 'https://github.com/c1osed1/LanSearch/archive/refs/heads/main.zip' });
  }
  // Удаляем уведомление
  chrome.notifications.clear(notificationId);
});

// Обработчик сообщений от content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Убираем попытку изменения заголовка вкладки, так как это не поддерживается в Chrome Extensions API
  // Заголовок вкладки изменяется только в content script через document.title
});

// После установки — тёмная тема + Новый UI + скрытие шума на ПК по умолчанию
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return;

  chrome.storage.sync.get([
    'theme', 'newUi', 'newUiAllClubsPc',
    'hideCheckboxes', 'hideComments', 'hideRemoteDownload'
  ], (result) => {
    const defaults = {};
    if (result.theme === undefined) defaults.theme = 'dark';
    if (result.newUi === undefined) defaults.newUi = true;
    if (result.newUiAllClubsPc === undefined) defaults.newUiAllClubsPc = true;
    if (result.hideCheckboxes === undefined) defaults.hideCheckboxes = true;
    if (result.hideComments === undefined) defaults.hideComments = true;
    if (result.hideRemoteDownload === undefined) defaults.hideRemoteDownload = true;
    if (Object.keys(defaults).length) {
      chrome.storage.sync.set(defaults);
    }
  });
});

// /all_clubs_pc/: нативный обход bsConfirm — locale.skipOneConfirm (MAIN world)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'lgsSetSkipOneConfirm') return;
  const tabId = sender.tab && sender.tab.id;
  if (!tabId) {
    sendResponse({ ok: false });
    return false;
  }
  const enabled = !!message.enabled;
  chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    args: [enabled],
    func: (en) => {
      const apply = () => {
        try {
          if (window.locale) window.locale.skipOneConfirm = !!en;
        } catch (_) {}
      };
      apply();
      if (en) {
        if (!window.__lgsSkipConfirmTimer) {
          window.__lgsSkipConfirmTimer = setInterval(apply, 1500);
        }
      } else if (window.__lgsSkipConfirmTimer) {
        clearInterval(window.__lgsSkipConfirmTimer);
        window.__lgsSkipConfirmTimer = null;
      }
    }
  }).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
  return true;
});

// Проверяем обновления при запуске расширения 
checkForUpdates();

// Проверяем обновления каждые 6 часов
setInterval(checkForUpdates, 6 * 60 * 60 * 1000); 