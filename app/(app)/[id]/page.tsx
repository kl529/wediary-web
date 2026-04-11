"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
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
  formatGiftAmount,
} from "@/lib/db";
import { downloadICS } from "@/lib/calendar";
import { useToast } from "@/components/Toast";
import type { Attendance } from "@/lib/types";

const QUICK_GIFT_AMOUNTS = [50000, 100000, 150000, 200000];

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
  const [giftInput, setGiftInput] = useState<string>("");
  const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const giftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setMemo(memory.memo ?? "");
      if (memory.gift_amount) {
        setGiftAmount(String(memory.gift_amount));
        setGiftInput(memory.gift_amount.toLocaleString("ko-KR"));
      }
    }
  }, [memory]);

  const updateAttendanceMutation = useMutation({
    mutationFn: (attendance: Attendance) => updateWedding(id, { attendance }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", id] });
      queryClient.invalidateQueries({ queryKey: ["weddings"] });
      showToast("참석 여부가 저장되었어요");
    },
    onError: () => showToast("저장에 실패했어요", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWedding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weddings"] });
      router.push("/");
    },
    onError: () => showToast("삭제에 실패했어요", "error"),
  });

  const saveMemory = useCallback(
    (updates: { memo?: string; gift_amount?: number | null }) => {
      upsertMemory(id, updates)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["memory", id] });
        })
        .catch(() => showToast("저장에 실패했어요", "error"));
    },
    [id, queryClient, showToast]
  );

  function handleMemoChange(value: string) {
    setMemo(value);
    if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
    memoTimerRef.current = setTimeout(() => {
      saveMemory({ memo: value });
    }, 1500);
  }

  function handleGiftInput(value: string) {
    // Strip non-numeric
    const numeric = value.replace(/[^0-9]/g, "");
    const num = numeric ? parseInt(numeric, 10) : 0;
    setGiftAmount(numeric);
    setGiftInput(num > 0 ? num.toLocaleString("ko-KR") : "");
    if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
    giftTimerRef.current = setTimeout(() => {
      saveMemory({ gift_amount: num > 0 ? num : null });
    }, 1500);
  }

  function handleQuickGift(amount: number) {
    setGiftAmount(String(amount));
    setGiftInput(amount.toLocaleString("ko-KR"));
    if (giftTimerRef.current) clearTimeout(giftTimerRef.current);
    saveMemory({ gift_amount: amount });
    showToast("축의금이 저장되었어요", "success");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div style={{ color: "#616161", fontSize: 15 }}>불러오는 중...</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div style={{ color: "#616161", fontSize: 15 }}>찾을 수 없어요</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[430px]">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 0",
            paddingTop: "max(16px, env(safe-area-inset-top))",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              color: "#A3A3A3",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 15,
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            <BackIcon /> 뒤로
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href={`/new?id=${id}`}
              style={{
                background: "none",
                border: "1px solid #2A2A2A",
                color: "#A3A3A3",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 13,
                textDecoration: "none",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              수정
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: "none",
                border: "none",
                color: "#FF1493",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                alignItems: "center",
              }}
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Couple names */}
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-gaegu), Gaegu, cursive",
                fontSize: 26,
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              {wedding.groom} ♥ {wedding.bride}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <span style={{ color: "#A3A3A3", fontSize: 15, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                {formatDateKR(wedding.date)}
                {wedding.time && ` ${formatTimeKR(wedding.time)}`}
              </span>
              {wedding.venue && (
                <span style={{ color: "#A3A3A3", fontSize: 15, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                  📍 {wedding.venue}
                </span>
              )}
              {wedding.invite_url && (
                <a
                  href={wedding.invite_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#FF1493",
                    fontSize: 13,
                    textDecoration: "underline",
                    fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                    marginTop: 4,
                  }}
                >
                  청첩장 보기 →
                </a>
              )}
            </div>
          </div>

          {/* Attendance selector */}
          <Section title="참석 여부">
            <div style={{ display: "flex", gap: 8 }}>
              {(["attending", "absent", "pending"] as Attendance[]).map((a) => {
                const labels = { attending: "참석", absent: "불참", pending: "미정" };
                const colors = {
                  attending: { bg: "#1A2600", text: "#CCFF00", border: "#CCFF00" },
                  absent: { bg: "#3D0A1E", text: "#FF1493", border: "#FF1493" },
                  pending: { bg: "#1A1A1A", text: "#616161", border: "#2A2A2A" },
                };
                const active = wedding.attendance === a;
                const c = colors[a];
                return (
                  <button
                    key={a}
                    onClick={() => updateAttendanceMutation.mutate(a)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 9999,
                      border: `1px solid ${active ? c.border : "#2A2A2A"}`,
                      backgroundColor: active ? c.bg : "transparent",
                      color: active ? c.text : "#616161",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                    }}
                  >
                    {labels[a]}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Memo */}
          <Section title="메모">
            <textarea
              value={memo}
              onChange={(e) => handleMemoChange(e.target.value)}
              placeholder="결혼식의 기억을 남겨보세요..."
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: 12,
                color: "#FFFFFF",
                fontSize: 15,
                lineHeight: 1.6,
                padding: "12px 16px",
                resize: "none",
                outline: "none",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            />
          </Section>

          {/* Gift amount */}
          <Section title="축의금">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {QUICK_GIFT_AMOUNTS.map((amount) => {
                const active = giftAmount === String(amount);
                return (
                  <button
                    key={amount}
                    onClick={() => handleQuickGift(amount)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 9999,
                      border: `1px solid ${active ? "#FF1493" : "#2A2A2A"}`,
                      backgroundColor: active ? "#3D0A1E" : "transparent",
                      color: active ? "#FF1493" : "#A3A3A3",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                    }}
                  >
                    {formatGiftAmount(amount).replace("원", "")}원
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="numeric"
                value={giftInput}
                onChange={(e) => handleGiftInput(e.target.value)}
                placeholder="직접 입력"
                style={{
                  width: "100%",
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  borderRadius: 12,
                  color: "#FFFFFF",
                  fontSize: 15,
                  padding: "12px 48px 12px 16px",
                  outline: "none",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#616161",
                  fontSize: 14,
                  pointerEvents: "none",
                }}
              >
                원
              </span>
            </div>
          </Section>

          {/* Calendar button */}
          {wedding.date && (
            <button
              onClick={() => downloadICS(wedding)}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "1px solid #2A2A2A",
                backgroundColor: "transparent",
                color: "#A3A3A3",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              <CalendarIcon />
              .ics 파일 다운로드
            </button>
          )}
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
              <h3
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8,
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                결혼식을 삭제할까요?
              </h3>
              <p
                style={{
                  color: "#A3A3A3",
                  fontSize: 14,
                  marginBottom: 24,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {wedding.groom} ♥ {wedding.bride} 결혼식과 관련된 모든 기록이 삭제됩니다.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "1px solid #2A2A2A",
                    backgroundColor: "transparent",
                    color: "#A3A3A3",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: "#3D0A1E",
                    color: "#FF1493",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                  }}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#A3A3A3",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
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

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
