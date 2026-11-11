(() => {
    const U = window.LanSearchScripts;
    const types = ['auth', 'reserve_manual', 'reserve_mobile', 'reserve_multi', 'account', 'bonus_spend'];
    const blacklistHeaders = ['source_id', 'phone', 'block_type', 'comment', 'guest_message', 'block_duration', 'source_state', 'source_moderation', 'duration_raw', 'created_at', 'updated_at'];
    const notificationHeaders = ['source_id', 'type', 'status', 'message_type', 'title', 'message', 'message_for_admin', 'important', 'recipient_count', 'recipient_phones'];
    const parseHTML = text => new DOMParser().parseFromString(String(text ?? ''), 'text/html');
    // Text in API fields is not HTML. Only table cells are decoded.
    const cell = value => parseHTML(String(value ?? '').replace(/<br\s*\/?>/gi, '\n')).body.textContent.trim();
    const str = value => value == null ? '' : String(value);
    function phone(value) {
        const raw = str(value).trim();
        if (!/^\+?[\d ()\-\u00a0]+$/.test(raw)) throw new Error('Некорректный телефон');
        const digits = raw.replace(/\D/g, '');
        if (!/^\d{10,15}$/.test(digits)) throw new Error('Телефон должен содержать 10–15 цифр');
        // Never infer country codes or match only the last digits.
        return '+' + digits;
    }
    // Geographic calling codes, ITU E.164. Keep the national number intact;
    // do not use a fixed last-N-digits suffix (country codes have different lengths).
    const callingCodes = new Set(('1 7 20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 ' +
        '51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98 ' +
        '211 212 213 216 218 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 ' +
        '235 236 237 238 239 240 241 242 243 244 245 246 247 248 249 250 251 252 253 254 ' +
        '255 256 257 258 260 261 262 263 264 265 266 267 268 269 290 291 297 298 299 ' +
        '350 351 352 353 354 355 356 357 358 359 370 371 372 373 374 375 376 377 378 ' +
        '380 381 382 383 385 386 387 389 420 421 423 500 501 502 503 504 505 506 507 508 509 ' +
        '590 591 592 593 594 595 596 597 598 599 670 672 673 674 675 676 677 678 679 680 ' +
        '681 682 683 685 686 687 688 689 690 691 692 850 852 853 855 856 880 886 ' +
        '960 961 962 963 964 965 966 967 968 970 971 972 973 974 975 976 977 992 993 994 995 996 998').split(' '));
    function nationalPhone(value, assumeInternational = false) {
        const raw = str(value).trim();
        if (!/^\+?[\d ()\-\u00a0]+$/.test(raw)) throw new Error('Некорректный телефон');
        let digits = raw.replace(/\D/g, '');
        const international = raw.startsWith('+') || digits.startsWith('00') || assumeInternational;
        if (!raw.startsWith('+') && digits.startsWith('00')) digits = digits.slice(2);
        if (international) {
            if (digits.length > 15) throw new Error('Некорректная длина международного телефона');
            let code = '';
            for (let length = 1; length <= 3; length++) {
                if (callingCodes.has(digits.slice(0, length))) { code = digits.slice(0, length); break; }
            }
            if (!code) throw new Error('Неизвестный код страны: ' + raw);
            digits = digits.slice(code.length);
        }
        if (!/^\d{4,14}$/.test(digits)) throw new Error('Некорректный номер без кода страны');
        return digits;
    }
    function id(value) {
        const result = str(value);
        if (!/^[1-9]\d*$/.test(result)) throw new Error('Неожиданный ID записи');
        return result;
    }
    function token() {
        const meta = document.querySelector('meta[name="MASTER_TOKEN"]')?.content;
        if (meta) return meta;
        for (const name of ['token_master_api', 'token']) {
            const item = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
            if (item) return decodeURIComponent(item.slice(name.length + 1));
        }
        throw new Error('Не найден токен текущего сайта. Откройте страницу чёрного списка и повторите запуск.');
    }
    async function json(path, options = {}, master = false) {
        // No URL, host, token or guest ID from an imported CSV can set the request destination.
        const response = await U.request(path, {
            ...options, credentials: 'include', redirect: 'error', cache: 'no-store',
            headers: { accept: 'application/json', ...(master ? {
                authorization: 'Bearer ' + token(), 'content-type': 'application/json',
                language: document.querySelector('meta[name="language"]')?.content || 'ru'
            } : { 'x-requested-with': 'XMLHttpRequest', 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' }) }
        });
        let data;
        try { data = JSON.parse(await response.text()); }
        catch { throw new Error('Сервер вернул ответ не в формате JSON'); }
        if (!data || typeof data !== 'object' || data.error || data.status === false || data.status === 'error' ||
            data.success === false || data.ok === false || (data.error_code != null && data.error_code !== 0)) {
            throw new Error('Сервер отклонил запрос');
        }
        return data;
    }
    const form = values => {
        const data = new URLSearchParams();
        for (const [key, value] of Object.entries(values)) {
            if (Array.isArray(value)) value.forEach(item => data.append(key + '[]', str(item)));
            else data.set(key, str(value));
        }
        return data;
    };
    const post = (path, values) => json(path, { method: 'POST', body: form(values) });
    async function pages(path, { method = 'GET', master = false, names = [], filters = {}, key } = {}) {
        const rows = [], seen = new Set();
        let total;
        for (let page = 0; page < 10000; page++) {
            const params = form({ draw: page + 1, start: rows.length, length: 50, 'search[value]': '', 'search[regex]': false,
                'order[0][column]': master ? 1 : 5, 'order[0][dir]': 'desc', ...filters });
            names.forEach((name, i) => {
                const fields = { data: i, name, searchable: true, orderable: true, 'search][value': '', 'search][regex': false };
                for (const [field, value] of Object.entries(fields)) params.set(`columns[${i}][${field}]`, str(value));
            });
            const data = await json(method === 'GET' ? path + '?' + params : path,
                method === 'GET' ? {} : { method, body: params }, master);
            const rawCount = data.recordsFiltered ?? data.recordsTotal;
            const count = /^(?:0|[1-9]\d*)$/.test(str(rawCount)) ? Number(rawCount) : NaN;
            if (!Array.isArray(data.data) || !Number.isSafeInteger(count) || count < 0) throw new Error('Неожиданный формат таблицы');
            if (total !== undefined && count !== total) throw new Error('Список изменился во время загрузки. Повторите экспорт.');
            total = count;
            if ((!data.data.length && rows.length !== total) || rows.length + data.data.length > total) throw new Error('Получена неполная или лишняя страница таблицы');
            for (const row of data.data) {
                const identity = key ? key(row) : JSON.stringify(row);
                if (seen.has(identity)) throw new Error('Сервер повторил запись между страницами');
                seen.add(identity); rows.push(row);
            }
            if (rows.length === total) return rows;
        }
        throw new Error('Превышено ограничение числа страниц');
    }
    const normalizeDuration = value => str(value).trim().replace(/\s+/gu, ' ').toLowerCase();
    const isPermanent = value => ['бессрочно', 'бессрочная', 'бессрочная блокировка', 'permanent', 'indefinite'].includes(normalizeDuration(value));
    function duration(value) {
        const text = normalizeDuration(value);
        if (isPermanent(text)) return '0';
        const match = text.match(/^(\d+)(?:\s*(?:сутки|суток|день|дня|дней|days?))?$/u);
        if (!match || Number(match[1]) > 366) throw new Error('Срок не распознан: укажите block_duration числом суток (0 — бессрочно)');
        return String(Number(match[1]));
    }
    function blacklistRow(raw, type, moderation = 'unknown') {
        if (!raw || typeof raw !== 'object' || !Object.hasOwn(raw, '10')) throw new Error('Неожиданные колонки чёрного списка');
        const result = { source_id: id(raw[0]), phone: cell(raw[2]), block_type: type, comment: cell(raw[3]),
            guest_message: cell(raw[4]), source_state: str(raw[6]), source_moderation: moderation, duration_raw: cell(raw[8]),
            created_at: cell(raw[9]), updated_at: cell(raw[10]), block_duration: '' };
        try { result.block_duration = duration(result.duration_raw); } catch {}
        return result;
    }
    async function blacklist() {
        const response = await U.request('/black_list_phone/', { credentials: 'include', redirect: 'error', cache: 'no-store' });
        const doc = parseHTML(await response.text());
        if (!doc.getElementById('js-black-list-phone-table')) throw new Error('Не найдена таблица чёрного списка; проверьте вход на сайт');
        // Read the literal flag from the supplied page format; never execute inline scripts.
        const matches = [...doc.querySelectorAll('script:not([src])')].flatMap(script =>
            [...script.textContent.matchAll(/window\.MODERATED_ACTION_ADD_BLACK_LIST\s*=\s*(true|false)\s*;/g)].map(match => match[1]));
        const moderation = matches.length === 1 ? matches[0] : 'unknown';
        const result = [];
        for (const type of types) {
            U.notify(`Чёрный список: загрузка ${type}…`);
            const rows = await pages('/master_api/guest-blacklist/datatable/' + type, { master: true, key: row => id(row[0]) });
            result.push(...rows.map(row => blacklistRow(row, type, moderation)));
        }
        return result;
    }
    function blacklistBody(row) {
        if (!types.includes(row.block_type)) throw new Error('Неизвестный тип блокировки');
        if (row.source_state !== 'approved' && !(row.source_state === 'created' && row.source_moderation === 'false')) throw new Error('Запись не одобрена: состояние ' + (row.source_state || 'пусто'));
        if (!str(row.comment).trim()) throw new Error('Не заполнен комментарий');
        // Compatibility with CSV exported before the full permanent label was recognized.
        // An explicit duration always wins; unknown/empty raw values never imply permanent.
        const days = !str(row.block_duration).trim() && isPermanent(row.duration_raw)
            ? '0' : duration(row.block_duration);
        return { phone: phone(row.phone), comment: str(row.comment), guest_message: str(row.guest_message),
            block_duration: days === '0' ? 0 : days, block_type: row.block_type };
    }
    function notificationRef(row) {
        const values = Array.isArray(row) ? row : Object.values(row || {});
        for (const value of values) {
            if (typeof value !== 'string') continue;
            const el = parseHTML(value).querySelector('.show_message[data-id]');
            if (el) {
                const type = el.getAttribute('data-type') || 'push';
                if (!['push', 'lost_item'].includes(type)) throw new Error('Неизвестный тип уведомления');
                return { id: id(el.getAttribute('data-id')), type, label: el.textContent.trim() };
            }
        }
        throw new Error('Не найдены ID и тип уведомления в строке таблицы');
    }
    async function notificationList() {
        // Only active required (lost_item) notifications are transferable; filter the API list client-side.
        const U = window.LanSearchScripts;
        const result = [], seen = new Set();
        for (let page = 1; page <= 1000; page++) {
            const json = await U.masterApi(`/guests/notifications/list?` + new URLSearchParams({ page: String(page), onpage: '100', order_dir: 'desc', for_export: '0' }));
            const batch = Array.isArray(json.items) ? json.items : null;
            if (!batch) throw new Error('Неожиданный формат списка уведомлений');
            for (const item of batch) {
                if (item.source_type !== 'lost_item' || item.message_type_code !== 'required' || item.status_code !== 'active') continue;
                const ref = { id: id(item.id), type: 'lost_item', label: String(item.title ?? '').trim() };
                if (seen.has(ref.type + ':' + ref.id)) throw new Error('Сервер повторил уведомление между страницами');
                seen.add(ref.type + ':' + ref.id);
                result.push(ref);
            }
            const last = Number(json.pagination?.last_page);
            if (!batch.length || (Number.isFinite(last) && page >= last)) return result;
        }
        throw new Error('Превышено ограничение числа страниц уведомлений');
    }
    // Recipient exports may be delimited with ; , or TAB. Unknown formats fail closed.
    function delimited(source, delimiter) {
        const rows = []; let row = [], value = '', quoted = false, closed = false;
        const end = () => { row.push(value); value = ''; closed = false; };
        const line = () => { end(); if (row.some(x => x !== '')) rows.push(row); row = []; };
        const text = source.replace(/^\uFEFF/, '');
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (quoted) {
                if (c === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } }
                else value += c;
            } else if (c === delimiter) end();
            else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; line(); }
            else if (c === '"') { if (value || closed) throw new Error('Некорректный CSV адресатов'); quoted = true; }
            else { if (closed) throw new Error('Некорректный CSV адресатов'); value += c; }
        }
        if (quoted) throw new Error('Некорректный CSV адресатов');
        if (value || row.length || closed) line();
        return rows;
    }
    function recipientCSV(text, expected) {
        for (const separator of [';', ',', '\t']) {
            let rows;
            try { rows = delimited(text, separator); } catch { continue; }
            if (!rows.length) continue;
            const headers = rows.shift().map(x => x.trim().toLowerCase());
            const columns = headers.map((x, i) => ['phone', 'телефон', 'номер телефона'].includes(x) ? i : -1).filter(i => i >= 0);
            if (columns.length !== 1) continue;
            if (rows.some(row => row.length !== headers.length)) throw new Error('Неполный CSV адресатов');
            return checkedPhones(rows.map(row => row[columns[0]]), expected);
        }
        throw new Error('Выгрузка адресатов не является CSV с колонкой «Телефон»/phone');
    }
    function checkedPhones(values, expected) {
        if (!Number.isSafeInteger(expected) || expected < 1 || values.length !== expected) throw new Error('Список получателей неполный или пустой');
        const normalized = values.map(phone);
        if (new Set(normalized).size !== normalized.length) throw new Error('Несколько получателей имеют один телефон');
        return normalized.sort();
    }
    async function notification(ref) {
        const json = await U.masterApi(`/guests/notifications/lost-items/${encodeURIComponent(ref.id)}`);
        const item = json.item;
        if (!item || id(item.id) !== ref.id) throw new Error('Получены данные другого уведомления');
        if (item.message_type_code !== 'required' || item.status_code !== 'active') throw new Error('Переносятся только активные обязательные сообщения');
        const count = Number(item.recipients_count);
        if (!Number.isSafeInteger(count) || count < 1) throw new Error('Сервер не указал полное число получателей');
        if (item.recipients_truncated) throw new Error(`Уведомление ${ref.id}: список получателей усечён (${count}); перенос таких уведомлений пока не поддержан`);
        const phones = checkedPhones((Array.isArray(item.recipients) ? item.recipients : []).map(guest => guest.phone), count);
        const row = { source_id: ref.id, type: 'lost_item', status: 'active', message_type: 'required',
            title: '', message: str(item.message), message_for_admin: str(item.message_for_admin),
            important: 'normal', recipient_count: String(count), recipient_phones: JSON.stringify(phones) };
        validateNotification(row);
        return row;
    }
    function validateNotification(row, { national = false } = {}) {
        if (row.type !== 'lost_item' || row.status !== 'active' || row.message_type !== 'required') throw new Error('Переносятся только активные обязательные сообщения');
        if (row.title !== '' || row.important !== 'normal') throw new Error('Неожиданные поля обязательного уведомления');
        if (!str(row.message_for_admin).trim()) throw new Error('Не заполнено сообщение для администратора');
        let values;
        try { values = JSON.parse(row.recipient_phones); } catch { throw new Error('recipient_phones должен содержать JSON-массив телефонов'); }
        if (!Array.isArray(values)) throw new Error('recipient_phones должен содержать массив');
        if (!national) return checkedPhones(values, Number(row.recipient_count));
        const count = Number(row.recipient_count);
        if (!Number.isSafeInteger(count) || count < 1 || values.length !== count) throw new Error('Список получателей неполный или пустой');
        const phones = values.map(value => nationalPhone(value));
        if (new Set(phones).size !== phones.length) throw new Error('Телефоны получателей совпали после удаления кода страны');
        return phones.sort();
    }
    const fingerprint = row => JSON.stringify([row.type, row.message_for_admin, row.message, validateNotification(row, { national: true })]);
    async function resolvePhone(value) {
        const normalized = nationalPhone(value);
        const json = await U.masterApi(`/messages_control/users/find?` + new URLSearchParams({ q: normalized }));
        const data = Array.isArray(json) ? json : json.items || json.data || (json.item ? [json.item] : []);
        if (!Array.isArray(data)) throw new Error('Неожиданный результат поиска гостей');
        const ids = new Set();
        for (const guest of data) {
            let matches = false;
            try { matches = nationalPhone(guest.phone) === normalized; } catch {}
            // The API may return either a national number or a full number without '+'.
            // Collect all exact matches in either form, never just the first search hit.
            if (!matches) {
                try { matches = nationalPhone(guest.phone, true) === normalized; } catch {}
            }
            if (matches) ids.add(id(guest.guest_id ?? guest.id));
        }
        if (ids.size !== 1) throw new Error(ids.size ? 'Неоднозначный телефон: ' + normalized : 'Гость не найден: ' + normalized);
        return [...ids][0];
    }
    function toCSV(headers, rows) { return [headers, ...rows.map(row => headers.map(key => row[key] ?? ''))]; }
    function report(rows, filename) {
        try {
            U.downloadCSV([['Запись / ID', 'Телефон / название', 'Тип', 'Результат', 'Причина'], ...rows], filename);
            return '\nОтчёт: ' + filename;
        } catch {
            console.table(rows);
            return '\nСкачать отчёт не удалось; полный список находится в консоли.';
        }
    }
    function showIssues(rows, title) {
        if (!rows.length) return;
        document.getElementById('lansearch-guest-transfer-report')?.remove();
        const host = document.createElement('div'); host.id = 'lansearch-guest-transfer-report';
        host.style.cssText = 'position:fixed;inset:6vh 5vw;z-index:2147483646;';
        const root = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = ':host{font:14px/1.5 sans-serif;color:#eee}section{background:#222;border:1px solid #888;border-radius:10px;padding:20px;max-height:80vh;overflow:auto}table{border-collapse:collapse;width:100%}td,th{padding:7px;border-bottom:1px solid #666;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}button{float:right;padding:6px 12px}h2{font-size:18px;margin-top:0}';
        const box = document.createElement('section'); const button = document.createElement('button'); button.textContent = 'Закрыть';
        button.addEventListener('click', () => host.remove()); const h = document.createElement('h2'); h.textContent = title;
        box.append(button, h); const table = document.createElement('table');
        for (const values of [['Запись / ID', 'Телефон / название', 'Тип', 'Результат', 'Причина'], ...rows]) {
            const tr = document.createElement('tr');
            for (const value of values) { const td = document.createElement('td'); td.textContent = str(value); tr.appendChild(td); }
            table.appendChild(tr);
        }
        box.appendChild(table); root.append(style, box); document.documentElement.appendChild(host);
    }
    async function createBlacklist(body) {
        const data = await json('/master_api/guest-blacklist/', { method: 'POST', body: JSON.stringify(body) }, true);
        if (data.error_code !== 0) throw new Error('Нет подтверждения создания: проверьте запись на сайте');
    }
    async function sendNotification(row, ids) {
        await U.masterApi('/guests/notifications', {
            method: 'POST',
            body: {
                message_type: 'required', target_by: 'by_guests', targets: ids.map(Number),
                gender: 'any_gender', message: row.message, message_for_admin: row.message_for_admin
            }
        });
    }
    window.LanSearchGuestTransfer = { types, blacklistHeaders, notificationHeaders, phone, nationalPhone, id, duration, pages, json,
        blacklistRow, blacklist, blacklistBody, notificationRef, notificationList, notification, validateNotification,
        checkedPhones, recipientCSV, resolvePhone, fingerprint, createBlacklist, sendNotification, toCSV, report, showIssues };
})();
