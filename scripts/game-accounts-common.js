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
        // Accounts and the type dictionary moved to master_api; for_export=1 includes passwords.
        const U = window.LanSearchScripts;
        async function accounts() {
            const items = [];
            for (let page = 1; page <= 1000; page++) {
                const json = await U.masterApi(`/launcher-accounts/table?` + new URLSearchParams({ page: String(page), onpage: '100', for_export: '1' }));
                const batch = Array.isArray(json.items) ? json.items : null;
                if (!batch) throw new Error('Неожиданный формат списка игровых аккаунтов');
                items.push(...batch);
                const last = Number(json.pagination?.last_page);
                if (!batch.length || (Number.isFinite(last) && page >= last)) return items;
            }
            throw new Error('Превышено ограничение числа страниц игровых аккаунтов');
        }
        const [typesJson, list] = await Promise.all([U.masterApi('/launcher-types?visible=0&enabled=1'), accounts()]);
        const types = (Array.isArray(typesJson.items) ? typesJson.items : [])
            .map(item => ({ value: String(item.key ?? ''), label: String(item.name ?? item.key ?? '').trim() }))
            .filter(item => item.value && item.label);
        if (!types.length) throw new Error('master_api вернул пустой справочник типов аккаунтов');
        const rows = list.map(raw => {
            const item = { id: String(raw.id ?? '') };
            if (!/^\d+$/.test(item.id)) throw new Error('Некорректный ID в списке аккаунтов');
            for (const name of ['login', 'mail', 'password']) item[name] = String(raw[name] ?? '');
            for (const name of flags) item[name] = raw[name] === true;
            item.type = String(raw.type ?? '');
            if (!types.some(type => type.value === item.type)) throw new Error(`Неизвестный тип аккаунта в записи ${item.id}`);
            return item;
        });
        if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('В списке повторяются ID аккаунтов');
        return { rows, types };
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
    function bodyFor(row) {
        return { login: row.login, mail: row.mail, password: row.password, type: row.type,
            admin_enabled: !!row.admin_enabled, lk_enabled: !!row.lk_enabled };
    }
    async function create(row) {
        await window.LanSearchScripts.masterApi('/launcher-accounts', { method: 'POST', body: bodyFor(row) });
    }
    async function update(row, id) {
        await window.LanSearchScripts.masterApi(`/launcher-accounts/${encodeURIComponent(id)}`, { method: 'POST', body: bodyFor(row) });
    }
    async function setDisabled(id, disabled) {
        // The UI toggles "Отключён" via a dedicated endpoint, separately from create/update.
        await window.LanSearchScripts.masterApi(`/launcher-accounts/${encodeURIComponent(id)}/output-disabled`, {
            method: 'POST', body: { flag: !!disabled }
        });
    }
    const same = (a, b) => ['login', 'mail', 'password', 'type', ...flags].every(name => a[name] === b[name]);
    window.LanSearchGameAccounts = { headers, flags, key, parse, load, readCSV, toCSV, create, update, setDisabled, same };
})();
