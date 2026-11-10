import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { records } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { artists, kinds, statuses, safeLink, validDate, starterEntries, type Entry } from "../../model";

export const dynamic = "force-dynamic";
const response = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});
const link = z.string().max(2000).refine(safeLink);
const entrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  title: z.string().trim().min(1).max(150),
  artist: z.enum(artists), kind: z.enum(kinds), status: z.enum(statuses),
  date: z.string().refine((date) => date === "" || validDate(date)),
  provisional: z.boolean(), progress: z.number().int().min(0).max(100),
  next: z.string().max(1000), notes: z.string().max(5000),
  cover: z.string().max(450000).refine((cover) => !cover || (cover.length <= 2000 && safeLink(cover)) ||
    /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(cover)),
  links: z.array(z.object({ label: z.string().trim().min(1).max(80), url: link })).max(20),
  posts: z.object({ Telegram: z.string().max(10000), Сайт: z.string().max(10000), YouTube: z.string().max(10000) }),
});
const changeSchema = z.object({ entry: entrySchema, revision: z.string().uuid().nullable() });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return response({ error: "Войдите через ChatGPT для доступа к записям." }, 401);
  const rows = await getDb().select().from(records).where(eq(records.owner, user.userId));
  const entries = new Map<string, { entry: Entry; revision: string | null }>(
    starterEntries.map((entry) => [entry.id, { entry, revision: null }]),
  );
  for (const row of rows) entries.set(row.id, { entry: JSON.parse(row.payload), revision: row.updatedAt });
  return response([...entries.values()]);
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return response({ error: "Войдите через ChatGPT для сохранения." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "same-origin") {
    return response({ error: "Источник запроса не разрешён." }, 403);
  }
  const raw = await request.text();
  if (raw.length > 550000) return response({ error: "Запись слишком большая." }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return response({ error: "Некорректная запись." }, 400); }
  const parsed = changeSchema.safeParse(body);
  if (!parsed.success) return response({ error: "Проверьте поля записи и адреса ссылок." }, 400);
  const { entry, revision } = parsed.data;
  const db = getDb();
  const updatedAt = crypto.randomUUID();
  const payload = JSON.stringify(entry);
  const saved = revision
    ? await db.update(records).set({ payload, updatedAt }).where(and(
        eq(records.owner, user.userId), eq(records.id, entry.id), eq(records.updatedAt, revision),
      )).returning({ id: records.id })
    : await db.insert(records).values({ owner: user.userId, id: entry.id, payload, updatedAt })
        .onConflictDoNothing().returning({ id: records.id });
  if (!saved.length) return response({ error: "Запись уже изменилась в другой вкладке. Скопируйте свои правки и обновите страницу." }, 409);
  return response({ entry, revision: updatedAt });
}
