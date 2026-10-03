window.LanSearchScripts.run('import-productlistfull', async ({ params, files }) => {
    const U = window.LanSearchScripts;
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    if (!files.csv) throw new Error('Выберите CSV в настройках скрипта');
    const csv = U.records(await files.csv.text(), ['name']);
    if (!csv.length) throw new Error('CSV не содержит товаров');
    const numeric = ['sort', 'purchase_price', 'price_sale', 'discount', 'count_in_box', 'group_id', 'supplier_id'];
    const flags = ['show_in_admin', 'show_in_lk', 'show_in_terminal', 'show_in_tablet', 'show_in_mobile', 'vending_sale', 'net_sale', 'active', 'excise', 'marking', 'adult_only'];
    const strings = ['tax_type', 'vendor_codes'];
    // Validate every body before the first write.
    const updates = csv.map(row => {
        if (!row.name.trim()) throw new Error('В CSV есть пустое название товара');
        const body = {};
        for (const key of numeric) if (Object.hasOwn(row, key) && row[key].trim() !== '') {
            body[key] = U.number(row[key], `${key} (${row.name})`);
        }
        for (const key of flags) if (Object.hasOwn(row, key)) {
            const value = row[key].trim().toLowerCase();
            if (value === '') continue;
            if (!['true', 'false', '1', '0'].includes(value)) throw new Error(`Некорректное логическое значение ${key} (${row.name})`);
            body[key] = value === 'true' || value === '1';
        }
        for (const key of strings) if (Object.hasOwn(row, key)) body[key] = row[key];
        if (!Object.keys(body).length) throw new Error('CSV не содержит поддерживаемых полей конфигурации');
        return { name: row.name, body };
    });
    const normalize = value => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
    U.uniqueIndex(updates, row => normalize(row.name));
    const response = await U.request('/products_list/?' + new URLSearchParams({ club_id: String(clubId) }));
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const products = [...doc.querySelectorAll('tr[data-id]')].map(row => ({ id: row.dataset.id, name: row.querySelector('td:nth-child(2) span')?.textContent.trim() })).filter(row => row.id && row.name);
    if (!products.length) throw new Error('В /products_list/ не найдены товары');
    const index = U.uniqueIndex(products, row => normalize(row.name));
    const matched = updates.map(row => ({ ...row, id: index.get(normalize(row.name))?.id })).filter(row => row.id);
    if (!matched.length) throw new Error('Нет совпадений товаров по названиям');
    const cookieToken = document.cookie.match(/(?:^|;\s*)token_master_api=([^;]+)/)?.[1] ||
        document.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
    // В cookie токен лежит в URL-кодировке — как и в promocode-create.js, декодируем.
    const token = localStorage.token_master_api || localStorage.token ||
        (cookieToken ? decodeURIComponent(cookieToken) : '');
    if (!token) throw new Error('На странице клуба не найден токен API');
    let completed = 0;
    for (const row of matched) {
        try {
            await U.api(`/master_api/products/configuration/${encodeURIComponent(row.id)}`, {
                method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', language: 'ru', 'x-language': 'ru', 'x-requested-with': 'XMLHttpRequest' }, body: JSON.stringify(row.body)
            });
            completed++;
            U.notify(`Учёт товаров: ${completed}/${matched.length}`);
            await U.wait(100);
        } catch (error) { throw new Error(`Остановлено на «${row.name}»: ${error.message}. До ошибки отправлено: ${completed}/${matched.length}.`); }
    }
    return `Настройки отправлены: ${completed}. Без совпадения: ${updates.length - matched.length}. Проверьте итог на сайте.`;
});
