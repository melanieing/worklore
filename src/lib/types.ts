// M1 수동 타입 정의. 추후 `supabase gen types typescript` 로 대체 예정.
export type Entry = {
  id: string;
  user_id: string;
  raw_text: string;
  source: "text" | "voice";
  audio_url: string | null;
  entry_date: string;
  created_at: string;
};

export type QaExchange = {
  id: string;
  user_id: string;
  entry_id: string;
  question: string;
  answer: string | null;
  asked_by: "ai";
  answered_at: string | null;
  created_at: string;
};
