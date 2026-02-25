const discordInviteUrl =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
  "https://discord.gg/uVYW93cbDY";

export const SITE_CONFIG = {
  name: "Retrace",
  version: "1.0.0",
  links: {
    github: "https://github.com/haseab/retrace",
    twitter: "https://twitter.com/haseab_",
    support: "mailto:support@retrace.to",
    featurebase: "https://retrace.featurebase.app",
    githubReleases: "https://github.com/haseab/retrace/releases",
    discord: discordInviteUrl,
  },
} as const;
