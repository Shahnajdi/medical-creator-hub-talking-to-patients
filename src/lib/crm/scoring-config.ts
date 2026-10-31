/**
 * Default, admin-overridable lead scoring (settings key "crm.scoring").
 * Country is scored by *where the business operates*, never by nationality,
 * and no score ever auto-rejects a lead — low scores go to nurture.
 */
export type ScoringConfig = {
  budget: Record<string, number>;
  adStatus: Record<string, number>;
  objective: Record<string, number>;
  hasWebOrInstagram: number;
  servedMarkets: { countries: string[]; points: number };
  thresholds: { high: number; medium: number; nurture: number };
};

export const DEFAULT_SCORING: ScoringConfig = {
  budget: { none: 0, under_500: 10, "500_1500": 20, "1500_5000": 30, over_5000: 35 },
  adStatus: { never: 5, paused: 8, self_managed: 12, agency: 15 },
  objective: { leads: 15, sales: 15, bookings: 15, awareness: 5, unsure: 5 },
  hasWebOrInstagram: 10,
  servedMarkets: { countries: ["US", "CA", "AU", "GB", "DE", "TR", "NL", "SE", "FR", "AE"], points: 15 },
  thresholds: { high: 70, medium: 45, nurture: 20 },
};
