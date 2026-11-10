"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, CalendarDays,
  Check, ChevronLeft, ChevronRight, Clipboard, Disc3, LayoutDashboard, Lightbulb, Link2,
  ListTodo, Plus, Search, X,
} from "lucide-react";
import { artists, blank, channels, kinds, releaseKinds, safeLink, starterEntries, statuses, type Entry, type RecordVersion } from "./model";

const tabs = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "releases", label: "Релизы", icon: Disc3 },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "ideas", label: "Треки и идеи", icon: Lightbulb },
  { id: "tasks", label: "Каналы и сайт", icon: ListTodo },
] as const;
type Tab = typeof tabs[number]["id"];
const statusStyle = ["idea", "working", "ready", "planned", "released", "paused"];
const artistStyle = (artist: Entry["artist"]) => "artist-" + artists.indexOf(artist);
const taskDone = (entry: Entry) => entry.status === "Готово" || entry.progress === 100;
const isRelease = (entry: Entry) => releaseKinds.some(kind => kind === entry.kind);
const prettyDate = (date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  date ? new Intl.DateTimeFormat("ru-RU", { ...options, timeZone: "UTC" }).format(new Date(date + "T12:00:00Z")) : "Без даты";
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(new Date());
const dateAscending = (a: Entry, b: Entry) => (a.date || "9999").localeCompare(b.date || "9999");

function Badge({ entry }: { entry: Entry }) {
  return <span className={"badge " + statusStyle[statuses.indexOf(entry.status)]}><i />{entry.status}</span>;
}

function Cover({ entry }: { entry: Entry }) {
  const [failedSource, setFailedSource] = useState("");
  const glowId = useId();
  const theme = entry.id === "two-stars" ? "stars" : entry.id === "oblivion" ? "portal" :
    entry.id === "holiday" ? "frost" : entry.id === "january" ? "amber" : artistStyle(entry.artist);
  return <div className={"cover " + theme}>
    {entry.cover && failedSource !== entry.cover ? <img src={entry.cover} alt={"Обложка «" + entry.title + "»"} onError={() => setFailedSource(entry.cover)} /> :
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs><radialGradient id={glowId}><stop stopColor="currentColor" stopOpacity=".5" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient></defs>
        <circle cx="50" cy="50" r="45" fill={"url(#" + glowId + ")"} />
        {theme === "stars" ? <>
          <path d="M30 47l3 9 9 3-9 3-3 9-3-9-9-3 9-3zm36-29 4 13 13 4-13 4-4 13-4-13-13-4 13-4z" fill="currentColor" />
          <ellipse cx="51" cy="50" rx="44" ry="17" transform="rotate(-30 51 50)" />
        </> : <>
          <circle cx="50" cy="50" r="31" /><circle cx="50" cy="50" r="20" /><circle cx="50" cy="50" r="9" />
          <ellipse cx="50" cy="50" rx="46" ry="16" transform="rotate(-36 50 50)" />
          <path d="M50 10v12m0 56v12M10 50h12m56 0h12" />
          <circle cx="50" cy="50" r="2" fill="currentColor" />
        </>}
      </svg>}
  </div>;
}

function Row({ entry, onOpen, onDone }: { entry: Entry; onOpen: () => void; onDone?: () => void }) {
  const task = entry.kind === "Задача";
  const done = task && taskDone(entry);
  const toggleLabel = done ? "Вернуть в работу" : "Отметить выполненной";
  return <div className={"entry-row" + (task ? " task-row" : "")}>
    <button className="row-main" onClick={onOpen}>
      {task ? <span className="task-icon"><ListTodo size={20} /></span> : <Cover entry={entry} />}
      <span className="row-name">
        <strong>{entry.title}</strong>
        {task ? <small>{done ? "Задача завершена" : entry.next || "Указать следующий шаг"}</small> :
          <small><i className={"artist-dot " + artistStyle(entry.artist)} />{entry.artist}<span className="meta-dot">·</span>{entry.kind}</small>}
      </span>
      <span className="row-date">{entry.date ? prettyDate(entry.date) : task ? "" : "Без даты"}{entry.date && entry.provisional && <small>Черновая дата</small>}</span>
      <Badge entry={done ? { ...entry, status: "Готово" } : entry} />
      {!task && <span className="row-progress">{entry.progress > 0 && entry.progress < 100 && <><span className="track"><i style={{ width: entry.progress + "%" }} /></span>{entry.progress}%</>}</span>}
      <ChevronRight size={17} className="row-chevron" />
    </button>
    {onDone && <button className="icon-button done-button" aria-label={toggleLabel + " · " + entry.title} title={toggleLabel} onClick={onDone}>{done ? <ArrowLeft size={16} /> : <Check size={18} />}</button>}
  </div>;
}

function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="panel-header"><h2>{title}</h2>{action}</div>;
}

