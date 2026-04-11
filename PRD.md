# wediary Web — PRD (Product Requirements Document)

**버전:** 1.0.0
**작성일:** 2026-04-11
**상태:** 배포 완료
**라이브 URL:** https://wediaryweb.vercel.app
**GitHub:** https://github.com/kl529/wediary-web

---

## 1. 제품 개요

### 1.1 배경

wediary는 결혼식 청첩장을 관리하고 참석 기록, 축의금, 소감을 남기는 개인 다이어리 앱이다. 기존에 Expo(React Native) 기반의 모바일 앱으로 운영 중이며, 이 문서는 **동일 기능을 Next.js 15 기반 PWA 웹앱으로 재구현**한 프로젝트를 다룬다.

### 1.2 목적

- iOS/Android 설치 없이 웹 브라우저에서 바로 사용 가능
- PWA(Progressive Web App)로 홈 화면 추가 시 네이티브 앱에 준하는 UX 제공
- Vercel 자동 배포로 빠른 배포 사이클

### 1.3 타겟 사용자

결혼식에 자주 참석하는 한국 사용자 (20-40대). 결혼식 이후 기억과 축의금 기록을 보관하고 싶은 사람.

---

## 2. 기능 요구사항

### 2.1 인증 (Authentication)

| ID | 요구사항 | 구현 |
|----|---------|------|
| AUTH-01 | 카카오 OAuth로 로그인 | Supabase Auth + Kakao provider |
| AUTH-02 | 로그인 없이 계속 (개발/테스트용) | Supabase signInAnonymously() |
| AUTH-03 | 세션 자동 갱신 | middleware.ts에서 매 요청마다 refresh |
| AUTH-04 | 미인증 사용자 → /login 리다이렉트 | Next.js middleware |
| AUTH-05 | 로그아웃 | settings 페이지에서 signOut() → /login |

**OAuth Callback URL (Supabase에 등록 필요):**
- Production: `https://wediaryweb.vercel.app/callback`
- Local: `http://localhost:3000/callback`

### 2.2 결혼식 목록 (Home)

| ID | 요구사항 | 구현 |
|----|---------|------|
| HOME-01 | 예정/지난 결혼식 탭 분리 | isUpcoming() 함수로 분류 |
| HOME-02 | 결혼식 카드: 커플 이름, 날짜, 참석 상태, D-day | WeddingCard 컴포넌트 |
| HOME-03 | D-day 뱃지: D-N (예정), N일 전 (지난) | formatDday() |
| HOME-04 | 참석 상태별 카드 왼쪽 border 색 | 참석=라임, 불참=핑크, 미정=회색 |
| HOME-05 | 새 결혼식 추가 FAB | 우하단 고정, /new로 이동 |
| HOME-06 | 빈 상태 메시지 | "아직 기록된 결혼식이 없어요" |

### 2.3 결혼식 상세 (Detail)

| ID | 요구사항 | 구현 |
|----|---------|------|
| DETAIL-01 | 커플 이름 (Gaegu 700, 26px) | 상단 히어로 영역 |
| DETAIL-02 | 날짜/시간/장소 표시 | formatDateKR(), formatTimeKR() |
| DETAIL-03 | 청첩장 링크 (있을 경우) | 새 탭으로 열기 |
| DETAIL-04 | 참석 여부 변경 (참석/불참/미정) | updateWedding() 즉시 반영 |
| DETAIL-05 | 메모 자동 저장 (1.5초 debounce) | upsertMemory() |
| DETAIL-06 | 축의금 입력: 빠른 선택 + 직접 입력 | 5/10/15/20만원 프리셋 |
| DETAIL-07 | 축의금 자동 저장 (1.5초 debounce) | upsertMemory() |
| DETAIL-08 | .ics 파일 다운로드 (캘린더 연동) | lib/calendar.ts |
| DETAIL-09 | 결혼식 삭제 (확인 다이얼로그 포함) | deleteWedding() |
| DETAIL-10 | 결혼식 수정 → /new?id=... | |

### 2.4 결혼식 추가/수정 (New)

