import Link from "next/link";
import { notFound } from "next/navigation";
import { generateCardFromEntry } from "@/app/(app)/cards/actions";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";
import type { AchievementCard, Entry, QaExchange } from "@/lib/types";
import { answerQuestion } from "../actions";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: entryData } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!entryData) {
    notFound();
  }
  const entry = entryData as Entry;

  const [{ data: qaData }, { data: cardData }] = await Promise.all([
    supabase
      .from("qa_exchanges")
      .select("*")
      .eq("entry_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("achievement_cards")
      .select("id, title, status")
      .contains("source_entry_ids", [id])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const exchanges = (qaData ?? []) as QaExchange[];
  const card = cardData as Pick<AchievementCard, "id" | "title" | "status"> | null;

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs text-neutral-400">{entry.entry_date}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
          {entry.raw_text}
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">{t("qa.heading")}</h2>
          <p className="text-xs text-neutral-500">{t("qa.hint")}</p>
        </div>

        {exchanges.length === 0 && (
          <p className="text-sm text-neutral-400">{t("qa.none")}</p>
        )}

        <ul className="space-y-4">
          {exchanges.map((qa) => (
            <li
              key={qa.id}
              className="rounded-lg border border-neutral-200 p-4"
            >
              <p className="text-sm font-medium text-neutral-800">
                {qa.question}
              </p>
              {qa.answer ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
                  {qa.answer}
                </p>
              ) : (
                <form action={answerQuestion} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="exchangeId" value={qa.id} />
                  <input type="hidden" name="entryId" value={entry.id} />
                  <textarea
                    name="answer"
                    required
                    rows={2}
                    maxLength={5000}
                    placeholder={t("qa.answerPlaceholder")}
                    className="w-full resize-y rounded-md border border-neutral-300 p-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                  >
                    {t("qa.submit")}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 border-t border-neutral-200 pt-6">
        {error === "card" && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {t("card.error.generic")}
          </p>
        )}
        {card ? (
          <Link
            href={`/cards/${card.id}`}
            className="block rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50"
          >
            <span className="block text-xs text-neutral-400">
              {card.status === "confirmed"
                ? t("card.status.confirmed")
                : t("card.status.draft")}
            </span>
            <span className="text-sm font-medium">{card.title}</span>
            <span className="mt-1 block text-xs text-neutral-500">
              {t("card.view")}
            </span>
          </Link>
        ) : (
          <>
            <p className="text-sm text-neutral-600">✨ {t("card.hint")}</p>
            <form action={generateCardFromEntry}>
              <input type="hidden" name="entryId" value={entry.id} />
              <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                {t("card.generate")}
              </button>
            </form>
          </>
        )}
      </section>
    </article>
  );
}
