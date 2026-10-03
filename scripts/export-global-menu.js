window.LanSearchScripts.run('export-global-menu', async () => {
    const U = window.LanSearchScripts, G = window.LanSearchGlobalMenu;
    if (!G) throw new Error('Не загружен модуль прав доступа. Обновите js/script-runner.js.');
    const rows = await G.load();
    U.downloadCSV(G.toCSV(rows), 'global-menu-rights.csv');
    return `Права выгружены: ${rows.length}. Основное меню: ${rows.filter(row => row.section === 'menu').length}. Дополнительные разрешения: ${rows.filter(row => row.section === 'other').length}.`;
});
