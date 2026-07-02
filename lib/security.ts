const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;
const HTML_TAGS = /<[^>]*>/g;

export const EDUCATIONAL_NOTICE =
  "AI Log Generator gera apenas dados sintéticos para treinamento, laboratório e simulação. Não insira dados reais sensíveis.";

export function sanitizeText(input: unknown, maxLength = 3000) {
  return String(input ?? "")
    .replace(CONTROL_CHARS, "")
    .replace(HTML_TAGS, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeStringArray(input: unknown, maxItems = 20) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => sanitizeText(item, 100)).filter(Boolean).slice(0, maxItems);
}
