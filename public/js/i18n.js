import ru from './i18n/ru.js';
import en from './i18n/en.js';

const dicts = { ru, en };
let currentLang = localStorage.getItem('lang') || 'ru';

export const t = (key) => dicts[currentLang][key] || dicts['ru'][key] || key;
export const getLang = () => currentLang;

export const setLang = (lang) => {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    translateDOM();
    window.dispatchEvent(new CustomEvent('lang-changed'));
};

export const translateDOM = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lang-switcher').value = currentLang;
    document.getElementById('lang-switcher').addEventListener('change', (e) => setLang(e.target.value));
    translateDOM();
});