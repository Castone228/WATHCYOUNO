const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const TMP_DIR = path.join(DATA_DIR, 'tmp');

[DATA_DIR, MEDIA_DIR, TMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const upload = multer({ dest: TMP_DIR, limits: { fileSize: 100 * 1024 * 1024 * 1024 } });

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Миграция старых записей videos[] -> video{}
const migrateItem = (item) => {
    if (item.videos && Array.isArray(item.videos) && item.videos.length > 0 && !item.video) {
        item.video = item.videos[0];
        delete item.videos;
    }
    return item;
};

app.get('/api/facets', (req, res) => {
    const db = readDB().map(migrateItem);
    res.json({
        franchises: [...new Set(db.map(i => i.franchise).filter(Boolean))],
        studios: [...new Set(db.map(i => i.studio).filter(Boolean))],
        universes: [...new Set(db.map(i => i.universe).filter(Boolean))],
        categories: [...new Set(db.flatMap(i => i.categories || []))]
    });
});

app.get('/api/items', (req, res) => {
    let db = readDB().map(migrateItem);
    const { type, q, franchise, studio, universe, yearFrom, yearTo, quality, watched, installed, sortBy, order } = req.query;
    
    if (type) db = db.filter(i => i.type === type);
    if (franchise) db = db.filter(i => i.franchise === franchise);
    if (studio) db = db.filter(i => i.studio === studio);
    if (universe) db = db.filter(i => i.universe === universe);
    if (quality) db = db.filter(i => i.quality === quality);
    if (installed === 'true') db = db.filter(i => !!i.video);
    if (installed === 'false') db = db.filter(i => !i.video);
    if (watched !== undefined) db = db.filter(i => i.watched === (watched === 'true'));
    if (yearFrom) db = db.filter(i => i.year >= parseInt(yearFrom));
    if (yearTo) db = db.filter(i => i.year <= parseInt(yearTo));
    if (q) {
        const s = q.toLowerCase();
        db = db.filter(i => 
            (i.title_ru || '').toLowerCase().includes(s) || 
            (i.title_en || '').toLowerCase().includes(s) ||
            (i.franchise || '').toLowerCase().includes(s)
        );
    }

    if (sortBy) {
        const dir = order === 'desc' ? -1 : 1;
        const qOrder = { '480p': 1, '720p': 2, '1080p': 3, '1440p': 4, '4K': 5, 'other': 0 };
        db.sort((a, b) => {
            if (sortBy === 'quality') return ((qOrder[a.quality]||0) - (qOrder[b.quality]||0)) * dir;
            const av = a[sortBy], bv = b[sortBy];
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }
    res.json(db);
});

app.get('/api/items/:id', (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    item ? res.json(item) : res.status(404).send('Not found');
});

app.post('/api/items', (req, res) => {
    const db = readDB().map(migrateItem);
    const body = req.body;
    const year = parseInt(body.year);
    if (!year || year < 1000 || year > 9999) return res.status(400).json({error: 'Year must be 4 digits'});
    
    const newItem = {
        id: uuidv4(),
        ...body,
        year,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        video: null,
        poster: null,
        watched: body.watched || false,
        upcoming: body.upcoming || false
    };
    if (newItem.type === 'series' && !newItem.seasons) newItem.seasons = [];
    db.push(newItem);
    writeDB(db);
    res.status(201).json(newItem);
});

app.put('/api/items/:id', (req, res) => {
    const db = readDB().map(migrateItem);
    const idx = db.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).send('Not found');
    const body = req.body;
    if (body.year) {
        const y = parseInt(body.year);
        if (y < 1000 || y > 9999) return res.status(400).json({error: 'Year must be 4 digits'});
        body.year = y;
    }
    db[idx] = { ...db[idx], ...body, updatedAt: new Date().toISOString() };
    writeDB(db);
    res.json(db[idx]);
});

app.patch('/api/items/:id/watched', (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item) return res.status(404).send('Not found');
    item.watched = req.body.watched;
    item.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
    let db = readDB().map(migrateItem);
    const idx = db.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).send('Not found');
    const mediaPath = path.join(MEDIA_DIR, req.params.id);
    if (fs.existsSync(mediaPath)) fs.rmSync(mediaPath, { recursive: true, force: true });
    db.splice(idx, 1);
    writeDB(db);
    res.status(204).send();
});

