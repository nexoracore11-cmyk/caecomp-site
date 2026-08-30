const saoPaulo = "America/Sao_Paulo";

function offsetAt(date: Date) {
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone: saoPaulo,
    timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT-03:00";
  const match = text.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) return -3 * 60 * 60 * 1000;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === "+" ? minutes : -minutes) * 60 * 1000;
}

/** Converts a datetime-local value into the corresponding instant in Goiânia. */
export function saoPauloLocalToIso(value: string) {
  const input = value.trim();
  if (!input) return null;
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(input)) return new Date(input).toISOString();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
  if (!match) throw new Error("Data e horário inválidos.");
  const milliseconds = Number((match[7] ?? "0").padEnd(3, "0"));
  const localAsUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] ?? 0), milliseconds);
  return new Date(localAsUtc - offsetAt(new Date(localAsUtc))).toISOString();
}

/** Formats an instant for a datetime-local input using Goiânia time. */
export function saoPauloDateTimeInput(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: saoPaulo,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
