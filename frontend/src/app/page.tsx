import { AboutSection } from "@/components/home/AboutSection";
import { ContributeSection } from "@/components/home/ContributeSection";
import { Hero } from "@/components/home/Hero";
import { HomeContent } from "@/components/home/HomeContent";

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <HomeContent />
      <ContributeSection />
      <AboutSection />
    </main>
  );
}
