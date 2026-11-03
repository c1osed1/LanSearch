/* document_start: класс Нового UI до первой отрисовки */
(function () {
  try {
    const host = (location.hostname || '').toLowerCase();
    if (
      host === 'msgtp.langame.ru'
      || host === 'msgpublic.langame.ru'
      || host.endsWith('.msgtp.langame.ru')
      || host.endsWith('.msgpublic.langame.ru')
    ) return;

    const isPcPage = (location.pathname || '').includes('/all_clubs_pc/');

    const apply = (newUi, newUiAllClubsPc) => {
      const root = document.documentElement;
      root.classList.toggle('lgs-new-ui', !!newUi);
      root.classList.toggle('lgs-new-ui-pc', !!(isPcPage && newUiAllClubsPc));
      try {
        localStorage.setItem('lanSearchNewUi', (!!newUi).toString());
        localStorage.setItem('lanSearchNewUiAllClubsPc', (!!newUiAllClubsPc).toString());
      } catch (_) {}
    };

    // мгновенно из localStorage — без ключа = включено (дефолт после установки)
    let newUi = true;
    let newUiAllClubsPc = true;
    try {
      const ui = localStorage.getItem('lanSearchNewUi');
      newUi = ui === null ? true : ui === 'true';
      const pc = localStorage.getItem('lanSearchNewUiAllClubsPc');
      newUiAllClubsPc = pc === null ? newUi : pc === 'true';
    } catch (_) {}
    apply(newUi, newUiAllClubsPc);

    // и сразу из chrome.storage (если localStorage устарел)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['newUi', 'newUiAllClubsPc'], function (result) {
          if (chrome.runtime && chrome.runtime.lastError) return;
          const n = result && result.newUi === undefined ? true : !!(result && result.newUi);
          const p = result && result.newUiAllClubsPc === undefined
            ? n
            : !!(result && result.newUiAllClubsPc);
          apply(n, p);
        });
      }
    } catch (_) {}
  } catch (_) {}
})();
