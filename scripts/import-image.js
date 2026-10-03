window.LanSearchScripts.run('import-image', async ({ files }) => {
    const U = window.LanSearchScripts;
    if (!files.csv || !files.images?.length) throw new Error('Выберите CSV и папку с изображениями в настройках');
    const csv = U.records(await files.csv.text(), ['Название', 'Изображение']);
    if (!csv.length) throw new Error('CSV не содержит записей');
    const clean = value => String(value).replace(/\\/g, '/').split('/').pop().split('?')[0].trim();
    const stem = value => value.replace(/\.(webp|jpe?g|png)$/i, '');
    const group = (items, key) => {
        const index = new Map();
        for (const item of items) {
            const value = key(item);
            if (!index.has(value)) index.set(value, []);
            index.get(value).push(item);
        }
        return index;
    };
    const images = files.images.filter(file => !/\.csv$/i.test(file.name));
    const imageIndex = group(images, file => clean(file.name));
    const stemIndex = group(images, file => stem(clean(file.name)));
    const products = await U.products();
    const productIndex = group(products, item => item.name);
    const csvIndex = group(csv, row => row['Название']);
    const issues = [];
    let completed = 0, skipped = 0, failed = 0;
    for (let i = 0; i < csv.length; i++) {
        const row = csv[i];
        const productName = row['Название'];
        const imageName = clean(row['Изображение']);
        const reasons = [];
        const matches = productIndex.get(productName) || [];
        if (!productName.trim()) reasons.push('Пустое название товара');
        else if (!matches.length) reasons.push('Товар не найден');
        else if (matches.length > 1) reasons.push('Несколько товаров с таким названием');
        else if (!matches[0].id) reasons.push('Нет ID товара');
        if ((csvIndex.get(productName)?.length || 0) > 1) reasons.push('Название повторяется в CSV');
        let candidates = imageName ? imageIndex.get(imageName) || [] : [];
        if (imageName && !candidates.length) candidates = stemIndex.get(stem(imageName)) || [];
        if (!imageName) reasons.push('Не указано имя изображения');
        else if (!candidates.length) reasons.push(`Нет файла «${imageName}»`);
        else if (candidates.length > 1) reasons.push(`Несколько файлов подходят для «${imageName}»`);
        if (reasons.length) {
            skipped++;
            issues.push([i + 2, productName, row['Изображение'], 'Пропущено', reasons.join('; ')]);
        } else {
            const product = matches[0], file = candidates[0];
            try {
                const form = new FormData();
                form.append('name', product.name);
                form.append('description', product.description ?? '');
                form.append('file', file, file.name);
                await U.api(`/products/crud.php?command=update&id=${encodeURIComponent(product.id)}`, {
                    method: 'POST', body: form, headers: { 'x-requested-with': 'XMLHttpRequest', accept: 'application/json, text/javascript, */*; q=0.01' }
                });
                completed++;
            } catch (error) {
                failed++;
                issues.push([i + 2, productName, row['Изображение'], 'Ошибка загрузки', error.message || String(error)]);
            }
            // Keep the request interval even when the server rejects an individual upload.
            await U.wait(1200);
        }
        U.notify(`Импорт фото: ${i + 1}/${csv.length}. Загружено: ${completed}. Пропущено: ${skipped}. Ошибок: ${failed}.`);
    }
    let message = `Импорт фото завершён. Обработано: ${csv.length}. Загружено: ${completed}. Пропущено: ${skipped}. Ошибок загрузки: ${failed}.`;
    if (issues.length) {
        try {
            U.downloadCSV([['Запись CSV (с заголовком)', 'Название', 'Изображение', 'Статус', 'Причина'], ...issues], 'image-import-report.csv');
            message += '\nПолный список проблем: image-import-report.csv (скачивание запрошено).';
        } catch (error) {
            console.table(issues.map(([record, name, image, status, reason]) => ({ record, name, image, status, reason })));
            message += '\nНе удалось скачать отчёт. Полный список проблем выведен в консоль.';
        }
        message += '\n' + issues.slice(0, 5).map(([record, name, , , reason]) => `Запись ${record}, «${name}»: ${reason}`).join('\n');
        if (issues.length > 5) message += `\nЕщё записей с проблемами: ${issues.length - 5}.`;
    }
    return message;
});
