window.LanSearchScripts.run('import-productlistfull', async ({ params, files }) => {
    const U = window.LanSearchScripts, M = window.LanSearchAccountingMapping;
    if (!M) throw new Error('Обновите script-runner.js и accounting-mapping-common.js');
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    if (!files.csv) throw new Error('Выберите CSV в настройках скрипта');
    const csv = U.records(await files.csv.text(), ['name']);
    if (!csv.length) throw new Error('CSV не содержит товаров');
    const numeric = ['sort', 'purchase_price', 'price_sale', 'discount', 'count_in_box', 'group_id', 'supplier_id'];
    const flags = ['show_in_admin', 'show_in_lk', 'show_in_terminal', 'show_in_tablet', 'show_in_mobile', 'vending_sale', 'net_sale', 'active', 'excise', 'marking', 'adult_only'];
    const strings = ['tax_type', 'vendor_codes'];
    const supported = new Set([...numeric, ...flags, ...strings]);
    const normalize = value => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
    async function readProducts() {
        const rows = await U.clubProducts(clubId);
        return rows.map(raw => ({ id: String(raw.id), name: String(raw.product_name ?? '').trim() }))
            .filter(row => row.id && row.name);
    }
    function checkAmbiguousNames(source, products) {
        const problems = [];
        for (const [label, items] of [['CSV', source], ['Целевой клуб', products]]) {
            const groups = new Map();
            items.forEach((item, index) => {
                const key = normalize(item.name);
                if (!key) return;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push({ item, record: index + 2 });
            });
            for (const [key, members] of groups) {
                if (members.length < 2) continue;
                problems.push([label, key, [...new Set(members.map(({ item }) => item.name))].join('\n'),
                    members.length, label === 'CSV' ? members.map(item => item.record).join(', ') : '',
                    members.map(({ item }) => item.id || '').filter(Boolean).join(', ')]);
            }
        }
        if (!problems.length) return;
        const rows = [['Источник', 'Название для сопоставления', 'Варианты названия', 'Количество', 'Записи CSV (с заголовком)', 'ID товаров'], ...problems];
        const filename = 'products-ambiguities.csv';
        const csvCount = problems.filter(row => row[0] === 'CSV').length;
        const summary = `Неоднозначное сопоставление названий: ${problems.length} групп. В CSV: ${csvCount}; в целевом клубе: ${problems.length - csvCount}. Изменения не отправлены.`;
        let saved = false;
        try { U.downloadCSV(rows, filename); saved = true; }
        catch { console.table(problems); }
        try {
            // Keep the complete list outside the popup; hundreds of rows remain scrollable.
            document.getElementById('lansearch-accounting-ambiguities')?.remove();
            const host = document.createElement('div');
            host.id = 'lansearch-accounting-ambiguities';
            host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:block';
            const shadow = host.attachShadow({ mode: 'open' });
            const element = (tag, text, className) => {
                const node = document.createElement(tag);
                if (text !== undefined) node.textContent = text;
                if (className) node.className = className;
                return node;
            };
            const style = element('style');
            style.textContent = ':host{color-scheme:dark}*{box-sizing:border-box}.overlay{position:absolute;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.45 system-ui;color:#eee}.panel{background:#212121;border:1px solid #555;border-radius:12px;width:1100px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;padding:20px}h2{font-size:20px;margin:0 0 10px}p{margin:0 0 12px}.list{overflow:auto;min-height:0}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:8px;border:1px solid #555;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{position:sticky;top:0;background:#303030}.actions{display:flex;gap:10px;justify-content:flex-end;padding-top:14px}button{padding:9px 12px;font:inherit;color:#eee;background:#333;border:1px solid #777;border-radius:6px;cursor:pointer}button:focus-visible{outline:2px solid white;outline-offset:2px}';
            const overlay = element('div', undefined, 'overlay');
            const panel = element('section', undefined, 'panel');
            panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Все неоднозначные названия товаров');
            const list = element('div', undefined, 'list'), table = element('table'), head = element('thead'), body = element('tbody');
            const heading = element('tr');
            for (const value of rows[0]) heading.append(element('th', value));
            head.append(heading);
            for (const row of problems) {
                const tr = element('tr');
                for (const value of row) tr.append(element('td', String(value)));
                body.append(tr);
            }
            table.append(head, body); list.append(table);
            const actions = element('div', undefined, 'actions');
            const status = element('p', saved ? `Полный список: ${filename}. Скачивание запрошено.` : 'Не удалось скачать файл. Полный список ниже и в консоли.');
            status.setAttribute('role', 'status');
            const download = element('button', 'Скачать полный список'); download.type = 'button';
            download.addEventListener('click', () => {
                try { U.downloadCSV(rows, filename); status.textContent = `Скачивание ${filename} запрошено.`; }
                catch { console.table(problems); status.textContent = 'Не удалось скачать файл. Список остаётся в таблице и консоли.'; }
            });
            const close = element('button', 'Закрыть'); close.type = 'button';
            const previous = document.activeElement;
            const dismiss = () => { host.remove(); previous?.focus?.(); };
            close.addEventListener('click', dismiss);
            panel.addEventListener('keydown', event => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
                if (event.key === 'Tab') {
                    if (event.shiftKey && shadow.activeElement === download) { event.preventDefault(); close.focus(); }
                    else if (!event.shiftKey && shadow.activeElement === close) { event.preventDefault(); download.focus(); }
                }
            });
            actions.append(download, close); panel.append(element('h2', 'Все неоднозначные названия'), element('p', summary), status, list, actions);
            overlay.append(panel); shadow.append(style, overlay); document.documentElement.append(host); close.focus();
        } catch { console.table(problems); }
        throw new Error(summary + (saved ? ` Полный список: ${filename}.` : ' Полный список выведен в консоль.'));
    }
    let products = await readProducts();
    checkAmbiguousNames(csv, products);
    if (!products.length) throw new Error('В клубе не найдены товары. Проверьте ID клуба и доступ.');
    let index = new Map(products.map(row => [normalize(row.name), row]));
    // Validate every body before the first write.
    const updates = csv.map(row => {
        if (!row.name.trim()) throw new Error('В CSV есть пустое название товара');
        // New exports distinguish missing controls from explicitly empty text.
        let absent = [];
        if (Object.hasOwn(row, '__absent_fields')) {
            try { absent = JSON.parse(row.__absent_fields); }
            catch { throw new Error(`Некорректная колонка __absent_fields (${row.name})`); }
            if (!Array.isArray(absent) || absent.some(key => !supported.has(key))) {
                throw new Error(`Некорректная колонка __absent_fields (${row.name})`);
            }
        }
        const hasValue = key => Object.hasOwn(row, key) &&
            (!absent.includes(key) || row[key].trim() !== '');
        const body = {};
        for (const key of numeric) if (hasValue(key) && row[key].trim() !== '') {
            body[key] = Object.hasOwn(M.kinds, key) ? Number(M.identifier(row[key])) : U.number(row[key], `${key} (${row.name})`);
        }
        for (const key of flags) if (hasValue(key)) {
            const value = row[key].trim().toLowerCase();
            if (value === '') continue;
            if (!['true', 'false', '1', '0'].includes(value)) throw new Error(`Некорректное логическое значение ${key} (${row.name})`);
            body[key] = value === 'true' || value === '1';
        }
        // The site itself sends vendor_codes as one plain string and null for an empty tax_type.
        for (const key of strings) if (hasValue(key)) {
            body[key] = key === 'tax_type' && row[key].trim() === '' ? null : row[key];
        }
        if (!Object.keys(body).length) throw new Error('CSV не содержит поддерживаемых полей конфигурации');
        return { name: row.name, body, source: row };
    });

    const matched = updates.filter(row => index.has(normalize(row.name)));
    if (!matched.length) throw new Error('Нет совпадений товаров по названиям');
    const report = updates.filter(row => !index.has(normalize(row.name))).map(row => [row.name, '', 'Пропущено', 'Товар не найден по названию']);
    const dictionaries = await M.catalogs(M.needed(matched));
    let entries = M.mappings(matched, dictionaries);
    const needsReview = entries.some(entry => !entry.choice) || params.review_mappings === true || params.review_mappings === 'true';
    if (entries.length && needsReview) {
        U.notify('Выберите соответствия категорий и поставщиков на странице клуба. До подтверждения импорт не выполняется.');
        entries = await M.review(entries, clubId);
        if (!entries) return 'Импорт отменён. Изменения не отправлены.';
    }
    const pending = M.apply(matched, entries);
    // A dialog can stay open for a while: reread selected references before writing.
    const usedFields = [...new Set(entries.filter(entry => !['keep', 'skip', '0'].includes(entry.choice)).map(entry => entry.field))];
    if (usedFields.length) M.verify(entries, await M.catalogs(usedFields));
    if (entries.length && needsReview) {
        products = await readProducts();
        checkAmbiguousNames(csv, products);
        if (!products.length) throw new Error('В клубе не найдены товары. Проверьте ID клуба и доступ.');
        index = new Map(products.map(row => [normalize(row.name), row]));
    }
    for (const update of pending) {
        const target = index.get(normalize(update.name));
        update.id = target?.id;
        if (!target) update.skipReason = 'Товар исчез из выбранного клуба после сопоставления';
    }
    let completed = 0, failure = '';
    for (const row of pending) {
        if (row.skipReason) { report.push([row.name, row.id || '', 'Пропущено', row.skipReason]); continue; }
        if (failure) { report.push([row.name, row.id, 'Не выполнялось', 'Импорт остановлен после ошибки']); continue; }
        try {
            await U.masterApi(`/products/configuration/${encodeURIComponent(row.id)}`, { method: 'POST', body: row.body });
            completed++;
            report.push([row.name, row.id, 'Отправлено', '']);
            U.notify(`Учёт товаров: отправлено ${completed}/${pending.filter(item => !item.skipReason).length}`);
            await U.wait(100);
        } catch (error) {
            failure = `Остановлено на «${row.name}»: ${error.message}. До ошибки отправлено: ${completed}/${pending.filter(item => !item.skipReason).length}.`;
            report.push([row.name, row.id, 'Ошибка; результат не подтверждён', error.message]);
        }
    }
    let reportMessage = '';
    try {
        if (entries.length) U.downloadCSV(M.mappingRows(entries), 'products-mapping.csv');
        U.downloadCSV([['Товар', 'ID назначения', 'Результат', 'Причина'], ...report], 'products-import-report.csv');
        reportMessage = ' Отчёт: products-import-report.csv.' + (entries.length ? ' Соответствия: products-mapping.csv.' : '');
    } catch {
        console.table(report);
        if (entries.length) console.table(M.mappingRows(entries));
        reportMessage = ' Не удалось скачать все отчёты; результаты выведены в консоль.';
    }
    if (failure) throw new Error(failure + reportMessage + ' Проверьте последнюю запись на сайте перед повторным импортом.');
    return `Клуб ${clubId}. Настройки отправлены: ${completed}. Пропущено: ${report.filter(row => row[2] === 'Пропущено').length}.` + reportMessage + ' Проверьте итог на сайте.';
});
