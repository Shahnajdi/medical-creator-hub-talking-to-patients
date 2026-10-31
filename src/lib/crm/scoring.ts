import type { ScoringConfig } from "./scoring-config";

export type AgencyAnswers = {
  budget?: string;
  adStatus?: string;
  objective?: string;
  website?: string | null;
  country?: string;
};

export type Qualification = "high" | "medium" | "nurture" | "not_qualified";

export function scoreAgencyLead(a: AgencyAnswers, cfg: ScoringConfig): { score: number; qualification: Qualification } {
  let score = 0;
  if (a.budget) score += cfg.budget[a.budget] ?? 0;
  if (a.adStatus) score += cfg.adStatus[a.adStatus] ?? 0;
  if (a.objective) score += cfg.objective[a.objective] ?? 0;
  if (a.website) score += cfg.hasWebOrInstagram;
  if (a.country && cfg.servedMarkets.countries.includes(a.country.toUpperCase())) score += cfg.servedMarkets.points;
  score = Math.max(0, Math.min(100, score));
  const t = cfg.thresholds;
  const qualification: Qualification =
    score >= t.high ? "high" : score >= t.medium ? "medium" : score >= t.nurture ? "nurture" : "not_qualified";
  return { score, qualification };
}
