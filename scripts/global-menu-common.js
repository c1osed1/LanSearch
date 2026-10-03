(() => {
    const normalize = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    const headers = ['Раздел', 'ID источника', 'Объект', 'Родитель', 'Роли'];
    const group = (items, key) => {
        const index = new Map();
        for (const item of items) {
            const value = key(item);
            if (!index.has(value)) index.set(value, []);
            index.get(value).push(item);
        }
        return index;
    };
    function parse(doc) {
        const result = [];
        for (const [section, tableId, button] of [
            ['menu', 'global-menu-global-table', 'saveRow'],
            ['other', 'global-menu-another-table', 'saveRowAnoth']
        ]) {
            const table = doc.getElementById(tableId);
            if (!table) throw new Error(`Не найдена таблица ${tableId}. Проверьте доступ к /global_menu/.`);
            for (const row of table.querySelectorAll('tbody tr')) {
                const select = row.querySelector('select[name="roles_mask[]"]');
                if (!select) continue;
                const id = row.querySelector(`button[name="${button}"]`)?.value;
                const name = section === 'menu' ? row.querySelector('input[name="name"]')?.value : row.cells[0]?.textContent.trim();
                const parent = section === 'menu' ? row.querySelector('select[name="parent_id"]') : null;
                if (!/^\d+$/.test(id || '') || !name?.trim() || (section === 'menu' && !parent)) {
                    throw new Error('Изменилась структура строки прав доступа');
                }
                const roles = [...select.options].map(option => ({
                    name: option.textContent.trim(), value: option.value, selected: option.selected
                }));
                if (roles.some(role => !role.name || !/^\d+$/.test(role.value))) throw new Error(`Некорректные роли: ${name}`);
                const roleIndex = group(roles, role => normalize(role.name));
                if ([...roleIndex.values()].some(items => items.length > 1)) throw new Error(`Повторяющиеся названия ролей: ${name}`);
                const parentName = parent?.selectedOptions[0]?.textContent.trim() || '';
                result.push({ section, id, name, parentId: parent?.value || '', parentName, roles });
            }
        }
        if (!result.length) throw new Error('На странице /global_menu/ нет доступных строк прав');
        const keys = new Set();
        for (const row of result) {
            const key = row.section + ':' + row.id;
            if (keys.has(key)) throw new Error(`Повторяющийся ID права: ${key}`);
            keys.add(key);
        }
        return result;
    }
    async function load() {
        // Fetch saved values, independent of DataTables filters and unsaved page edits.
        const response = await window.LanSearchScripts.request('/global_menu/', { cache: 'no-store' });
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        return parse(doc);
    }
    const toCSV = rows => [headers, ...rows.map(row => [row.section, row.id, row.name, row.parentName,
        JSON.stringify(row.roles.filter(role => role.selected).map(role => role.name))])];
    function readCSV(text) {
        const rows = window.LanSearchScripts.records(text, []);
        if (!rows.length) throw new Error('CSV не содержит прав доступа');
        const legacyHeaders = ['ID', 'Родитель ID', 'Родитель', 'Название', 'Роли'];
        const legacy = !Object.hasOwn(rows[0], 'Раздел') && legacyHeaders.every(key => Object.hasOwn(rows[0], key));
        const required = legacy ? legacyHeaders : headers;
        for (const key of required) if (!Object.hasOwn(rows[0], key)) throw new Error(`В CSV отсутствует колонка «${key}»`);
        return rows.map((row, i) => {
            let roles, section, name, reason;
            if (legacy) {
                const id = row['ID'].trim();
                if (!/^(?:anothers_)?\d+$/.test(id)) throw new Error(`Запись ${i + 2}: неизвестный формат ID`);
                section = id.startsWith('anothers_') ? 'other' : 'menu';
                name = row['Название'];
                roles = row['Роли'].split(',').map(value => value.trim()).filter(Boolean);
                if (!name.trim()) reason = 'В старом CSV отсутствует название. Повторите экспорт новым скриптом; ID источника для сопоставления не используется.';
            } else {
                section = row['Раздел'];
                name = row['Объект'];
                try { roles = JSON.parse(row['Роли']); } catch { throw new Error(`Запись ${i + 2}: поле «Роли» должно содержать JSON-массив`); }
            }
            if (!['menu', 'other'].includes(section) || (!name.trim() && !reason) ||
                !Array.isArray(roles) || roles.some(role => typeof role !== 'string' || !role.trim()) ||
                new Set(roles.map(normalize)).size !== roles.length) throw new Error(`Некорректная запись прав ${i + 2}`);
            return { section, name, parentName: row['Родитель'], roles, record: i + 2, reason };
        });
    }
    function plan(source, target) {
        const index = group(target, row => row.section + ':' + normalize(row.name));
        const planned = source.map(row => {
            if (row.reason) return { row, reason: row.reason };
            let matches = index.get(row.section + ':' + normalize(row.name)) || [];
            if (matches.length > 1) matches = matches.filter(item => normalize(item.parentName) === normalize(row.parentName));
            if (matches.length !== 1) return { row, reason: matches.length ? 'Неоднозначное совпадение пункта' : 'Пункт не найден по названию/родителю' };
            const item = matches[0], available = group(item.roles, role => normalize(role.name));
            const missing = row.roles.filter(role => available.get(normalize(role))?.length !== 1);
            if (missing.length) return { row, reason: 'Не найдены роли: ' + missing.join(', ') };
            const selected = new Set(row.roles.map(normalize));
            const values = item.roles.filter(role => selected.has(normalize(role.name))).map(role => role.value);
            const previous = item.roles.filter(role => role.selected).map(role => role.value);
            return { row, item, values, unchanged: values.length === previous.length && values.every(value => previous.includes(value)) };
        });
        const destinations = group(planned.filter(entry => entry.item), entry => entry.item.section + ':' + entry.item.id);
        for (const entries of destinations.values()) if (entries.length > 1) {
            for (const entry of entries) entry.reason = 'Несколько строк CSV указывают на один пункт';
        }
        return planned;
    }
    function form(entry) {
        const body = new FormData();
        if (entry.item.section === 'menu') {
            body.append('parent_id', entry.item.parentId);
            body.append('name', entry.item.name);
            body.append('roles_mask', entry.values.join(','));
        } else body.append('rule_mask', entry.values.join(','));
        return body;
    }
    async function save(entry) {
        const command = entry.item.section === 'menu' ? 'update' : 'updateAnother';
        const response = await window.LanSearchScripts.request('/global_menu/crud.php?' + new URLSearchParams({ command, id: entry.item.id }), {
            method: 'POST', body: form(entry), headers: { 'x-requested-with': 'XMLHttpRequest', accept: 'application/json' }
        });
        let data;
        try { data = await response.json(); } catch { throw new Error('Сервер вернул ответ, который не является JSON'); }
        if (data?.status !== 'ok') throw new Error(String(data?.textStatus || data?.statusText || 'Сервер не подтвердил сохранение прав'));
    }
    window.LanSearchGlobalMenu = { normalize, parse, load, toCSV, readCSV, plan, form, save };
})();
