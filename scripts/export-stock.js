window.LanSearchScripts.run('export-stock', async ({ params }) => {
    const U = window.LanSearchScripts;
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    const query = new URLSearchParams({ club_id: String(clubId) });
    const response = await U.request('/products_list/?' + query);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const rows = [...doc.querySelectorAll('tr[data-id]')];
    if (!rows.length) throw new Error('В /products_list/ не найдены товары. Проверьте страницу и доступ.');
    const result = rows.map(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[1]?.querySelector('span')?.textContent.trim();
        const stock = cells[10]?.querySelector('span')?.textContent.trim();
        if (!name || stock === undefined) throw new Error('Изменилась структура таблицы остатков');
        return [row.dataset.id, name, stock];
    });
    U.downloadCSV([['ID', 'Название', 'Остаток'], ...result], 'products_stock.csv');
    return `Клуб ${clubId}. Выгружено товаров: ${result.length}`;
});
