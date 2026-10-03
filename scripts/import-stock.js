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
    const csv = stockRows.map(row => ({
        name: row['Название'].trim(), count: U.number(row['Остаток'], `Остаток (${row['Название']})`)
    }));
    if (csv.some(row => !row.name)) throw new Error('В CSV есть пустое название товара');
    U.uniqueIndex(csv, row => normalize(row.name));
    const response = await U.request('/products_invent/');
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const products = [...doc.querySelectorAll('tr')].map(row => ({
        name: row.querySelectorAll('td')[2]?.textContent.trim(),
        id: row.querySelector('input[name^="count["]')?.name.match(/^count\[(\d+)\]/)?.[1]
    })).filter(row => row.id && row.name);
    if (!products.length) throw new Error('Не найдена таблица инвентаризации');
    const index = U.uniqueIndex(products, row => normalize(row.name));
    const matched = csv.map(row => ({ ...row, id: index.get(normalize(row.name))?.id })).filter(row => row.id);
    if (!matched.length) throw new Error('Нет совпадений товаров по названиям');
    const body = new URLSearchParams({ command: 'invent', club_id: String(clubId) });
    for (const row of matched) body.append(`count[${row.id}]`, String(row.count));
    await U.api('/products_invent/crud.php', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest', accept: 'application/json, text/javascript, */*; q=0.01' }, body: body.toString()
    });
    return `Остатки отправлены: ${matched.length}. Без совпадения: ${csv.length - matched.length}. Пропущено услуг: ${skippedServices}. Проверьте итог в инвентаризации.`;
});
