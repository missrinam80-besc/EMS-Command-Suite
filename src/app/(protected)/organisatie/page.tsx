import { SectionPage } from "@/components/section-page";

export default function OrganisatiePage() {
  return (
    <SectionPage
      kicker="Organisatie"
      title="Planning, aanvragen en meetingverslagen"
      description="De organisatorische laag bundelt interne afstemming, opvolging en verslagen."
      modules={["Meetingaanvragen", "Meetings", "Meetingverslagen", "Audit logging"]}
    />
  );
}
