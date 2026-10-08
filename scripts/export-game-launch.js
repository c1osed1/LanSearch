window.LanSearchScripts.run('export-game-launch', async () => {
    const U = window.LanSearchScripts, G = window.LanSearchGameLaunch;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/game-launch-common.js');
    const maps = await G.catalog();
    const all = await G.list(maps);
    const rows = [], skipped = [];
    for (const row of all) {
        (G.slots.some(slot => row[slot + '_id']) ? rows : skipped).push(row);
    }
    U.downloadCSV(G.toCSV(rows), 'game-launch-settings.csv');
    let message = `Выгружено настроек запуска игр: ${rows.length}. Пропущено без привязанных аккаунтов: ${skipped.length}. Проверены все ${all.length} записей доступного списка.`;
    if (skipped.length) {
        message += '\nБез привязанных аккаунтов:\n' + skipped.map((row, index) => `${index + 1}. ${row.name}`).join('\n');
    }
    U.notify(message);
    const status = document.getElementById('lansearch-script-status');
    if (status) {
        status.style.maxHeight = '70vh';
        status.style.overflowY = 'auto';
        status.style.overflowWrap = 'anywhere';
    }
    return message;
});
