"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateAchievementCard } from "@/lib/ai/achievement-card";
import type { Plan } from "@/lib/ai/models";
import { createClient } from "@/lib/supabase/server";
import type { Entry, QaExchange } from "@/lib/types";

const uuid = z.string().uuid();

export async function generateCardFromEntry(formData: FormData) {
  const parsed = uuid.safeParse(formData.get("entryId"));
  if (!parsed.success) {
    redirect("/journal");
  }
  const entryId = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: entryData } = await supabase
    .from("entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (!entryData) {
    redirect("/journal");
  }
  const entry = entryData as Entry;

  const [{ data: qaData }, { data: profile }] = await Promise.all([
    supabase
      .from("qa_exchanges")
      .select("question, answer")
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
  ]);

  const exchanges = (qaData ?? []) as Pick<QaExchange, "question" | "answer">[];
  const plan = ((profile?.plan as Plan | undefined) ?? "free") satisfies Plan;

  let cardId: string;
  try {
    const generated = await generateAchievementCard(
      entry.raw_text,
      entry.entry_date,
      exchanges,
      plan,
    );

    const { data: card, error } = await supabase
      .from("achievement_cards")
      .insert({
        user_id: user.id,
        ...generated,
        status: "draft",
        source_entry_ids: [entryId],
      })
      .select("id")
      .single();

    if (error || !card) {
      throw error ?? new Error("insert failed");
    }
    cardId = card.id;
  } catch (err) {
    console.error("card generation failed", err);
    redirect(`/journal/${entryId}?error=card`);
  }

  revalidatePath(`/journal/${entryId}`);
  redirect(`/cards/${cardId}`);
}

export async function confirmCard(formData: FormData) {
  const parsed = uuid.safeParse(formData.get("cardId"));
  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("achievement_cards")
    .update({ status: "confirmed" })
    .eq("id", parsed.data);

  revalidatePath(`/cards/${parsed.data}`);
}
