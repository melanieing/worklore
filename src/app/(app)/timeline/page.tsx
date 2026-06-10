import Link from "next/link";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";
import type { AchievementCard } from "@/lib/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(date: string | null): string | null {
  if (!date) return null;
  const m = Number(date.slice(5, 7));
  return MONTHS[m - 1] ?? null;
}

function periodLabel(card: AchievementCard): string | null {
  const start = monthLabel(card.period_start);
  const end = monthLabel(card.period_end);
  if (start && end && start !== end) return `${start}–${end}`;
  return start ?? end;
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const supabase = await createClient();

  let cardQuery = supabase
    .from("achievement_cards")
    .select("*")
    .order("period_start", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (tag) {
    cardQuery = cardQuery.eq("project_tag", tag);
  }

  const [{ data: cardData }, { data: tagData }, { data: entryIds }, { data: cardSources }] =
    await Promise.all([
      cardQuery,
      supabase
        .from("achievement_cards")
        .select("project_tag")
        .not("project_tag", "is", null),
      supabase.from("entries").select("id"),
      supabase.from("achievement_cards").select("source_entry_ids"),
    ]);

  const cards = (cardData ?? []) as AchievementCard[];
  const tags = [
    ...new Set((tagData ?? []).map((r) => r.project_tag as string)),
  ].sort();

  const cardedEntryIds = new Set(
    (cardSources ?? []).flatMap(
      (c) => (c.source_entry_ids as string[] | null) ?? [],
    ),
  );
  const uncardedCount = (entryIds ?? []).filter(
    (e) => !cardedEntryIds.has(e.id as string),
  ).length;

  const byYear = new Map<string, AchievementCard[]>();
  for (const card of cards) {
    const year = (card.period_start ?? card.created_at).slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), card]);
  }
  const years = [...byYear.keys()].sort().reverse();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("timeline.title")}</h1>
        {tags.length > 0 && (
          <nav className="flex flex-wrap justify-end gap-1.5 text-xs">
            <Link
              href="/timeline"
              className={`rounded-full border px-3 py-1 ${!tag ? "border-neutral-900 font-semibold" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
            >
              {t("timeline.allTags")}
            </Link>
            {tags.map((tg) => (
              <Link
                key={tg}
                href={`/timeline?tag=${encodeURIComponent(tg)}`}
                className={`rounded-full border px-3 py-1 ${tag === tg ? "border-neutral-900 font-semibold" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
              >
                #{tg}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <h2 className="text-lg font-semibold">{t("timeline.empty.heading")}</h2>
          <p className="max-w-md text-sm text-neutral-500">
            {t("timeline.empty.hint")}
          </p>
          <Link
            href="/journal"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {t("journal.title")} →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <section key={year} className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-900">{year}</h2>
              <ul className="space-y-3">
                {byYear.get(year)!.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={`/cards/${card.id}`}
                      className={`block rounded-lg border border-neutral-200 border-l-4 p-4 hover:bg-neutral-50 ${
                        card.status === "confirmed"
                          ? "border-l-emerald-600"
                          : "border-l-amber-600"
                      }`}
                    >
                      <span className="text-sm font-semibold">{card.title}</span>
                      <span className="mt-1 block text-xs text-neutral-500">
                        {[periodLabel(card), card.project_tag && `#${card.project_tag}`]
                          .filter(Boolean)
                          .join(" · ")}
                        {" · "}
                        <span
                          className={
                            card.status === "confirmed"
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-amber-700"
                          }
                        >
                          {card.status === "confirmed"
                            ? t("card.status.confirmed")
                            : t("card.status.draft")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {uncardedCount > 0 && (
        <Link
          href="/journal"
          className="block rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 hover:bg-neutral-50"
        >
          + {uncardedCount} {t("timeline.uncarded")}
        </Link>
      )}
    </div>
  );
}
