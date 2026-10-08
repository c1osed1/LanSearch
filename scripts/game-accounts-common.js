(() => {
    const headers = ['id', 'login', 'mail', 'password', 'type', 'admin_enabled', 'lk_enabled', 'output_is_disabled'];
    const flags = ['admin_enabled', 'lk_enabled', 'output_is_disabled'];
    const key = row => JSON.stringify([row.type, row.login.trim().toLowerCase()]);
    function parse(doc) {
        const table = doc.getElementById('js-acc-steam-table');
        if (!table) throw new Error('Не найдена таблица игровых аккаунтов /acc_steam/');
        const typeSelect = doc.querySelector('#js-add-account-modal select[name="type"]');
        if (!typeSelect) throw new Error('Не найден справочник типов игровых аккаунтов');
        const types = [...typeSelect.options].map(option => ({ value: option.value, label: option.textContent.trim() }));
        const rows = [];
        for (const row of table.querySelectorAll('tbody tr[data-id]')) {
            const item = { id: row.dataset.id };
            if (!/^\d+$/.test(item.id)) throw new Error('Некорректный ID в таблице аккаунтов');
            for (const name of ['login', 'mail', 'password', ...flags]) {
                const field = row.querySelector(`input[name="${name}"]`);
                if (!field || (flags.includes(name) && field.type !== 'checkbox')) throw new Error(`Не найдено поле ${name} в записи ${item.id}`);
                item[name] = flags.includes(name) ? field.checked : field.value;
            }
            const text = row.querySelector('[data-column="type"] .js-field')?.textContent.trim();
            const matches = types.filter(type => type.value === text || type.label === text);
            if (matches.length !== 1) throw new Error(`Не удалось определить тип аккаунта в записи ${item.id}`);
            item.type = matches[0].value;
            rows.push(item);
        }
        if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('В таблице повторяются ID аккаунтов');
        return { rows, types };
    }
    async function load() {
        const response = await window.LanSearchScripts.request('/acc_steam/', { cache: 'no-store' });
        return parse(new DOMParser().parseFromString(await response.text(), 'text/html'));
    }
    function readCSV(text) {
        const rows = window.LanSearchScripts.records(text, headers.filter(name => name !== 'id'));
        if (!rows.length) throw new Error('CSV не содержит игровых аккаунтов');
        return rows.map((row, i) => {
            const item = { record: i + 2 };
            for (const name of ['login', 'mail', 'password', 'type']) {
                if (!row[name].trim()) throw new Error(`Запись ${i + 2}: не заполнено поле ${name}`);
                item[name] = row[name];
            }
            for (const name of flags) {
                const value = row[name].trim().toLowerCase();
                if (!['true', 'false', '1', '0', 'on', 'off'].includes(value)) throw new Error(`Запись ${i + 2}: неверный флаг ${name}`);
                item[name] = ['true', '1', 'on'].includes(value);
            }
            return item;
        });
    }
    const toCSV = rows => [headers, ...rows.map(row => headers.map(name => row[name]))];
    function form(row, command, id, staging = false) {
        const body = new URLSearchParams({ command, login: row.login, mail: row.mail, password: row.password });
        if (command === 'insert') body.set('type', row.type);
        else body.set('id', id);
        // Unchecked HTML checkboxes are omitted by jQuery.serialize().
        if (!staging && row.admin_enabled) body.set('admin_enabled', 'on');
        if (!staging && row.lk_enabled) body.set('lk_enabled', 'on');
        if (command === 'update' && row.output_is_disabled) body.set('output_is_disabled', '1');
        return body;
    }
    async function post(body) {
        const command = body.get('command');
        let response;
        try {
            response = await window.LanSearchScripts.request('/acc_steam/crud.php', {
                method: 'POST', credentials: 'include',
                referrer: new URL('/acc_steam/', location.href).href,
                headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest', accept: 'application/json, text/javascript, */*; q=0.01' },
                body: body.toString()
            });
        } catch { throw new Error(`Ошибка запроса ${command}. Результат операции не подтверждён.`); }
        let data;
        try { data = await response.json(); } catch { throw new Error(`Команда ${command}: сервер вернул ответ не в формате JSON`); }
        // Never put response text in reports: a server may echo credentials.
        if (data?.status !== 'ok' && data?.status !== true) throw new Error(`Сервер не подтвердил команду ${command}`);
    }
    const same = (a, b) => ['login', 'mail', 'password', 'type', ...flags].every(name => a[name] === b[name]);
    window.LanSearchGameAccounts = { headers, flags, key, parse, load, readCSV, toCSV, form, post, same };
})();
