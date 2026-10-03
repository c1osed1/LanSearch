window.LanSearchScripts.run('export-productlistfull', async ({ params }) => {
    const U = window.LanSearchScripts;
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    const response = await U.request('/products_list/?' + new URLSearchParams({ club_id: String(clubId) }));
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const result = [...doc.querySelectorAll('tr[data-id]')].map(row => {
        const name = row.querySelector('td:nth-child(2) span')?.textContent.trim();
        if (!name) throw new Error('Не найдено название товара: изменилась таблица /products_list/');
        const item = { id: row.dataset.id, name };
        row.querySelectorAll('input[name]').forEach(input => {
            item[input.name] = input.type === 'checkbox' ? input.checked : input.value;
        });
        row.querySelectorAll('select[name]').forEach(select => { item[select.name] = select.value; });
        for (const [key, title] of [['purchase_price', 'Цена закупки'], ['price_sale', 'Цена продажи']]) {
            if (item[key] === undefined) {
                const cell = row.querySelector(`[title="${title}"]`);
                const value = cell?.querySelector('input')?.value?.trim() || cell?.textContent.trim();
                if (value) item[key] = value;
            }
        }
        return item;
    });
    if (!result.length) throw new Error('В /products_list/ не найдены товары');
    const headers = [...new Set(result.flatMap(Object.keys))];
    U.downloadCSV([headers, ...result.map(row => headers.map(key => row[key] ?? ''))], 'products_prices.csv');
    return `Выгружено товаров: ${result.length}`;
});
