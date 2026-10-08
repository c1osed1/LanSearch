window.LanSearchScripts.run('import-game-launch', async ({ files }) => {
    const U = window.LanSearchScripts, G = window.LanSearchGameLaunch;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/game-launch-common.js');
    if (!files.csv) throw new Error('Выберите CSV настроек запуска игр');
    const source = G.readCSV(await files.csv.text());
    const maps = await G.catalog();
    const plan = G.plan(source, maps);
    const report = plan.filter(entry => entry.reason).map(entry => [entry.row.record, entry.row.name, entry.row.game, '', 'Пропущено', entry.reason]);
    const pending = plan.filter(entry => !entry.reason);
    let completed = 0, failed = 0, notAttempted = 0;
    for (let i = 0; i < pending.length; i++) {
        const entry = pending[i];
        let sent = false;
        try {
            let current = await G.list(maps);
            const before = new Set(current.map(row => row.id));
            sent = true;
            await G.api('/game-accounts', { method: 'POST', body: JSON.stringify(entry.body) });
            current = await G.list(maps);
            const matches = current.filter(row => !before.has(row.id) && G.same(row, entry.body));
            if (matches.length !== 1) throw new Error('Новая настройка или порядок аккаунтов не подтвердились при повторном чтении');
            completed++;
            report.push([entry.row.record, entry.row.name, entry.row.game, matches[0].id, 'Создано и проверено', '']);
            U.notify(`Настройки запуска: перенесено ${completed}/${pending.length}.`);
            await U.wait(300);
        } catch (error) {
            failed++;
            report.push([entry.row.record, entry.row.name, entry.row.game, '', sent ? 'Создание не подтверждено' : 'Ошибка до создания', error.message || 'Ошибка переноса']);
            for (const remaining of pending.slice(i + 1)) {
                notAttempted++;
                report.push([remaining.row.record, remaining.row.name, remaining.row.game, '', 'Не выполнялось', 'Импорт остановлен после ошибки']);
            }
            break;
        }
    }
    const skipped = report.filter(row => row[4] === 'Пропущено').length;
    let message = `Импорт настроек запуска ${failed ? 'остановлен' : 'завершён'}. Создано и проверено: ${completed}. Пропущено: ${skipped}. Ошибок: ${failed}. Не выполнялось: ${notAttempted}.`;
    try {
        U.downloadCSV([['Запись CSV', 'Название', 'Игра', 'ID назначения', 'Результат', 'Причина'], ...report], 'game-launch-import-report.csv');
        message += '\nОтчёт: game-launch-import-report.csv (скачивание запрошено).';
    } catch {
        console.table(report);
        message += '\nНе удалось скачать отчёт. Результаты в консоли.';
    }
    if (failed) message += '\nПроверьте последнюю запись на сайте перед повтором: автоматического повторения POST нет.';
    return message + '\nОбновите страницу /games_accounts_config/.';
});
