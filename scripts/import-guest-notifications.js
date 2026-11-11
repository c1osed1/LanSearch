window.LanSearchScripts.run('import-guest-notifications', async ({ files }) => {
    const U = window.LanSearchScripts, G = window.LanSearchGuestTransfer;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/guest-transfer-common.js');
    if (!files.csv) throw new Error('Выберите CSV уведомлений');
    const source = U.records(await files.csv.text(), G.notificationHeaders), report = [], candidates = [];
    const cache = new Map(), seen = new Set();
    // Complete preflight: collect all absent/ambiguous phones, not just the first.
    for (let i = 0; i < source.length; i++) {
        const row = source[i], number = i + 2, label = row.message_for_admin;
        try {
            const phones = G.validateNotification(row, { national: true }), key = G.fingerprint(row);
            if (seen.has(key)) throw new Error('Одинаковое уведомление повторяется в CSV');
            seen.add(key);
            const ids = [], errors = [];
            for (const phone of phones) {
                if (!cache.has(phone)) {
                    try { cache.set(phone, { id: await G.resolvePhone(phone) }); }
                    catch (error) { cache.set(phone, { error: error.message }); }
                }
                const result = cache.get(phone);
                if (result.error) errors.push(result.error); else ids.push(result.id);
            }
            if (new Set(ids).size !== ids.length) errors.push('Разные телефоны сопоставились с одним гостем');
            if (errors.length) throw new Error(errors.join('\n'));
            candidates.push({ row, number, ids, key });
        } catch (error) { report.push([number, label, 'required', 'Пропущено', error.message]); }
        U.notify(`Уведомления: проверено ${i + 1} из ${source.length}.`);
    }
    let created = 0, failed = 0;
    if (candidates.length) {
        const existing = new Set();
        // Do not resend an existing active message with the same full recipient set.
        // If destination history is unreadable, do not assume it is empty.
        try {
            const refs = await G.notificationList();
            for (const ref of refs) existing.add(G.fingerprint(await G.notification(ref)));
        } catch (error) {
            for (const item of candidates) report.push([item.number, item.row.message_for_admin, 'required', 'Не выполнялось', 'Не удалось проверить уведомления целевого сайта: ' + error.message]);
            G.showIssues(report, 'Уведомления: импорт не выполнен');
            return 'Импорт уведомлений не выполнен: не удалось проверить существующие записи. Создано: 0.' + G.report(report, 'guest-notifications-import-report.csv');
        }
        for (let i = 0; i < candidates.length; i++) {
            const item = candidates[i];
            if (existing.has(item.key)) {
                report.push([item.number, item.row.message_for_admin, 'required', 'Пропущено', 'Такое активное сообщение с теми же адресатами уже существует']);
                continue;
            }
            try {
                await G.sendNotification(item.row, item.ids);
                created++; existing.add(item.key);
                report.push([item.number, item.row.message_for_admin, 'required', 'Создано', 'Сервер подтвердил отправку; получателей: ' + item.ids.length]);
                U.notify(`Уведомления: создано ${created} из ${candidates.length}.`);
            } catch (error) {
                failed++;
                report.push([item.number, item.row.message_for_admin, 'required', 'Не подтверждено', error.message]);
                for (const rest of candidates.slice(i + 1)) report.push([rest.number, rest.row.message_for_admin, 'required', 'Не выполнялось', 'Остановлено после ошибки отправки; автоматического повтора нет']);
                break;
            }
        }
    }
    const skipped = report.filter(x => x[3] === 'Пропущено').length;
    G.showIssues(report.filter(x => x[3] !== 'Создано'), 'Уведомления: результаты импорта');
    return `Импорт уведомлений ${failed ? 'остановлен' : 'завершён'}. Создано: ${created}. Пропущено: ${skipped}. Ошибок: ${failed}.` +
        G.report(report, 'guest-notifications-import-report.csv') + '\nОбновите страницу /guests_notifications/.';
});
