import Link from "next/link";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/lib/types";

export default async function JournalPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select("id, raw_text, entry_date, created_at")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = (data ?? []) as Pick<
    Entry,
    "id" | "raw_text" | "entry_date" | "created_at"
  >[];

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{t("journal.empty.heading")}</h1>
        <p className="max-w-md text-sm text-neutral-500">
          {t("journal.empty.hint")}
        </p>
        <Link
          href="/journal/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {t("journal.new")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h1 className="pb-4 text-xl font-semibold">{t("journal.title")}</h1>
      <ul className="divide-y divide-neutral-100">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/journal/${entry.id}`}
              className="block rounded-md px-2 py-3 hover:bg-neutral-50"
            >
              <span className="block text-xs text-neutral-400">
                {entry.entry_date}
              </span>
              <span className="line-clamp-2 text-sm text-neutral-800">
                {entry.raw_text}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
