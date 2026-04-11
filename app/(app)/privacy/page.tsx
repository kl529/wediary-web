"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

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
            개인정보처리방침
          </h1>
        </div>

        <div
          style={{
            padding: "24px 16px 60px",
            color: "#A3A3A3",
            fontSize: 14,
            lineHeight: 1.8,
            fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
          }}
        >
          <p style={{ color: "#616161", fontSize: 12, marginBottom: 24 }}>
            최종 업데이트: 2026년 4월 11일
          </p>

          <Section title="1. 수집하는 개인정보">
            <p>
              wediary는 서비스 제공을 위해 다음과 같은 정보를 수집합니다:
            </p>
            <ul style={{ paddingLeft: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>카카오 계정을 통한 이메일 주소 및 프로필 이름 (소셜 로그인 시)</li>
              <li>결혼식 정보 (신랑/신부 이름, 날짜, 장소, 참석 여부)</li>
              <li>메모 및 축의금 기록</li>
            </ul>
          </Section>

          <Section title="2. 개인정보 이용 목적">
            <p>수집된 정보는 다음 목적으로만 사용됩니다:</p>
            <ul style={{ paddingLeft: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>서비스 제공 및 운영</li>
              <li>사용자 계정 관리</li>
              <li>결혼식 기록 저장 및 조회</li>
            </ul>
          </Section>

          <Section title="3. 개인정보 보관 기간">
            <p>
              개인정보는 서비스 이용 계약이 존속하는 기간 동안 보관됩니다.
              계정 삭제 시 모든 개인정보는 즉시 파기됩니다.
            </p>
          </Section>

          <Section title="4. 개인정보 제3자 제공">
            <p>
              wediary는 사용자의 개인정보를 제3자에게 제공하지 않습니다.
              단, 법령에 의한 요청이 있는 경우는 예외로 합니다.
            </p>
          </Section>

          <Section title="5. 데이터 저장">
            <p>
              모든 데이터는 Supabase(미국 소재)의 안전한 서버에 암호화되어 저장됩니다.
            </p>
          </Section>

          <Section title="6. 사용자의 권리">
            <p>사용자는 다음 권리를 가집니다:</p>
            <ul style={{ paddingLeft: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>개인정보 삭제 요청 (계정 탈퇴)</li>
            </ul>
          </Section>

          <Section title="7. 문의">
            <p>
              개인정보 처리에 관한 문의는 아래로 연락주세요:
            </p>
            <p style={{ marginTop: 8, color: "#FF1493" }}>wediary@example.com</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#FFFFFF",
          marginBottom: 10,
          fontFamily: "var(--font-pretendard), Pretendard Variable, sans-serif",
        }}
      >
        {title}
      </h2>
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
