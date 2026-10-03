class ScriptManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scripts = [];
        this.cards = new Map();
        this.runtimeFiles = new Map();
        this.running = false;
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
            await this.render();
        } catch (error) {
            console.error(error);
            this.container.textContent = `Ошибка загрузки скриптов: ${error.message}`;
        }
    }

    async render() {
        this.container.replaceChildren();
        this.cards.clear();
        for (const script of this.scripts) {
            const ui = this.createCard(script);
            this.cards.set(script.id, ui);
            this.container.appendChild(ui.card);
            const saved = await ScriptStorage.get(script.id);
            ui.summary.textContent = Object.keys(saved).length ? 'Сохранённые настройки загружены' :
                (script.fields.length ? 'Используются значения по умолчанию; файлы выберите в настройках' : 'Готов к запуску');
        }
    }

    createCard(script) {
        const element = (tag, className, text) => {
            const node = document.createElement(tag);
            node.className = className;
            if (text !== undefined) node.textContent = text;
            return node;
        };
        const card = element('div', 'favorite-item');
        const title = element('div', 'favorite-item-name', script.name);
        const description = element('div', 'favorite-item-path', script.description || '');
        const summary = element('div', 'script-summary', 'Загрузка настроек…');
        summary.setAttribute('role', 'status');
        const settingsPanel = element('div', 'script-settings-panel');
        settingsPanel.style.display = 'none';
        const footer = element('div', 'favorite-item-footer');
        const actions = element('div', 'favorite-item-actions');
        let settingsButton = null;
        if (script.fields.length) {
            settingsButton = element('button', 'favorite-btn', 'Настроить');
            settingsButton.type = 'button';
            settingsButton.addEventListener('click', async () => {
                try { await this.toggleSettingsPanel(script); }
                catch (error) { summary.textContent = `Ошибка настроек: ${error.message}`; }
            });
            actions.appendChild(settingsButton);
        }
        const button = element('button', 'favorite-btn', 'Запустить');
        button.type = 'button';
        button.addEventListener('click', async () => {
            if (this.running) return;
            this.running = true;
            this.cards.forEach(ui => { ui.button.disabled = true; if (ui.settingsButton) ui.settingsButton.disabled = true; });
            button.textContent = 'Выполняется…';
            summary.textContent = 'Подготовка и выполнение. Итог также появится на странице клуба.';
            try {
                // An open form is used directly, so unsaved edits are not silently ignored.
                const ui = this.cards.get(script.id);
                const values = ui.settingsPanel.style.display !== 'none' ? this.readSettings(ui.settingsPanel) : await ScriptStorage.get(script.id);
                const result = await ScriptRunner.run(script, values, this.runtimeFiles.get(script.id) || {});
                summary.textContent = result.message || 'Выполнено';
            } catch (error) {
                console.error(error);
                summary.textContent = `Ошибка: ${error.message}`;
            } finally {
                this.running = false;
                this.cards.forEach(ui => { ui.button.disabled = false; if (ui.settingsButton) ui.settingsButton.disabled = false; });
                button.textContent = 'Запустить';
            }
        });
        actions.appendChild(button);
        footer.appendChild(actions);
        card.append(title, description, summary, settingsPanel, footer);
        return { card, summary, settingsPanel, settingsButton, button };
    }

    async toggleSettingsPanel(script) {
        const ui = this.cards.get(script.id);
        const opening = ui.settingsPanel.style.display === 'none';
        this.cards.forEach(card => {
            card.settingsPanel.style.display = 'none';
            if (card.settingsButton) card.settingsButton.textContent = 'Настроить';
        });
        if (!opening) return;
        // Preserve file inputs and unsaved edits when switching between cards.
        if (!ui.settingsPanel.childElementCount) await this.buildSettingsPanel(script, ui.settingsPanel);
        ui.settingsPanel.style.display = 'block';
        ui.settingsButton.textContent = 'Скрыть';
    }

    async buildSettingsPanel(script, panel) {
        const saved = await ScriptStorage.get(script.id);
        const files = this.runtimeFiles.get(script.id) || {};
        this.runtimeFiles.set(script.id, files);
        for (const field of script.fields) {
            const wrapper = document.createElement('div');
            wrapper.className = 'script-field';
            const label = document.createElement('label');
            label.textContent = field.label;
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
        const hint = document.createElement('div');
        hint.className = 'favorite-item-path';
        hint.textContent = 'Файлы доступны до закрытия этого окна. После открытия выберите их заново.';
        if (script.fields.some(field => ['file', 'directory'].includes(field.type))) panel.appendChild(hint);
        const save = document.createElement('button');
        save.type = 'button'; save.className = 'favorite-btn'; save.textContent = 'Сохранить';
        save.addEventListener('click', async () => {
            try {
                const params = ScriptRunner.parameters(script, this.readSettings(panel));
                await ScriptStorage.save(script.id, params);
                const ui = this.cards.get(script.id);
                ui.summary.textContent = 'Настройки сохранены';
                panel.style.display = 'none';
                ui.settingsButton.textContent = 'Настроить';
            } catch (error) { this.cards.get(script.id).summary.textContent = `Ошибка: ${error.message}`; }
        });
        panel.appendChild(save);
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
