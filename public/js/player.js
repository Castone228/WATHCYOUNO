import { t } from './i18n.js';

const overlay = document.getElementById('player-overlay');
const video = document.getElementById('video-element');
const playBtn = document.getElementById('play-btn');
const timeline = document.getElementById('timeline');
const timeDisplay = document.getElementById('time-display');
const muteBtn = document.getElementById('mute-btn');
const volume = document.getElementById('volume');
const speedSelect = document.getElementById('speed-select');
const fsBtn = document.getElementById('fullscreen-btn');
const unsupportedMsg = document.getElementById('unsupported-msg');
const controls = document.getElementById('player-controls');
const closeBtn = document.getElementById('close-player-btn');
const markPrompt = document.getElementById('mark-watched-toast');

let currentItem = null;
let hideTimeout;
let promptShown = false;
const watchedThreshold = 0.8;

export function openPlayer(item) {
    currentItem = item;
    promptShown = false;
    markPrompt.classList.add('hidden');

    if (!item.video) return;
    loadVideo();

    overlay.classList.remove('hidden');
    setupEvents();
}

function loadVideo() {
    const v = currentItem.video;
    const isSupported = ['mp4', 'webm', 'ogg', 'mov'].includes(v.ext.toLowerCase());

    if (!isSupported) {
        video.style.display = 'none';
        unsupportedMsg.classList.remove('hidden');
        unsupportedMsg.innerHTML = `
            <h3>${t('unsupported')}</h3>
            <p>${v.originalName}</p>
            <a href="/api/media/${currentItem.id}/video?download=1" class="btn btn-accent" style="text-decoration:none;"><span>${t('download')}</span></a>
        `;
    } else {
        video.style.display = 'block';
        unsupportedMsg.classList.add('hidden');
        video.src = `/api/media/${currentItem.id}/video`;
        video.play().catch(() => {});
    }
}

function setupEvents() {
    closeBtn.onclick = closePlayer;
    playBtn.onclick = () => video.paused ? video.play() : video.pause();
    video.onplay = () => playBtn.textContent = '⏸';
    video.onpause = () => playBtn.textContent = '▶';

    video.ontimeupdate = () => {
        if (video.duration) {
            timeline.value = (video.currentTime / video.duration) * 100;
            timeDisplay.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;

            // Окно на 80% просмотра
            if (!promptShown && !currentItem.watched && video.currentTime / video.duration >= watchedThreshold) {
                promptShown = true;
                markPrompt.classList.remove('hidden');
            }
        }
    };

    timeline.oninput = () => video.currentTime = (timeline.value / 100) * video.duration;
    muteBtn.onclick = () => { video.muted = !video.muted; muteBtn.textContent = video.muted ? '🔇' : '🔊'; };
    volume.oninput = () => { video.volume = volume.value; video.muted = false; };
    speedSelect.onchange = () => video.playbackRate = parseFloat(speedSelect.value);

    // Реальный fullscreen для самого <video>
    fsBtn.onclick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
        }
    };

    document.getElementById('confirm-watched').onclick = async () => {
        await fetch(`/api/items/${currentItem.id}/watched`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ watched: true })
        });
        currentItem.watched = true;
        markPrompt.classList.add('hidden');
        const { renderCatalog } = await import('./catalog.js');
        const { renderStats, renderNextUp } = await import('./stats.js');
        const { getCurrentView } = await import('./views.js');
        renderCatalog(getCurrentView());
        renderStats();
        renderNextUp();
    };
    document.getElementById('dismiss-watched').onclick = () => markPrompt.classList.add('hidden');

    overlay.onmousemove = showControls;
    document.onkeydown = handleHotkeys;
}

function showControls() {
    controls.classList.remove('hidden-ui');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        if (!video.paused) controls.classList.add('hidden-ui');
    }, 3000);
}

function handleHotkeys(e) {
    if (overlay.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
    if (e.code === 'Escape') closePlayer();
    if (e.code === 'ArrowRight') video.currentTime += 10;
    if (e.code === 'ArrowLeft') video.currentTime -= 10;
    if (e.code === 'ArrowUp') { video.volume = Math.min(1, video.volume + 0.1); volume.value = video.volume; }
    if (e.code === 'ArrowDown') { video.volume = Math.max(0, video.volume - 0.1); volume.value = video.volume; }
    if (e.key === 'f' || e.key === 'F') fsBtn.click();
    if (e.key === 'm' || e.key === 'M') muteBtn.click();
}

function closePlayer() {
    video.pause();
    video.src = '';
    overlay.classList.add('hidden');
    document.onkeydown = null;
    overlay.onmousemove = null;
}

function fmt(s) {
    if (isNaN(s)) return '00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}