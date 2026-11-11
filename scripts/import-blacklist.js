window.LanSearchScripts.run('import-blacklist', async ({ files }) => {
    const U = window.LanSearchScripts, G = window.LanSearchGuestTransfer;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/guest-transfer-common.js');
    if (!files.csv) throw new Error('Выберите CSV чёрного списка');
    const source = U.records(await files.csv.text(), G.blacklistHeaders);
    const report = [], pending = [], seen = new Set();
    // Validate every CSV record before any mutation, including all ambiguous/invalid rows.
    for (let i = 0; i < source.length; i++) {
        const row = source[i], number = i + 2;
        try {
            const body = G.blacklistBody(row), key = body.phone + ':' + body.block_type;
            if (seen.has(key)) throw new Error('Телефон и тип повторяются в CSV');
            seen.add(key); pending.push({ row, number, body, key });
        } catch (error) { report.push([number, row.phone, row.block_type, 'Пропущено', error.message]); }
    }
    let created = 0, failed = 0;
    if (pending.length) {
        const existing = new Set();
        try {
            const current = await G.blacklist();
            for (const row of current) {
                // Do not silently ignore malformed phones while checking duplicates.
                existing.add(G.phone(row.phone) + ':' + row.block_type);
            }
        } catch (error) {
            for (const item of pending) report.push([item.number, item.body.phone, item.body.block_type, 'Не выполнялось', 'Не удалось проверить целевой чёрный список: ' + error.message]);
            G.showIssues(report, 'Чёрный список: импорт не выполнен');
            return 'Импорт чёрного списка не выполнен. Создано: 0.' + G.report(report, 'guest-blacklist-import-report.csv');
        }
        for (let i = 0; i < pending.length; i++) {
            const item = pending[i];
            if (existing.has(item.key)) {
                report.push([item.number, item.body.phone, item.body.block_type, 'Пропущено', 'Телефон уже есть в этом типе чёрного списка']);
                continue;
            }
            try {
                await G.createBlacklist(item.body);
                created++; existing.add(item.key);
                report.push([item.number, item.body.phone, item.body.block_type, 'Создано', 'Подтверждено сервером; модерация по правилам целевого сайта']);
                U.notify(`Чёрный список: создано ${created} из ${pending.length}.`);
            } catch (error) {
                failed++;
                report.push([item.number, item.body.phone, item.body.block_type, 'Не подтверждено', error.message]);
                for (const rest of pending.slice(i + 1)) report.push([rest.number, rest.body.phone, rest.body.block_type, 'Не выполнялось', 'Остановлено после ошибки записи; повторные запросы не отправлялись']);
                break;
            }
        }
    }
    const skipped = report.filter(x => x[3] === 'Пропущено').length;
    G.showIssues(report.filter(x => x[3] !== 'Создано'), 'Чёрный список: результаты импорта');
    return `Импорт чёрного списка ${failed ? 'остановлен' : 'завершён'}. Создано: ${created}. Пропущено: ${skipped}. Ошибок: ${failed}.` +
        G.report(report, 'guest-blacklist-import-report.csv') + '\nОбновите страницу /black_list_phone/.';
});
