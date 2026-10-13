# 📦 Импорт и экспорт фильмов через JSON

Вы можете импортировать фильмы пачками через JSON-файл. Это удобно для переноса базы, бэкапов, обмена коллекциями и массового редактирования.

---

## 🚀 Как импортировать

1. Подготовьте JSON-файл по формату ниже (массив объектов)
2. На сайте нажмите кнопку **«{ } База / JSON»** в шапке
3. В открывшемся окне нажмите **«Загрузить…»** и выберите ваш `.json` файл
4. Подтвердите — увидите сообщение о количестве добавленных фильмов

**Альтернативный способ:** откройте «База / JSON», вставьте JSON прямо в текстовое поле и нажмите **«Применить»**.

Чтобы **экспортировать** текущую базу — нажмите **«Скачать .json»** в том же окне.

---

## 🎯 Максимальный пример (все поля)

```json
[
  {
    "id": "avengers-endgame-2019",
    "type": "movie",
    "title_ru": "Мстители: Финал",
    "title_en": "Avengers: Endgame",
    "year": 2019,
    "timeline": 2023,
    "era": "Сага Бесконечности",
    "universe": "Кинематографическая вселенная Марвел",
    "franchise": "Мстители",
    "studio": "Marvel Studios",
    "categories": ["боевик", "фантастика", "приключения", "супергероика"],
    "genres": ["Action", "Sci-Fi", "Adventure"],
    "quality": "4K",
    "desc": "Оставшиеся в живых Мстители собираются вместе, чтобы отменить действия Таноса и восстановить баланс во вселенной.",
    "description": {
      "ru": "Оставшиеся в живых Мстители собираются вместе, чтобы отменить действия Таноса.",
      "en": "The surviving Avengers assemble to undo Thanos' actions and restore balance."
    },
    "watched": true,
    "upcoming": false,
    "rating": 10,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "loki-series-2021",
    "type": "series",
    "title_ru": "Локи",
    "title_en": "Loki",
    "year": 2021,
    "timeline": 2021,
    "era": "Мультивселенная",
    "universe": "Кинематографическая вселенная Марвел",
    "franchise": "Локи",
    "studio": "Marvel Studios",
    "categories": ["фантастика", "приключения", "драма"],
    "quality": "1080p",
    "desc": "Бог хитрости попадает в Управление временными изменениями.",
    "watched": false,
    "upcoming": false,
    "rating": 8,
    "seasons": [
      {
        "season": 1,
        "episodes": [
          { "number": 1, "title_ru": "Славная цель", "title_en": "Glorious Purpose", "watched": true },
          { "number": 2, "title_ru": "Вариант", "title_en": "The Variant", "watched": true },
          { "number": 3, "title_ru": "Ламентис", "title_en": "Lamentis", "watched": false }
        ]
      },
      {
        "season": 2,
        "episodes": [
          { "number": 1, "title_ru": "Уроборос", "title_en": "Ouroboros", "watched": false }
        ]
      }
    ]
  },
  {
    "id": "spider-verse-2018",
    "type": "cartoon",
    "title_ru": "Человек-паук: Через вселенные",
    "title_en": "Spider-Man: Into the Spider-Verse",
    "year": 2018,
    "timeline": 2018,
    "era": "Паучья вселенная",
    "universe": "Spider-Verse",
    "franchise": "Человек-паук",
    "studio": "Sony Pictures Animation",
    "categories": ["анимация", "боевик", "комедия"],
    "quality": "4K",
    "desc": "Майлз Моралес становится Человеком-пауком и встречает пауков из других вселенных.",
    "watched": true,
    "rating": 9
  },
  {
    "id": "attack-on-titan",
    "type": "anime",
    "title_ru": "Атака титанов",
    "title_en": "Shingeki no Kyojin",
    "year": 2013,
    "universe": "Атака титанов",
    "franchise": "Атака титанов",
    "studio": "Wit Studio / MAPPA",
    "categories": ["экшен", "драма", "фэнтези", "постапокалипсис"],
    "quality": "1080p",
    "desc": "Человечество борется за выживание против гигантских титанов.",
    "watched": false,
    "rating": null
  },
  {
    "id": "secret-wars-2027",
    "type": "movie",
    "title_ru": "Мстители: Секретные войны",
    "title_en": "Avengers: Secret Wars",
    "year": 2027,
    "timeline": 2027,
    "era": "Мультивселенная",
    "universe": "Кинематографическая вселенная Марвел",
    "franchise": "Мстители",
    "studio": "Marvel Studios",
    "categories": ["боевик", "фантастика"],
    "quality": "other",
    "desc": "Финал Мультивселенной. Герои со всех реальностей объединяются.",
    "watched": false,
    "upcoming": true
  }
]