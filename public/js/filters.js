import { fetchItems } from './catalog.js';
import { getCurrentView } from './views.js';
import { renderCatalog } from './catalog.js';
import { renderStats, renderNextUp } from './stats.js';

let currentFilters = { watched: 'all', type: 'all', installed: false, q: '' };
let sortOrder = 'desc';

export function setupFilters() {
    const search = document.getElementById('search-input');
    const watchedSelect = document.getElementById('filter-watched');
    const typeSelect = document.getElementById('filter-type');
    const installedBtn = document.getElementById('filter-installed');
    const sortBy = document.getElementById('sort-by');
    const orderBtn = document.getElementById('sort-order');

    const triggerSearch = async () => {
        await fetchItems(getFilters());
        renderCatalog(getCurrentView());
        renderStats();
        renderNextUp();
    };

    search.addEventListener('input', (e) => {
        currentFilters.q = e.target.value;
        triggerSearch();
    });

    watchedSelect.addEventListener('change', (e) => {
        currentFilters.watched = e.target.value;
        triggerSearch();
    });

    typeSelect.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        triggerSearch();
    });

    // Кнопка-переключатель «Установлен»
    installedBtn.addEventListener('click', () => {
        currentFilters.installed = !currentFilters.installed;
        installedBtn.classList.toggle('active', currentFilters.installed);
        triggerSearch();
    });

    sortBy.addEventListener('change', triggerSearch);

    orderBtn.addEventListener('click', () => {
        sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        orderBtn.textContent = sortOrder === 'desc' ? '↓' : '↑';
        triggerSearch();
    });
}

export function getFilters() {
    const filters = {
        q: currentFilters.q,
        type: currentFilters.type,
        watched: currentFilters.watched,
        sortBy: document.getElementById('sort-by').value,
        order: sortOrder
    };
    if (currentFilters.installed) filters.installed = 'true';
    return filters;
}