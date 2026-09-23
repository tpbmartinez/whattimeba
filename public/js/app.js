// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 Tim Martinez
import {
  CORE_TIMEZONES,
  parseNaturalMeeting,
  parseTimezoneInput,
  parseDateTimeInputs,
  localSpecToUtc,
  formatMeetingInSpec,
  formatMeetingInZone,
  friendlyZoneName,
  dayRelation,
  timeOfDayLabel,
  seasonalWarning,
  timezoneDifferenceLabel,
  serializeSourceSpec,
  deserializeSourceSpec,
  toIcsUtc,
  toGoogleCalendarUtc,
} from "./time.js";

const els = {
  form: document.querySelector("#natural-form"),
  text: document.querySelector("#meeting-text"),
  parseMessage: document.querySelector("#parse-message"),
  details: document.querySelector("#details-panel"),
  date: document.querySelector("#meeting-date"),
  time: document.querySelector("#meeting-time"),
  sourceZone: document.querySelector("#source-zone"),
  targetZone: document.querySelector("#target-zone"),
  duration: document.querySelector("#duration"),
  manualConvert: document.querySelector("#manual-convert"),
  timezoneList: document.querySelector("#timezone-list"),
  ambiguityCard: document.querySelector("#ambiguity-card"),
  ambiguityTitle: document.querySelector("#ambiguity-title"),
  ambiguityCopy: document.querySelector("#ambiguity-copy"),
  ambiguityActions: document.querySelector("#ambiguity-actions"),
  resultSection: document.querySelector("#result-section"),
  sourceWeekday: document.querySelector("#source-weekday"),
  sourceTime: document.querySelector("#source-time"),
  sourceDate: document.querySelector("#source-date"),
  sourceZoneLabel: document.querySelector("#source-zone-label"),
  targetWeekday: document.querySelector("#target-weekday"),
  targetTime: document.querySelector("#target-time"),
  targetDate: document.querySelector("#target-date"),
  targetZoneLabel: document.querySelector("#target-zone-label"),
  differenceLabel: document.querySelector("#difference-label"),
  timeBadges: document.querySelector("#time-badges"),
  timezoneWarning: document.querySelector("#timezone-warning"),
  warningTitle: document.querySelector("#warning-title"),
  warningCopy: document.querySelector("#warning-copy"),
  warningComparison: document.querySelector("#warning-comparison"),
  confirmationPreview: document.querySelector("#confirmation-preview"),
  copyReply: document.querySelector("#copy-reply"),
  shareMeeting: document.querySelector("#share-meeting"),
  googleCalendar: document.querySelector("#google-calendar"),
  downloadIcs: document.querySelector("#download-ics"),
  actionStatus: document.querySelector("#action-status"),
};

const state = {
  sourceSpec: null,
  utcMs: null,
  targetZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  sourceLocalParts: null,
  duration: 30,
  sourceView: null,
  targetView: null,
};

function setParseMessage(message, type = "") {
  els.parseMessage.textContent = message;
  els.parseMessage.className = `parse-message${type ? ` ${type}` : ""}`;
}

function buildTimezoneList() {
  const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : CORE_TIMEZONES;
  const values = [...new Set([...CORE_TIMEZONES, ...supported])].sort();
  const aliases = ["ET", "EST", "EDT", "CT", "CST", "CDT", "MT", "MST", "MDT", "PT", "PST", "PDT", "GMT", "UTC", "BST", "CET", "CEST", "PHT", "SGT", "JST", "AEST", "AEDT"];
  const options = [...aliases, ...values].map(value => {
    const option = document.createElement("option");
    option.value = value;
    return option;
  });
  els.timezoneList.replaceChildren(...options);
}

function initialize() {
  buildTimezoneList();
  els.targetZone.value = state.targetZone;
  wireEvents();
  loadSharedMeeting();
}

