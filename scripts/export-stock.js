window.LanSearchScripts.run('export-stock', async ({ params }) => {
    const U = window.LanSearchScripts;
    const clubId = U.number(params.club_id, 'ID клуба', { integer: true, min: 1 });
    const items = await U.clubProducts(clubId);
    if (!items.length) throw new Error('В клубе не найдены товары. Проверьте ID клуба и доступ.');
    // Stock operations cover products only; services have no inventory.
    const products = items.filter(item => item.type !== 'service');
    const skippedServices = items.length - products.length;
    const result = products.map(item => [item.id, String(item.product_name ?? '').trim(), item.remaining_stock ?? 0]);
    U.downloadCSV([['ID', 'Название', 'Остаток'], ...result], 'products_stock.csv');
    return `Клуб ${clubId}. Выгружено товаров: ${result.length}.` +
        (skippedServices ? ` Услуги не выгружались: ${skippedServices}.` : '');
});