export default function Studio() {
  const [tab, setTab] = useState<Tab>("overview");
  const [records, setRecords] = useState<RecordVersion[]>(starterEntries.map(entry => ({ entry, revision: null })));
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<{ record: RecordVersion; view: boolean } | null>(null);
  const [artist, setArtist] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [day, setDay] = useState("2026-11-10");

  async function refresh() {
    setLoadError("");
    try {
      const result = await fetch("/api/records", { cache: "no-store" });
      if (result.status === 401) throw new Error("Войдите через ChatGPT, чтобы сохранять записи.");
      if (!result.ok) throw new Error("Не удалось загрузить сохранённые записи.");
      setRecords(await result.json());
      setLoaded(true);
    } catch (error) {
      setLoaded(false);
      setLoadError(error instanceof Error ? error.message : "Нет связи с хранилищем.");
    }
  }
  useEffect(() => { setDay(today()); void refresh(); }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const entries = records.map(({ entry }) => entry);
  const upcoming = entries.filter(entry => isRelease(entry) && entry.date >= day && entry.status !== "Выпущено" && entry.status !== "Отложено").sort(dateAscending);
  const next = upcoming[0];
  const openTasks = entries.filter(entry => entry.kind === "Задача" && !taskDone(entry)).sort(dateAscending);
  const open = (entry: Entry) => {
    const record = records.find(item => item.entry.id === entry.id);
    if (record) setEditor({ record, view: true });
  };
  function create(date = "") {
    setEditor({ record: { entry: { ...blank, date, provisional: !!date,
      artist: tab === "tasks" ? "W4steR MUSIC" : artists.find(value => value === artist && value !== "W4steR MUSIC") ?? "W4steR",
      kind: tab === "tasks" ? "Задача" : tab === "ideas" ? "Идея" : "Сингл",
    }, revision: null }, view: false });
  }
  function reset() { setArtist(""); setKind(""); setStatus(""); setSearch(""); setFrom(""); setTo(""); }
  function navigate(value: Tab) { reset(); setTab(value); window.scrollTo({ top: 0, behavior: "instant" }); }
  async function save(entry: Entry, revision: string | null) {
    if (!loaded) throw new Error("Сначала подключитесь к хранилищу.");
    const result = await fetch("/api/records", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entry, revision }),
    });
    if (!result.ok) {
      const data = await result.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error || "Не удалось сохранить запись. Попробуйте ещё раз.");
    }
    const saved = await result.json() as RecordVersion;
    setRecords(old => old.some(record => record.entry.id === saved.entry.id)
      ? old.map(record => record.entry.id === saved.entry.id ? saved : record)
      : [...old, saved]);
    setMessage("Запись сохранена");
  }
  async function finish(entry: Entry) {
    const item = records.find(record => record.entry.id === entry.id);
    if (!item) return;
    const done = taskDone(entry);
    try { await save({ ...entry, status: done ? "В работе" : "Готово", progress: done ? 0 : 100 }, item.revision); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось обновить задачу."); }
  }

  const filtered = entries.filter(entry => {
    const inTab = tab === "ideas" ? entry.kind === "Идея" : tab === "tasks" ? entry.kind === "Задача" : isRelease(entry);
    return inTab && (!artist || artist === entry.artist) && (!kind || kind === entry.kind) &&
      (!status || status === entry.status) && (!from || entry.date >= from) &&
      (!to || (entry.date && entry.date <= to)) &&
      (!search || (entry.title + " " + entry.notes + " " + entry.next).toLocaleLowerCase("ru").includes(search.trim().toLocaleLowerCase("ru")));
  }).sort(tab === "releases" ? (a, b) => b.date.localeCompare(a.date) : dateAscending);
  const current = tabs.find(item => item.id === tab)!;

  return <div className="shell">
    <header className="masthead">
      <div className="masthead-inner">
        <button className="brand" onClick={() => navigate("overview")} aria-label="W4steR MUSIC, обзор">
          <img src="/mark.svg" alt="" width="40" height="40" /><span><strong>W4steR<br />MUSIC</strong></span>
        </button>
        <nav aria-label="Разделы">{tabs.map(({ id, label, icon: Icon }) =>
          <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={16} /><span>{label}</span></button>)}</nav>
        <button className="primary add-entry" onClick={() => create()}><Plus size={19} />Новая запись</button>
      </div>
    </header>
    <div className="workspace">
      <main>
        {loadError && <div className="notice" role="status">{loadError} <button onClick={() => void refresh()}>Повторить</button>{loadError.startsWith("Войдите") && <a href="/signin-with-chatgpt?return_to=%2F" target="_top">Войти</a>}</div>}
        {tab === "overview" ? <>
          <div className="front-grid">
            <section className="mast-cover">
              <div className="mast-art" aria-hidden="true"><span className="vinyl" /><span className="sticker">W4<br />MUSIC</span><span className="spark">✳</span></div>
              <div className="mast-copy">
                <p className="eyebrow">W4steR MUSIC / СТУДИЯ</p>
                <h1>На пульте<span>.</span></h1>
                <p>Релизы, идеи и задачи лейбла.</p>
                <button className="secondary" onClick={() => navigate("calendar")}><CalendarDays size={17} /> Календарь <ArrowUpRight size={16} /></button>
              </div>
            </section>
            <section className="panel next-panel">
              <PanelHeader title="Следующий шаг" />
              {next ? <>
                <p className="focus-action">{next.next || "Укажи следующее действие в карточке релиза."}</p>
                <div className="next-release"><Cover entry={next} /><div><strong>{next.title}</strong><small>{next.artist} · {prettyDate(next.date)}{next.provisional ? " · черновая дата" : ""}</small></div></div>
                <button className="text-button" onClick={() => open(next)}>Открыть карточку <ArrowUpRight size={16} /></button>
              </> : <p className="empty">Добавь дату выпуска в карточке релиза.</p>}
            </section>
          </div>
          <div className="artist-strip" aria-label="Релизы по артистам">
            <span>АРТИСТЫ</span>
            {artists.slice(0, 3).map(name => <button key={name} className={artistStyle(name)} onClick={() => { navigate("releases"); setArtist(name); }}>
              <i className="artist-dot" />{name}<ArrowUpRight size={13} />
            </button>)}
          </div>
          <section className="panel releases-preview">
            <PanelHeader title="Ближайшие релизы" action={<button className="text-button" onClick={() => navigate("releases")}>Все релизы <ArrowRight size={16} /></button>} />
            <div className="release-grid">{upcoming.slice(0, 4).map(entry =>
              <button className={"release-tile " + artistStyle(entry.artist)} key={entry.id} onClick={() => open(entry)}>
                <div className="tile-top"><Cover entry={entry} /><ArrowUpRight size={20} /></div>
                <div className="tile-title"><strong>{entry.title}</strong><small>{entry.artist} · {entry.kind}</small></div>
                <div className="tile-footer"><span>{prettyDate(entry.date)}{entry.provisional && <small>Черновая дата</small>}</span><Badge entry={entry} /></div>
              </button>)}</div>
            {!upcoming.length && <p className="empty">Добавь дату выпуска в карточке релиза.</p>}
          </section>
          <section className="panel tasks-preview">
            <PanelHeader title="Открытые задачи" action={<button className="text-button" onClick={() => navigate("tasks")}>Все задачи <ArrowRight size={16} /></button>} />
            {openTasks.slice(0, 3).map(entry => <Row key={entry.id} entry={entry} onOpen={() => open(entry)} onDone={loaded ? () => void finish(entry) : undefined} />)}
            {!openTasks.length && <p className="empty">Открытых задач пока нет.</p>}
          </section>
        </> : <>
          <div className={"section-heading page-" + tab}><p className="eyebrow">W4steR MUSIC / СТУДИЯ</p><h1>{current.label}<span aria-hidden="true">.</span></h1><p>{{
            releases: "Карточки синглов, EP и альбомов, ссылки на площадки и тексты публикаций.",
            calendar: "Планируй выпуски с интервалом около трёх недель. Черновые даты можно менять.",
            ideas: "Храни идеи и демо, отмечай прогресс и фиксируй следующее действие.",
            tasks: "Публикации, оформление каналов и обновления сайта.",
          }[tab]}</p></div>
          <div className="filters">
            <label className="search"><Search size={17} /><input aria-label="Поиск записей" placeholder="Поиск по записям" value={search} onChange={e => setSearch(e.target.value)} /></label>
            <Filter label="Артист" value={artist} values={artists} onChange={setArtist} />
            {tab !== "tasks" && tab !== "ideas" && <Filter label="Тип" value={kind} values={releaseKinds} onChange={setKind} />}
            <Filter label="Статус" value={status} values={statuses} onChange={setStatus} />
            <label className="date-filter">С <input aria-label="Дата с" type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label className="date-filter">По <input aria-label="Дата по" type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
            {(artist || kind || status || search || from || to) && <button className="text-button" onClick={reset}>Сбросить</button>}
          </div>
          {tab === "calendar" ? <Calendar entries={filtered} upcoming={upcoming} day={day} open={open} create={create} /> :
            <section className="panel list-panel" aria-label={current.label}>
            {filtered.map(entry => <Row key={entry.id} entry={entry} onOpen={() => open(entry)} onDone={tab === "tasks" && loaded ? () => void finish(entry) : undefined} />)}
            {!filtered.length && <p className="empty">Здесь пока нет записей по выбранным фильтрам.</p>}</section>}
        </>}
        <footer className="footer"><AudioLines size={15} /> W4steR MUSIC <span>Личное пространство</span></footer>
      </main>
    </div>
    {editor && <Editor key={editor.record.entry.id} {...editor} loaded={loaded} close={() => setEditor(null)} notify={setMessage} save={save} />}
    {message && <div className="toast" role="status">{message}</div>}
  </div>;
}

