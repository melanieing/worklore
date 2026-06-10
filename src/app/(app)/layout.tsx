import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { t } from "@/lib/i18n/en";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6">
      <header className="flex items-center justify-between border-b border-neutral-200 py-4">
        <Link href="/journal" className="font-semibold">
          {t("app.name")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/journal" className="text-neutral-500 hover:text-neutral-900">
            {t("journal.title")}
          </Link>
          <Link href="/timeline" className="text-neutral-500 hover:text-neutral-900">
            {t("timeline.nav")}
          </Link>
          <Link
            href="/journal/new"
            className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700"
          >
            {t("journal.new")}
          </Link>
          <form action={signOut}>
            <button className="text-neutral-500 hover:text-neutral-900">
              {t("auth.signOut")}
            </button>
          </form>
        </nav>
      </header>
      <main className="py-8">{children}</main>
    </div>
  );
}
