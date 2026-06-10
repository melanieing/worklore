import { t } from "@/lib/i18n/en";
import { createEntry } from "../actions";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t("journal.empty.heading")}</h1>
        <p className="text-sm text-neutral-500">{t("journal.empty.hint")}</p>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error === "empty" ? t("journal.error.empty") : t("journal.error.generic")}
        </p>
      )}

      <form action={createEntry} className="flex flex-col gap-4">
        <textarea
          name="rawText"
          required
          rows={8}
          maxLength={20000}
          placeholder={t("journal.placeholder")}
          className="w-full resize-y rounded-md border border-neutral-300 p-3 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          {t("journal.entryDate")}
          <input
            name="entryDate"
            type="date"
            defaultValue={today}
            max={today}
            className="rounded-md border border-neutral-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {t("journal.save")}
        </button>
      </form>
    </div>
  );
}
