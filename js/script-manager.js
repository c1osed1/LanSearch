class ScriptManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scripts = [];
        this.cards = new Map();
        this.runtimeFiles = new Map();
        this.running = false;
        this.viewToken = 0;
        this.query = '';
        this.catalogScroll = 0;
    }

    element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    button(text, className, handler) {
        const node = this.element('button', className, text);
        node.type = 'button';
        node.addEventListener('click', handler);
        return node;
    }

    static normalize(value) {
        return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
    }

    static objects(scripts) {
        const objects = new Map();
        for (const script of scripts) {
            const meta = script.catalog || {};
            const id = meta.id || script.id;
            if (!objects.has(id)) objects.set(id, {
                id, name: meta.name || script.name, category: meta.category || 'Другие операции', scripts: []
            });
            objects.get(id).scripts.push(script);
        }
        return [...objects.values()];
    }

    static matches(object, query) {
        const text = ScriptManager.normalize([object.name, object.category, ...object.scripts.flatMap(script => [
            script.name, script.description, script.catalog?.action, ...(script.catalog?.keywords || [])
        ])].join(' '));
        return ScriptManager.normalize(query).split(' ').filter(Boolean).every(word => text.includes(word));
    }

    async load() {
        try {
            const response = await fetch(chrome.runtime.getURL('scripts.json'));
            if (!response.ok) throw new Error(`scripts.json: HTTP ${response.status}`);
            this.scripts = await response.json();
            if (!Array.isArray(this.scripts)) throw new Error('scripts.json должен содержать массив');
            const ids = new Set();
            for (const script of this.scripts) {
                if (!script.id || ids.has(script.id) || !script.file || !Array.isArray(script.fields)) {
                    throw new Error('Некорректное описание или повторяющийся ID скрипта');
                }
                ids.add(script.id);
            }
            this.objects = ScriptManager.objects(this.scripts);
            this.render();
        } catch (error) {
            console.error(error);
            this.container.textContent = `Ошибка загрузки скриптов: ${error.message}`;
        }
    }

    render() {
        this.container.replaceChildren();
        this.container.classList.add('lsc-root');
        this.scroller = this.container.closest('.tab-content') || this.container;
        this.busy = this.button('', 'favorite-btn secondary lsc-busy', () => {
            if (this.activeRun) this.openObject(this.objectFor(this.activeRun), this.activeRun);
        });
        this.busy.hidden = true;
        this.catalog = this.element('section', 'lsc-catalog');
        const header = this.element('div', 'lsc-catalog-header');
        const titleRow = this.element('div', 'lsc-title-row');
        titleRow.append(this.element('h2', 'favorite-item-name lsc-title', 'Каталог скриптов'),
            this.element('span', 'favorite-item-meta lsc-total', `${this.objects.length} объектов · ${this.scripts.length} действий`));
        const searchRow = this.element('div', 'lsc-search-row');
        this.search = this.element('input', 'search-input lsc-search');
        this.search.type = 'search';
        this.search.placeholder = 'Найти объект или действие…';
        this.search.setAttribute('aria-label', 'Поиск скриптов по объекту или действию');
        this.search.value = this.query;
        this.clear = this.button('Сбросить', 'favorite-btn secondary lsc-clear', () => {
            this.search.value = ''; this.query = ''; this.filter(); this.search.focus();
        });
        this.search.addEventListener('input', () => { this.query = this.search.value; this.filter(); });
        this.search.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.stopPropagation(); this.clear.click(); }
        });
        searchRow.append(this.search, this.clear);
        this.found = this.element('div', 'search-results-count lsc-found');
        this.found.setAttribute('role', 'status');
        header.append(titleRow, searchRow, this.found);
        this.list = this.element('div', 'lsc-objects');
        this.catalog.append(header, this.list);
        this.detail = this.element('section', 'lsc-detail');
        this.detail.hidden = true;
        this.container.append(this.busy, this.catalog, this.detail);
        this.filter();
    }

    filter() {
        this.clear.hidden = !this.query;
        this.list.replaceChildren();
        const objects = this.objects.filter(object => ScriptManager.matches(object, this.query));
        this.found.hidden = !this.query;
        this.found.textContent = `Найдено объектов: ${objects.length}`;
        const categories = new Map();
        for (const object of objects) {
            if (!categories.has(object.category)) {
                const group = this.element('section', 'lsc-group');
                group.appendChild(this.element('h3', 'favorite-item-meta lsc-category', object.category));
                categories.set(object.category, group);
                this.list.appendChild(group);
            }
            const row = this.button('', 'favorite-item lsc-object', () => this.openObject(object));
            row.dataset.object = object.id;
            const copy = this.element('span', 'lsc-object-copy');
            copy.append(this.element('span', 'favorite-item-name lsc-object-name', object.name),
                this.element('span', 'favorite-item-meta lsc-object-actions', object.scripts.map(script => this.actionName(script)).join(' · ')));
            const arrow = this.element('span', 'favorite-item-meta lsc-arrow', '›');
            arrow.setAttribute('aria-hidden', 'true');
            row.append(copy, arrow);
            categories.get(object.category).appendChild(row);
        }
        if (!objects.length) {
            const empty = this.element('div', 'empty-favorites lsc-empty');
            empty.append(this.element('strong', '', this.scripts.length ? 'Ничего не найдено' : 'Скриптов пока нет'),
                this.element('p', '', 'Попробуйте название объекта: «остатки», «фото» или «аккаунты».'));
            this.list.appendChild(empty);
        }
    }

    actionName(script) { return script.catalog?.action || script.name; }
    objectFor(script) { return this.objects.find(object => object.scripts.includes(script)); }

    async openObject(object, selected) {
        if (!object) return;
        const token = ++this.viewToken;
        if (!this.catalog.hidden) this.catalogScroll = this.scroller.scrollTop;
        this.catalog.hidden = true;
        this.detail.hidden = false;
        this.detail.replaceChildren();
        this.currentObject = object;
        const back = this.button('‹ Все объекты', 'favorite-btn secondary lsc-back', () => this.showCatalog());
        const heading = this.element('h2', 'favorite-item-name lsc-detail-title', object.name);
        heading.tabIndex = -1;
        const actions = this.element('div', 'favorite-item-actions lsc-actions');
        actions.setAttribute('role', 'group');
        actions.setAttribute('aria-label', 'Действия с объектом');
        const script = selected || object.scripts[0];
        for (const item of object.scripts) {
            const action = this.button(this.actionName(item), 'favorite-btn secondary lsc-action', () => this.openObject(object, item));
            action.setAttribute('aria-pressed', String(item === script));
            actions.appendChild(action);
        }
        const content = this.element('div', 'lsc-operation', 'Загрузка настроек…');
        this.detail.append(back, heading, actions, content);
        this.scroller.scrollTop = 0;
        heading.focus({ preventScroll: true });
        try {
            const ui = await this.getOperation(script);
            if (token !== this.viewToken) return;
            content.replaceChildren(ui.card);
        } catch (error) {
            if (token === this.viewToken) content.textContent = `Ошибка настроек: ${error.message}`;
        }
    }

    showCatalog() {
        ++this.viewToken;
        this.detail.hidden = true;
        this.catalog.hidden = false;
        const row = [...this.list.querySelectorAll('[data-object]')].find(node => node.dataset.object === this.currentObject?.id);
        (row || this.search).focus({ preventScroll: true });
        this.scroller.scrollTop = this.catalogScroll;
    }

    async getOperation(script) {
        if (this.cards.has(script.id)) {
            const ui = this.cards.get(script.id);
            await ui.ready;
            return ui;
        }
        const card = this.element('div', 'lsc-form');
        const description = this.element('p', 'favorite-item-path lsc-description', script.description || script.name);
        const summary = this.element('div', 'script-summary lsc-result');
        summary.setAttribute('role', 'status');
        summary.hidden = true;
        const panel = this.element('fieldset', 'script-settings-panel lsc-fields');
        panel.appendChild(this.element('legend', 'lsc-legend', script.fields.length ? 'Параметры' : 'Запуск'));
        const button = this.button('Запустить', 'favorite-btn lsc-run', () => this.run(script));
        card.append(description);
        if (script.catalog?.hint) card.appendChild(this.element('p', 'script-summary lsc-hint', script.catalog.hint));
        card.append(panel, button, summary);
        const ui = { card, summary, settingsPanel: panel, button };
        this.cards.set(script.id, ui);
        ui.ready = this.buildSettingsPanel(script, panel).then(() => { this.updateBusy(); }).catch(error => {
            this.cards.delete(script.id);
            throw error;
        });
        await ui.ready;
        return ui;
    }

    async buildSettingsPanel(script, panel) {
        const saved = await ScriptStorage.get(script.id);
        const files = this.runtimeFiles.get(script.id) || {};
        this.runtimeFiles.set(script.id, files);
        if (!script.fields.length) panel.appendChild(this.element('p', 'favorite-item-path lsc-description', 'Дополнительные параметры не требуются.'));
        for (const field of script.fields) {
            const wrapper = this.element('div', 'script-field');
            const label = this.element('label', '', field.label + (field.required ? ' *' : ''));
            const input = document.createElement('input');
            input.id = `script-${script.id}-${field.id}`;
            label.htmlFor = input.id;
            input.dataset.field = field.id;
            input.type = ({ datetime: 'datetime-local', directory: 'file' })[field.type] || field.type;
            input.required = !!field.required;
            if (field.type === 'number') {
                input.step = field.integer ? '1' : 'any';
                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
            }
            if (input.type === 'file') {
                input.accept = field.accept || '';
                if (field.type === 'directory') { input.webkitdirectory = true; input.multiple = true; }
                input.addEventListener('change', () => {
                    files[field.id] = field.type === 'directory' ? Array.from(input.files) : input.files[0];
                });
            } else {
                const value = saved[field.id] ?? field.default ?? '';
                if (input.type === 'checkbox') input.checked = value === true || value === 'true';
                else if (field.type === 'datetime') input.value = String(value).replace(' ', 'T').slice(0, 16);
                else input.value = value;
            }
            wrapper.append(label, input);
            panel.appendChild(wrapper);
        }
        if (script.fields.some(field => ['file', 'directory'].includes(field.type))) {
            panel.appendChild(this.element('p', 'favorite-item-path lsc-help', 'Файлы сохраняются при переходах по каталогу. После закрытия окна выберите их заново.'));
        }
        if (script.fields.some(field => !['file', 'directory'].includes(field.type))) {
            const save = this.button('Сохранить параметры', 'favorite-btn secondary lsc-save', async () => {
                if (this.running) return;
                try {
                    const params = ScriptRunner.parameters(script, this.readSettings(panel));
                    await ScriptStorage.save(script.id, params);
                    this.result(script, 'Параметры сохранены.');
                } catch (error) { this.result(script, `Ошибка: ${error.message}`, true); }
            });
            panel.appendChild(save);
        }
    }

    result(script, text, error = false) {
        const ui = this.cards.get(script.id);
        ui.summary.hidden = false;
        ui.summary.textContent = text;
        ui.summary.classList.toggle('lsc-error', error);
    }

    updateBusy() {
        this.cards.forEach(ui => {
            ui.button.disabled = this.running;
            ui.settingsPanel.disabled = this.running;
        });
        this.busy.hidden = !this.running;
        this.busy.textContent = this.running ? `Выполняется: ${this.activeRun.name} →` : '';
    }

    async run(script) {
        if (this.running) return;
        const ui = this.cards.get(script.id);
        try {
            // Read before disabling the fieldset so native validation still applies.
            const values = this.readSettings(ui.settingsPanel);
            this.running = true;
            this.activeRun = script;
            this.updateBusy();
            ui.button.textContent = 'Выполняется…';
            this.result(script, 'Выполняется. Итог также появится на странице клуба.');
            const result = await ScriptRunner.run(script, values, this.runtimeFiles.get(script.id) || {});
            this.result(script, result.message || 'Выполнено');
        } catch (error) {
            console.error(error);
            this.result(script, `Ошибка: ${error.message}`, true);
        } finally {
            this.running = false;
            this.activeRun = null;
            this.updateBusy();
            ui.button.textContent = 'Запустить';
        }
    }

    readSettings(panel) {
        const values = {};
        for (const input of panel.querySelectorAll('[data-field]')) {
            if (input.type === 'file') continue;
            if (!input.reportValidity()) throw new Error('Проверьте поля настроек');
            values[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
        }
        return values;
    }
}
