import { HeroBase } from "./hero-base";

export function Hero() {
  return (
    <HeroBase
      title="Your Screen History,"
      highlightedText="Searchable. Private. Free."
      description="Find anything you've ever seen on your screen. All data stays on your Mac, encrypted at rest. Zero cloud. Zero login. Open Source."
      mobileDescription="Find anything you've ever seen on your screen. All data stays on your Mac."
      trackingSource="hero"
    />
  );
}
