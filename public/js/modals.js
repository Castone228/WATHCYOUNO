import { t } from './i18n.js';
import { fetchItems } from './catalog.js';
import { getCurrentView } from './views.js';
import { renderCatalog } from './catalog.js';
import { renderStats, renderNextUp } from './stats.js';

const overlay = document.getElementById('modal-overlay');
const content = document.getElementById('modal-content');

function closeModal() {
    overlay.classList.add('hidden');
    content.innerHTML = '';
}
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

async function refresh() {
    const { getFilters } = await import('./filters.js');
    await fetchItems(getFilters());
    renderCatalog(getCurrentView());
    renderStats();
    renderNextUp();
}

const TYPE_OPTIONS = ['movie', 'series', 'cartoon', 'anime'];
const QUALITY_OPTIONS = ['other', '480p', '720p', '1080p', '1440p', '4K'];

function buildFormHTML(item = null, title = 'Новый фильм') {
    return `
        <div class="modal-title">
            <span>${title}</span>
            <button class="modal-close" onclick="document.getElementById('modal-overlay').classList.add('hidden')">✕</button>
        </div>
        <form id="item-form">
            <div class="form-row">
                <label>Название (рус) *</label>
                <input name="title_ru" value="${item?.title_ru || ''}" required>
            </div>
            <div class="form-row">
                <label>Оригинальное название</label>
                <input name="title_en" value="${item?.title_en || ''}">
            </div>
            <div class="form-row grid-2">
                <div>
                    <label>Год выхода *</label>
                    <input type="number" name="year" min="1000" max="9999" value="${item?.year || new Date().getFullYear()}" required>
                </div>
                <div>
                    <label>Год в хронике</label>
                    <input type="number" name="timeline" min="1000" max="9999" value="${item?.timeline || ''}">
                </div>
            </div>
            <div class="form-row grid-2">
                <div>
                    <label>Тип</label>
                    <select name="type">
                        ${TYPE_OPTIONS.map(tp => `<option value="${tp}" ${item?.type===tp?'selected':''}>${t(tp)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Качество</label>
                    <select name="quality">
                        ${QUALITY_OPTIONS.map(q => `<option value="${q}" ${item?.quality===q?'selected':''}>${q}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <label>Эпоха (бейдж на постере)</label>
                <input name="era" value="${item?.era || ''}" placeholder="Например: Infinity Saga">
            </div>
            <div class="form-row grid-2">
                <div>
                    <label>Вселенная</label>
                    <input name="universe" value="${item?.universe || ''}" list="universe-list" placeholder="Имя новой вселенной">
                    <datalist id="universe-list"></datalist>
                </div>
                <div>
                    <label>Франшиза</label>
                    <input name="franchise" value="${item?.franchise || ''}" list="franchise-list" placeholder="Имя новой франшизы">
                    <datalist id="franchise-list"></datalist>
                </div>
            </div>
            <div class="form-row">
                <label>Категории через запятую</label>
                <input name="categories" value="${(item?.categories || item?.genres || []).join(', ')}">
            </div>
            <div class="form-row">
                <label>Описание в одну строку</label>
                <textarea name="desc">${item?.desc || item?.description?.ru || ''}</textarea>
            </div>
            <div class="form-row">
                <label>Постер</label>
                <input type="file" name="poster" accept="image/*">
                ${item?.poster ? `<div class="file-hint">Текущий постер будет заменён</div>` : ''}
            </div>
            <div class="form-row">
                <label>Видеофайл (один файл)</label>
                <input type="file" name="video" accept="video/*">
                ${item?.video ? `<div class="file-hint">Текущий: ${item.video.originalName}. Будет заменён.</div>` : ''}
            </div>
            <div class="checkbox-row">
                <label><input type="checkbox" name="watched" ${item?.watched?'checked':''}> Просмотрено</label>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-overlay').classList.add('hidden')"><span>Отмена</span></button>
                <button type="submit" class="btn btn-accent"><span>Сохранить в базе</span></button>
            </div>
        </form>
    `;
}

async function loadFacets() {
    const res = await fetch('/api/facets');
    const facets = await res.json();
    const uList = document.getElementById('universe-list');
    const fList = document.getElementById('franchise-list');
    if (uList) uList.innerHTML = facets.universes.map(u => `<option value="${u}">`).join('');
    if (fList) fList.innerHTML = facets.franchises.map(f => `<option value="${f}">`).join('');
}

export function openAddModal() {
    content.innerHTML = buildFormHTML(null, 'Новый фильм');
    overlay.classList.remove('hidden');
    loadFacets();
    bindForm(null);
}

export function openEditModal(item) {
    content.innerHTML = buildFormHTML(item, item.title_ru);
    overlay.classList.remove('hidden');
    loadFacets();
    bindForm(item);
}

function bindForm(item) {
    const form = document.getElementById('item-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const posterFile = fd.get('poster');
        const videoFile = fd.get('video');
        fd.delete('poster'); fd.delete('video');

        const watched = fd.get('watched') === 'on';
        fd.delete('watched');

        const categories = fd.get('categories').split(',').map(s => s.trim()).filter(Boolean);

        const data = Object.fromEntries(fd.entries());
        data.year = parseInt(data.year);
        if (data.timeline) data.timeline = parseInt(data.timeline);
        data.watched = watched;
        data.categories = categories;
        data.genres = categories;
        data.description = { ru: data.desc || '', en: '' };

        let savedItem;
        if (item) {
            const res = await fetch(`/api/items/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            savedItem = await res.json();
        } else {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            savedItem = await res.json();
        }

        if (posterFile && posterFile.size > 0) {
            const pfd = new FormData();
            pfd.append('poster', posterFile);
            await fetch(`/api/items/${savedItem.id}/poster`, { method: 'POST', body: pfd });
        }
        if (videoFile && videoFile.size > 0) {
            const vfd = new FormData();
            vfd.append('video', videoFile);
            await fetch(`/api/items/${savedItem.id}/video`, { method: 'POST', body: vfd });
        }

        closeModal();
        refresh();
    };
}

export function openDeleteConfirm(item) {
    content.innerHTML = `
        <div class="modal-title">
            <span>ТЫ УВЕРЕН, ГЕРОЙ?</span>
            <button class="modal-close" onclick="document.getElementById('modal-overlay').classList.add('hidden')">✕</button>
        </div>
        <p style="margin-bottom: 12px; font-weight:700;">${t('confirm_delete_sub')}</p>
        <p style="font-family: var(--font-title); font-size:1.3rem; margin-bottom: 20px;">«${item.title_ru}»</p>
        <div style="background: var(--marvel-yellow); border: 2px solid var(--ink-black); box-shadow: 3px 3px 0 var(--ink-black); padding: 12px; font-size: 13px; font-weight: 700; margin-bottom: 16px; transform: rotate(-1deg);">
            💡 «Удалить файл» сотрёт только видеофайл с диска — карточка останется в базе.
        </div>
        <div class="form-actions" style="justify-content: stretch;">
            <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('modal-overlay').classList.add('hidden')"><span>Отмена</span></button>
            ${item.video ? `<button id="del-file-btn" class="btn btn-blue" style="flex:1"><span>Удалить файл</span></button>` : ''}
            <button id="del-all-btn" class="btn btn-accent" style="flex:1"><span>Удалить всё</span></button>
        </div>
    `;
    overlay.classList.remove('hidden');

    const delFileBtn = document.getElementById('del-file-btn');
    if (delFileBtn) {
        delFileBtn.onclick = async () => {
            await fetch(`/api/items/${item.id}/video`, { method: 'DELETE' });
            closeModal();
            refresh();
        };
    }
    document.getElementById('del-all-btn').onclick = async () => {
        await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
        closeModal();
        refresh();
    };
}