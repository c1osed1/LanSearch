(function() {
  var params = new URLSearchParams(window.location.search);
  var token = params.get('token');
  var userStr = params.get('user');
  var statusEl = document.getElementById('status');
  if (token && userStr) {
    try {
      var user = JSON.parse(decodeURIComponent(userStr));
      chrome.storage.local.set({ wikiToken: token, wikiUser: user }, function() {
        statusEl.textContent = 'Авторизация успешна! Закройте вкладку.';
        statusEl.className = 'success';
        chrome.runtime.sendMessage({ type: 'LANSEARCH_AUTH_SUCCESS' });
        setTimeout(function() {
          chrome.tabs.getCurrent(function(tab) { if (tab && tab.id) chrome.tabs.remove(tab.id); });
        }, 1500);
      });
    } catch (e) {
      statusEl.textContent = 'Ошибка: неверные данные.';
      statusEl.className = 'error';
    }
  } else {
    statusEl.textContent = 'Ошибка: токен не получен.';
    statusEl.className = 'error';
  }
})();
