export interface Offer {
  id: number;
  name: string;
  rankFinal: number;
  scoreFinal: number;
  rankFinancial: number;
  scoreFinancial: number;
  rankTechnical: number;
  scoreTechnical: number;
  amountTTC: number;
}

export interface Metadata {
  consultation: string;
  date: string;
  description: string;
  buyer: string;
  requester: string;
  tva: string;
}

export interface Stats {
  average: number;
  max: number;
  min: number;
  winner: Offer | null;
  savingAmount: number;
  savingPercent: number;
}

export interface TechnicalCriterion {
  name: string;
  score: string | number;
  maxScore?: string | number;
  comment?: string;
}

export interface CandidateTechnicalAnalysis {
  candidateName: string;
  criteria: TechnicalCriterion[];
}

export interface AnalysisData {
  lotName: string; 
  metadata: Metadata;
  offers: Offer[];
  stats: Stats;
  technicalAnalysis?: CandidateTechnicalAnalysis[];
}

export interface GlobalAnalysisResult {
  lots: AnalysisData[];
  globalMetadata: Record<string, string>;
}
