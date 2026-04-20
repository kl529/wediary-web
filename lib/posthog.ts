/**
 * PostHog 분석 통합 모듈 — wediary
 *
 * 설치 & 초기화 패턴은 GRO-83 설계 플랜을 따릅니다.
 * 프로젝트별 API Key는 NEXT_PUBLIC_POSTHOG_KEY 환경 변수로 주입합니다.
 */
import posthog from "posthog-js";

const PROJECT_NAME = "wediary-web";

// PostHog 프록시 경로 (next.config.ts rewrites와 매핑)
const POSTHOG_HOST =
  typeof window !== "undefined"
    ? `${window.location.origin}/ingest`
    : "https://us.i.posthog.com";

export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (posthog.__loaded) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    capture_pageview: false, // 수동으로 page_viewed 이벤트를 발행
    capture_pageleave: true,
    persistence: "localStorage",
    loaded: (ph) => {
      ph.register({ project_name: PROJECT_NAME });
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });
}

/** 이벤트 추적 헬퍼 */
export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

/** 유저 식별 (로그인 후 호출) */
export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

/** 로그아웃 시 유저 세션 리셋 */
export function resetUser(): void {
  if (typeof window === "undefined") return;
  posthog.reset();
}

/**
 * 표준 이벤트 카탈로그 (GRO-83 공통 이벤트 스키마)
 */
export const events = {
  pageViewed: (pageName: string, pagePath: string) =>
    track("page_viewed", { page_name: pageName, page_path: pagePath }),

  featureUsed: (featureName: string, detail?: string) =>
    track("feature_used", {
      feature_name: featureName,
      action_detail: detail,
    }),

  contentCreated: (contentType: string, contentId?: string) =>
    track("content_created", { content_type: contentType, content_id: contentId }),

  contentViewed: (contentType: string, contentId?: string, durationSec?: number) =>
    track("content_viewed", {
      content_type: contentType,
      content_id: contentId,
      duration_sec: durationSec,
    }),

  shareTriggered: (contentType: string, shareChannel: string) =>
    track("share_triggered", {
      content_type: contentType,
      share_channel: shareChannel,
    }),

  ctaClicked: (ctaName: string, ctaLocation: string) =>
    track("cta_clicked", { cta_name: ctaName, cta_location: ctaLocation }),

  signUpStarted: (method: string) =>
    track("sign_up_started", { method }),

  signUpCompleted: (method: string) =>
    track("sign_up_completed", { method }),

  loginSucceeded: (method: string) =>
    track("login_succeeded", { method }),

  onboardingStepCompleted: (stepNumber: number, stepName: string, totalSteps: number) =>
    track("onboarding_step_completed", {
      step_number: stepNumber,
      step_name: stepName,
      total_steps: totalSteps,
    }),

  errorEncountered: (errorType: string, errorMessage: string, pagePath?: string) =>
    track("error_encountered", {
      error_type: errorType,
      error_message: errorMessage,
      page_path: pagePath,
    }),
} as const;
