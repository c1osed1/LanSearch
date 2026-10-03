window.LanSearchScripts.run('promocode-create', async ({ params }) => {
    const U = window.LanSearchScripts;
    const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('token_master_api='));
    const token = cookie ? decodeURIComponent(cookie.slice('token_master_api='.length)) : '';
    if (!token) throw new Error('На странице клуба не найден token_master_api');
    const count = U.number(params.count, 'Количество промокодов', { integer: true, min: 1 });
    const length = U.number(params.code_length, 'Длина промокода', { integer: true, min: 1 });
    const amount = U.number(params.amount, 'Сумма', { min: 0 });
    if (length > 256) throw new Error('Длина промокода не должна превышать 256 символов');
    if (count > 36 ** Math.min(length, 10)) throw new Error('Количество превышает число уникальных кодов выбранной длины');
    function date(value, end = false) {
        const text = String(value || '').replace('T', ' ');
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(text)) throw new Error('Неверный формат даты');
        const normalized = text.length === 16 ? text + (end ? ':59' : ':00') : text;
        const parsed = new Date(normalized.replace(' ', 'T'));
        if (!Number.isFinite(parsed.getTime()) || parsed.getFullYear() !== Number(text.slice(0, 4)) ||
            parsed.getMonth() + 1 !== Number(text.slice(5, 7)) || parsed.getDate() !== Number(text.slice(8, 10))) throw new Error('Некорректная дата');
        return normalized;
    }
    const start = date(params.date_start), end = date(params.date_end, true);
    if (start > end) throw new Error('Дата окончания раньше даты начала');
    const clubIds = String(params.internal_club_ids).split(',').map(id => U.number(id, 'ID клуба', { integer: true, min: 1 }));
    const base = {
        amount, is_money: params.is_money, is_multi: params.is_multi, is_first: params.is_first,
        active: params.active, date_start: start, date_end: end, only_register: params.only_register,
        activate_comment: params.activate_comment || '',
        burn_hours: params.burn_hours === '' || params.burn_hours == null ? null : U.number(params.burn_hours, 'Срок сгорания', { min: 0 }),
        available_lk: params.available_lk, available_mp: params.available_mp, internal_club_ids: [...new Set(clubIds)]
    };
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const used = new Set();
    function code() {
        // Rejection sampling avoids modulo bias; enforce uniqueness within this batch.
        for (let attempt = 0; attempt < 10000; attempt++) {
            let result = '';
            while (result.length < length) {
                for (const byte of crypto.getRandomValues(new Uint8Array(Math.min(length * 2, 512)))) {
                    if (byte < 252 && result.length < length) result += chars[byte % 36];
                }
            }
            if (!used.has(result)) { used.add(result); return result; }
        }
        throw new Error('Не удалось подобрать уникальный код. Увеличьте длину.');
    }
    const created = [];
    let failure = null;
    let unconfirmedCode = '';
    for (let i = 0; i < count; i++) {
        let value = '';
        try {
            value = code();
            await U.api('/master_api/domain-promocodes', {
                method: 'POST', headers: { accept: '*/*', 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-requested-with': 'XMLHttpRequest', 'x-language': 'ru' },
                body: JSON.stringify({ ...base, code: value, name: value })
            });
            created.push({ name: value, start, end, amount, unit: base.is_money ? 'руб.' : 'бонусов' });
            U.notify(`Создание промокодов: ${created.length}/${count}`);
        } catch (error) {
            failure = error;
            unconfirmedCode = value;
            break;
        }
    }
    const displayDate = value => `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)} ${value.slice(11)}`;
    const lines = [
        `${failure ? 'Создание остановлено' : 'Создание завершено'}. Создано промокодов: ${created.length}/${count}.`,
        `Начало действия: ${displayDate(start)}`,
        `Завершение действия: ${displayDate(end)}`,
        `Начисление: ${amount.toLocaleString('ru-RU')} ${base.is_money ? 'руб.' : 'бонусов'}`,
        'Названия созданных промокодов:',
        ...created.map((item, index) => `${index + 1}. ${item.name}`)
    ];
    if (!created.length) lines.push('Нет подтверждённых созданий.');
    if (failure) {
        lines.push(`Причина остановки: ${failure.message || String(failure)}`);
        if (unconfirmedCode) lines.push(`Создание ${unconfirmedCode} не подтверждено. Проверьте его на сайте перед повторным запуском.`);
    }
    if (created.length) {
        try {
            U.downloadCSV([
                ['Название', 'Начало действия', 'Завершение действия', 'Сумма начисления', 'Единица'],
                ...created.map(item => [item.name, item.start, item.end, item.amount, item.unit])
            ], 'created-promocodes.csv');
            lines.push('Список также выгружен в created-promocodes.csv (скачивание запрошено).');
        } catch {
            lines.push('Не удалось скачать CSV. Список созданных промокодов приведён выше.');
        }
    }
    const summary = lines.join('\n');
    U.notify(summary);
    // Keep a long batch readable in the existing status panel.
    const status = document.getElementById('lansearch-script-status');
    if (status) {
        status.style.maxHeight = '70vh';
        status.style.overflowY = 'auto';
        status.style.overflowWrap = 'anywhere';
    }
    if (failure) throw new Error(summary);
    return summary;
});
