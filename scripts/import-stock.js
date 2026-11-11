window.LanSearchScripts.run('import-stock', async ({ params, files }) => {
    const U = window.LanSearchScripts;
    if (!files.csv) throw new Error('Выберите CSV в настройках скрипта');
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    const normalize = value => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
    const rows = U.records(await files.csv.text(), ['Название', 'Остаток']);
    if (!rows.length) throw new Error('CSV не содержит товаров');
    // A dash denotes a service without inventory. Exclude it before number validation.
    const stockRows = rows.filter(row => row['Остаток'].trim() !== '-');
    const skippedServices = rows.length - stockRows.length;
    if (!stockRows.length) return `Нет товаров с остатками. Пропущено услуг: ${skippedServices}. Импорт не выполнялся.`;
    const parsed = stockRows.map(row => ({
        name: row['Название'].trim(), count: U.number(row['Остаток'], `Остаток (${row['Название']})`)
    }));
    // Negative stock is not sent: such rows are listed and skipped.
    const negative = parsed.filter(row => row.count < 0);
    const csv = parsed.filter(row => row.count >= 0);
    if (!csv.length) {
        return 'Все позиции CSV имеют отрицательный остаток — импорт не выполнялся.' +
            (skippedServices ? ` Пропущено услуг: ${skippedServices}.` : '');
    }
    if (csv.some(row => !row.name)) throw new Error('В CSV есть пустое название товара');
    U.uniqueIndex(csv, row => normalize(row.name));
    // The inventory endpoint keys rows by the global product_id, not the club configuration id.
    const items = await U.clubProducts(clubId);
    if (!items.length) throw new Error('В клубе не найдены товары. Проверьте ID клуба и доступ.');
    const products = items.map(item => ({
        name: String(item.product_name ?? '').trim(), id: String(item.product_id ?? '')
    })).filter(row => /^\d+$/.test(row.id) && row.name);
    const index = U.uniqueIndex(products, row => normalize(row.name));
    const matched = csv.map(row => ({ ...row, id: index.get(normalize(row.name))?.id })).filter(row => row.id);
    if (!matched.length) throw new Error('Нет совпадений товаров по названиям');
    await U.masterApi('/products/inventory', {
        method: 'POST',
        body: { club_id: clubId, products: matched.map(row => ({ product_id: Number(row.id), count: row.count })) }
    });
    let message = `Остатки отправлены: ${matched.length}. Без совпадения: ${csv.length - matched.length}. Пропущено услуг: ${skippedServices}. Проверьте итог в инвентаризации.`;
    if (negative.length) {
        U.listDialog({
            title: 'Пропущены позиции с отрицательным остатком',
            message: `Позиций: ${negative.length}. Они не отправлялись на сервер. Приведите остатки в порядок на сайте или в CSV.`,
            headers: ['Товар', 'Остаток'],
            rows: negative.map(row => [row.name, row.count]),
            filename: 'stock-skipped-negative.csv'
        });
        message += ` Пропущено с отрицательным остатком: ${negative.length} — список показан на странице.`;
    }
    return message;
});
