import test from "node:test";
import assert from "node:assert/strict";
import {
  parseNaturalMeeting,
  parseTimezoneInput,
  localSpecToUtc,
  formatMeetingInZone,
  seasonalWarning,
  dayRelation,
  deserializeSourceSpec,
} from "../public/js/time.js";

const USER_ZONE = "Asia/Manila";

test("parses Thursday 5pm EST", () => {
  const now = Date.parse("2026-09-23T08:00:00Z"); // Wed afternoon Manila
  const parsed = parseNaturalMeeting("Thursday 5pm EST", { nowMs: now, userZone: USER_ZONE });
  assert.equal(parsed.dateInput, "2026-09-24");
  assert.equal(parsed.timeInput, "17:00");
  assert.equal(parsed.sourceSpec.kind, "fixed");
  assert.equal(parsed.sourceSpec.offsetMinutes, -300);
});

test("literal 5pm EST converts to 6am Manila next day in September", () => {
  const source = parseTimezoneInput("EST");
  const conversion = localSpecToUtc({ year: 2026, month: 9, day: 24, hour: 17, minute: 0 }, source);
  assert.equal(conversion.ok, true);
  const target = formatMeetingInZone(conversion.utcMs, USER_ZONE);
  assert.equal(target.weekday, "Friday");
  assert.equal(target.time, "6:00 AM");
});

test("5pm Eastern Time converts to 5am Manila next day during EDT", () => {
  const source = parseTimezoneInput("Eastern Time");
  const conversion = localSpecToUtc({ year: 2026, month: 9, day: 24, hour: 17, minute: 0 }, source);
  assert.equal(conversion.ok, true);
  const target = formatMeetingInZone(conversion.utcMs, USER_ZONE);
  assert.equal(target.weekday, "Friday");
  assert.equal(target.time, "5:00 AM");
});

test("EST flags seasonal mismatch during EDT", () => {
  const source = parseTimezoneInput("EST");
  const warning = seasonalWarning(source, { year: 2026, month: 9, day: 24, hour: 17, minute: 0 });
  assert.ok(warning);
  assert.match(warning.actualAbbr, /EDT|GMT-4/);
});

test("EST has no mismatch when New York is on standard time", () => {
  const source = parseTimezoneInput("EST");
  const warning = seasonalWarning(source, { year: 2026, month: 12, day: 10, hour: 17, minute: 0 });
  assert.equal(warning, null);
});

test("CST without context is ambiguous", () => {
  const parsed = parseNaturalMeeting("Friday 3pm CST", { nowMs: Date.parse("2026-09-23T08:00:00Z"), userZone: USER_ZONE });
  assert.equal(parsed.sourceSpec.kind, "ambiguous");
});

test("CST with China context resolves to Shanghai", () => {
  const parsed = parseNaturalMeeting("Friday 3pm CST China", { nowMs: Date.parse("2026-09-23T08:00:00Z"), userZone: USER_ZONE });
  assert.equal(parsed.sourceSpec.kind, "iana");
  assert.equal(parsed.sourceSpec.zone, "Asia/Shanghai");
});

test("London example parses", () => {
  const parsed = parseNaturalMeeting("Friday 3pm London time", { nowMs: Date.parse("2026-09-23T08:00:00Z"), userZone: USER_ZONE });
  assert.equal(parsed.sourceSpec.zone, "Europe/London");
  assert.equal(parsed.timeInput, "15:00");
  assert.equal(parsed.dateInput, "2026-09-25");
});

test("Sydney Monday example parses", () => {
  const parsed = parseNaturalMeeting("10am Sydney Monday", { nowMs: Date.parse("2026-09-23T08:00:00Z"), userZone: USER_ZONE });
  assert.equal(parsed.sourceSpec.zone, "Australia/Sydney");
  assert.equal(parsed.timeInput, "10:00");
  assert.equal(parsed.dateInput, "2026-09-28");
});

test("day relation detects next day", () => {
  assert.equal(dayRelation(
    { year: 2026, month: 9, day: 24 },
    { year: 2026, month: 9, day: 25 }
  ), "Next day");
});

test("spring DST gap is rejected instead of silently shifting the time", () => {
  const source = parseTimezoneInput("America/New_York");
  const conversion = localSpecToUtc({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, source);
  assert.equal(conversion.ok, false);
  assert.match(conversion.error, /does not exist/i);
});

test("fall DST repeated hour is rejected as ambiguous", () => {
  const source = parseTimezoneInput("America/New_York");
  const conversion = localSpecToUtc({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, source);
  assert.equal(conversion.ok, false);
  assert.match(conversion.error, /happens twice/i);
});


test("shared fixed timezone spec accepts only known aliases", () => {
  assert.equal(deserializeSourceSpec("fixed:-300:EST")?.label, "EST");
  assert.equal(deserializeSourceSpec("fixed:-300:%3Cscript%3E"), null);
  assert.equal(deserializeSourceSpec("fixed:999:UTC"), null);
});
