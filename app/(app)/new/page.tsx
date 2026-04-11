"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWedding, createWedding, updateWedding } from "@/lib/db";
import { useToast } from "@/components/Toast";
import type { Attendance } from "@/lib/types";

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
        showToast("저장되었어요", "success");
        router.push(`/${newWedding.id}`);
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 16px 0",
            paddingTop: "max(16px, env(safe-area-inset-top))",
            gap: 12,
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
            }}
          >
            <BackIcon />
          </button>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            {isEdit ? "결혼식 수정" : "새 결혼식 추가"}
          </h1>
        </div>

        {/* Form */}
        <div style={{ padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Invite URL */}
          <FormGroup label="청첩장 URL">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                value={inviteUrl}
                onChange={(e) => setInviteUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
              <button
                onClick={handleParseInvitation}
                disabled={parsing || !inviteUrl.trim()}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #2A2A2A",
                  backgroundColor: parsing ? "#1A1A1A" : "#3D0A1E",
                  color: parsing ? "#616161" : "#FF1493",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: parsing || !inviteUrl.trim() ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {parsing ? "불러오는 중..." : "불러오기"}
              </button>
            </div>
          </FormGroup>

          <div style={{ height: 1, backgroundColor: "#2A2A2A" }} />

          {/* Groom */}
          <FormGroup label="신랑 이름 *">
            <input
              type="text"
              value={groom}
              onChange={(e) => setGroom(e.target.value)}
              placeholder="홍길동"
              style={inputStyle}
            />
          </FormGroup>

          {/* Bride */}
          <FormGroup label="신부 이름 *">
            <input
              type="text"
              value={bride}
              onChange={(e) => setBride(e.target.value)}
              placeholder="김영희"
              style={inputStyle}
            />
          </FormGroup>

          {/* Date */}
          <FormGroup label="날짜">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </FormGroup>

          {/* Time */}
          <FormGroup label="시간">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </FormGroup>

          {/* Venue */}
          <FormGroup label="장소">
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="그랜드 볼룸"
              style={inputStyle}
            />
          </FormGroup>

          {/* Attendance */}
          <FormGroup label="참석 여부">
            <div style={{ display: "flex", gap: 8 }}>
              {(["attending", "absent", "pending"] as Attendance[]).map((a) => {
                const labels = { attending: "참석", absent: "불참", pending: "미정" };
                const colors = {
                  attending: { bg: "#1A2600", text: "#CCFF00", border: "#CCFF00" },
                  absent: { bg: "#3D0A1E", text: "#FF1493", border: "#FF1493" },
                  pending: { bg: "#1A1A1A", text: "#616161", border: "#2A2A2A" },
                };
                const active = attendance === a;
                const c = colors[a];
                return (
                  <button
                    key={a}
                    onClick={() => setAttendance(a)}
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
          </FormGroup>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              backgroundColor: saving ? "#616161" : "#FF1493",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              marginTop: 8,
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
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

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#A3A3A3",
          letterSpacing: "0.04em",
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