// ===== POSTER =====
app.post('/api/items/:id/poster', upload.single('poster'), (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item) return res.status(404).send('Not found');
    const itemDir = path.join(MEDIA_DIR, item.id);
    if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const destPath = path.join(itemDir, `poster${ext}`);
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    fs.renameSync(req.file.path, destPath);
    item.poster = `poster${ext}`;
    item.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(item);
});

// ===== VIDEO (один файл на фильм, имя = video.{ext}) =====
app.post('/api/items/:id/video', upload.single('video'), (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item) return res.status(404).send('Not found');
    
    const videosDir = path.join(MEDIA_DIR, item.id);
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

    // Удалить старый файл, если есть
    if (item.video && item.video.storedPath) {
        const oldPath = path.join(MEDIA_DIR, item.id, item.video.storedPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const finalName = `video${ext}`;
    const destPath = path.join(videosDir, finalName);
    
    fs.renameSync(req.file.path, destPath);
    
    item.video = {
        id: uuidv4(),
        originalName: req.file.originalname,
        storedPath: finalName,
        ext: ext.replace('.', ''),
        size: req.file.size,
        label: req.file.originalname
    };

    // Авто-качество
    const name = req.file.originalname.toLowerCase();
    if (name.includes('2160p') || name.includes('4k')) item.quality = '4K';
    else if (name.includes('1440p')) item.quality = '1440p';
    else if (name.includes('1080p')) item.quality = '1080p';
    else if (name.includes('720p')) item.quality = '720p';
    else if (name.includes('480p')) item.quality = '480p';

    item.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(item);
});

app.delete('/api/items/:id/video', (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item || !item.video) return res.status(404).send('No video');
    const filePath = path.join(MEDIA_DIR, item.id, item.video.storedPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    item.video = null;
    item.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json(item);
});

app.get('/api/media/:id/poster', (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item || !item.poster) return res.status(404).send('Not found');
    res.sendFile(path.join(MEDIA_DIR, item.id, item.poster));
});

app.get('/api/media/:id/video', (req, res) => {
    const db = readDB().map(migrateItem);
    const item = db.find(i => i.id === req.params.id);
    if (!item || !item.video) return res.status(404).send('Not found');
    const videoPath = path.join(MEDIA_DIR, item.id, item.video.storedPath);
    if (!fs.existsSync(videoPath)) return res.status(404).send('File missing');

    if (req.query.download === '1') {
        return res.download(videoPath, item.video.originalName);
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = item.video.ext.toLowerCase();
    const mimeTypes = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime' };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        });
        file.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType });
        fs.createReadStream(videoPath).pipe(res);
    }
});

// ===== IMPORT JSON =====
app.post('/api/import', (req, res) => {
    try {
        const imported = req.body;
        if (!Array.isArray(imported)) return res.status(400).json({error: 'Must be array'});
        const db = readDB().map(migrateItem);
        let added = 0;
        imported.forEach(item => {
            if (!item.title_ru && !item.title) return;
            const newItem = {
                id: item.id || uuidv4(),
                type: item.type || 'movie',
                title_ru: item.title_ru || item.title || 'Без названия',
                title_en: item.title_en || item.original || '',
                year: parseInt(item.year) || new Date().getFullYear(),
                universe: item.universe || '',
                franchise: item.franchise || '',
                studio: item.studio || '',
                categories: item.categories || [],
                genres: item.genres || [],
                quality: item.quality || 'other',
                description: item.description || { ru: '', en: '' },
                desc: item.desc || '',
                poster: null,
                video: null,
                watched: item.watched || false,
                upcoming: item.upcoming || false,
                rating: item.rating || null,
                era: item.era || '',
                timeline: item.timeline || null,
                seasons: item.seasons || [],
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Если такой id уже есть - перезаписываем метаданные
            const existingIdx = db.findIndex(x => x.id === newItem.id);
            if (existingIdx >= 0) {
                const existing = db[existingIdx];
                newItem.poster = existing.poster;
                newItem.video = existing.video;
                db[existingIdx] = newItem;
            } else {
                db.push(newItem);
                added++;
            }
        });
        writeDB(db);
        res.json({ success: true, added, total: db.length });
    } catch (e) {
        res.status(400).json({error: e.message});
    }
});

app.get('/api/export', (req, res) => {
    res.json(readDB().map(migrateItem));
});

app.listen(PORT, () => console.log(`Marvel Vault: http://localhost:${PORT}`));