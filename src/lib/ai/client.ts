import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }
  return client;
}
