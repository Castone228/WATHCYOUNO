import { t, getLang } from './i18n.js';
import { openEditModal, openDeleteConfirm } from './modals.js';
import { openPlayer } from './player.js';

let items = [];
export const getItems = () => items;

export async function fetchItems(filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== 'all' && v !== '') params.append(k, v);
    });
    const res = await fetch(`/api/items?${params}`);
    items = await res.json();
}

export function renderCatalog(viewMode) {
    const container = document.getElementById('catalog-container');
    container.className = `catalog-grid view-${viewMode}`;
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state">Здесь пока пусто, герой! Даже с пауком-чутьём ничего не нашлось 🕷</div>`;
        return;
    }

    items.forEach((item, index) => {
        const title = getLang() === 'en' && item.title_en ? item.title_en : item.title_ru;
        const posterUrl = item.poster ? `/api/media/${item.id}/poster` : '';
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.04}s`;

        card.onclick = (e) => {
            if (e.target.closest('.card-actions') || e.target.closest('.badge-watched')) return;
            if (item.video) openPlayer(item);
            else openEditModal(item);
        };

        const yearStr = item.year || '';
        const typeStr = t(item.type) || item.type;
        const firstLetter = (title[0] || '?').toUpperCase();

        card.innerHTML = `
            <div class="card-poster-wrap">
                ${posterUrl
                    ? `<img src="${posterUrl}" class="card-poster" alt="${title}" onerror="this.outerHTML='<div class=\\'card-poster-placeholder\\'>${firstLetter}</div>'">`
                    : `<div class="card-poster-placeholder">${firstLetter}</div>`}
                ${item.quality && item.quality !== 'other' ? `<span class="badge-quality q-${item.quality}" title="Качество: ${item.quality}">${item.quality}</span>` : ''}
                ${item.era ? `<span class="badge-era">${item.era}</span>` : ''}
                ${item.watched ? `<span class="badge-watched" data-action="toggle-watched" title="Просмотрено (клик — снять)">✓</span>` : ''}
                ${item.upcoming ? `<span class="badge-upcoming">Скоро</span>` : ''}
                ${item.video ? `<span class="badge-installed" title="Файл установлен">📁</span>` : ''}
            </div>
            <div class="card-body">
                <div class="card-title">${title}</div>
                <div class="card-meta">${yearStr}${yearStr && typeStr ? ' · ' : ''}${typeStr}${item.franchise ? ' · ' + item.franchise : ''}</div>
                <div class="card-actions">
                    <button class="card-btn watched-btn ${item.watched ? 'watched-active' : ''}" data-action="toggle-watched" title="Отметить просмотр">
                        ${item.watched ? '✓' : '👁'}
                    </button>
                    <button class="card-btn" data-action="edit" title="Редактировать">✎</button>
                    <button class="card-btn danger" data-action="delete" title="Удалить">✕</button>
                </div>
            </div>
        `;

        card.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'edit') openEditModal(item);
                else if (action === 'delete') openDeleteConfirm(item);
                else if (action === 'toggle-watched') {
                    const newVal = !item.watched;
                    await fetch(`/api/items/${item.id}/watched`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ watched: newVal })
                    });
                    item.watched = newVal;
                    renderCatalog(viewMode);
                    const { renderStats, renderNextUp } = await import('./stats.js');
                    renderStats();
                    renderNextUp();
                }
            };
        });

        container.appendChild(card);
    });
}