function wireEvents() {
  els.form.addEventListener("submit", event => {
    event.preventDefault();
    parseNaturalAndConvert();
  });
  document.querySelectorAll(".example-chip").forEach(button => {
    button.addEventListener("click", () => {
      els.text.value = button.dataset.example;
      parseNaturalAndConvert();
    });
  });
  els.manualConvert.addEventListener("click", () => convertFromFields());
  els.copyReply.addEventListener("click", copyConfirmation);
  els.shareMeeting.addEventListener("click", shareMeeting);
  els.downloadIcs.addEventListener("click", downloadIcs);
  els.duration.addEventListener("change", () => {
    state.duration = Number(els.duration.value);
    if (state.utcMs) updateCalendarLink();
  });
}

function parseNaturalAndConvert() {
  const value = els.text.value.trim();
  if (!value) {
    setParseMessage("Paste a meeting time first.", "error");
    els.text.focus();
    return;
  }

  const parsed = parseNaturalMeeting(value, { userZone: state.targetZone });
  if (parsed.dateInput) els.date.value = parsed.dateInput;
  if (parsed.timeInput) els.time.value = parsed.timeInput;

  if (parsed.sourceSpec?.kind === "ambiguous") {
    showAmbiguity(parsed.sourceSpec);
    setParseMessage("I found the date and time, but the timezone abbreviation is ambiguous.");
    els.details.open = true;
    return;
  }

  if (parsed.sourceSpec) {
    state.sourceSpec = parsed.sourceSpec;
    els.sourceZone.value = displaySourceInput(parsed.sourceSpec);
  }

  const missing = [];
  if (!parsed.date) missing.push("date");
  if (!parsed.time) missing.push("time");
  if (!parsed.sourceSpec) missing.push("timezone");
  if (missing.length) {
    hideAmbiguity();
    setParseMessage(`I could not confidently find the ${missing.join(", ")}. Add it below and update the conversion.`, "error");
    els.details.open = true;
    return;
  }

  hideAmbiguity();
  setParseMessage("Meeting details understood. You can still edit them below.", "success");
  convertFromFields(parsed.sourceSpec);
}

function displaySourceInput(spec) {
  if (spec.kind === "iana") return spec.zone;
  return spec.label || "UTC";
}

function showAmbiguity(ambiguity) {
  state.sourceSpec = ambiguity;
  els.ambiguityTitle.textContent = `What does ${ambiguity.label} mean here?`;
  els.ambiguityCopy.textContent = ambiguity.copy;
  els.ambiguityActions.replaceChildren();
  ambiguity.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.addEventListener("click", () => {
      state.sourceSpec = option.spec;
      els.sourceZone.value = displaySourceInput(option.spec);
      hideAmbiguity();
      setParseMessage(`Using ${option.spec.label}.`, "success");
      convertFromFields(option.spec);
    });
    els.ambiguityActions.appendChild(button);
  });
  els.ambiguityCard.classList.remove("hidden");
  els.resultSection.classList.add("hidden");
}

function hideAmbiguity() { els.ambiguityCard.classList.add("hidden"); }

function convertFromFields(preferredSpec = null) {
  const parts = parseDateTimeInputs(els.date.value, els.time.value);
  if (!parts) {
    setParseMessage("Choose a valid meeting date and time.", "error");
    els.details.open = true;
    return;
  }

  const sourceSpec = preferredSpec || parseTimezoneInput(els.sourceZone.value);
  if (!sourceSpec) {
    setParseMessage("I do not recognise that source timezone. Try a city such as America/New_York or an abbreviation such as ET or EST.", "error");
    els.details.open = true;
    return;
  }
  if (sourceSpec.kind === "ambiguous") {
    showAmbiguity(sourceSpec);
    return;
  }

  const targetSpec = parseTimezoneInput(els.targetZone.value);
  if (!targetSpec || targetSpec.kind !== "iana") {
    setParseMessage("For your timezone, choose a city based timezone such as Asia/Manila.", "error");
    els.details.open = true;
    return;
  }

  const conversion = localSpecToUtc(parts, sourceSpec);
  if (!conversion.ok) {
    setParseMessage(conversion.error, "error");
    els.details.open = true;
    return;
  }

  state.sourceSpec = sourceSpec;
  state.utcMs = conversion.utcMs;
  state.sourceLocalParts = parts;
  state.targetZone = targetSpec.zone;
  state.duration = Number(els.duration.value);
  state.sourceView = formatMeetingInSpec(state.utcMs, sourceSpec);
  state.targetView = formatMeetingInZone(state.utcMs, state.targetZone);

  setParseMessage("Conversion updated.", "success");
  renderResult();
}

