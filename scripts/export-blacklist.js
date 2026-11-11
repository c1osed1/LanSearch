window.LanSearchScripts.run('export-blacklist', async () => {
    const U = window.LanSearchScripts, G = window.LanSearchGuestTransfer;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/guest-transfer-common.js');
    const rows = await G.blacklist(), report = [];
    for (const row of rows) {
        try { G.blacklistBody(row); }
        catch (error) { report.push([row.source_id, row.phone, row.block_type, 'Нужна проверка перед импортом', error.message]); }
    }
    U.downloadCSV(G.toCSV(G.blacklistHeaders, rows), 'guest-blacklist.csv');
    G.showIssues(report, 'Чёрный список: записи, которые не пройдут импорт');
    return `Выгружено записей чёрного списка: ${rows.length}. Требуют проверки: ${report.length}.` +
        (report.length ? G.report(report, 'guest-blacklist-export-report.csv') : '') +
        '\nСрок block_duration — число суток; при создании на другом сайте он начинается заново. Исходные даты сохранены для справки.';
});
