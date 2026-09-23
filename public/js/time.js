// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 Tim Martinez
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

export const CORE_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix",
  "America/Toronto", "America/Vancouver", "America/Mexico_City", "America/Sao_Paulo",
  "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Asia/Manila", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong",
  "Asia/Kolkata", "Asia/Dubai", "Asia/Jerusalem",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth",
  "Pacific/Auckland", "UTC"
];

const ALIAS_RULES = [
  { pattern: /\b(?:new\s*york|nyc|eastern\s+time|eastern|\bet\b)/i, spec: { kind: "iana", zone: "America/New_York", label: "Eastern Time" } },
  { pattern: /\b(?:los\s*angeles|la\s+time|pacific\s+time|pacific|\bpt\b)/i, spec: { kind: "iana", zone: "America/Los_Angeles", label: "Pacific Time" } },
  { pattern: /\b(?:chicago|central\s+time|\bct\b)/i, spec: { kind: "iana", zone: "America/Chicago", label: "Central Time" } },
  { pattern: /\b(?:denver|mountain\s+time|\bmt\b)/i, spec: { kind: "iana", zone: "America/Denver", label: "Mountain Time" } },
  { pattern: /\b(?:london|uk\s+time|british\s+time)\b/i, spec: { kind: "iana", zone: "Europe/London", label: "London time" } },
  { pattern: /\b(?:manila|philippines|philippine\s+time|\bpht\b)\b/i, spec: { kind: "iana", zone: "Asia/Manila", label: "Philippine Time" } },
  { pattern: /\b(?:singapore|\bsgt\b)\b/i, spec: { kind: "iana", zone: "Asia/Singapore", label: "Singapore Time" } },
  { pattern: /\b(?:tokyo|japan|\bjst\b)\b/i, spec: { kind: "iana", zone: "Asia/Tokyo", label: "Japan Standard Time" } },
  { pattern: /\b(?:sydney)\b/i, spec: { kind: "iana", zone: "Australia/Sydney", label: "Sydney time" } },
  { pattern: /\b(?:melbourne)\b/i, spec: { kind: "iana", zone: "Australia/Melbourne", label: "Melbourne time" } },
  { pattern: /\b(?:brisbane)\b/i, spec: { kind: "iana", zone: "Australia/Brisbane", label: "Brisbane time" } },
  { pattern: /\b(?:india\s+time|indian\s+standard\s+time)\b/i, spec: { kind: "iana", zone: "Asia/Kolkata", label: "India Standard Time" } },
  { pattern: /\bEST\b/i, spec: { kind: "fixed", offsetMinutes: -300, label: "EST", seasonalZone: "America/New_York", seasonalLabel: "Eastern Time" } },
  { pattern: /\bEDT\b/i, spec: { kind: "fixed", offsetMinutes: -240, label: "EDT", seasonalZone: "America/New_York", seasonalLabel: "Eastern Time" } },
  { pattern: /\bPST\b/i, spec: { kind: "fixed", offsetMinutes: -480, label: "PST", seasonalZone: "America/Los_Angeles", seasonalLabel: "Pacific Time" } },
  { pattern: /\bPDT\b/i, spec: { kind: "fixed", offsetMinutes: -420, label: "PDT", seasonalZone: "America/Los_Angeles", seasonalLabel: "Pacific Time" } },
  { pattern: /\bCDT\b/i, spec: { kind: "fixed", offsetMinutes: -300, label: "CDT", seasonalZone: "America/Chicago", seasonalLabel: "Central Time" } },
  { pattern: /\bMST\b/i, spec: { kind: "fixed", offsetMinutes: -420, label: "MST", seasonalZone: "America/Denver", seasonalLabel: "Mountain Time" } },
  { pattern: /\bMDT\b/i, spec: { kind: "fixed", offsetMinutes: -360, label: "MDT", seasonalZone: "America/Denver", seasonalLabel: "Mountain Time" } },
  { pattern: /\bGMT\b/i, spec: { kind: "fixed", offsetMinutes: 0, label: "GMT" } },
  { pattern: /\bUTC\b/i, spec: { kind: "fixed", offsetMinutes: 0, label: "UTC" } },
  { pattern: /\bBST\b/i, spec: { kind: "fixed", offsetMinutes: 60, label: "BST", seasonalZone: "Europe/London", seasonalLabel: "London time" } },
  { pattern: /\bCET\b/i, spec: { kind: "fixed", offsetMinutes: 60, label: "CET", seasonalZone: "Europe/Paris", seasonalLabel: "Central European Time" } },
  { pattern: /\bCEST\b/i, spec: { kind: "fixed", offsetMinutes: 120, label: "CEST", seasonalZone: "Europe/Paris", seasonalLabel: "Central European Time" } },
  { pattern: /\bAEST\b/i, spec: { kind: "fixed", offsetMinutes: 600, label: "AEST", seasonalZone: "Australia/Sydney", seasonalLabel: "Sydney time" } },
  { pattern: /\bAEDT\b/i, spec: { kind: "fixed", offsetMinutes: 660, label: "AEDT", seasonalZone: "Australia/Sydney", seasonalLabel: "Sydney time" } },
];

