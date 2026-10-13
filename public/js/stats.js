import { getItems } from './catalog.js';
import { openPlayer } from './player.js';
import { t } from './i18n.js';

export function renderStats() {
    const items = getItems();
    const total = items.length;
    const watched = items.filter(i => i.watched).length;
    const unwatched = items.filter(i => !i.watched).length;
    const percent = total ? Math.round((watched / total) * 100) : 0;

    animateNum('stat-total', total);
    animateNum('stat-watched', watched);
    animateNum('stat-unwatched', unwatched);

    setTimeout(() => {
        document.getElementById('progress-bar').style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = `${percent}% коллекции закрыто`;
    }, 100);
}

export function renderNextUp() {
    const items = getItems();
    const nextItem = items.find(i => !i.watched && i.video);
    const section = document.getElementById('next-up-section');
    const container = document.getElementById('next-up-card');

    if (!nextItem) { section.classList.add('hidden'); return; }

    section.classList.remove('hidden');
    const posterUrl = nextItem.poster ? `/api/media/${nextItem.id}/poster` : '';

    container.innerHTML = `
        ${posterUrl ? `<img src="${posterUrl}" class="next-up-poster">` : ''}
        <div class="next-up-info">
            <div class="next-up-title">${nextItem.title_ru}</div>
            <div class="next-up-meta">${nextItem.year} · ${t(nextItem.type)}${nextItem.franchise ? ' · ' + nextItem.franchise : ''}</div>
            <button class="btn btn-accent" id="btn-play-next"><span>▶ Играть</span></button>
        </div>
    `;

    document.getElementById('btn-play-next').onclick = () => openPlayer(nextItem);
}

function animateNum(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 600;
    const start = performance.now();
    const initial = parseInt(el.textContent) || 0;
    const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor(initial + (target - initial) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}