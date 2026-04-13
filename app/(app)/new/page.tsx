"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWedding, createWedding, updateWedding } from "@/lib/db";
import { downloadICS } from "@/lib/calendar";
import { useToast } from "@/components/Toast";
import type { Attendance, Wedding } from "@/lib/types";

export default function NewWeddingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = use(searchParams);
  const isEdit = !!id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("pending");
  const [inviteUrl, setInviteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [createdWedding, setCreatedWedding] = useState<Wedding | null>(null);

  const { data: existing } = useQuery({
    queryKey: ["wedding", id],
    queryFn: () => getWedding(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setGroom(existing.groom ?? "");
      setBride(existing.bride ?? "");
      setDate(existing.date ?? "");
      setTime(existing.time ?? "");
      setVenue(existing.venue ?? "");
      setAttendance(existing.attendance ?? "pending");
      setInviteUrl(existing.invite_url ?? "");
    }
  }, [existing]);

  async function handleParseInvitation() {
    if (!inviteUrl.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/parse-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inviteUrl }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.groom) setGroom(data.groom);
      if (data.bride) setBride(data.bride);
      if (data.date) setDate(data.date);
      if (data.time) setTime(data.time);
      if (data.venue) setVenue(data.venue);
      showToast("청첩장 정보를 불러왔어요", "success");
    } catch {
      showToast("청첩장 정보를 불러오지 못했어요", "error");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    if (!groom.trim() || !bride.trim()) {
      showToast("신랑, 신부 이름을 입력해주세요", "error");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateWedding(id, {
          groom: groom.trim(),
          bride: bride.trim(),
          date,
          time: time || null,
          venue: venue.trim(),
          attendance,
          invite_url: inviteUrl.trim() || null,
        });
        queryClient.invalidateQueries({ queryKey: ["wedding", id] });
        queryClient.invalidateQueries({ queryKey: ["weddings"] });
        showToast("수정되었어요", "success");
        router.push(`/${id}`);
      } else {
        const newWedding = await createWedding({
          groom: groom.trim(),
          bride: bride.trim(),
          date,
          time: time || null,
          venue: venue.trim(),
          attendance,
          invite_url: inviteUrl.trim() || null,
        });
        queryClient.invalidateQueries({ queryKey: ["weddings"] });
        // Check if wedding date is upcoming → show calendar modal
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const wDate = new Date(date + "T00:00:00");
        if (wDate >= today) {
          setCreatedWedding(newWedding);
          setShowCalendarModal(true);
        } else {
          showToast("저장되었어요", "success");
          router.push(`/${newWedding.id}`);
        }
      }
    } catch {
      showToast("저장에 실패했어요", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[430px]">
        {/* Header: 취소 / title / 저장 */}
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
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: 16,
              cursor: "pointer",
              padding: "8px 0",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            취소
          </button>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#FFFFFF",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            {isEdit ? "결혼식 수정" : "새 결혼식"}
          </span>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              background: "none",
              border: "none",
              color: saving ? "rgba(255,255,255,0.3)" : "#FF1493",
              fontSize: 16,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              padding: "8px 0",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 20px 60px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Section 1: 청첩장 URL */}
          <SectionCard label="청첩장 URL">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                value={inviteUrl}
                onChange={(e) => setInviteUrl(e.target.value)}
                placeholder="청첩장 링크 붙여넣기..."
                style={inputStyle}
              />
              <button
                onClick={handleParseInvitation}
                disabled={parsing || !inviteUrl.trim()}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: parsing || !inviteUrl.trim() ? "none" : "1px solid rgba(255,20,147,0.4)",
                  backgroundColor: parsing || !inviteUrl.trim() ? "rgba(255,20,147,0.3)" : "rgba(255,20,147,0.2)",
                  color: parsing || !inviteUrl.trim() ? "rgba(255,255,255,0.2)" : "#FF1493",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: parsing || !inviteUrl.trim() ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {parsing ? "..." : "불러오기"}
              </button>
            </div>
            {parsing && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>
                청첩장 정보를 가져오는 중...
              </p>
            )}
          </SectionCard>

          {/* Section 2: 기본 정보 */}
          <SectionCard label="기본 정보">
            {/* 신랑 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>신랑</span>
                <span style={{ fontSize: 12, color: "#FF1493" }}>*</span>
              </div>
              <input
                type="text"
                value={groom}
                onChange={(e) => setGroom(e.target.value)}
                placeholder="이름"
                style={inputStyle}
              />
            </div>

            {/* 신부 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>신부</span>
                <span style={{ fontSize: 12, color: "#FF1493" }}>*</span>
              </div>
              <input
                type="text"
                value={bride}
                onChange={(e) => setBride(e.target.value)}
                placeholder="이름"
                style={inputStyle}
              />
            </div>

            {/* 날짜 + 시간 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>날짜</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>시간</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* 장소 */}
            <div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>장소</span>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="웨딩홀 이름"
                style={inputStyle}
              />
            </div>
          </SectionCard>

          {/* Section 3: 참석 여부 */}
          <SectionCard label="참석 여부">
            <div style={{ display: "flex", gap: 8 }}>
              {(["attending", "absent", "pending"] as Attendance[]).map((a) => {
                const labels = { attending: "참석", absent: "불참", pending: "미정" };
                const active = attendance === a;
                const activeStyles: Record<Attendance, { bg: string; text: string; border: string }> = {
                  attending: { bg: "rgba(163,230,53,0.15)", text: "#A3E635", border: "#A3E635" },
                  absent: { bg: "rgba(255,20,147,0.15)", text: "#FF1493", border: "#FF1493" },
                  pending: { bg: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.7)", border: "rgba(255,255,255,0.3)" },
                };
                const s = activeStyles[a];
                return (
                  <button
                    key={a}
                    onClick={() => setAttendance(a)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: `1px solid ${active ? s.border : "#2A2A2A"}`,
                      backgroundColor: active ? s.bg : "#1A1A1A",
                      color: active ? s.text : "rgba(255,255,255,0.3)",
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
          </SectionCard>
        </div>

        {/* Calendar Modal */}
        {showCalendarModal && createdWedding && (
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
                캘린더에 추가할까요?
              </h3>
              <p style={{ color: "#A3A3A3", fontSize: 14, marginBottom: 24, lineHeight: 1.6, fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}>
                저장된 결혼식 일정을 기기 캘린더에 추가할 수 있어요.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setShowCalendarModal(false);
                    showToast("등록됐어요", "success");
                    router.push(`/${createdWedding.id}`);
                  }}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #2A2A2A", backgroundColor: "transparent", color: "#A3A3A3", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}
                >
                  건너뛰기
                </button>
                <button
                  onClick={() => {
                    downloadICS(createdWedding);
                    setShowCalendarModal(false);
                    showToast("등록됐어요", "success");
                    router.push(`/${createdWedding.id}`);
                  }}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", backgroundColor: "#FF1493", color: "#FFFFFF", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif" }}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  backgroundColor: "#1A1A1A",
  border: "1px solid #2A2A2A",
  borderRadius: 12,
  color: "#FFFFFF",
  fontSize: 15,
  padding: "12px 16px",
  outline: "none",
  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
};

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #2A2A2A",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          display: "block",
          marginBottom: 12,
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
