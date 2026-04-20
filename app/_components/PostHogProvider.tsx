"use client";

/**
 * PostHog 초기화 및 페이지뷰 자동 추적 Provider
 *
 * - App Router의 layout.tsx에서 최상단 wrapping
 * - pathname 변경 시마다 page_viewed 이벤트 발행
 */
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, events } from "@/lib/posthog";

function PostHogInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const pageName = pathname.split("/").filter(Boolean).join(" > ") || "home";
    events.pageViewed(pageName, pathname);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PostHogInner />
      {children}
    </>
  );
}
