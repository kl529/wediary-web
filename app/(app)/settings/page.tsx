"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { canInstall, install } = usePWAInstall();

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
            padding: "16px 24px 0",
            paddingTop: "max(16px, env(safe-area-inset-top))",
            gap: 4,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "8px 8px 8px 0",
              display: "flex",
              alignItems: "center",
            }}
          >
            <BackIcon />
          </button>
        </div>

        <div style={{ padding: "4px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1
            style={{
              fontFamily: "var(--font-fredoka), Fredoka, sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: "#FF1493",
              marginBottom: 16,
            }}
          >
            설정
          </h1>

          {/* User card */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                marginBottom: 4,
                letterSpacing: "0.04em",
              }}
            >
              계정
            </p>
            {name ? (
              <>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                  }}
                >
                  {name}
                </p>
                {email && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </p>
                )}
              </>
            ) : (
              <p
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                {email || "—"}
              </p>
            )}
          </div>

          {/* Install PWA */}
          {canInstall && (
            <div
              onClick={install}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                backgroundColor: "rgba(255,20,147,0.1)",
                border: "1px solid rgba(255,20,147,0.3)",
                borderRadius: 16,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#FF1493",
                  fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
                }}
              >
                앱 설치하기
              </span>
              <DownloadIcon />
            </div>
          )}

          {/* Privacy */}
          <Link
            href="/privacy"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              textDecoration: "none",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              개인정보처리방침
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>›</span>
          </Link>

          {/* Logout */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              cursor: loggingOut ? "not-allowed" : "pointer",
              opacity: loggingOut ? 0.6 : 1,
            }}
            onClick={!loggingOut ? handleLogout : undefined}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#F87171",
                fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              }}
            >
              {loggingOut ? "로그아웃 중..." : "로그아웃"}
            </span>
          </div>

          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
            }}
          >
            v1.0.0
          </p>
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

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF1493" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
