import { translateDOM, t } from './i18n.js';
import { renderCatalog, fetchItems, getItems } from './catalog.js';
import { setupFilters, getFilters } from './filters.js';
import { openAddModal } from './modals.js';
import { initViews, getCurrentView } from './views.js';
import { renderStats, renderNextUp } from './stats.js';

let originalJSON = '';

async function init() {
    setupFilters();
    initViews();

    document.getElementById('btn-add').addEventListener('click', openAddModal);

    // База / JSON
    document.getElementById('btn-base').addEventListener('click', openBaseModal);
    document.getElementById('base-modal-close').addEventListener('click', closeBaseModal);
    document.getElementById('base-apply').addEventListener('click', applyBase);
    document.getElementById('base-copy').addEventListener('click', copyBase);
    document.getElementById('base-download').addEventListener('click', downloadBase);
    document.getElementById('base-upload').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('base-reset').addEventListener('click', resetBase);
    document.getElementById('base-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'base-modal-overlay') closeBaseModal();
    });

    document.getElementById('import-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Array.isArray(data) ? data : [data])
            });
            const result = await res.json();
            if (result.success) {
                alert(`Импортировано: ${result.added}. Всего в базе: ${result.total}`);
                await reload();
                if (!document.getElementById('base-modal-overlay').classList.contains('hidden')) {
                    loadBaseTextarea();
                }
            } else {
                alert('Ошибка сервера: ' + result.error);
            }
        } catch (err) {
            alert('Это не JSON, герой! Проверь файл.');
        }
        e.target.value = '';
    });

    window.addEventListener('lang-changed', reload);

    await reload();
}

async function reload() {
    await fetchItems(getFilters());
    renderCatalog(getCurrentView());
    renderStats();
    renderNextUp();
}

async function loadBaseTextarea() {
    const res = await fetch('/api/export');
    const data = await res.json();
    const json = JSON.stringify(data, null, 2);
    document.getElementById('base-json-textarea').value = json;
    if (!originalJSON) originalJSON = json;
}

function openBaseModal() {
    loadBaseTextarea();
    document.getElementById('base-modal-overlay').classList.remove('hidden');
}

function closeBaseModal() {
    document.getElementById('base-modal-overlay').classList.add('hidden');
}

async function applyBase() {
    try {
        const text = document.getElementById('base-json-textarea').value;
        const data = JSON.parse(text);
        const res = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Array.isArray(data) ? data : [data])
        });
        const result = await res.json();
        if (result.success) {
            alert('База обновлена! Всего фильмов: ' + result.total);
            await reload();
            closeBaseModal();
        } else {
            alert('Ошибка сервера: ' + result.error);
        }
    } catch (err) {
        alert('JSON невалидный! Проверь синтаксис.');
    }
}

async function copyBase() {
    const textarea = document.getElementById('base-json-textarea');
    textarea.select();
    try {
        await navigator.clipboard.writeText(textarea.value);
        alert('Скопировано в буфер обмена!');
    } catch {
        document.execCommand('copy');
        alert('Скопировано!');
    }
}

async function downloadBase() {
    const res = await fetch('/api/export');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marvel-vault-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetBase() {
    if (confirm('Сбросить текст в поле к состоянию на момент открытия окна?')) {
        document.getElementById('base-json-textarea').value = originalJSON;
    }
}

document.addEventListener('DOMContentLoaded', init);