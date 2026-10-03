(() => {
    if (window.LanSearchScripts) return;
    let state = null;
    let transferTimer;
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const notify = message => {
        let box = document.getElementById('lansearch-script-status');
        if (!box) {
            box = document.createElement('div');
            box.id = 'lansearch-script-status';
            box.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;max-width:420px;padding:14px;background:#212121;color:white;border:1px solid #888;border-radius:10px;font:14px/1.5 sans-serif;white-space:pre-wrap;';
            box.setAttribute('role', 'status');
            const text = document.createElement('span');
            const close = document.createElement('button');
            close.textContent = '×'; close.title = 'Скрыть статус';
            close.style.cssText = 'margin-left:12px;cursor:pointer;';
            close.addEventListener('click', () => box.remove());
            box.append(text, close);
            document.documentElement.appendChild(box);
        }
        box.firstChild.textContent = `LanSearch: ${message}`;
    };
    const touch = () => {
        clearTimeout(transferTimer);
        transferTimer = setTimeout(() => {
            if (state?.phase === 'preparing') { state = null; notify('Подготовка прервана. Откройте расширение и повторите запуск.'); }
        }, 120000);
    };
    const transfer = (id, action) => {
        try {
            if (state?.id !== id || state.phase !== 'preparing') throw new Error('Подготовка запуска прервана');
            touch(); action(); return { ok: true };
        } catch (error) { return { ok: false, error: error.message }; }
    };
    function parseCSV(source) {
        const text = String(source).replace(/^\uFEFF/, '');
        const rows = []; let row = [], cell = '', quoted = false, closed = false;
        const endCell = () => { row.push(cell); cell = ''; closed = false; };
        const endRow = () => { endCell(); if (row.some(value => value !== '')) rows.push(row); row = []; };
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (quoted) {
                if (char === '"') {
                    if (text[i + 1] === '"') { cell += '"'; i++; }
                    else { quoted = false; closed = true; }
                } else cell += char;
            } else if (char === ';') endCell();
            else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; endRow(); }
            else if (char === '"') {
                if (cell || closed) throw new Error('Некорректные кавычки в CSV');
                quoted = true;
            } else {
                if (closed) throw new Error('Лишние символы после кавычек в CSV');
                cell += char;
            }
        }
        if (quoted) throw new Error('Незакрытая кавычка в CSV');
        if (cell || row.length || closed) endRow();
        return rows;
    }
    function records(text, required) {
        const rows = parseCSV(text);
        if (!rows.length) throw new Error('CSV пуст');
        const headers = rows.shift().map(key => key.trim());
        if (new Set(headers).size !== headers.length || headers.some(key => !key)) throw new Error('Пустые или повторяющиеся заголовки CSV');
        for (const key of required) if (!headers.includes(key)) throw new Error(`В CSV отсутствует колонка «${key}»`);
        return rows.map((row, index) => {
            if (row.length !== headers.length) throw new Error(`CSV: неверное число колонок в записи ${index + 2}`);
            return Object.fromEntries(headers.map((key, i) => [key, row[i]]));
        });
    }
    const csv = rows => '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const download = (blob, name) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.documentElement.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    };
    const downloadCSV = (rows, name) => download(new Blob([csv(rows)], { type: 'text/csv;charset=utf-8' }), name);
    async function request(url, options = {}) {
        const response = await fetch(url, { credentials: 'include', ...options });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${new URL(url, location.href).pathname}`);
        if (response.redirected && /\/(?:login|auth)(?:\/|\?|$)/i.test(response.url)) throw new Error('Сайт требует входа. Обновите страницу клуба.');
        return response;
    }
    async function api(url, options = {}) {
        const response = await request(url, options);
        const text = await response.text();
        if (/^\s*(?:<!doctype\s+html|<html)/i.test(text)) throw new Error('Вместо ответа API получена HTML-страница');
        let data;
        try { data = JSON.parse(text); } catch { return text; }
        if (data && (data.success === false || data.ok === false || data.status === 'error' ||
            (data.error && data.error !== false))) throw new Error('Сервер сообщил об ошибке операции');
        return data;
    }
    const htmlText = html => {
        const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
        return doc.body.textContent.trim();
    };
    const number = (value, label, { integer = false, min = -Infinity } = {}) => {
        const source = String(value ?? '').trim().replace(',', '.');
        const result = Number(source);
        if (!source || !Number.isFinite(result) || result < min || (integer && !Number.isInteger(result))) throw new Error(`Некорректное число: ${label}`);
        return result;
    };
    const uniqueIndex = (items, getKey) => {
        const index = new Map();
        for (const item of items) {
            const key = getKey(item);
            if (index.has(key)) throw new Error(`Неоднозначное совпадение: ${key}`);
            index.set(key, item);
        }
        return index;
    };
    async function products() {
        const result = []; const seen = new Set(); const perPage = 50;
        for (let page = 0; page < 10000; page++) {
            const params = new URLSearchParams({ draw: String(page + 1), start: String(page * perPage), length: String(perPage), 'search[value]': '', 'search[regex]': 'false', _: String(Date.now()) });
            for (let i = 0; i < 8; i++) {
                for (const [key, value] of Object.entries({ data: i, name: '', searchable: 'true', orderable: 'false', 'search][value': '', 'search][regex': 'false' })) {
                    params.append(`columns[${i}][${key}]`, String(value));
                }
            }
            const response = await request('/products/server_processing.php?' + params);
            const json = await response.json();
            if (!Array.isArray(json.data)) throw new Error('Неожиданный формат списка товаров');
            if (!json.data.length) return result;
            const signature = JSON.stringify(json.data);
            if (seen.has(signature)) throw new Error('Сервер повторяет страницу товаров; выгрузка остановлена');
            seen.add(signature);
            for (const row of json.data) {
                const doc = new DOMParser().parseFromString(String(row['3'] || ''), 'text/html');
                result.push({ id: row.DT_RowAttr?.['data-id'], name: htmlText(row['1']), description: htmlText(row['2']), image: doc.querySelector('img')?.getAttribute('src') || '' });
            }
            const total = Number(json.recordsFiltered ?? json.recordsTotal);
            if (Number.isFinite(total) && result.length >= total) return result;
        }
        throw new Error('Превышено ограничение числа страниц товаров');
    }
    window.LanSearchScripts = {
        begin(id, scriptId, params) {
            if (state) return { ok: false, error: `На этой странице уже выполняется ${state.scriptId}` };
            state = { id, scriptId, params, files: {}, phase: 'preparing' }; touch();
            notify('Подготовка скрипта и файлов…'); return { ok: true };
        },
        startFile(id, key, meta, multiple) { return transfer(id, () => { state.file = { key, meta, multiple, chunks: [] }; }); },
        fileChunk(id, base64) {
            return transfer(id, () => {
                if (!state.file) throw new Error('Нет принимаемого файла');
                state.file.chunks.push(Uint8Array.from(atob(base64), char => char.charCodeAt(0)));
            });
        },
        endFile(id) {
            return transfer(id, () => {
                const { key, meta, multiple, chunks } = state.file;
                const file = new File(chunks, meta.name, { type: meta.type, lastModified: meta.lastModified });
                Object.defineProperty(file, 'webkitRelativePath', { value: meta.relativePath });
                if (multiple) (state.files[key] ||= []).push(file); else state.files[key] = file;
                delete state.file;
            });
        },
        release(id) {
            // A vanished popup must never unlock a running mutation.
            if (state?.id === id && state.phase !== 'running') { clearTimeout(transferTimer); state = null; notify('Подготовка отменена. Проверьте сообщение в окне расширения.'); }
        },
        async run(scriptId, callback) {
            if (!state || state.scriptId !== scriptId || state.phase !== 'preparing') return { ok: false, error: 'Запускайте скрипт через расширение' };
            const current = state;
            current.phase = 'running'; clearTimeout(transferTimer);
            let result;
            try {
                notify(`Выполняется ${scriptId}…`);
                const message = await callback({ params: current.params, files: current.files });
                result = { ok: true, message: message || 'Выполнено' };
                notify(result.message);
            } catch (error) {
                console.error(`[LanSearch ${scriptId}]`, error);
                result = { ok: false, error: error.message || String(error) };
                notify(`Ошибка: ${result.error}`);
            } finally { if (state === current) state = null; }
            return result;
        },
        wait, notify, parseCSV, records, csv, download, downloadCSV, request, api, htmlText, number, uniqueIndex, products
    };
})();
