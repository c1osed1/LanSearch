window.LanSearchScripts.run('import-global-menu', async ({ files, params = {} }) => {
    const U = window.LanSearchScripts, G = window.LanSearchGlobalMenu;
    if (!G) throw new Error('Не загружен модуль прав доступа. Обновите js/script-runner.js.');
    if (!files.csv) throw new Error('Выберите CSV с правами доступа');
    const source = G.readCSV(await files.csv.text());
    const target = await G.load();
    const plan = G.plan(source, target);
    const updates = plan.filter(entry => !entry.reason && !entry.unchanged);
    const unchanged = plan.filter(entry => !entry.reason && entry.unchanged).length;
    const issues = plan.filter(entry => entry.reason).map(entry => [entry.row.record, entry.row.section, entry.row.name, 'Пропущено', entry.reason]);
    const skipped = issues.length;
    if (params.preview_only === true) {
        U.downloadCSV([
            ['Запись CSV', 'Раздел', 'Объект', 'ID назначения', 'Роли сейчас', 'Роли из CSV', 'Результат проверки'],
            ...plan.map(entry => [entry.row.record, entry.row.section, entry.row.name, entry.item?.id || '',
                entry.item ? JSON.stringify(entry.item.roles.filter(role => role.selected).map(role => role.name)) : '',
                JSON.stringify(entry.row.roles), entry.reason || (entry.unchanged ? 'Уже совпадает' : 'Будет изменено')])
        ], 'global-menu-import-plan.csv');
        return `Проверка завершена без изменения прав. Будет изменено: ${updates.length}. Уже совпадают: ${unchanged}. Пропущено: ${skipped}. План: global-menu-import-plan.csv (скачивание запрошено).`;
    }
    // Save the target's current settings before any changes.
    if (updates.length) U.downloadCSV(G.toCSV(target), 'global-menu-rights-before-import.csv');
    let completed = 0, failed = 0, notAttempted = 0;
    for (let i = 0; i < updates.length; i++) {
        const entry = updates[i];
        try {
            await G.save(entry);
            completed++;
            U.notify(`Перенос прав: ${completed}/${updates.length}. Пропущено: ${skipped}. Уже совпадают: ${unchanged}.`);
            await U.wait(200);
        } catch (error) {
            failed++;
            issues.push([entry.row.record, entry.row.section, entry.row.name, 'Ошибка', error.message || String(error)]);
            for (const remaining of updates.slice(i + 1)) {
                notAttempted++;
                issues.push([remaining.row.record, remaining.row.section, remaining.row.name, 'Не выполнялось', 'Импорт остановлен после ошибки сохранения']);
            }
            break;
        }
    }
    let message = `Перенос прав ${failed ? 'остановлен' : 'завершён'}. Сохранено: ${completed}. Уже совпадали: ${unchanged}. Пропущено: ${skipped}. Ошибок: ${failed}. Не выполнялось: ${notAttempted}.`;
    if (updates.length) message += '\nРезервная копия: global-menu-rights-before-import.csv (скачивание запрошено).';
    if (issues.length) {
        try {
            U.downloadCSV([['Запись CSV', 'Раздел', 'Объект', 'Статус', 'Причина'], ...issues], 'global-menu-import-report.csv');
            message += '\nПодробности: global-menu-import-report.csv (скачивание запрошено).';
        } catch {
            console.table(issues);
            message += '\nНе удалось скачать отчёт. Подробности в консоли.';
        }
    }
    return message + '\nОбновите страницу /global_menu/, чтобы увидеть сохранённые права.';
});
