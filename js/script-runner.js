class ScriptRunner {
    static parameters(script, saved = {}) {
        const params = {};
        for (const field of script.fields || []) {
            if (field.type === 'file' || field.type === 'directory') continue;
            let value = saved[field.id] ?? field.default ?? '';
            if (field.type === 'number') {
                if (value === '') {
                    if (field.required) throw new Error(`Заполните: ${field.label}`);
                } else {
                    value = Number(value);
                    if (!Number.isFinite(value) || (field.integer && !Number.isInteger(value)) ||
                        (field.min !== undefined && value < field.min) ||
                        (field.max !== undefined && value > field.max)) {
                        throw new Error(`Некорректное значение: ${field.label}`);
                    }
                }
            } else if (field.type === 'checkbox') {
                value = value === true || value === 'true';
            } else {
                value = String(value);
                if (field.required && !value.trim()) throw new Error(`Заполните: ${field.label}`);
            }
            params[field.id] = value;
        }
        return params;
    }

    static async run(script, saved = {}, files = {}) {
        if (!/^scripts\/[a-z0-9-]+\.js$/.test(script.file)) throw new Error('Некорректный путь скрипта');
        const params = this.parameters(script, saved);
        for (const field of script.fields || []) {
            if (field.required && ['file', 'directory'].includes(field.type) &&
                (!files[field.id] || (field.type === 'directory' && !files[field.id].length))) {
                throw new Error(`Выберите: ${field.label}`);
            }
        }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !/^https?:\/\//i.test(tab.url || '')) {
            throw new Error('Откройте страницу клуба (http/https) и повторите запуск');
        }
        let target = { tabId: tab.id, frameIds: [0] };
        const inject = data => chrome.scripting.executeScript({ target, world: 'ISOLATED', ...data });
        const id = crypto.randomUUID();
        let acquired = false;
        try {
            const installed = await inject({ files: ['scripts/script-runtime.js'] });
            if (installed[0]?.documentId) target = { tabId: tab.id, documentIds: [installed[0].documentId] };
            const initial = await inject({
                func: (id, scriptId, params) => window.LanSearchScripts.begin(id, scriptId, params),
                args: [id, script.id, params]
            });
            if (!initial[0]?.result?.ok) throw new Error(initial[0]?.result?.error || 'Не удалось подготовить запуск');
            acquired = true;
            // File cannot be passed as an executeScript argument. Transfer small JSON-safe chunks.
            for (const field of script.fields || []) {
                if (!['file', 'directory'].includes(field.type)) continue;
                const selected = field.type === 'directory' ? Array.from(files[field.id] || []) : [files[field.id]].filter(Boolean);
                for (const file of selected) {
                    const begin = await inject({
                        func: (id, key, meta, multiple) => window.LanSearchScripts.startFile(id, key, meta, multiple),
                        args: [id, field.id, { name: file.name, type: file.type, lastModified: file.lastModified, relativePath: file.webkitRelativePath || '' }, field.type === 'directory']
                    });
                    if (!begin[0]?.result?.ok) throw new Error(begin[0]?.result?.error || 'Не удалось передать файл');
                    for (let offset = 0; offset < file.size; offset += 256 * 1024) {
                        const bytes = new Uint8Array(await file.slice(offset, offset + 256 * 1024).arrayBuffer());
                        let binary = '';
                        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
                        const chunk = await inject({
                            func: (id, data) => window.LanSearchScripts.fileChunk(id, data),
                            args: [id, btoa(binary)]
                        });
                        if (!chunk[0]?.result?.ok) throw new Error(chunk[0]?.result?.error || 'Передача файла прервана');
                    }
                    const end = await inject({ func: id => window.LanSearchScripts.endFile(id), args: [id] });
                    if (!end[0]?.result?.ok) throw new Error(end[0]?.result?.error || 'Не удалось восстановить файл');
                }
            }
            if (script.id === 'export-image') await inject({ files: ['scripts/vendor/jszip.min.js'] });
            if (['export-global-menu', 'import-global-menu'].includes(script.id)) {
                await inject({ files: ['scripts/global-menu-common.js'] });
            }
            // The last expression of each script is a Promise. Chrome waits for completion.
            const results = await inject({ files: [script.file] });
            const result = results.find(item => item.frameId === 0)?.result;
            if (!result?.ok) throw new Error(result?.error || 'Скрипт не вернул результат выполнения');
            return result;
        } finally {
            if (acquired) {
                await inject({ func: id => window.LanSearchScripts?.release(id), args: [id] }).catch(() => {});
            }
        }
    }
}
