"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? null);
        setName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? null);
      }
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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
            설정
          </h1>
        </div>

        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* User card */}
          <div
            style={{
              backgroundColor: "#111111",
              borderRadius: 16,
              padding: 20,
              border: "1px solid #2A2A2A",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#3D0A1E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                fontSize: 22,
              }}
            >
              💌
            </div>
            {name && (
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: 4,
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {name}
              </p>
            )}
            {email ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#A3A3A3",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {email}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#616161",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                익명 사용자
              </p>
            )}
          </div>

          {/* Menu list */}
          <div
            style={{
              backgroundColor: "#111111",
              borderRadius: 16,
              border: "1px solid #2A2A2A",
              overflow: "hidden",
            }}
          >
            <Link
              href="/privacy"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                textDecoration: "none",
                borderBottom: "1px solid #2A2A2A",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: "#FFFFFF",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                개인정보처리방침
              </span>
              <ChevronRight />
            </Link>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#616161",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                버전
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#616161",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                1.0.0
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 16,
              border: "1px solid #3D0A1E",
              backgroundColor: "transparent",
              color: "#FF1493",
              fontSize: 15,
              fontWeight: 600,
              cursor: loggingOut ? "not-allowed" : "pointer",
              opacity: loggingOut ? 0.6 : 1,
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </div>
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

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#616161" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
