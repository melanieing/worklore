// V1 ships English only; ko arrives in V1.5 (CLAUDE.md 코딩 컨벤션).
// All user-facing strings live here as keys so locale switching is mechanical.
export const en = {
  "app.name": "Worklore",
  "app.tagline": "Your 5-minute AI career interviewer",

  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "auth.signOut": "Sign out",
  "auth.checkInbox": "Check your inbox to confirm your email, then sign in.",
  "auth.error.invalid": "Invalid email or password.",
  "auth.error.generic": "Something went wrong. Please try again.",

  "journal.title": "Journal",
  "journal.new": "New entry",
  "journal.empty.heading": "What happened at work recently?",
  "journal.empty.hint":
    "A couple of sentences is plenty — shipped something, fixed something, talked someone into something. I'll ask the rest.",
  "journal.placeholder":
    "e.g. Rolled out the new caching layer today. Checkout got noticeably faster and the infra team was happy.",
  "journal.entryDate": "When did this happen?",
  "journal.save": "Save & get questions",
  "journal.saving": "Saving…",
  "journal.error.empty": "Write at least a sentence before saving.",
  "journal.error.generic": "Could not save your entry. Please try again.",

  "qa.heading": "Quick follow-ups",
  "qa.hint": "Answer what you can — numbers fade fast, so now is the best time.",
  "qa.answerPlaceholder": "Your answer…",
  "qa.submit": "Save answer",
  "qa.answered": "Answered",
  "qa.pendingGeneration": "Thinking of good questions…",
  "qa.none": "No follow-up questions for this entry.",
} as const;

export type I18nKey = keyof typeof en;

export function t(key: I18nKey): string {
  return en[key];
}
