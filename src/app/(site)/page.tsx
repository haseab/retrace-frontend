import { Hero } from "@/components/sections/hero";
import { DemoVideo } from "@/components/sections/demo-video";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { CTA } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <DemoVideo />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  );
}
