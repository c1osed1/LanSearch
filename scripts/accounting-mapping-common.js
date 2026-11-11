(() => {
    const kinds = {
        group_id: { label: 'Категории', singular: 'категория', nameField: 'group_name', path: '/products_groups/', table: 'js-products-groups-table', apiPath: '/products/groups/active', empty: 'Без категории' },
        supplier_id: { label: 'Поставщики', singular: 'поставщик', nameField: 'supplier_name', path: '/products_suppliers/', table: 'js-local-table', apiPath: '/products/suppliers/active', empty: 'Без поставщика' }
    };
    const normalize = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    function identifier(value) {
        const text = String(value ?? '').trim();
        const number = Number(text);
        if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < 0) throw new Error(`Некорректный ID справочника: ${text}`);
        return String(number);
    }
    function parseCatalog(doc, field) {
        const kind = kinds[field];
        const table = doc.getElementById(kind.table);
        if (!table) throw new Error(`Не найдена таблица «${kind.label}» на ${kind.path}. Проверьте доступ к странице.`);
        if (table.getAttribute('data-paging') === 'true' || table.getAttribute('data-server-side-config')) {
            throw new Error(`Таблица «${kind.label}» загружается по страницам: полный справочник не подтверждён.`);
        }
        const result = [], seen = new Set();
        for (const row of table.querySelectorAll('tbody tr[data-id]')) {
            const id = identifier(row.dataset.id);
            if (id === '0') continue;
            const name = (row.querySelector('input[name="name"]')?.value ?? row.querySelector('[data-column="name"] .js-field')?.textContent ?? '').trim();
            if (!name || seen.has(id)) throw new Error(`Некорректное название или повтор ID ${id} в справочнике «${kind.label}»`);
            seen.add(id);
            result.push({ id, name });
        }
        // Empty DataTables placeholders are allowed; unexplained rows are not silently discarded.
        if (!result.length && [...table.querySelectorAll('tbody tr')].some(row => !row.querySelector('.dt-empty, .dataTables_empty'))) {
            throw new Error(`Не удалось прочитать строки справочника «${kind.label}»`);
        }
        return result;
    }
    function parseApiCatalog(json, field) {
        const kind = kinds[field];
        const list = Array.isArray(json) ? json : json.items || json.data || [];
        if (!Array.isArray(list)) throw new Error(`Неожиданный формат справочника «${kind.label}» в master_api`);
        const result = [], seen = new Set();
        for (const entry of list) {
            const id = identifier(entry.id);
            if (id === '0') continue;
            const name = String(entry.name ?? entry.title ?? '').trim();
            if (!name || seen.has(id)) throw new Error(`Некорректное название или повтор ID ${id} в справочнике «${kind.label}»`);
            seen.add(id);
            result.push({ id, name });
        }
        return result;
    }
    async function catalog(field) {
        const kind = kinds[field];
        // The current UI loads dictionaries via master_api; keep the legacy HTML table as a fallback.
        let apiError = null;
        try {
            return parseApiCatalog(await window.LanSearchScripts.masterApi(kind.apiPath), field);
        } catch (error) { apiError = error; }
        try {
            const response = await window.LanSearchScripts.request(kind.path, { cache: 'no-store' });
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            return parseCatalog(doc, field);
        } catch (fallbackError) {
            throw new Error(`Справочник «${kind.label}» недоступен: ${apiError.message}; ${fallbackError.message}`);
        }
    }
    async function catalogs(fields) {
        const results = await Promise.all([...new Set(fields)].map(async field => [field, await catalog(field)]));
        return Object.fromEntries(results);
    }
    function needed(rows) {
        return Object.keys(kinds).filter(field => rows.some(row => {
            const body = row.body || row;
            return Object.hasOwn(body, field) && String(body[field]).trim() !== '' && identifier(body[field]) !== '0';
        }));
    }
    function mappings(updates, dictionaries) {
        const index = new Map();
        for (const update of updates) for (const field of Object.keys(kinds)) {
            if (!Object.hasOwn(update.body, field)) continue;
            const sourceId = identifier(update.body[field]);
            if (sourceId === '0') continue;
            const key = `${field}:${sourceId}`;
            const sourceName = String(update.source?.[kinds[field].nameField] ?? '').trim();
            if (!index.has(key)) index.set(key, { key, field, sourceId, sourceName, count: 0 });
            const entry = index.get(key);
            if (sourceName && entry.sourceName && normalize(sourceName) !== normalize(entry.sourceName)) {
                throw new Error(`В CSV для ${kinds[field].singular} ID ${sourceId} указаны разные названия`);
            }
            if (sourceName) entry.sourceName = sourceName;
            entry.count++;
        }
        return [...index.values()].map(entry => {
            const options = dictionaries[entry.field] || [];
            const matches = entry.sourceName ? options.filter(item => normalize(item.name) === normalize(entry.sourceName)) : [];
            return { ...entry, options, choice: matches.length === 1 ? matches[0].id : '',
                automatic: matches.length === 1, reason: !entry.sourceName ? 'В CSV нет названия — выберите вручную' : matches.length > 1 ? 'Несколько совпадений — выберите вручную' : matches.length === 0 ? 'Название не найдено — выберите вручную' : 'Совпадение по названию' };
        });
    }
    function apply(updates, entries) {
        const index = new Map(entries.map(entry => [entry.key, entry]));
        return updates.map(update => {
            const result = { ...update, body: { ...update.body }, skipReason: '' };
            for (const field of Object.keys(kinds)) {
                if (!Object.hasOwn(result.body, field)) continue;
                const id = identifier(result.body[field]);
                if (id === '0') { result.body[field] = 0; continue; }
                const entry = index.get(`${field}:${id}`);
                if (!entry?.choice) throw new Error(`Не выбрано соответствие: ${kinds[field].singular} ID ${id}`);
                if (entry.choice === 'keep') delete result.body[field];
                else if (entry.choice === 'skip') result.skipReason = 'Пропущено по выбору в сопоставлении';
                else {
                    const target = identifier(entry.choice);
                    if (target !== '0' && !entry.options.some(item => item.id === target)) throw new Error('Выбранного ID нет в целевом справочнике');
                    result.body[field] = Number(target);
                }
            }
            if (!Object.keys(result.body).length && !result.skipReason) result.skipReason = 'Нет полей для обновления после сохранения текущих связей';
            return result;
        });
    }
    function verify(entries, dictionaries) {
        for (const entry of entries) {
            if (['keep', 'skip', '0'].includes(entry.choice)) continue;
            const before = entry.options.find(item => item.id === entry.choice);
            const now = (dictionaries[entry.field] || []).find(item => item.id === entry.choice);
            if (!before || !now || normalize(before.name) !== normalize(now.name)) {
                throw new Error(`Справочник изменился после выбора: ${kinds[entry.field].label}. Запустите импорт заново.`);
            }
        }
    }
    function mappingRows(entries) {
        return [['Тип', 'ID источника', 'Название источника', 'ID назначения', 'Название назначения', 'Действие', 'Товаров'], ...entries.map(entry => {
            const target = entry.options.find(item => item.id === entry.choice);
            const action = entry.choice === 'keep' ? 'Сохранить текущее значение' : entry.choice === 'skip' ? 'Пропустить связанные товары' : 'Подставить ID назначения';
            return [kinds[entry.field].label, entry.sourceId, entry.sourceName, ['keep','skip'].includes(entry.choice) ? '' : entry.choice,
                target?.name || (entry.choice === '0' ? kinds[entry.field].empty : ''), action, entry.count];
        })];
    }
    function review(entries, clubId) {
        return new Promise(resolve => {
            const host = document.createElement('div');
            host.id = 'lansearch-accounting-mapping';
            host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:block;';
            const shadow = host.attachShadow({ mode: 'open' });
            const node = (tag, text, cls) => {
                const item = document.createElement(tag);
                if (text !== undefined) item.textContent = text;
                if (cls) item.className = cls;
                return item;
            };
            const style = node('style');
            style.textContent = ':host{color-scheme:dark}*{box-sizing:border-box}.backdrop{position:absolute;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.45 system-ui;color:#eee}.panel{background:#212121;border:1px solid #555;border-radius:12px;width:850px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;padding:20px}h2{margin:0 0 10px;font-size:20px}h3{font-size:16px;margin:20px 0 10px}p{margin:0 0 12px;color:#bbb}.list{overflow:auto;min-height:0;padding:0 4px}.entry{display:grid;gap:8px;padding:12px 0;border-bottom:1px solid #444}small{color:#aaa}select,button{font:inherit;color:#eee;background:#292929;border:1px solid #666;border-radius:6px;padding:9px;max-width:100%}select{width:100%}button{cursor:pointer}button:disabled{opacity:.4;cursor:not-allowed}.footer{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;padding-top:16px}.apply{background:#b90000}select:focus-visible,button:focus-visible{outline:2px solid #fff;outline-offset:2px}';
            const backdrop = node('div', undefined, 'backdrop');
            const panel = node('section', undefined, 'panel');
            panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Сопоставление категорий и поставщиков');
            panel.append(node('h2', 'Категории и поставщики'), node('p', `Назначение: ${location.host || new URL(location.href).host}, клуб ${clubId}. Выберите соответствие один раз для всех связанных товаров. Изменения ещё не отправлены.`));
            const list = node('div', undefined, 'list');
            const selections = [];
            for (const field of Object.keys(kinds)) {
                const group = entries.filter(entry => entry.field === field);
                if (!group.length) continue;
                list.append(node('h3', kinds[field].label));
                for (const entry of group) {
                    const wrapper = node('div', undefined, 'entry');
                    const select = node('select'); select.dataset.mappingKey = entry.key;
                    select.id = `mapping-${selections.length}`;
                    const label = node('label', `${entry.sourceName || 'Название неизвестно'} · ID источника ${entry.sourceId} · товаров: ${entry.count}`);
                    label.htmlFor = select.id;
                    const option = (value, text) => { const item = node('option', text); item.value = value; select.append(item); };
                    option('', 'Выберите соответствие…');
                    option('keep', 'Оставить текущую привязку каждого товара');
                    option('skip', 'Пропустить связанные товары целиком');
                    option('0', `${kinds[field].empty} (ID 0)`);
                    for (const item of [...entry.options].sort((a,b) => a.name.localeCompare(b.name, 'ru'))) option(item.id, `${item.name} · ID ${item.id}`);
                    select.value = entry.choice;
                    wrapper.append(label, node('small', entry.reason), select); list.append(wrapper);
                    selections.push({ entry, select });
                }
            }
            const footer = node('div', undefined, 'footer');
            const cancel = node('button', 'Отмена'); cancel.type = 'button';
            const submit = node('button', 'Применить и продолжить', 'apply'); submit.type = 'button';
            const update = () => { submit.disabled = selections.some(item => !item.select.value); };
            selections.forEach(item => item.select.addEventListener('change', update)); update();
            const previous = document.activeElement;
            const finish = result => { host.remove(); previous?.focus?.(); resolve(result); };
            cancel.addEventListener('click', () => finish(null));
            submit.addEventListener('click', () => {
                if (submit.disabled) return;
                for (const { entry, select } of selections) { entry.choice = select.value; }
                finish(entries);
            });
            panel.addEventListener('keydown', event => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(null); }
                if (event.key === 'Tab') {
                    const focusable = [...panel.querySelectorAll('select, button')].filter(item => !item.disabled);
                    const first = focusable[0], last = focusable[focusable.length - 1];
                    if (event.shiftKey && shadow.activeElement === first) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && shadow.activeElement === last) { event.preventDefault(); first.focus(); }
                }
            });
            footer.append(cancel, submit); panel.append(list, footer); backdrop.append(panel); shadow.append(style, backdrop);
            document.documentElement.append(host);
            (selections.find(item => !item.entry.choice)?.select || selections[0]?.select || cancel).focus();
        });
    }
    window.LanSearchAccountingMapping = { kinds, normalize, identifier, parseCatalog, catalogs, needed, mappings, apply, verify, mappingRows, review };
})();
