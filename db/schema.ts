import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const records = sqliteTable("label_records", {
  owner: text("owner").notNull(),
  id: text("id").notNull(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.owner, table.id] })]);
