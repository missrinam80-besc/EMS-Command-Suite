import { SectionPage } from "@/components/section-page";

export default function HandboekPage() {
  return (
    <SectionPage
      kicker="Handboek"
      title="Richtlijnen, procedures en interne kennis"
      description="Het handboek wordt een beheerde kennisbank met versiebeheer, categorieën en restricted content."
      modules={[
        "Richtlijnencategorieën",
        "Procedures per discipline",
        "Interne notities",
        "Versiebeheer en publicatiestatus",
      ]}
    />
  );
}
