import { createClient } from "@/lib/supabase/client";
import type { Attendance, Wedding, Memory } from "@/lib/types";

export type { Attendance, Wedding, Memory };

// ── Date helpers ──────────────────────────────────────────────
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateKR(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

export function formatTimeKR(timeStr: string | null): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${ampm} ${hour}시${m > 0 ? ` ${m}분` : ""}`;
}

export function isUpcoming(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weddingDate = new Date(dateStr + "T00:00:00");
  return weddingDate >= today;
}

export function getDDay(dateStr: string): string {
  if (!dateStr) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weddingDate = new Date(dateStr + "T00:00:00");
  const diff = Math.round(
    (weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `${Math.abs(diff)}일 전`;
}

export function formatGiftAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ── Weddings ──────────────────────────────────────────────────
export async function getWeddings(): Promise<Wedding[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWedding(id: string): Promise<Wedding | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createWedding(
  wedding: Omit<Wedding, "id" | "user_id" | "created_at">
): Promise<Wedding> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weddings")
    .insert({ ...wedding, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWedding(
  id: string,
  updates: Partial<Omit<Wedding, "id" | "user_id" | "created_at">>
): Promise<Wedding> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weddings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWedding(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("weddings").delete().eq("id", id);
  if (error) throw error;
}

// ── Memory ────────────────────────────────────────────────────
export async function getMemory(weddingId: string): Promise<Memory | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function upsertMemory(
  weddingId: string,
  updates: Partial<Pick<Memory, "memo" | "emotion_tags" | "gift_amount">>
): Promise<Memory> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("memories")
    .upsert(
      { wedding_id: weddingId, user_id: user.id, ...updates },
      { onConflict: "wedding_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
