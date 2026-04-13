"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getWeddings, formatDateKR, isUpcoming } from "@/lib/db";
import type { Wedding } from "@/lib/types";

export default function HomePage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: weddings = [], isLoading, isError } = useQuery({
    queryKey: ["weddings"],
    queryFn: getWeddings,
  });

  const upcoming = weddings.filter((w) => isUpcoming(w.date));
  const past = weddings.filter((w) => !isUpcoming(w.date));
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-[430px] min-h-screen flex flex-col">
        {/* Header */}
        <header
          style={{
            padding: "16px 24px 0",
            paddingTop: "max(16px, env(safe-area-inset-top))",
          }}
          className="flex items-center justify-between"
        >
          <h1
            style={{
              fontFamily: "var(--font-fredoka), Fredoka, sans-serif",
              fontSize: 28,
              fontWeight: 600,
              color: "#FF1493",
              letterSpacing: "-0.02em",
            }}
          >
            wediary
          </h1>
          <Link
            href="/settings"
            style={{
              color: "rgba(255,255,255,0.6)",
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <SettingsIcon />
          </Link>
        </header>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            margin: "12px 24px 0",
            padding: "4px",
          }}
        >
          <TabButton
            label="예정"
            badge={upcoming.length}
            active={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
          />
          <TabButton
            label="지난 결혼식"
            badge={past.length}
            active={tab === "past"}
            onClick={() => setTab("past")}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 24px 100px", overflowY: "auto", marginTop: 8 }}>
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <EmptyState tab={tab} />
          ) : displayed.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {displayed.map((w) => (
                <WeddingCard key={w.id} wedding={w} />
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/new"
          style={{
            position: "fixed",
            bottom: "max(24px, env(safe-area-inset-bottom))",
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#FF1493",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(255, 20, 147, 0.4)",
            zIndex: 10,
          }}
        >
          <PlusIcon />
        </Link>
      </div>
    </div>
  );
}

function TabButton({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        cursor: "pointer",
        padding: "8px 0",
        borderRadius: 8,
        backgroundColor: active ? "#FF1493" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#000000" : "rgba(255,255,255,0.4)",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        transition: "all 0.15s ease",
      }}
    >
      {label} {badge > 0 ? `(${badge})` : ""}
    </button>
  );
}

function WeddingCard({ wedding }: { wedding: Wedding }) {
  const stripColor =
    wedding.attendance === "attending"
      ? "#CCFF00"
      : wedding.attendance === "absent"
      ? "#FF1493"
      : "#2A2A2A";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wDate = new Date(wedding.date + "T00:00:00");
  const daysUntil = Math.round((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Link href={`/${wedding.id}`} style={{ textDecoration: "none" }} aria-label={`${wedding.groom} ♥ ${wedding.bride}, ${formatDateKR(wedding.date)}`}>
      <div
        style={{
          backgroundColor: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left accent strip */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: stripColor,
          }}
        />

        <div style={{ padding: "16px 16px 0 18px" }}>
          {/* Couple names */}
          <span
            style={{
              fontFamily: "var(--font-gaegu), Gaegu, cursive",
              fontSize: 18,
              fontWeight: 700,
              color: "#FFFFFF",
              display: "block",
              marginBottom: 8,
            }}
          >
            {wedding.groom} <span style={{ color: "#FF1493" }}>♥</span> {wedding.bride}
          </span>

          {/* Date + time row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <CalendarSmallIcon />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#FF1493",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              {formatDateKR(wedding.date)}
            </span>
            {wedding.time && (
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {wedding.time}
              </span>
            )}
          </div>

          {/* Venue row */}
          {wedding.venue && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LocationSmallIcon />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#7EB8FF",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {wedding.venue}
              </span>
            </div>
          )}
        </div>

        {/* D-day row */}
        <div
          style={{
            borderTop: "1px solid #2A2A2A",
            marginTop: 12,
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {daysUntil >= 0 ? (
            <span
              style={{
                backgroundColor: "#FF1493",
                borderRadius: 9999,
                padding: "4px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                boxShadow: "0 3px 6px rgba(255,20,147,0.4)",
              }}
            >
              <CalendarTinyIcon />
              {daysUntil === 0 ? "D-Day" : `D-${daysUntil}`}
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              {Math.abs(daysUntil)}일 전
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "past" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingTop: 80,
      }}
    >
      <MailIcon />
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
          textAlign: "center",
          marginTop: 8,
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {tab === "upcoming"
          ? "예정된 결혼식이 없어요"
          : "아직 기록이 없어요"}
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: 12,
          textAlign: "center",
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {tab === "upcoming"
          ? "오른쪽 아래 + 버튼으로 추가해보세요"
          : "지난 결혼식을 추가하면 여기에 나타나요"}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: "#111111",
            borderRadius: 16,
            padding: 16,
            height: 90,
            borderLeft: "3px solid #2A2A2A",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CalendarTinyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LocationSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
