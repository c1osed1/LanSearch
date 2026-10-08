window.LanSearchScripts.run('export-game-accounts', async () => {
    const U = window.LanSearchScripts, G = window.LanSearchGameAccounts;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/game-accounts-common.js');
    const { rows } = await G.load();
    U.downloadCSV(G.toCSV(rows), 'game-accounts.csv');
    return `Выгружено игровых аккаунтов: ${rows.length}. Файл game-accounts.csv содержит пароли.`;
});
