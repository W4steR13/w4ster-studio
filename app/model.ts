export const artists = ["W4steR", "SHU.NT", "Veylorn", "W4steR MUSIC"] as const;
export const releaseKinds = ["Сингл", "Альбом", "EP"] as const;
export const kinds = [...releaseKinds, "Идея", "Задача"] as const;
export const statuses = ["Идея", "В работе", "Готово", "Запланировано", "Выпущено", "Отложено"] as const;
export const channels = ["Telegram", "Сайт", "YouTube"] as const;

export type Entry = {
  id: string;
  title: string;
  artist: typeof artists[number];
  kind: typeof kinds[number];
  status: typeof statuses[number];
  date: string;
  provisional: boolean;
  progress: number;
  next: string;
  notes: string;
  cover: string;
  links: { label: string; url: string }[];
  posts: Record<typeof channels[number], string>;
};
export type RecordVersion = { entry: Entry; revision: string | null };
export const blank: Entry = {
  id: "", title: "", artist: "W4steR", kind: "Сингл", status: "Идея",
  date: "", provisional: false, progress: 0, next: "", notes: "", cover: "",
  links: [], posts: { Telegram: "", Сайт: "", YouTube: "" },
};
const seed = (fields: Partial<Entry>): Entry => ({ ...blank, ...fields });
export const starterEntries = [
  seed({ id: "two-stars", title: "Две звезды", status: "Выпущено", date: "2026-11-06", progress: 100,
    next: "Добавить прямые ссылки на площадки и опубликованное видео в карточку.",
    cover: "https://w4ster.ru/dve_zvezdy.png",
    links: [{ label: "Все площадки", url: "https://band.link/LwEjk" }],
    posts: {
      Telegram: "«Две звезды» уже вышли ✨\nСлушай новый трек W4steR на удобной площадке: https://band.link/LwEjk",
      Сайт: "W4steR — «Две звезды». Сингл вышел 6 ноября. Слушать: https://band.link/LwEjk",
      YouTube: "W4steR — «Две звезды»\nСлушать трек на стримингах: https://band.link/LwEjk",
    },
  }),
  seed({ id: "oblivion", title: "Грань забытия", artist: "Veylorn", status: "Готово", progress: 100,
    date: "2026-11-27", provisional: true, notes: "Готовый инструментал. Изначально задуман для игры LIMEN.",
    next: "Подтвердить дату и выбрать обложку перед отправкой дистрибьютору.",
    posts: {
      Telegram: "Знакомьтесь с Veylorn, инструментальным проектом W4steR MUSIC. Его первый релиз — «Грань забытия». Этот трек изначально задумывался для игры LIMEN.",
      Сайт: "«Грань забытия» — дебютный инструментальный релиз Veylorn, артиста лейбла W4steR MUSIC. Композиция выросла из музыки, задуманной для игры LIMEN.",
      YouTube: "Veylorn — «Грань забытия»\nДебютный инструментал Veylorn на W4steR MUSIC. Композиция изначально задумывалась для игры LIMEN.",
    },
  }),
  seed({ id: "dont-know", title: "Не знаю, как это работает", kind: "Сингл", date: "2026-10-08", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/ne_znayu_kak_eto_rabotaet.png", links: [{ label: "Все площадки", url: "https://band.link/BGAWd" }],
    notes: "В публичной дискографии указано 9 октября 2026. Дату релиза нужно сверить с дистрибьютором.",
  }),
  seed({ id: "two-left", title: "Оставили двое", kind: "Сингл", date: "2026-09-18", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/ostavili_dvoe.png", links: [{ label: "Все площадки", url: "https://band.link/ndnD7" }],
  }),
  seed({ id: "skazhi-ey", title: "Скажи ей!", kind: "Сингл", date: "2026-08-28", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/skazhi_ey.png", links: [{ label: "Все площадки", url: "https://band.link/Q2gHJ" }],
  }),
  seed({ id: "card-house", title: "Карточный домик", kind: "Сингл", date: "2026-07-31", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/Card_House.png", links: [{ label: "Все площадки", url: "https://band.link/RoUGm" }],
  }),
  seed({ id: "when-everyone-is-home", title: "Когда все дома", kind: "EP", date: "2026-07-08", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/When_Everyone_Is_Home.png", links: [{ label: "Все площадки", url: "https://band.link/Wa5aT" }],
    notes: "Треклист\n1. Мама\n2. Когда все дома\n3. Дым\n4. Если бы знал",
  }),
  seed({ id: "immortals", title: "Бессмертны", kind: "Сингл", date: "2026-06-26", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/Immortals.png", links: [{ label: "Все площадки", url: "https://band.link/FKiAl" }],
    notes: "При участии SHU.NT.",
  }),
  seed({ id: "focus-failed", title: "Фокус не вышел", kind: "Сингл", date: "2026-06-12", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/Focus%20Failed.png", links: [{ label: "Все площадки", url: "https://band.link/0Hk8w" }],
  }),
  seed({ id: "voices-from-the-vacuum", title: "Голос из вакуума", kind: "EP", date: "2026-05-13", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/Voices_from_the_Vacuum.jpg", links: [{ label: "Все площадки", url: "https://band.link/pwEjl" }],
    notes: "Треклист\n1. Не могу молчать\n2. В самый раз\n3. Вне гравитации\n4. Я выбрал тебя",
  }),
  seed({ id: "in-your-rhythm", title: "В твоём ритме", kind: "Сингл", date: "2026-04-17", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/In%20Your%20Rhythm.png", links: [{ label: "Все площадки", url: "https://band.link/o4Bxq" }],
  }),
  seed({ id: "na-svoem-meste", title: "На своём месте", kind: "Сингл", date: "2026-03-20", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/na_svoem_meste.png", links: [{ label: "Все площадки", url: "https://band.link/fv9Wl" }],
  }),
  seed({ id: "radio-interference", title: "Радиопомехи", kind: "Сингл", date: "2026-02-03", status: "Выпущено", progress: 100,
    cover: "https://w4ster.ru/Radio-Interference.jpg", links: [{ label: "Все площадки", url: "https://band.link/2IRfF" }],
  }),
  seed({ id: "angry", title: "Злюка", status: "Отложено", notes: "Изначально планировалась на 30 октября.", next: "Решить, в какой слот перенести релиз." }),
  seed({ id: "holiday", title: "Новогодний сингл", date: "2026-12-18", provisional: true, status: "Запланировано", next: "Выбрать трек для декабрьского выпуска." }),
  seed({ id: "january", title: "Январский альбом", kind: "Альбом", date: "2027-01-08", provisional: true, status: "Запланировано", next: "Утвердить название и черновой треклист." }),
  seed({ id: "anniversary", title: "Год на площадках", date: "2027-02-03", provisional: true, status: "Запланировано", next: "Выбрать трек к годовщине." }),
  seed({ id: "orbit", title: "Первая космическая скорость", kind: "Идея", status: "В работе", notes: "Текст принят.", next: "Записать черновой вокал." }),
  seed({ id: "chains", title: "Оковы", kind: "Идея", notes: "Мрачная электроника и альтернативный поп.", next: "Собрать демо припева." }),
  seed({ id: "arrhythmia", title: "Аритмия", kind: "Идея" }),
  seed({ id: "between", title: "Между строк", kind: "Идея", notes: "Любовная лирика." }),
  seed({ id: "identity", title: "Единая подача W4steR MUSIC", kind: "Задача", artist: "W4steR MUSIC", status: "В работе",
    notes: "Обновить название, аватар и описания общих каналов. W4steR — главный артист и основной ник. SHU.NT и Veylorn — самостоятельные артисты внутри лейбла.",
    next: "Подготовить единое описание для Telegram, YouTube и сайта.",
    links: [{ label: "Telegram", url: "https://t.me/W4steR_official" }, { label: "Сайт", url: "https://w4ster.ru" }],
  }),
  seed({ id: "colors", title: "Вынести цвета сайта в CSS-переменные", kind: "Задача", artist: "W4steR MUSIC", status: "Идея",
    notes: "Собрать текущие цвета в :root. Использовать переменные для фона, карточек, текста, границ и акцентов. Сохранить текущую структуру и внешний вид публичного сайта.",
    next: "Выписать существующие цвета и назначить им переменные в CSS.",
    links: [{ label: "Публичный сайт", url: "https://w4ster.ru" }],
  }),
  seed({ id: "announcement", title: "Объявить о запуске лейбла", kind: "Задача", artist: "W4steR MUSIC", status: "В работе",
    next: "Вычитать три версии и выбрать дату объявления.",
    posts: {
      Telegram: "Теперь у моих музыкальных проектов есть общий дом — W4steR MUSIC. W4steR остаётся моим основным именем. SHU.NT и Veylorn будут выпускать свою музыку как отдельные артисты этого лейбла. Здесь буду делиться релизами всех троих. Первым релизом Veylorn станет инструментал «Грань забытия».",
      Сайт: "W4steR MUSIC — независимый лейбл, который объединяет три музыкальных проекта. W4steR остаётся главным артистом лейбла. SHU.NT и Veylorn выпускают музыку под собственными именами. На этом сайте можно следить за релизами всех трёх артистов.",
      YouTube: "Добро пожаловать на W4steR MUSIC. Здесь выходят клипы, визуалайзеры и новости трёх артистов одного независимого лейбла: W4steR, SHU.NT и Veylorn. W4steR остаётся основным проектом канала.",
    },
  }),
];

export function safeLink(value: string) {
  try { return ["https:", "http:"].includes(new URL(value).protocol); }
  catch { return false; }
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}
