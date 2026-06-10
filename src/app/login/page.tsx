import { redirect } from "next/navigation";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/journal");
  }

  const { error, notice } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("app.name")}</h1>
        <p className="text-sm text-neutral-500">{t("app.tagline")}</p>
      </header>

      {notice === "check-inbox" && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {t("auth.checkInbox")}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error === "invalid" ? t("auth.error.invalid") : t("auth.error.generic")}
        </p>
      )}

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("auth.email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("auth.password")}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <button
          formAction={login}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {t("auth.signIn")}
        </button>
        <button
          formAction={signup}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
        >
          {t("auth.signUp")}
        </button>
      </form>
    </main>
  );
}
