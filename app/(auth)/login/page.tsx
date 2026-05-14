"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);

  async function handleKakaoLogin() {
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${origin}/callback`,
      },
    });
    setLoading(false);
  }

  async function handleAnonLogin() {
    setAnonLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      window.location.href = "/";
    } catch {
      setAnonLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-[390px] flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1
            style={{
              fontFamily: "var(--font-fredoka), Fredoka, sans-serif",
              fontSize: 48,
              fontWeight: 600,
              color: "#FF1493",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            wediary
          </h1>
          <p
            style={{
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
            }}
          >
            결혼식 기억을 모아두는 다이어리
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            style={{
              backgroundColor: "#FEE500",
              color: "#000000",
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 12,
              padding: "16px 32px",
              width: "100%",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "로그인 중..." : "카카오로 시작하기"}
          </button>

          <button
            onClick={handleAnonLogin}
            disabled={anonLoading}
            style={{
              background: "none",
              border: "none",
              color: "#616161",
              fontSize: 13,
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              cursor: anonLoading ? "not-allowed" : "pointer",
              padding: "8px 0",
              textDecoration: "underline",
              textDecorationColor: "#616161",
            }}
          >
            {anonLoading ? "진행 중..." : "로그인 없이 계속"}
          </button>
        </div>

        {/* Footer note */}
        <p
          style={{
            fontSize: 11,
            color: "#616161",
            textAlign: "center",
            fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
          }}
        >
          로그인하면{" "}
          <Link href="/privacy" style={{ color: "#A3A3A3", textDecoration: "underline" }}>
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
