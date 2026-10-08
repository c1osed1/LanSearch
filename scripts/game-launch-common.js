(() => {
    const slots = ['first_launcher', 'second_launcher', 'third_launcher'];
    const headers = ['id', 'name', 'app_id', 'game', 'game_id', 'launcher_type', ...slots.flatMap(slot => [slot, slot + '_id'])];
    const norm = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    const absent = value => value == null || String(value).trim() === '' || String(value) === '-1';
    const id = value => {
        const text = String(value ?? '').trim();
        if (!/^\d+$/.test(text)) throw new Error('Неожиданный ID в ответе списка настроек запуска');
        return text;
    };
    function token() {
        const cookies = document.cookie.split(';').map(part => part.trim());
        for (const name of ['token_master_api', 'token']) {
            const part = cookies.find(value => value.startsWith(name + '='));
            if (part) return decodeURIComponent(part.slice(name.length + 1));
        }
        const value = localStorage.getItem('token_master_api') || localStorage.getItem('token');
        if (!value) throw new Error('На странице клуба не найден токен Master API');
        return value;
    }
    function parseCatalog(doc) {
        const table = doc.getElementById('js-games-accounts-config-table');
        if (!table) throw new Error('Не найдена таблица настройки запуска игр');
        let config;
        try { config = JSON.parse(table.getAttribute('data-server-side-config')); }
        catch { throw new Error('Не удалось прочитать справочники настройки запуска игр'); }
        const maps = config?.selectOptionsMap;
        for (const field of ['game_id', 'launcher_type', ...slots.map(slot => slot + '_id')]) {
            if (!maps?.[field] || typeof maps[field] !== 'object' || Array.isArray(maps[field])) throw new Error(`Не найден справочник ${field}`);
        }
        return maps;
    }
    async function catalog() {
        const response = await window.LanSearchScripts.request('/games_accounts_config/', { cache: 'no-store' });
        return parseCatalog(new DOMParser().parseFromString(await response.text(), 'text/html'));
    }
    function cell(html) {
        const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
        const select = doc.querySelector('select');
        if (select) return { value: select.value, label: select.selectedOptions[0]?.textContent.trim() || '' };
        const input = doc.querySelector('input');
        if (input) return { value: input.value, label: input.value };
        const text = doc.body.textContent.trim();
        return { value: text, label: text };
    }
    function normalizeRow(source, maps) {
        let row;
        if (Array.isArray(source)) {
            if (source.length < 8) throw new Error('Неполная строка списка настроек запуска');
            const cells = source.slice(0, 7).map(cell);
            row = { id: source[7], name: cells[0].value, game_id: cells[1].value,
                game: cells[1].label, launcher_type: cells[2].value, app_id: cells[3].value };
            slots.forEach((slot, index) => { row[slot + '_id'] = cells[index + 4].value; row[slot] = cells[index + 4].label; });
        } else {
            if (!source || typeof source !== 'object') throw new Error('Неожиданный формат строки настройки запуска');
            row = { ...source };
            if (Array.isArray(source.launchers)) {
                // The relation list is authoritative, including slots that are absent.
                slots.forEach(slot => { row[slot + '_id'] = ''; row[slot] = ''; });
                const priorities = new Set();
                for (const launcher of source.launchers) {
                    const priority = Number(launcher.priority);
                    if (!Number.isInteger(priority) || priority < 0 || priority >= slots.length || priorities.has(priority)) throw new Error('Некорректные приоритеты аккаунтов в ответе сервера');
                    priorities.add(priority);
                    row[slots[priority] + '_id'] = launcher.launcher_id;
                }
            }
        }
        row.id = id(row.id);
        row.name = String(row.name ?? '').trim();
        row.app_id = String(row.app_id ?? '');
        row.game_id = id(row.game_id);
        row.launcher_type = String(row.launcher_type ?? '');
        if (!row.name || !Object.hasOwn(maps.launcher_type, row.launcher_type)) throw new Error(`Некорректное название или тип лаунчера в записи ${row.id}`);
        row.game = String(maps.game_id[row.game_id] ?? row.game ?? '').trim();
        if (!row.game) throw new Error(`Не найдено название игры в записи ${row.id}`);
        for (const slot of slots) {
            const value = row[slot + '_id'];
            if (absent(value)) { row[slot + '_id'] = ''; row[slot] = ''; }
            else {
                row[slot + '_id'] = id(value);
                row[slot] = String(maps[slot + '_id'][row[slot + '_id']] ?? row[slot] ?? '').trim();
                if (!row[slot]) throw new Error(`Не найдено название аккаунта ${slot} в записи ${row.id}`);
            }
        }
        // Keep unlinked records in the full list so pagination and new-ID verification stay correct.
        return row;
    }
    async function api(path, options = {}) {
        const response = await window.LanSearchScripts.request('/master_api' + path, {
            ...options, credentials: 'include', cache: 'no-store',
            referrer: new URL('/games_accounts_config/', location.href).href,
            headers: { accept: '*/*', 'content-type': 'application/json', language: 'ru', authorization: 'Bearer ' + token() }
        });
        const text = await response.text();
        let data;
        if (!text.trim() && options.method === 'POST') return null;
        try { data = JSON.parse(text); } catch { throw new Error('Master API вернул ответ не в формате JSON'); }
        if (data && typeof data === 'object' && (data.success === false || data.ok === false || data.status === false ||
            data.status === 'error' || data.error || data.error_message || (Array.isArray(data.errors) && data.errors.length))) {
            throw new Error('Master API сообщил об ошибке операции');
        }
        return data;
    }
    async function list(maps) {
        const result = [], seen = new Set();
        let total = null, start = 0;
        for (let page = 0; page < 10000; page++) {
            const query = new URLSearchParams({ draw: String(page + 1), start: String(start), length: '25',
                'search[value]': '', 'search[regex]': 'false', 'order[0][column]': '1', 'order[0][dir]': 'desc' });
            const response = await api('/game-accounts/datatable?' + query);
            const count = Number(response?.recordsFiltered ?? response?.recordsTotal);
            if (!Array.isArray(response?.data) || !Number.isInteger(count) || count < 0) throw new Error('Неожиданный формат списка настроек запуска');
            if (total === null) total = count;
            else if (total !== count) throw new Error('Количество записей изменилось во время выгрузки. Повторите запуск.');
            for (const raw of response.data) {
                const row = normalizeRow(raw, maps);
                if (seen.has(row.id)) throw new Error('Сервер повторил запись между страницами. Неполная выгрузка отменена.');
                seen.add(row.id); result.push(row);
            }
            if (result.length === total) return result;
            if (result.length > total || !response.data.length) throw new Error('Не удалось получить полный список настроек запуска');
            start += response.data.length;
        }
        throw new Error('Превышено ограничение числа страниц настроек запуска');
    }
    const toCSV = rows => [headers, ...rows.map(row => headers.map(field => row[field] ?? ''))];
    function readCSV(text) {
        const rows = window.LanSearchScripts.records(text, ['name', 'app_id', 'game', 'launcher_type', ...slots]);
        if (!rows.length) throw new Error('CSV не содержит настроек запуска');
        return rows.map((row, index) => {
            const item = { record: index + 2 };
            for (const field of ['name', 'app_id', 'game', 'launcher_type', ...slots]) item[field] = row[field].trim();
            if (!item.name || !item.game || !item.launcher_type || !slots.some(slot => item[slot])) throw new Error(`Запись ${index + 2}: не заполнено название, игра, тип или ни один аккаунт`);
            return item;
        });
    }
    function match(map, label) {
        return Object.entries(map).filter(([id, name]) => !absent(id) && norm(name) === norm(label)).map(([id]) => id);
    }
    function plan(source, maps) {
        return source.map(row => {
            if (!Object.hasOwn(maps.launcher_type, row.launcher_type)) return { row, reason: 'Тип лаунчера отсутствует на целевом сайте' };
            const games = match(maps.game_id, row.game);
            if (games.length !== 1) return { row, reason: games.length ? 'Несколько игр с таким названием' : 'Игра не найдена по названию' };
            const body = { name: row.name, app_id: row.app_id, game_id: games[0], launcher_type: row.launcher_type, launchers: [] };
            for (const slot of slots) {
                if (!row[slot]) continue;
                const accounts = match(maps[slot + '_id'], row[slot]);
                if (accounts.length !== 1) return { row, reason: `${slot}: ${accounts.length ? 'несколько аккаунтов с таким названием' : 'аккаунт не найден'}` };
                body.launchers.push({ id: 'pending', launcher_id: accounts[0], priority: body.launchers.length });
            }
            return { row, body };
        });
    }
    function same(row, body) {
        return row.name === body.name && row.app_id === body.app_id && row.game_id === body.game_id && row.launcher_type === body.launcher_type &&
            slots.every((slot, index) => (row[slot + '_id'] || '') === (body.launchers[index]?.launcher_id || ''));
    }
    window.LanSearchGameLaunch = { slots, headers, norm, parseCatalog, catalog, normalizeRow, api, list, toCSV, readCSV, plan, same };
})();