function Filter({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}><option value="">{label} · все</option>{values.map(item => <option key={item}>{item}</option>)}</select>;
}

function Calendar({ entries, upcoming, day, open, create }: { entries: Entry[]; upcoming: Entry[]; day: string; open: (entry: Entry) => void; create: (day: string) => void }) {
  const [month, setMonth] = useState(() => day.slice(0, 7));
  const first = new Date(month + "-01T12:00:00Z");
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const monthEntries = entries.filter(entry => entry.date.startsWith(month + "-")).sort(dateAscending);
  function shift(by: number) {
    setMonth(dateKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + by, 1))).slice(0, 7));
  }
  const suggested = new Date((upcoming.at(-1)?.date ?? day) + "T12:00:00Z");
  suggested.setUTCDate(suggested.getUTCDate() + 21);
  const suggestedDate = dateKey(suggested);
  return <>
    <section className="panel calendar">
      <PanelHeader title={prettyDate(month + "-01", { month: "long", year: "numeric" })} action={<div className="calendar-actions"><button className="icon-button" aria-label="Предыдущий месяц" onClick={() => shift(-1)}><ChevronLeft size={19} /></button><button className="text-button" onClick={() => setMonth(day.slice(0, 7))}>Сегодня</button><button className="icon-button" aria-label="Следующий месяц" onClick={() => shift(1)}><ChevronRight size={19} /></button></div>} />
      <div className="calendar-grid">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(name => <div key={name} className="weekday">{name}</div>)}
        {Array.from({ length: Math.ceil((count + offset) / 7) * 7 }, (_, index) => {
          const number = index - offset + 1;
          if (number < 1 || number > count) return <div key={index} className="calendar-cell muted" />;
          const date = month + "-" + String(number).padStart(2, "0");
          return <div key={index} className={"calendar-cell" + (date === day ? " today" : "")}>
            <button className="day-number" title="Добавить запись" aria-label={"Добавить запись на " + prettyDate(date)} onClick={() => create(date)}>{number}</button>
            {monthEntries.filter(entry => entry.date === date).map(entry => <button className={"event " + artistStyle(entry.artist)} title={entry.title} key={entry.id} onClick={() => open(entry)}>{entry.title}{entry.provisional ? " · черн." : ""}</button>)}
          </div>;
        })}
      </div>
    </section>
    <section className="panel calendar-list"><PanelHeader title="Релизы месяца" action={<button className="text-button" onClick={() => create(suggestedDate)}><Plus size={16} /> Слот через 21 день · {prettyDate(suggestedDate)}</button>} />
      {monthEntries.length ? monthEntries.map(entry => <Row key={entry.id} entry={entry} onOpen={() => open(entry)} />) : <p className="empty">В этом месяце нет релизов по выбранным фильтрам.</p>}
    </section>
  </>;
}

