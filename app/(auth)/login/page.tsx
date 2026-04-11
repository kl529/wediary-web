"use client";

import { useState } from "react";
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
              fontSize: 40,
              fontWeight: 600,
              color: "#FF1493",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            wediary
          </h1>
          <p
            style={{
              fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
              fontSize: 13,
              color: "#A3A3A3",
              fontWeight: 400,
            }}
          >
            결혼식 기록 다이어리
          </p>
        </div>

        {/* Decorative element */}
        <div className="text-4xl select-none">💌</div>

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
              fontWeight: 700,
              borderRadius: 9999,
              padding: "14px 0",
              width: "100%",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              "로그인 중..."
            ) : (
              <>
                <KakaoIcon />
                카카오로 시작하기
              </>
            )}
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
          <a href="/privacy" style={{ color: "#A3A3A3", textDecoration: "underline" }}>
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.392c0 2.088 1.356 3.924 3.402 4.974l-.864 3.222a.188.188 0 0 0 .288.204l3.864-2.556c.258.03.522.048.81.048 4.142 0 7.5-2.634 7.5-5.892S13.142 1.5 9 1.5z"
        fill="#000000"
      />
    </svg>
  );
}
