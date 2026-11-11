(() => {
    if (window.LanSearchScripts) return;
    let state = null;
    let transferTimer;
    const isCancelled = () => !!(state && state.cancelled);
    const stop = () => {
        if (!state) return { ok: false, error: 'Нет активного запуска' };
        if (state.phase === 'preparing') {
            clearTimeout(transferTimer);
            state = null;
            notify('Подготовка отменена.');
            return { ok: true, message: 'Подготовка отменена' };
        }
        state.cancelled = true;
        notify('Останавливаю после текущего шага…');
        return { ok: true, message: 'Останавливаю после текущего шага' };
    };
    const wait = ms => new Promise((resolve, reject) => setTimeout(
        () => (isCancelled() ? reject(new Error('Остановлено пользователем')) : resolve()),
        ms
    ));
    const notify = message => {
        let box = document.getElementById('lansearch-script-status');
        if (!box) {
            box = document.createElement('div');
            box.id = 'lansearch-script-status';
            box.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;max-width:420px;padding:14px;background:#212121;color:white;border:1px solid #888;border-radius:10px;font:14px/1.5 sans-serif;white-space:pre-wrap;';
            box.setAttribute('role', 'status');
            const text = document.createElement('span');
            const stopButton = document.createElement('button');
            stopButton.textContent = 'Стоп'; stopButton.title = 'Остановить выполнение';
            stopButton.style.cssText = 'margin-left:12px;cursor:pointer;';
            stopButton.addEventListener('click', stop);
            const close = document.createElement('button');
            close.textContent = '×'; close.title = 'Скрыть статус';
            close.style.cssText = 'margin-left:12px;cursor:pointer;';
            close.addEventListener('click', () => box.remove());
            box.append(text, stopButton, close);
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
        if (isCancelled()) throw new Error('Остановлено пользователем');
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
    async function masterApi(path, { method = 'GET', body } = {}) {
        if (isCancelled()) throw new Error('Остановлено пользователем');
        const readMeta = source => ({
            token: source.querySelector('meta[name="MASTER_TOKEN"]')?.content || '',
            base: source.querySelector('meta[name="MASTER_API_URL"]')?.content || ''
        });
        let { token, base } = readMeta(document);
        if (!token || !base) {
            // The club pages carry the meta tags; fetch one when the current page lacks them.
            const response = await request('/products_list/', { cache: 'no-store' });
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            ({ token, base } = readMeta(doc));
        }
        if (!token) token = localStorage.token_master_api || localStorage.token ||
            document.cookie.match(/(?:^|;\s*)token_master_api=([^;]+)/)?.[1] || document.cookie.match(/(?:^|;\s*)token=([^;]+)/)?.[1] || '';
        if (!token) throw new Error('Не найден токен master_api. Откройте страницу товаров клуба и повторите.');
        if (!base) base = new URL('/master_api/', location.href).href;
        const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
        const response = await fetch(base.replace(/\/+$/, '') + path, {
            method, credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + token,
                Language: document.querySelector('meta[name="language"]')?.content || 'ru',
                ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {})
            },
            body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
        const json = await response.json().catch(() => null);
        if (!json || typeof json !== 'object') throw new Error('master_api вернул не-JSON ответ');
        if (json.error_code) throw new Error(json.error_message || `Ошибка master_api (код ${json.error_code})`);
        return json;
    }
    async function clubProducts(clubId) {
        const items = [];
        for (let page = 1; page <= 1000; page++) {
            const json = await masterApi(`/products/configuration/club/${encodeURIComponent(clubId)}/list?` +
                new URLSearchParams({ page: String(page), onpage: '50', order_by: 'sort', order_dir: 'asc', for_export: '0' }));
            const batch = Array.isArray(json.items) ? json.items : null;
            if (!batch) throw new Error('Неожиданный формат списка товаров master_api');
            items.push(...batch);
            const last = Number(json.pagination?.last_page);
            if (!batch.length || (Number.isFinite(last) && page >= last)) return items;
        }
        throw new Error('Превышено ограничение числа страниц товаров');
    }
    function listDialog({ title = 'Список', message = '', headers = [], rows = [], filename = '' }) {
        // Non-blocking modal with a scrollable table; the page keeps working underneath.
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:block';
        const shadow = host.attachShadow({ mode: 'open' });
        const node = (tag, text, cls) => {
            const el = document.createElement(tag);
            if (text !== undefined) el.textContent = text;
            if (cls) el.className = cls;
            return el;
        };
        const style = node('style');
        style.textContent = ':host{color-scheme:dark}*{box-sizing:border-box}.overlay{position:absolute;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.45 system-ui;color:#eee}.panel{background:#212121;border:1px solid #555;border-radius:12px;width:760px;max-width:100%;max-height:85vh;display:flex;flex-direction:column;padding:20px}h2{font-size:18px;margin:0 0 8px}p{margin:0 0 12px;color:#bbb}.list{overflow:auto;min-height:0}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:7px 10px;border:1px solid #555;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{position:sticky;top:0;background:#303030}tr:nth-child(even) td{background:#262626}.actions{display:flex;gap:10px;justify-content:flex-end;padding-top:14px}button{padding:9px 14px;font:inherit;color:#eee;background:#333;border:1px solid #777;border-radius:6px;cursor:pointer}button:focus-visible{outline:2px solid white;outline-offset:2px}';
        const overlay = node('div', undefined, 'overlay');
        const panel = node('section', undefined, 'panel');
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', title);
        panel.append(node('h2', title));
        if (message) panel.append(node('p', message));
        const list = node('div', undefined, 'list'), table = node('table');
        const head = node('thead'), body = node('tbody'), heading = node('tr');
        for (const value of headers) heading.append(node('th', value));
        head.append(heading);
        for (const row of rows) {
            const tr = node('tr');
            for (const value of row) tr.append(node('td', String(value)));
            body.append(tr);
        }
        table.append(head, body); list.append(table); panel.append(list);
        const actions = node('div', undefined, 'actions');
        const close = node('button', 'Закрыть'); close.type = 'button';
        const previous = document.activeElement;
        const dismiss = () => { host.remove(); previous?.focus?.(); };
        if (filename) {
            const download = node('button', 'Скачать CSV'); download.type = 'button';
            download.addEventListener('click', () => downloadCSV([headers, ...rows], filename));
            actions.append(download);
        }
        close.addEventListener('click', dismiss);
        panel.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
        });
        actions.append(close); panel.append(actions);
        overlay.append(panel); shadow.append(style, overlay); document.documentElement.append(host); close.focus();
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
        const result = [];
        for (let page = 1; page <= 10000; page++) {
            const json = await masterApi('/products/list?' + new URLSearchParams({ page: String(page), onpage: '100', order_by: 'name', order_dir: 'asc', for_export: '0' }));
            const batch = Array.isArray(json.items) ? json.items : null;
            if (!batch) throw new Error('Неожиданный формат списка товаров');
            for (const item of batch) {
                result.push({
                    id: String(item.id ?? ''),
                    name: String(item.name ?? '').trim(),
                    description: String(item.description ?? '').trim(),
                    image: item.image_url || ''
                });
            }
            const last = Number(json.pagination?.last_page);
            if (!batch.length || (Number.isFinite(last) && page >= last)) return result;
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
            current.phase = 'running'; current.cancelled = false; clearTimeout(transferTimer);
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
        stop, wait, notify, parseCSV, records, csv, download, downloadCSV, request, api, masterApi, clubProducts, listDialog, htmlText, number, uniqueIndex, products
    };
})();
