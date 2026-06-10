import { notFound } from "next/navigation";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";
import type { AchievementCard } from "@/lib/types";
import { confirmCard } from "../actions";

function MetricValue({ metric }: { metric: AchievementCard["metrics"][number] }) {
  if (metric.before && metric.after) {
    return (
      <b>
        {metric.before} → {metric.after}
      </b>
    );
  }
  return <b>{metric.value ?? metric.after ?? metric.before ?? "—"}</b>;
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("achievement_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }
  const card = data as AchievementCard;
  const star: [string, string | null][] = [
    ["S", card.situation],
    ["T", card.task],
    ["A", card.action],
    ["R", card.result],
  ];

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={
              card.status === "confirmed"
                ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            }
          >
            {card.status === "confirmed"
              ? t("card.status.confirmed")
              : t("card.status.draft")}
          </span>
          {card.project_tag && (
            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
              #{card.project_tag}
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold leading-snug">{card.title}</h1>
        {(card.period_start || card.period_end) && (
          <p className="text-xs text-neutral-400">
            {t("card.period")}: {card.period_start ?? "?"} – {card.period_end ?? "?"}
          </p>
        )}
      </header>

      {card.metrics.length > 0 && (
        <section className="rounded-lg border border-neutral-200 p-4">
          <h2 className="pb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">
            {t("card.metrics")}
          </h2>
          <ul className="divide-y divide-dashed divide-neutral-200 text-sm">
            {card.metrics.map((m, i) => (
              <li key={i} className="flex justify-between py-2">
                <span className="text-neutral-600">{m.label}</span>
                <MetricValue metric={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 text-sm leading-relaxed text-neutral-700">
        {star.map(
          ([letter, text]) =>
            text && (
              <p key={letter}>
                <b className="text-neutral-900">{letter}</b> — {text}
              </p>
            ),
        )}
      </section>

      {card.skills.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {card.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600"
            >
              {skill}
            </span>
          ))}
        </section>
      )}

      {card.status === "draft" ? (
        <form action={confirmCard}>
          <input type="hidden" name="cardId" value={card.id} />
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
            ✓ {t("card.confirm")}
          </button>
        </form>
      ) : (
        <p className="text-sm text-emerald-700">{t("card.confirmedNote")}</p>
      )}

      <p className="text-xs text-neutral-400">{t("card.sourceNote")}</p>
    </article>
  );
}
