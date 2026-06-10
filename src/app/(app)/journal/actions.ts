"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateFollowupQuestions } from "@/lib/ai/followup";
import { createClient } from "@/lib/supabase/server";

const createEntrySchema = z.object({
  rawText: z.string().trim().min(1).max(20000),
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function createEntry(formData: FormData) {
  const parsed = createEntrySchema.safeParse({
    rawText: formData.get("rawText"),
    entryDate: formData.get("entryDate") || undefined,
  });
  if (!parsed.success) {
    redirect("/journal/new?error=empty");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { rawText, entryDate } = parsed.data;

  const { data: entry, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      raw_text: rawText,
      source: "text",
      ...(entryDate ? { entry_date: entryDate } : {}),
    })
    .select("id, entry_date")
    .single();

  if (error || !entry) {
    redirect("/journal/new?error=save");
  }

  // 역질문 생성 — 원데이터 저장이 우선이므로 AI 실패는 기록을 막지 않는다.
  try {
    const questions = await generateFollowupQuestions(rawText, entry.entry_date);
    if (questions.length > 0) {
      await supabase.from("qa_exchanges").insert(
        questions.map((question) => ({
          user_id: user.id,
          entry_id: entry.id,
          question,
        })),
      );
    }
  } catch (err) {
    console.error("followup generation failed", err);
  }

  revalidatePath("/journal");
  redirect(`/journal/${entry.id}`);
}

const answerSchema = z.object({
  exchangeId: z.string().uuid(),
  entryId: z.string().uuid(),
  answer: z.string().trim().min(1).max(5000),
});

export async function answerQuestion(formData: FormData) {
  const parsed = answerSchema.safeParse({
    exchangeId: formData.get("exchangeId"),
    entryId: formData.get("entryId"),
    answer: formData.get("answer"),
  });
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

  // answer 는 1회만 기록 가능 — DB 트리거(qa_answer_once)가 불변성을 강제한다.
  await supabase
    .from("qa_exchanges")
    .update({ answer: parsed.data.answer })
    .eq("id", parsed.data.exchangeId)
    .is("answer", null);

  revalidatePath(`/journal/${parsed.data.entryId}`);
}
