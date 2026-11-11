window.LanSearchScripts.run('import-image', async ({ files }) => {
    const U = window.LanSearchScripts;
    if (!files.csv) throw new Error('Выберите CSV в настройках');
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
    const images = (files.images || []).filter(file => !/\.csv$/i.test(file.name));
    const imageIndex = group(images, file => clean(file.name));
    const stemIndex = group(images, file => stem(clean(file.name)));
    const products = await U.products();
    const productIndex = group(products, item => item.name);
    const csvIndex = group(csv, row => row['Название']);
    const issues = [];
    let completed = 0, skipped = 0, failed = 0, descriptions = 0, partial = 0, updated = 0;
    for (let i = 0; i < csv.length; i++) {
        const row = csv[i];
        const productName = row['Название'];
        const imageName = clean(row['Изображение']);
        const reasons = [];
        const hasDescription = Object.hasOwn(row, 'Описание');
        const matches = productIndex.get(productName) || [];
        if (!productName.trim()) reasons.push('Пустое название товара');
        else if (!matches.length) reasons.push('Товар не найден');
        else if (matches.length > 1) reasons.push('Несколько товаров с таким названием');
        else if (!matches[0].id) reasons.push('Нет ID товара');
        if ((csvIndex.get(productName)?.length || 0) > 1) reasons.push('Название повторяется в CSV');
        let candidates = imageName ? imageIndex.get(imageName) || [] : [];
        if (imageName && !candidates.length) candidates = stemIndex.get(stem(imageName)) || [];
        const imageIssue = !imageName ? (hasDescription ? '' : 'Не указано имя изображения') :
            !candidates.length ? `Нет файла «${imageName}»` :
            candidates.length > 1 ? `Несколько файлов подходят для «${imageName}»` : '';
        if (imageIssue && !hasDescription) reasons.push(imageIssue);
        if (reasons.length) {
            skipped++;
            issues.push([i + 2, productName, row['Изображение'], 'Пропущено', reasons.join('; ')]);
        } else {
            const product = matches[0], file = imageIssue ? null : candidates[0];
            try {
                // Description and image are separate endpoints in the new API.
                if (hasDescription) {
                    await U.masterApi(`/products/${encodeURIComponent(product.id)}`, {
                        method: 'POST', body: { name: product.name, description: row['Описание'] }
                    });
                }
                if (file) {
                    const form = new FormData();
                    form.append('image', file, file.name);
                    await U.masterApi(`/products/${encodeURIComponent(product.id)}/upload_image`, { method: 'POST', body: form });
                }
                updated++;
                if (file) completed++;
                if (hasDescription) descriptions++;
                if (imageIssue) {
                    partial++;
                    issues.push([i + 2, productName, row['Изображение'], 'Описание обновлено; фото пропущено', imageIssue]);
                }
            } catch (error) {
                failed++;
                issues.push([i + 2, productName, row['Изображение'], 'Ошибка обновления', error.message || String(error)]);
            }
            // Keep the request interval even when the server rejects an individual upload.
            await U.wait(1200);
        }
        U.notify(`Импорт фото и описаний: ${i + 1}/${csv.length}. Загружено: ${completed}. Описаний: ${descriptions}. Частично: ${partial}. Пропущено: ${skipped}. Ошибок: ${failed}.`);
    }
    let message = `Импорт фото и описаний завершён. Обработано: ${csv.length}. Обновлено товаров: ${updated}. Загружено: ${completed}. Описаний: ${descriptions}. Частично: ${partial}. Пропущено: ${skipped}. Ошибок обновления: ${failed}.`;
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