async function coverFromFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15_000_000) {
    throw new Error("Выберите JPG, PNG или WebP до 15 МБ.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось подготовить обложку.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/webp", 0.78);
    if (image.length > 450000) throw new Error("Обложка слишком большая. Уменьшите изображение.");
    return image;
  } finally {
    bitmap.close();
  }
}

function Editor({ record, view, loaded, close, notify, save }: {
  record: RecordVersion; view: boolean; loaded: boolean; close: () => void; notify: (text: string) => void;
  save: (entry: Entry, revision: string | null) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const newId = useRef("");
  const [entry, setEntry] = useState(record.entry);
  const [editing, setEditing] = useState(!view);
  const [channel, setChannel] = useState<typeof channels[number]>("Telegram");
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (editing) dialog.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
  }, [editing]);
  const patch = (fields: Partial<Entry>) => setEntry(old => ({ ...old, ...fields }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!entry.title.trim()) { setError("Введите название записи."); return; }
    const links = entry.links.filter(link => link.label.trim() || link.url.trim()).map(link => ({
      label: link.label.trim(), url: link.url.trim(),
    }));
    if (links.some(link => !link.label || !safeLink(link.url))) {
      setError("Для каждой ссылки нужны подпись и корректный адрес HTTP или HTTPS.");
      return;
    }
    if (entry.cover && !entry.cover.startsWith("data:") && !safeLink(entry.cover.trim())) {
      setError("Укажите адрес изображения HTTP или HTTPS.");
      return;
    }
    setBusy(true);
    newId.current ||= crypto.randomUUID();
    try {
      await save({ ...entry, links, cover: entry.cover.trim(), id: entry.id || newId.current, title: entry.title.trim() }, record.revision);
      close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить запись.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.posts[channel]);
      notify("Текст скопирован");
    } catch {
      setError("Копирование недоступно. Выделите текст вручную.");
    }
  }

  const postTabs = <div className="post-tabs" aria-label="Канал публикации">
    {channels.map(name => <button type="button" key={name} aria-pressed={channel === name} onClick={() => setChannel(name)}>{name}</button>)}
  </div>;
  return <dialog ref={dialog} className="editor" aria-labelledby="editor-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <div className="editor-head"><div><p className="eyebrow">{entry.id ? entry.artist : "СТУДИЯ ЛЕЙБЛА"}</p>
      <h2 id="editor-title">{editing ? entry.id ? "Редактировать запись" : "Новая запись" : entry.title}</h2></div>
      <button className="icon-button" aria-label="Закрыть карточку" type="button" disabled={busy} onClick={close}><X size={21} /></button></div>
    {editing ? <form onSubmit={submit}>
      <div className="editor-body">
        <label>Название<input name="title" required maxLength={150} value={entry.title} onChange={event => patch({ title: event.target.value })} /></label>
        <div className="form-grid">
          <label>Артист<select value={entry.artist} onChange={e => patch({ artist: e.target.value as Entry["artist"] })}>{artists.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>Тип<select value={entry.kind} onChange={e => patch({ kind: e.target.value as Entry["kind"] })}>{kinds.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>Статус<select value={entry.status} onChange={e => patch({ status: e.target.value as Entry["status"] })}>{statuses.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>Дата<input type="date" value={entry.date} onChange={e => patch({ date: e.target.value })} /></label>
        </div>
        <label className="inline-check"><input type="checkbox" checked={entry.provisional} onChange={e => patch({ provisional: e.target.checked })} /> Черновая дата</label>
        <label>Прогресс · {entry.progress}%<input type="range" min="0" max="100" value={entry.progress} onChange={e => patch({ progress: Number(e.target.value) })} /></label>
        <label>Следующий практический шаг<input placeholder="Например, отправить мастер дистрибьютору" maxLength={1000} value={entry.next} onChange={e => patch({ next: e.target.value })} /></label>
        <label>Заметки<textarea rows={3} maxLength={5000} value={entry.notes} onChange={e => patch({ notes: e.target.value })} /></label>
        <fieldset>
          <legend>Обложка</legend>
          <div className="cover-edit"><Cover entry={entry} /><div>
            {entry.cover.startsWith("data:") ? <button type="button" className="text-button" onClick={() => patch({ cover: "" })}>Убрать загруженную обложку</button> :
              <label>URL изображения<input placeholder="https://…" value={entry.cover} maxLength={2000} onChange={e => patch({ cover: e.target.value })} /></label>}
            <label className="file-label">Или загрузите JPG, PNG, WebP<input type="file" accept="image/jpeg,image/png,image/webp" disabled={coverBusy} onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCoverBusy(true);
              setError("");
              try { patch({ cover: await coverFromFile(file) }); }
              catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось загрузить обложку."); }
              finally { setCoverBusy(false); }
            }} /></label>
          </div></div>
        </fieldset>
        <fieldset><legend>Ссылки на площадки</legend>
          {entry.links.map((link, index) => <div className="link-edit" key={index}>
            <input aria-label={"Подпись ссылки " + (index + 1)} placeholder="Площадка" maxLength={80} value={link.label} onChange={e => patch({ links: entry.links.map((value, i) => i === index ? { ...value, label: e.target.value } : value) })} />
            <input aria-label={"Адрес ссылки " + (index + 1)} placeholder="https://…" maxLength={2000} value={link.url} onChange={e => patch({ links: entry.links.map((value, i) => i === index ? { ...value, url: e.target.value } : value) })} />
            <button className="icon-button" type="button" aria-label={"Убрать ссылку " + (index + 1)} onClick={() => patch({ links: entry.links.filter((_, i) => i !== index) })}><X size={16} /></button>
          </div>)}
          <button type="button" className="text-button" disabled={entry.links.length >= 20} onClick={() => patch({ links: [...entry.links, { label: "", url: "" }] })}><Plus size={15} /> Добавить ссылку</button>
        </fieldset>
        <fieldset><legend>Публикации</legend>{postTabs}
          <textarea aria-label={"Текст для " + channel} rows={5} maxLength={10000} placeholder={"Текст для " + channel} value={entry.posts[channel]} onChange={e => patch({ posts: { ...entry.posts, [channel]: e.target.value } })} />
        </fieldset>
      </div>
      <div className="editor-footer">
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loaded && <p className="form-error">Сохранение станет доступно после подключения к хранилищу.</p>}
        <button type="button" className="secondary" onClick={close} disabled={busy}>Отмена</button>
        <button className="primary" type="submit" disabled={busy || coverBusy || !loaded}>{busy ? "Сохраняю…" : "Сохранить запись"}</button>
      </div>
    </form> : <>
      <div className="editor-body">
        <div className="record-summary"><Cover entry={entry} /><div><p>{entry.kind} · {entry.date ? prettyDate(entry.date, { day: "numeric", month: "long", year: "numeric" }) : "Без даты"}{entry.date && entry.provisional ? " · Черновик" : ""}</p><Badge entry={entry} />
          {entry.progress > 0 && entry.progress < 100 && <div className="row-progress"><span className="track"><i style={{ width: entry.progress + "%" }} /></span>{entry.progress}%</div>}</div></div>
        <div className="detail-block"><h3>Следующий шаг</h3><p>{entry.next || "Пока не указан."}</p></div>
        {entry.notes && <div className="detail-block"><h3>Заметки</h3><p>{entry.notes}</p></div>}
        {entry.links.length > 0 && <div className="detail-block"><h3>Ссылки</h3><div className="link-pills">{entry.links.filter(link => safeLink(link.url)).map((link, index) => <a key={index} href={link.url} target="_blank" rel="noreferrer"><Link2 size={15} />{link.label}<ArrowUpRight size={14} /></a>)}</div></div>}
        <div className="detail-block"><h3>Публикации</h3>{postTabs}
          <div className="post-preview">{entry.posts[channel] || "Текст ещё не добавлен."}</div>
          {entry.posts[channel] && <button className="text-button" type="button" onClick={() => void copy()}><Clipboard size={15} /> Скопировать текст</button>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </div>
      <div className="editor-footer"><button className="secondary" type="button" onClick={close}>Закрыть</button><button className="primary" type="button" onClick={() => { setEditing(true); setError(""); }}>Редактировать</button></div>
    </>}
  </dialog>;
}
