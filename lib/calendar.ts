import type { Wedding } from "@/lib/types";

function formatICSDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (timeStr) {
    const [h, m] = timeStr.split(":").map((v) => v.padStart(2, "0"));
    return `${year}${month}${day}T${h}${m}00`;
  }
  return `${year}${month}${day}`;
}

function addOneHour(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const endH = String((h + 1) % 24).padStart(2, "0");
  const endM = String(m).padStart(2, "0");
  const date = new Date(dateStr + "T00:00:00");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}T${endH}${endM}00`;
}

function formatAlarmDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  // 24 hours before
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (timeStr) {
    const [h, m] = timeStr.split(":").map((v) => v.padStart(2, "0"));
    return `${year}${month}${day}T${h}${m}00`;
  }
  return `${year}${month}${day}T090000`;
}

export function generateICS(wedding: Wedding): string {
  const dtstart = formatICSDate(wedding.date, wedding.time);
  const dtend = wedding.time
    ? addOneHour(wedding.date, wedding.time)
    : formatICSDate(wedding.date, null);
  const alarm = formatAlarmDate(wedding.date, wedding.time);

  const allDay = !wedding.time;
  const dtStartLine = allDay
    ? `DTSTART;VALUE=DATE:${dtstart}`
    : `DTSTART:${dtstart}`;
  const dtEndLine = allDay
    ? `DTEND;VALUE=DATE:${dtend}`
    : `DTEND:${dtend}`;

  const uid = `${wedding.id}@wediary`;
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wediary//wediary//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${wedding.groom} ♥ ${wedding.bride} 결혼식`,
    `LOCATION:${wedding.venue}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `TRIGGER;VALUE=DATE-TIME:${alarm}`,
    `DESCRIPTION:${wedding.groom} ♥ ${wedding.bride} 결혼식 내일입니다`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(wedding: Wedding): void {
  const content = generateICS(wedding);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${wedding.groom}_${wedding.bride}_결혼식.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
