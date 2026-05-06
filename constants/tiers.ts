export const tiers = [
  {
    id: "scanner",
    name: "Scanner",
    rank: "Tier 1",
    scanThreshold: 5,
    referralThreshold: 0,
    reward: "Base allocation"
  },
  {
    id: "referrer",
    name: "Referrer",
    rank: "Tier 2",
    scanThreshold: 5,
    referralThreshold: 1,
    reward: "2x allocation"
  },
  {
    id: "guardian",
    name: "Guardian",
    rank: "Tier 3",
    scanThreshold: 50,
    referralThreshold: 3,
    reward: "5x allocation"
  }
] as const;
