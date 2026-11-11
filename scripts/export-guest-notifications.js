window.LanSearchScripts.run('export-guest-notifications', async () => {
    const U = window.LanSearchScripts, G = window.LanSearchGuestTransfer;
    if (!G) throw new Error('Обновите js/script-runner.js и scripts/guest-transfer-common.js');
    const refs = await G.notificationList(), rows = [], report = [];
    for (const ref of refs) {
        try { rows.push(await G.notification(ref)); }
        catch (error) { report.push([ref.id, ref.label, ref.type, 'Пропущено', error.message]); }
        U.notify(`Уведомления: обработано ${rows.length + report.length} из ${refs.length}.`);
    }
    U.downloadCSV(G.toCSV(G.notificationHeaders, rows), 'guest-notifications.csv');
    G.showIssues(report, 'Уведомления: пропущенные при экспорте записи');
    return `Выгружено активных обязательных уведомлений: ${rows.length}. Пропущено: ${report.length}.` +
        (report.length ? G.report(report, 'guest-notifications-export-report.csv') : '');
});