| ID | 요구사항 | 구현 |
|----|---------|------|
| NEW-01 | 신랑/신부 이름 (필수) | 폼 validation |
| NEW-02 | 날짜, 시간, 장소, 참석 여부 | 선택 입력 |
| NEW-03 | 청첩장 URL 붙여넣기 → 자동 정보 추출 | /api/parse-invitation → Supabase Edge Fn |
| NEW-04 | 수정 모드: URL에 ?id= 파라미터 | 기존 데이터 프리필 |
| NEW-05 | 저장 후 /[id] 로 이동 | |

### 2.5 설정 (Settings)

| ID | 요구사항 | 구현 |
|----|---------|------|
| SET-01 | 로그인 사용자 이름/이메일 표시 | user_metadata.full_name |
| SET-02 | 개인정보처리방침 링크 | /privacy |
| SET-03 | 로그아웃 | signOut() → /login |

### 2.6 PWA

| ID | 요구사항 | 구현 |
|----|---------|------|
| PWA-01 | 홈 화면 추가 지원 | manifest.ts, display: standalone |
| PWA-02 | 오프라인 서비스 워커 | @ducanh2912/next-pwa |
| PWA-03 | 테마 색상 #000000 | theme-color meta 태그 |
| PWA-04 | 앱 아이콘 192px, 512px | public/icons/ |
| PWA-05 | iOS 전체화면 지원 | apple-mobile-web-app-capable |

---

## 3. 비기능 요구사항

### 3.1 성능
- First Load JS < 200KB (현재 최대 184KB)
- 서버 컴포넌트 우선 (클라이언트 번들 최소화)

### 3.2 UX/디자인
- 모바일 최적화: max-width 430px, 세로 중앙 배치
- 다크 모드 전용 (라이트 모드 없음)
- Y2K 미학: 블랙 배경 + 핫핑크 (#FF1493) + 라임 (#CCFF00)
- 폰트: Fredoka(로고), Gaegu(커플 이름), Pretendard(UI 전체)

### 3.3 보안
- Supabase Row Level Security (RLS): user_id 기반 격리
- 환경변수: Vercel env에서만 관리
- OAuth 콜백 URL 화이트리스트

### 3.4 접근성
- 한국어 lang="ko"
- 시맨틱 HTML (button, label, nav 등)

---

## 4. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 서버 상태 | TanStack React Query v5 |
| 백엔드 | Supabase (Auth, Postgres, Storage, Edge Functions) |
| PWA | @ducanh2912/next-pwa |
| 배포 | Vercel (자동 배포) |
| 소스 | GitHub (kl529/wediary-web) |

---

## 5. 배포 및 인프라

### 5.1 환경 변수

| 변수 | 설명 | Vercel 등록 |
|------|------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 | ✅ production |

### 5.2 Vercel 설정
- 프로젝트명: wediary_web
- 팀: lyvas-projects
- 배포 URL: https://wediaryweb.vercel.app
- Region: iad1 (Washington D.C.)
- Framework: Next.js (자동 감지)

### 5.3 CI/CD
- GitHub push → Vercel 자동 빌드/배포 (git 연동 설정 후)
- 현재: `vercel deploy --prod` 수동 배포

---

## 6. Supabase 설정 (필요 작업)

배포 후 Supabase 대시보드에서 아래 작업 필요:

1. **Authentication > URL Configuration**에 Redirect URL 추가:
   - `https://wediaryweb.vercel.app/callback`
   - `https://wediaryweb.vercel.app/**`

2. **Kakao OAuth 앱 설정**에서 허용 도메인/리다이렉트 URL 추가

---

## 7. 기존 Expo 앱과의 차이점

| 기능 | Expo 앱 | wediary Web |
|------|---------|-------------|
| OCR 스캔 | ML Kit (네이티브) | ❌ 미지원 (웹 제한) |
| 캘린더 연동 | 기기 캘린더 직접 추가 | .ics 파일 다운로드 |
| 딥링크 | wediary:// scheme | 표준 URL |
| 푸시 알림 | EAS Push | ❌ 미구현 |
| 사진 업로드 | expo-image-picker | ❌ 미구현 (향후) |

---

## 8. 향후 계획

- [ ] GitHub → Vercel 자동 배포 연동
- [ ] 사진 업로드 기능 (웹 file input 활용)
- [ ] 웹 푸시 알림 (Web Push API)
- [ ] PWA 아이콘 실제 wediary 브랜드 아이콘으로 교체
- [ ] Preview 환경 (PR별 자동 배포)
- [ ] E2E 테스트 (Playwright)
