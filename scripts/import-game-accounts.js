window.LanSearchScripts.run('import-game-accounts', async ({ files }) => {
    const U = window.LanSearchScripts, G = window.LanSearchGameAccounts;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/game-accounts-common.js');
    if (!files.csv) throw new Error('Выберите CSV игровых аккаунтов');
    const source = G.readCSV(await files.csv.text());
    let current = await G.load();
    const existing = new Map(current.rows.map(item => [G.key(item), item]));
    const types = new Set(current.types.map(type => type.value));
    const occurrences = new Map();
    for (const row of source) occurrences.set(G.key(row), (occurrences.get(G.key(row)) || 0) + 1);
    const report = [], pending = [];
    for (const row of source) {
        const id = G.key(row);
        let reason = '';
        if (!types.has(row.type)) reason = 'Тип аккаунта отсутствует на целевом сайте';
        else if (occurrences.get(id) > 1) reason = 'Логин и тип повторяются в CSV';
        if (reason) report.push([row.record, row.login, row.type, '', 'Пропущено', reason]);
        else pending.push({ row, target: existing.get(id) || null });
    }
    let created = 0, updated = 0, completed = 0, failed = 0, notAttempted = 0;
    for (let i = 0; i < pending.length; i++) {
        const { row, target } = pending[i];
        let inserted = false, targetId = target?.id || '';
        try {
            if (target) {
                // Existing account: sync differing fields instead of skipping.
                if (target.output_is_disabled !== row.output_is_disabled) {
                    await G.setDisabled(targetId, row.output_is_disabled);
                }
                if (!G.same(target, row)) {
                    await G.update(row, targetId);
                }
                current = await G.load();
                const verified = current.rows.find(item => item.id === targetId);
                if (!verified || !G.same(verified, row)) throw new Error('Итоговые данные или флаги аккаунта отличаются от CSV');
                updated++;
                completed++;
                report.push([row.record, row.login, row.type, targetId, 'Обновлено и проверено', '']);
            } else {
                // Recheck before insert to avoid duplicates introduced after preflight.
                current = await G.load();
                if (current.rows.some(item => G.key(item) === G.key(row))) {
                    report.push([row.record, row.login, row.type, '', 'Пропущено', 'Аккаунт появился после начала импорта']);
                    continue;
                }
                const beforeIds = new Set(current.rows.map(item => item.id));
                await G.create(row);
                inserted = true;
                created++;
                current = await G.load();
                const matches = current.rows.filter(item => G.key(item) === G.key(row));
                if (matches.length !== 1 || beforeIds.has(matches[0].id)) throw new Error('Не удалось однозначно определить ID новой записи. Проверьте аккаунт на сайте.');
                let fresh = matches[0];
                targetId = fresh.id;
                if (fresh.login !== row.login || fresh.mail !== row.mail || fresh.password !== row.password) throw new Error('Данные новой записи отличаются от CSV. Проверьте аккаунт на сайте.');
                if (fresh.output_is_disabled !== row.output_is_disabled) {
                    await G.setDisabled(targetId, row.output_is_disabled);
                    current = await G.load();
                    fresh = current.rows.find(item => item.id === targetId);
                    if (!fresh || fresh.output_is_disabled !== row.output_is_disabled) throw new Error('Состояние «Отключён» не подтвердилось после сохранения');
                }
                if (!G.same(fresh, row)) {
                    await G.update(row, targetId);
                    current = await G.load();
                    fresh = current.rows.find(item => item.id === targetId);
                    if (!fresh || !G.same(fresh, row)) throw new Error('Итоговые данные или флаги аккаунта отличаются от CSV');
                }
                completed++;
                report.push([row.record, row.login, row.type, targetId, 'Создано и проверено', '']);
            }
            U.notify(`Игровые аккаунты: обработано ${completed}/${pending.length}.`);
            await U.wait(300);
        } catch (error) {
            failed++;
            // Errors contain field names only, never passwords or raw server responses.
            report.push([row.record, row.login, row.type, targetId, inserted ? 'Создано; перенос не завершён' : 'Не подтверждено', error.message || 'Ошибка переноса']);
            for (const remaining of pending.slice(i + 1)) {
                notAttempted++;
                report.push([remaining.row.record, remaining.row.login, remaining.row.type, '', 'Не выполнялось', 'Импорт остановлен после ошибки']);
            }
            break;
        }
    }
    const totalSkipped = report.filter(row => row[4] === 'Пропущено').length;
    let message = `Импорт игровых аккаунтов ${failed ? 'остановлен' : 'завершён'}. Создано: ${created}. Обновлено: ${updated}. Полностью перенесено: ${completed}. Пропущено: ${totalSkipped}. Ошибок: ${failed}. Не выполнялось: ${notAttempted}.`;
    try {
        U.downloadCSV([['Запись CSV', 'Логин', 'Тип', 'ID назначения', 'Результат', 'Причина'], ...report], 'game-accounts-import-report.csv');
        message += '\nОтчёт: game-accounts-import-report.csv (скачивание запрошено).';
    } catch {
        console.table(report);
        message += '\nНе удалось скачать отчёт. Результаты в консоли.';
    }
    if (failed) message += '\nПроверьте последнюю запись на сайте перед повтором: автоматического повторения создания нет.';
    return message + '\nОбновите страницу /acc_steam/.';
});
