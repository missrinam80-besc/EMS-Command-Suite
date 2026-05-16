export type FeedbackType = "success" | "error";

export function buildFeedbackUrl(
  pathname: string,
  type: FeedbackType,
  message: string,
) {
  const params = new URLSearchParams();
  params.set(type, message);
  return `${pathname}?${params.toString()}`;
}

export function readFeedback(searchParams?: { success?: string; error?: string }) {
  if (searchParams?.success) {
    return { type: "success" as const, message: decodeURIComponent(searchParams.success) };
  }

  if (searchParams?.error) {
    return { type: "error" as const, message: decodeURIComponent(searchParams.error) };
  }

  return null;
}
