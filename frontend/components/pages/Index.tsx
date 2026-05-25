import { Header } from "@/components/homie/Header";
import { Hero } from "@/components/homie/Hero";
import { Features } from "@/components/homie/Features";
import { Cultivate } from "@/components/homie/Cultivate";
import { CTA } from "@/components/homie/CTA";
import { Footer } from "@/components/homie/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Cultivate />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
