type FeedbackBannerProps = {
  type: "success" | "error";
  message: string;
};

export function FeedbackBanner({ type, message }: FeedbackBannerProps) {
  const classes =
    type === "success"
      ? "border-[#bde7ca] bg-[#edf9f1] text-[#1f6a3b]"
      : "border-[#efcfcb] bg-[#fff5f4] text-[#9d3f35]";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>
      {message}
    </div>
  );
}
