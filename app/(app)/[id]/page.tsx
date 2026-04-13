"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getWedding,
  getMemory,
  updateWedding,
  deleteWedding,
  upsertMemory,
  formatDateKR,
  formatTimeKR,
  isUpcoming,
} from "@/lib/db";
import { downloadICS } from "@/lib/calendar";
import { useToast } from "@/components/Toast";
import type { Attendance } from "@/lib/types";

const ATTENDANCE_LABEL: Record<Attendance, string> = {
  attending: "참석",
  absent: "불참",
  pending: "미정",
};

const ATTENDANCE_PILL_ACTIVE: Record<Attendance, { bg: string; border: string; text: string }> = {
  attending: { bg: "rgba(163,230,53,0.15)", border: "#A3E635", text: "#A3E635" },
  absent: { bg: "rgba(255,20,147,0.15)", border: "#FF1493", text: "#FF1493" },
  pending: { bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.3)", text: "rgba(255,255,255,0.7)" },
};

export default function WeddingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memo, setMemo] = useState("");
  const [giftAmount, setGiftAmount] = useState<string>("");
  const [venueCopied, setVenueCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const memoRef = useRef("");
  const giftRef = useRef("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding", id],
    queryFn: () => getWedding(id),
  });

  const { data: memory } = useQuery({
    queryKey: ["memory", id],
    queryFn: () => getMemory(id),
    enabled: !!wedding,
  });

  useEffect(() => {
    if (memory) {
      const m = memory.memo ?? "";
      const g = memory.gift_amount ? String(memory.gift_amount) : "";
      setMemo(m);
      setGiftAmount(g);
      memoRef.current = m;
      giftRef.current = g;
    }
  }, [memory]);

  const updateAttendanceMutation = useMutation({
    mutationFn: (attendance: Attendance) => updateWedding(id, { attendance }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", id] });
      queryClient.invalidateQueries({ queryKey: ["weddings"] });
      showToast("참석 여부 업데이트됐어요");
    },
    onError: () => showToast("저장에 실패했어요", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWedding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weddings"] });
      showToast("삭제됐어요");
      router.push("/");
    },
    onError: () => showToast("삭제에 실패했어요", "error"),
  });

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertMemory(id, {
        memo: memoRef.current.trim() || undefined,
        gift_amount: giftRef.current ? Number(giftRef.current) : null,
      })
        .then(() => queryClient.invalidateQueries({ queryKey: ["memory", id] }))
        .catch(() => showToast("저장에 실패했어요", "error"));
    }, 1500);
  }

  function saveNow() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    upsertMemory(id, {
      memo: memoRef.current.trim() || undefined,
      gift_amount: giftRef.current ? Number(giftRef.current) : null,
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["memory", id] });
        showToast("저장됐어요");
      })
      .catch(() => showToast("저장에 실패했어요", "error"));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div style={{ color: "#FF1493", fontSize: 24 }}>·</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-8">
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 40 }}>☁</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
          결혼식 정보를 불러오지 못했어요.{"\n"}잠시 후 다시 시도해주세요.
        </p>
        <button onClick={() => router.back()} style={{ color: "#FF1493", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
          돌아가기
        </button>
      </div>
    );
  }

  const att = (ATTENDANCE_LABEL[wedding.attendance as Attendance] ? wedding.attendance : "pending") as Attendance;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wDate = new Date(wedding.date + "T00:00:00");
  const daysUntil = Math.round((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const upcoming = isUpcoming(wedding.date);

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 0",
            paddingTop: "max(16px, env(safe-area-inset-top))",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "8px 8px 8px 0", display: "flex", alignItems: "center" }}
          >
            <ChevronBackIcon />
          </button>

          <span
            style={{
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              flex: 1,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: "0 8px",
            }}
          >
            {wedding.groom} ♥ {wedding.bride}
          </span>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {upcoming && (
              <button
                onClick={() => downloadICS(wedding)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#FF69B4", display: "flex" }}
                title="캘린더에 추가"
              >
                <CalendarIcon />
              </button>
            )}
            <Link
              href={`/new?id=${id}`}
              style={{ color: "#FF69B4", display: "flex", alignItems: "center" }}
              title="편집"
            >
              <EditIcon />
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.35)", display: "flex" }}
              title="삭제"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Scroll content */}
        <div style={{ padding: "20px 20px 80px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── 웨딩 정보 카드 ── */}
          <div
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2A2A2A",
              borderRadius: 16,
              padding: 20,
            }}
          >
            {/* 이름 */}
            <p
              style={{
                fontFamily: "var(--font-gaegu), Gaegu, cursive",
                fontSize: 30,
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              {wedding.groom} <span style={{ color: "#FF1493" }}>♥</span> {wedding.bride}
            </p>

            {/* D-day 배지 */}
            <div style={{ marginBottom: 16 }}>
              {daysUntil === 0 ? (
                <span style={{ display: "inline-block", backgroundColor: "#FF1493", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: "2px 10px" }}>D-Day</span>
              ) : daysUntil > 0 ? (
                <span style={{ display: "inline-block", backgroundColor: "rgba(255,20,147,0.15)", border: "1px solid rgba(255,20,147,0.4)", color: "#FF1493", fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: "2px 10px" }}>D-{daysUntil}</span>
              ) : (
                <span style={{ display: "inline-block", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", fontSize: 11, borderRadius: 9999, padding: "2px 10px" }}>{Math.abs(daysUntil)}일 전</span>
              )}
            </div>

            {/* 날짜 + 시간 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <CalendarSmallIcon />
              <span style={{ color: "#FF1493", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                {formatDateKR(wedding.date)}
              </span>
              {wedding.time && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                  · {formatTimeKR(wedding.time)}
                </span>
              )}
            </div>

            {/* 장소 */}
            {wedding.venue && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(wedding.venue).catch(() => {});
                  setVenueCopied(true);
                  setTimeout(() => setVenueCopied(false), 2000);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${venueCopied ? "rgba(204,255,0,0.3)" : "rgba(255,255,255,0.1)"}`,
                  backgroundColor: venueCopied ? "rgba(204,255,0,0.1)" : "rgba(0,0,0,0.3)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <LocationIcon color={venueCopied ? "#CCFF00" : "#7EB8FF"} />
                <span style={{ flex: 1, color: venueCopied ? "#CCFF00" : "#7EB8FF", fontSize: 13, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {wedding.venue}
                </span>
                {venueCopied
                  ? <span style={{ color: "#CCFF00", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>복사됨 ✓</span>
                  : <CopyIcon />}
              </button>
            )}
          </div>

          {/* ── 참석 여부 ── */}
          <div style={{ backgroundColor: "#111111", border: "1px solid #2A2A2A", borderRadius: 16, padding: 16 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, marginBottom: 12, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>참석 여부</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["attending", "absent", "pending"] as Attendance[]).map((value) => {
                const active = att === value;
                const c = ATTENDANCE_PILL_ACTIVE[value];
                return (
                  <button
                    key={value}
                    onClick={() => updateAttendanceMutation.mutate(value)}
                    disabled={updateAttendanceMutation.isPending}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 9999,
                      border: `1px solid ${active ? c.border : "rgba(255,255,255,0.1)"}`,
                      backgroundColor: active ? c.bg : "rgba(255,255,255,0.05)",
                      color: active ? c.text : "rgba(255,255,255,0.3)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: updateAttendanceMutation.isPending ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                    }}
                  >
                    {ATTENDANCE_LABEL[value]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 청첩장 링크 ── */}
          {wedding.invite_url && (
            <button
              onClick={() => window.open(wedding.invite_url!, "_blank")}
              onContextMenu={async (e) => {
                e.preventDefault();
                await navigator.clipboard.writeText(wedding.invite_url!).catch(() => {});
                setUrlCopied(true);
                setTimeout(() => setUrlCopied(false), 2000);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#111111",
                border: "1px solid #2A2A2A",
                borderRadius: 16,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, minWidth: 28, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>URL</span>
              <span style={{ flex: 1, color: "#7EB8FF", fontSize: 12, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {wedding.invite_url}
              </span>
              {urlCopied
                ? <span style={{ color: "#CCFF00", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>복사됨 ✓</span>
                : <ExternalIcon />}
            </button>
          )}

          {/* ── 축의금 ── */}
          <div style={{ backgroundColor: "#111111", border: "1px solid #2A2A2A", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>축의금</p>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>자동 저장</span>
            </div>
            {/* 빠른 선택 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[50000, 100000, 150000, 200000].map((amount) => {
                const active = giftAmount === String(amount);
                return (
                  <button
                    key={amount}
                    onClick={() => {
                      const v = String(amount);
                      setGiftAmount(v);
                      giftRef.current = v;
                      scheduleSave();
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 9999,
                      border: `1px solid ${active ? "#FF1493" : "rgba(255,255,255,0.1)"}`,
                      backgroundColor: active ? "rgba(255,20,147,0.15)" : "rgba(255,255,255,0.05)",
                      color: active ? "#FF1493" : "rgba(255,255,255,0.4)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                    }}
                  >
                    {amount / 10000}만
                  </button>
                );
              })}
            </div>
            {/* 직접 입력 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                inputMode="numeric"
                value={giftAmount}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, "");
                  setGiftAmount(clean);
                  giftRef.current = clean;
                  scheduleSave();
                }}
                onBlur={saveNow}
                placeholder="0"
                style={{
                  flex: 1,
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: 12,
                  color: "#FFFFFF",
                  fontSize: 15,
                  padding: "12px 16px",
                  outline: "none",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>원</span>
            </div>
            {giftAmount && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 6, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                {Number(giftAmount).toLocaleString("ko-KR")}원
              </p>
            )}
          </div>

          {/* ── 메모 ── */}
          <div style={{ backgroundColor: "#111111", border: "1px solid #2A2A2A", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>메모</p>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>자동 저장</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => {
                setMemo(e.target.value);
                memoRef.current = e.target.value;
                scheduleSave();
              }}
              onBlur={saveNow}
              placeholder="이날의 기억을 한 줄로..."
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: 12,
                color: "#FFFFFF",
                fontSize: 14,
                lineHeight: 1.6,
                padding: "12px 16px",
                resize: "none",
                outline: "none",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

        </div>

        {/* Delete confirm dialog */}
        {showDeleteConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 24,
            }}
          >
            <div
              style={{
                backgroundColor: "#111111",
                borderRadius: 20,
                padding: 24,
                width: "100%",
                maxWidth: 320,
                border: "1px solid #2A2A2A",
              }}
            >
              <h3 style={{ color: "#FFFFFF", fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                삭제
              </h3>
              <p style={{ color: "#A3A3A3", fontSize: 14, marginBottom: 24, lineHeight: 1.6, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                이 결혼식을 삭제할까요? 기억도 함께 삭제됩니다.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #2A2A2A", backgroundColor: "transparent", color: "#A3A3A3", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}
                >
                  취소
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); deleteMutation.mutate(); }}
                  disabled={deleteMutation.isPending}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", backgroundColor: "#3D0A1E", color: "#FF1493", fontSize: 14, fontWeight: 600, cursor: deleteMutation.isPending ? "not-allowed" : "pointer", fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}
                >
                  {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronBackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function LocationIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
