class ScriptStorage {

    static async get(id) {

        const data = await chrome.storage.local.get(id);

        return data[id] ?? {};

    }

    static async save(id, params) {

        await chrome.storage.local.set({
            [id]: params
        });

    }

}