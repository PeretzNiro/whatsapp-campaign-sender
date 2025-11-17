import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import { Contact } from "./types.js";
import { env } from "./env.js";

export async function loadContacts(): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const rows: Contact[] = [];
    fs.createReadStream(env.CONTACTS_CSV)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row: any) => {
        rows.push({
          phone: String(row.phone || "").trim(),
          opt_in: String(row.opt_in || "").toLowerCase() === "true",
          tags: row.tags ? String(row.tags) : undefined,
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

export async function persistContacts(contacts: Contact[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(env.CONTACTS_CSV);
    const stringifier = stringify({ header: true, columns: ["phone", "opt_in", "tags"] });
    stringifier.on("error", reject).pipe(writable).on("finish", resolve).on("error", reject);
    contacts.forEach(c => stringifier.write({ phone: c.phone, opt_in: c.opt_in, tags: c.tags || "" }));
    stringifier.end();
  });
}

export async function optOut(phone: string) {
  const contacts = await loadContacts();
  const idx = contacts.findIndex(c => c.phone === phone);
  if (idx >= 0) {
    contacts[idx].opt_in = false;
    await persistContacts(contacts);
  }
}