function renderResult() {
  const source = state.sourceView;
  const target = state.targetView;
  els.sourceWeekday.textContent = source.weekday;
  els.sourceTime.textContent = source.time;
  els.sourceDate.textContent = source.date;
  els.sourceZoneLabel.textContent = source.label || source.abbreviation;

  els.targetWeekday.textContent = target.weekday;
  els.targetTime.textContent = target.time;
  els.targetDate.textContent = target.date;
  els.targetZoneLabel.textContent = friendlyZoneName(state.targetZone);
  els.differenceLabel.textContent = timezoneDifferenceLabel(state.utcMs, state.sourceSpec, state.targetZone);

  renderBadges(source.parts, target.parts, target.hour24);
  renderSeasonalWarning();
  renderConfirmation();
  updateCalendarLink();
  els.resultSection.classList.remove("hidden");
  els.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderBadges(sourceParts, targetParts, targetHour) {
  els.timeBadges.replaceChildren();
  const relation = dayRelation(sourceParts, targetParts);
  const dayTime = timeOfDayLabel(targetHour);
  if (relation) addBadge(relation, true);
  addBadge(dayTime.text, dayTime.warn);
}

function addBadge(text, warn = false) {
  const span = document.createElement("span");
  span.className = `badge${warn ? " warn" : ""}`;
  span.textContent = text;
  els.timeBadges.appendChild(span);
}

function renderSeasonalWarning() {
  const warning = seasonalWarning(state.sourceSpec, state.sourceLocalParts);
  if (!warning) {
    els.timezoneWarning.classList.add("hidden");
    return;
  }

  const literalTarget = formatMeetingInZone(state.utcMs, state.targetZone);
  const seasonalTarget = formatMeetingInZone(warning.seasonalUtcMs, state.targetZone);
  els.warningTitle.textContent = `They wrote ${state.sourceSpec.label}, but ${state.sourceSpec.seasonalLabel} uses ${warning.actualAbbr} on this date.`;
  els.warningCopy.textContent = `If they meant the regional timezone rather than the literal ${state.sourceSpec.label} offset, your meeting time changes.`;
  els.warningComparison.replaceChildren();
  addComparison(`Literal ${state.sourceSpec.label}`, `${literalTarget.weekday} ${literalTarget.time}`);
  addComparison(`${state.sourceSpec.seasonalLabel} (${warning.actualAbbr})`, `${seasonalTarget.weekday} ${seasonalTarget.time}`);
  els.timezoneWarning.classList.remove("hidden");
}

function addComparison(label, value) {
  const row = document.createElement("div");
  row.className = "comparison-row";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  row.append(labelNode, valueNode);
  els.warningComparison.appendChild(row);
}

function sourceHumanLabel() {
  if (state.sourceSpec.kind === "iana") return state.sourceSpec.label || friendlyZoneName(state.sourceSpec.zone);
  return state.sourceSpec.label;
}

function renderConfirmation() {
  const source = state.sourceView;
  const target = state.targetView;
  const relation = dayRelation(source.parts, target.parts);
  const targetDatePhrase = relation ? `${target.weekday} at ${target.time}` : `${target.weekday} at ${target.time}`;
  const text = `Just confirming, ${source.weekday} at ${source.time} ${sourceHumanLabel()} is ${targetDatePhrase} for me in ${friendlyZoneName(state.targetZone).split(" · ")[0]}.`;
  els.confirmationPreview.textContent = text;
}

async function copyConfirmation() {
  if (!state.utcMs) return;
  try {
    await navigator.clipboard.writeText(els.confirmationPreview.textContent);
    setActionStatus("Confirmation copied.");
  } catch {
    fallbackCopy(els.confirmationPreview.textContent);
    setActionStatus("Confirmation copied.");
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.className = "copy-helper";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function shareMeeting() {
  if (!state.utcMs) return;
  const url = buildShareUrl();
  const shareData = { title: "Meeting time", text: els.confirmationPreview.textContent, url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      setActionStatus("Share sheet opened.");
    } else {
      await navigator.clipboard.writeText(url);
      setActionStatus("Share link copied.");
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      fallbackCopy(url);
      setActionStatus("Share link copied.");
    }
  }
}

function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("meeting", new Date(state.utcMs).toISOString());
  url.searchParams.set("src", serializeSourceSpec(state.sourceSpec));
  url.searchParams.set("duration", String(state.duration));
  return url.toString();
}

function loadSharedMeeting() {
  const params = new URLSearchParams(window.location.search);
  const meeting = params.get("meeting");
  const sourceSpec = deserializeSourceSpec(params.get("src"));
  if (!meeting || !sourceSpec) return;
  const utcMs = Date.parse(meeting);
  if (!Number.isFinite(utcMs)) return;

  const allowedDurations = new Set([30, 45, 60, 90, 120]);
  const duration = Number(params.get("duration") || 30);
  const year = new Date(utcMs).getUTCFullYear();
  if (year < 1970 || year > 2100) return;
  state.sourceSpec = sourceSpec;
  state.utcMs = utcMs;
  state.duration = allowedDurations.has(duration) ? duration : 30;
  els.duration.value = String(state.duration);
  els.sourceZone.value = displaySourceInput(sourceSpec);

  const sourceView = formatMeetingInSpec(utcMs, sourceSpec);
  state.sourceView = sourceView;
  state.sourceLocalParts = sourceView.parts;
  els.date.value = `${sourceView.parts.year}-${String(sourceView.parts.month).padStart(2, "0")}-${String(sourceView.parts.day).padStart(2, "0")}`;
  els.time.value = `${String(sourceView.parts.hour).padStart(2, "0")}:${String(sourceView.parts.minute).padStart(2, "0")}`;
  state.targetView = formatMeetingInZone(utcMs, state.targetZone);
  setParseMessage("A meeting time was shared with you. It has been converted to your current timezone.", "success");
  renderResult();
}

function updateCalendarLink() {
  const start = toGoogleCalendarUtc(state.utcMs);
  const end = toGoogleCalendarUtc(state.utcMs + state.duration * 60000);
  const details = `Meeting time converted with whattimeba.com. Original: ${state.sourceView.weekday}, ${state.sourceView.time} ${sourceHumanLabel()}.`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Meeting",
    dates: `${start}/${end}`,
    details,
  });
  els.googleCalendar.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs() {
  if (!state.utcMs) return;
  const start = toIcsUtc(state.utcMs);
  const end = toIcsUtc(state.utcMs + state.duration * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@whattimeba.com`;
  const description = `Original meeting time: ${state.sourceView.weekday}, ${state.sourceView.time} ${sourceHumanLabel()}.`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//whattimeba.com//Meeting Time Converter//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SUMMARY:Meeting",
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meeting.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setActionStatus("Calendar file downloaded.");
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function setActionStatus(message) {
  els.actionStatus.textContent = message;
  window.clearTimeout(setActionStatus.timer);
  setActionStatus.timer = window.setTimeout(() => { els.actionStatus.textContent = ""; }, 3200);
}


initialize();