const AMBIGUOUS_RULES = [
  {
    pattern: /\bCST\b/i,
    label: "CST",
    copy: "CST is used for more than one timezone. Choose the location your client meant.",
    options: [
      { label: "US Central", spec: { kind: "iana", zone: "America/Chicago", label: "Central Time" } },
      { label: "China", spec: { kind: "iana", zone: "Asia/Shanghai", label: "China Standard Time" } },
    ]
  },
  {
    pattern: /\bIST\b/i,
    label: "IST",
    copy: "IST can mean India, Ireland or Israel depending on context. Choose the location they meant.",
    options: [
      { label: "India", spec: { kind: "iana", zone: "Asia/Kolkata", label: "India Standard Time" } },
      { label: "Ireland", spec: { kind: "iana", zone: "Europe/Dublin", label: "Ireland time" } },
      { label: "Israel", spec: { kind: "iana", zone: "Asia/Jerusalem", label: "Israel time" } },
    ]
  },
];

function pad2(value) { return String(value).padStart(2, "0"); }
function toDateInput(parts) { return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`; }
function toTimeInput(parts) { return `${pad2(parts.hour)}:${pad2(parts.minute)}`; }

export function getPartsInZone(dateOrMs, timeZone) {
  const date = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  });
  const map = Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return {
    year: Number(map.year), month: Number(map.month), day: Number(map.day),
    hour: Number(map.hour), minute: Number(map.minute), second: Number(map.second),
  };
}

export function getPartsInFixedOffset(dateOrMs, offsetMinutes) {
  const date = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  const shifted = new Date(date.getTime() + offsetMinutes * 60000);
  return {
    year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(), second: shifted.getUTCSeconds(),
  };
}

export function zonedLocalToUtc(parts, timeZone) {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  let guess = desired;
  for (let i = 0; i < 6; i += 1) {
    const observed = getPartsInZone(guess, timeZone);
    const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, 0);
    const delta = desired - observedAsUtc;
    guess += delta;
    if (delta === 0) break;
  }
  const verified = getPartsInZone(guess, timeZone);
  const sameLocal = observed => observed.year === parts.year && observed.month === parts.month && observed.day === parts.day && observed.hour === parts.hour && observed.minute === parts.minute;
  const matches = sameLocal(verified);
  if (!matches) {
    return { ok: false, error: "That local time does not exist in this timezone, usually because the clocks move forward for daylight saving time." };
  }

  const nearbyMatches = [-7200000, -3600000, 3600000, 7200000]
    .map(delta => guess + delta)
    .filter(candidate => sameLocal(getPartsInZone(candidate, timeZone)));
  if (nearbyMatches.length) {
    return { ok: false, error: "That local time happens twice because the clocks move back for daylight saving time. Ask for the timezone abbreviation or UTC offset so the meeting is unambiguous." };
  }

  return { ok: true, utcMs: guess };
}

export function localSpecToUtc(parts, spec) {
  if (spec.kind === "iana") return zonedLocalToUtc(parts, spec.zone);
  if (spec.kind === "fixed") {
    const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0) - spec.offsetMinutes * 60000;
    return { ok: true, utcMs };
  }
  return { ok: false, error: "Choose a specific timezone first." };
}

export function formatOffset(minutes) {
  const sign = minutes >= 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

export function offsetAt(utcMs, timeZone) {
  const parts = getPartsInZone(utcMs, timeZone);
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((representedAsUtc - utcMs) / 60000);
}

export function abbreviationAt(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(new Date(utcMs));
  return parts.find(p => p.type === "timeZoneName")?.value || timeZone;
}

export function parseTimezoneInput(input) {
  const value = String(input || "").trim();
  if (!value) return null;

  for (const ambiguous of AMBIGUOUS_RULES) {
    if (ambiguous.pattern.test(value)) return { kind: "ambiguous", ...ambiguous };
  }
  for (const rule of ALIAS_RULES) {
    if (rule.pattern.test(value)) return { ...rule.spec };
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return { kind: "iana", zone: value, label: friendlyZoneName(value) };
  } catch {
    return null;
  }
}

export function detectTimezoneInText(text) {
  const raw = String(text || "");
  const lower = raw.toLowerCase();

  // Context can disambiguate CST and IST.
  if (/\bCST\b/i.test(raw)) {
    if (/\b(china|chinese|shanghai|beijing)\b/i.test(raw)) return { kind: "iana", zone: "Asia/Shanghai", label: "China Standard Time" };
    if (/\b(us|usa|american|chicago|central\s+time)\b/i.test(raw)) return { kind: "iana", zone: "America/Chicago", label: "Central Time" };
    return { kind: "ambiguous", ...AMBIGUOUS_RULES[0] };
  }
  if (/\bIST\b/i.test(raw)) {
    if (/\b(india|indian|kolkata|mumbai|delhi)\b/i.test(raw)) return { kind: "iana", zone: "Asia/Kolkata", label: "India Standard Time" };
    if (/\b(ireland|irish|dublin)\b/i.test(raw)) return { kind: "iana", zone: "Europe/Dublin", label: "Ireland time" };
    if (/\b(israel|israeli|jerusalem|tel\s*aviv)\b/i.test(raw)) return { kind: "iana", zone: "Asia/Jerusalem", label: "Israel time" };
    return { kind: "ambiguous", ...AMBIGUOUS_RULES[1] };
  }

  for (const rule of ALIAS_RULES) {
    if (rule.pattern.test(raw)) return { ...rule.spec };
  }

  // Basic direct IANA timezone recognition inside text.
  const ianaMatch = raw.match(/\b(?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_+\-]+(?:\/[A-Za-z_+\-]+)?\b/);
  if (ianaMatch) return parseTimezoneInput(ianaMatch[0]);

  // A few phrases that are easier to recognize as lowercase text.
  if (lower.includes("new york")) return { kind: "iana", zone: "America/New_York", label: "Eastern Time" };
  return null;
}

function parseTime(text) {
  const twelve = text.match(/\b(?:at\s+)?(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (twelve) {
    let hour = Number(twelve[1]);
    const minute = Number(twelve[2] || 0);
    const meridiem = twelve[3].toLowerCase().replace(/\./g, "");
    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return { hour, minute, raw: twelve[0] };
  }
  const twentyFour = text.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (twentyFour) return { hour: Number(twentyFour[1]), minute: Number(twentyFour[2]), raw: twentyFour[0] };
  return null;
}

function dateFromYmd(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

function addDays(parts, count) {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + count));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function weekdayIndex(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function currentDateForSpec(nowMs, spec, fallbackZone) {
  const parts = spec?.kind === "iana"
    ? getPartsInZone(nowMs, spec.zone)
    : spec?.kind === "fixed"
      ? getPartsInFixedOffset(nowMs, spec.offsetMinutes)
      : getPartsInZone(nowMs, fallbackZone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function parseDate(text, nowMs, sourceSpec, fallbackZone) {
  const lower = text.toLowerCase();
  const current = currentDateForSpec(nowMs, sourceSpec, fallbackZone);

  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return dateFromYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const monthFirst = lower.match(new RegExp(`\\b(${Object.keys(MONTHS).join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, "i"));
  if (monthFirst) {
    let year = Number(monthFirst[3] || current.year);
    const month = MONTHS[monthFirst[1].toLowerCase()];
    const day = Number(monthFirst[2]);
    if (!monthFirst[3] && (month < current.month || (month === current.month && day < current.day))) year += 1;
    return dateFromYmd(year, month, day);
  }

  const dayFirst = lower.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${Object.keys(MONTHS).join("|")})(?:,?\\s+(20\\d{2}))?\\b`, "i"));
  if (dayFirst) {
    let year = Number(dayFirst[3] || current.year);
    const month = MONTHS[dayFirst[2].toLowerCase()];
    const day = Number(dayFirst[1]);
    if (!dayFirst[3] && (month < current.month || (month === current.month && day < current.day))) year += 1;
    return dateFromYmd(year, month, day);
  }

  if (/\btoday\b/i.test(text)) return current;
  if (/\btomorrow\b/i.test(text)) return addDays(current, 1);

  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    const weekday = WEEKDAYS[i];
    const short = weekday.slice(0, 3);
    if (new RegExp(`\\b(?:${weekday}|${short})\\b`, "i").test(text)) {
      const currentIdx = weekdayIndex(current);
      let delta = (i - currentIdx + 7) % 7;
      // "next Friday" means the next occurrence after this week when today is Friday.
      if (new RegExp(`\\bnext\\s+(?:${weekday}|${short})\\b`, "i").test(text) && delta === 0) delta = 7;
      return addDays(current, delta);
    }
  }
  return null;
}

export function parseNaturalMeeting(text, { nowMs = Date.now(), userZone = "UTC" } = {}) {
  const sourceSpec = detectTimezoneInText(text);
  const time = parseTime(text);
  const date = parseDate(text, nowMs, sourceSpec, userZone);

  return {
    sourceSpec,
    time,
    date,
    complete: Boolean(sourceSpec && sourceSpec.kind !== "ambiguous" && time && date),
    ambiguity: sourceSpec?.kind === "ambiguous" ? sourceSpec : null,
    dateInput: date ? toDateInput(date) : "",
    timeInput: time ? toTimeInput(time) : "",
  };
}

export function parseDateTimeInputs(dateInput, timeInput) {
  const dm = String(dateInput).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm = String(timeInput).match(/^(\d{2}):(\d{2})$/);
  if (!dm || !tm) return null;
  return {
    year: Number(dm[1]), month: Number(dm[2]), day: Number(dm[3]),
    hour: Number(tm[1]), minute: Number(tm[2]),
  };
}

export function formatMeetingInZone(utcMs, zone, locale = "en-US") {
  const date = new Date(utcMs);
  const fmt = (options) => new Intl.DateTimeFormat(locale, { timeZone: zone, ...options }).format(date);
  return {
    weekday: fmt({ weekday: "long" }),
    time: fmt({ hour: "numeric", minute: "2-digit", hour12: true }),
    date: fmt({ month: "long", day: "numeric", year: "numeric" }),
    dateShort: fmt({ month: "short", day: "numeric" }),
    hour24: Number(new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(date)),
    parts: getPartsInZone(utcMs, zone),
    abbreviation: abbreviationAt(utcMs, zone),
  };
}

export function formatMeetingInSpec(utcMs, spec, locale = "en-US") {
  if (spec.kind === "iana") return { ...formatMeetingInZone(utcMs, spec.zone, locale), label: spec.label || friendlyZoneName(spec.zone) };
  const shifted = new Date(utcMs + spec.offsetMinutes * 60000);
  const fmtUtc = (options) => new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(shifted);
  const parts = getPartsInFixedOffset(utcMs, spec.offsetMinutes);
  return {
    weekday: fmtUtc({ weekday: "long" }),
    time: fmtUtc({ hour: "numeric", minute: "2-digit", hour12: true }),
    date: fmtUtc({ month: "long", day: "numeric", year: "numeric" }),
    dateShort: fmtUtc({ month: "short", day: "numeric" }),
    hour24: parts.hour,
    parts,
    abbreviation: spec.label,
    label: `${spec.label} (${formatOffset(spec.offsetMinutes)})`,
  };
}

export function friendlyZoneName(zone) {
  if (!zone) return "";
  if (zone === "UTC") return "UTC";
  const city = zone.split("/").pop().replace(/_/g, " ");
  const region = zone.split("/")[0];
  return `${city} · ${region}`;
}

export function dayRelation(sourceParts, targetParts) {
  const sourceDay = Date.UTC(sourceParts.year, sourceParts.month - 1, sourceParts.day);
  const targetDay = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);
  const diff = Math.round((targetDay - sourceDay) / 86400000);
  if (diff === 0) return null;
  if (diff === 1) return "Next day";
  if (diff === -1) return "Previous day";
  return diff > 0 ? `${diff} days later` : `${Math.abs(diff)} days earlier`;
}

export function timeOfDayLabel(hour) {
  if (hour < 5) return { text: "Overnight", warn: true };
  if (hour < 8) return { text: "Early morning", warn: true };
  if (hour < 12) return { text: "Morning", warn: false };
  if (hour < 17) return { text: "Afternoon", warn: false };
  if (hour < 21) return { text: "Evening", warn: false };
  return { text: "Late evening", warn: true };
}

export function seasonalWarning(sourceSpec, localParts) {
  if (sourceSpec.kind !== "fixed" || !sourceSpec.seasonalZone) return null;
  const seasonalConversion = localSpecToUtc(localParts, { kind: "iana", zone: sourceSpec.seasonalZone, label: sourceSpec.seasonalLabel });
  if (!seasonalConversion.ok) return null;
  const actualAbbr = abbreviationAt(seasonalConversion.utcMs, sourceSpec.seasonalZone);
  const literalOffset = sourceSpec.offsetMinutes;
  const seasonalOffset = offsetAt(seasonalConversion.utcMs, sourceSpec.seasonalZone);
  if (literalOffset === seasonalOffset) return null;
  return {
    actualAbbr,
    seasonalOffset,
    seasonalUtcMs: seasonalConversion.utcMs,
    zone: sourceSpec.seasonalZone,
    label: sourceSpec.seasonalLabel,
  };
}

export function timezoneDifferenceLabel(utcMs, sourceSpec, targetZone) {
  const sourceOffset = sourceSpec.kind === "iana" ? offsetAt(utcMs, sourceSpec.zone) : sourceSpec.offsetMinutes;
  const targetOffset = offsetAt(utcMs, targetZone);
  const diff = targetOffset - sourceOffset;
  if (diff === 0) return "same time";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = `${h ? `${h}h` : ""}${m ? ` ${m}m` : ""}`.trim();
  return `${amount} ${diff > 0 ? "ahead" : "behind"}`;
}

export function serializeSourceSpec(spec) {
  if (spec.kind === "iana") return `iana:${spec.zone}`;
  if (spec.kind === "fixed") return `fixed:${spec.offsetMinutes}:${encodeURIComponent(spec.label || "UTC")}`;
  return "";
}

export function deserializeSourceSpec(value) {
  if (!value) return null;
  if (value.startsWith("iana:")) {
    const zone = value.slice(5);
    return parseTimezoneInput(zone);
  }
  if (value.startsWith("fixed:")) {
    const [, offset, encodedLabel] = value.split(":");
    const offsetMinutes = Number(offset);
    if (!Number.isInteger(offsetMinutes) || offsetMinutes < -840 || offsetMinutes > 840) return null;
    try {
      const label = decodeURIComponent(encodedLabel || "UTC");
      if (label.length > 32) return null;
      const known = parseTimezoneInput(label);
      if (!known || known.kind !== "fixed" || known.offsetMinutes !== offsetMinutes) return null;
      return known;
    } catch {
      return null;
    }
  }
  return null;
}

export function toIcsUtc(utcMs) {
  const d = new Date(utcMs);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

export function toGoogleCalendarUtc(utcMs) { return toIcsUtc(utcMs); }
