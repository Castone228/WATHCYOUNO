let currentView = localStorage.getItem('view') || 'grid';

export function initViews() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        if (btn.dataset.view === currentView) btn.classList.add('active');
        else btn.classList.remove('active');
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            localStorage.setItem('view', currentView);
            import('./catalog.js').then(m => m.renderCatalog(currentView));
        });
    });
}

export const getCurrentView = () => currentView;