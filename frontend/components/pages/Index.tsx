import { Header } from "@/components/homie/Header";
import { Hero } from "@/components/homie/Hero";
import { AudiencePaths } from "@/components/homie/AudiencePaths";
import { FeaturesSeekers } from "@/components/homie/FeaturesSeekers";
import { FeaturesBrokers } from "@/components/homie/FeaturesBrokers";
import { Cultivate } from "@/components/homie/Cultivate";
import { CTA } from "@/components/homie/CTA";
import { Footer } from "@/components/homie/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <AudiencePaths />
      <FeaturesSeekers />
      <FeaturesBrokers />
      <Cultivate />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
