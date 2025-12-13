import { HeroRewind } from "@/components/sections/hero-rewind";
import { DemoVideo } from "@/components/sections/demo-video";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { CTA } from "@/components/sections/cta";

export default function RewindPage() {
  return (
    <>
      <HeroRewind />
      <DemoVideo />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  );
}
