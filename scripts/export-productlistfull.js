window.LanSearchScripts.run('export-productlistfull', async ({ params }) => {
    const U = window.LanSearchScripts, M = window.LanSearchAccountingMapping;
    if (!M) throw new Error('Обновите script-runner.js и accounting-mapping-common.js');
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    const rows = await U.clubProducts(clubId);
    if (!rows.length) throw new Error('В клубе не найдены товары. Проверьте ID клуба и доступ.');
    const fields = ['sort', 'purchase_price', 'price_sale', 'discount', 'count_in_box', 'group_id', 'supplier_id',
        'show_in_admin', 'show_in_lk', 'show_in_terminal', 'show_in_tablet', 'show_in_mobile', 'vending_sale',
        'net_sale', 'active', 'excise', 'marking', 'adult_only', 'tax_type', 'vendor_codes'];
    const result = rows.map(raw => {
        const name = String(raw.product_name ?? '').trim();
        if (!name) throw new Error(`Пустое название товара в ответе master_api (ID конфигурации ${raw.id})`);
        const item = { id: String(raw.id), name };
        for (const key of fields) {
            const value = raw[key];
            if (value === null || value === undefined) item[key] = '';
            else if (Array.isArray(value)) item[key] = value.join(', ');
            else item[key] = value;
        }
        // The API always returns every supported field; nothing is absent anymore.
        item.__absent_fields = '[]';
        return item;
    });
    const dictionaries = await M.catalogs(M.needed(result));
    const missing = [];
    for (const item of result) for (const [field, kind] of Object.entries(M.kinds)) {
        item[kind.nameField] = '';
        if (!Object.hasOwn(item, field) || String(item[field]).trim() === '') continue;
        const id = M.identifier(item[field]);
        if (id === '0') continue;
        const entry = (dictionaries[field] || []).find(entry => entry.id === id);
        if (entry) item[kind.nameField] = entry.name;
        else missing.push(`${kind.singular} ID ${id}`);
    }
    const headers = ['id', 'name', ...fields.filter(key => result.some(row => Object.hasOwn(row, key))), 'group_name', 'supplier_name', '__absent_fields'];
    U.downloadCSV([headers, ...result.map(row => headers.map(key => row[key] ?? ''))], 'products_prices.csv');
    return `Клуб ${clubId}. Выгружено товаров и услуг: ${result.length}. Добавлены названия категорий и поставщиков.` +
        (missing.length ? '\nНазвания не найдены: ' + [...new Set(missing)].join('; ') + '. При импорте потребуется ручной выбор.' : '');
});
