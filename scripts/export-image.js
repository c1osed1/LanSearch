window.LanSearchScripts.run('export-image', async () => {
    const U = window.LanSearchScripts;
    if (typeof JSZip === 'undefined') throw new Error('Не загружена локальная библиотека JSZip');
    const products = await U.products();
    if (!products.length) throw new Error('Не найдены товары для экспорта');
    const zip = new JSZip();
    const rows = [['Название', 'Изображение']];
    for (let i = 0; i < products.length; i++) {
        const item = products[i];
        if (!item.image) continue;
        U.notify(`Скачивание изображений: ${i + 1}/${products.length}`);
        const url = new URL(item.image, location.origin + '/products/');
        const response = await U.request(url.href);
        const blob = await response.blob();
        const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/bmp': 'bmp' };
        const ext = extensions[blob.type.split(';')[0]] || url.pathname.match(/\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i)?.[1] || 'bin';
        if (/text\/html/i.test(blob.type)) throw new Error(`Вместо изображения получена HTML-страница (${item.name})`);
        // Prefix guarantees uniqueness even when sanitized names collide.
        const name = `${String(i + 1).padStart(6, '0')}_${item.name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 100) || 'image'}.${ext}`;
        zip.file(name, await blob.arrayBuffer());
        rows.push([item.name, name]);
    }
    if (rows.length === 1) throw new Error('У товаров нет изображений');
    // The same CSV is included in the ZIP, so a blocked second download does not lose the mapping.
    zip.file('products.csv', U.csv(rows));
    const archive = await zip.generateAsync({ type: 'blob' });
    U.download(archive, 'images.zip');
    U.downloadCSV(rows, 'products.csv');
    return `Выгружено изображений: ${rows.length - 1}. products.csv также находится внутри ZIP.`;
});
