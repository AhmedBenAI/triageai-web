export type Category = 'billing' | 'technical' | 'account' | 'feature' | 'compliance' | 'general';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Sentiment = 'frustrated' | 'neutral' | 'positive';

export interface Classification {
  category: Category;
  priority: Priority;
  confidence: number;
  sentiment: Sentiment;
  summary: string;
  intent: string;
}

export interface RagDocument {
  id: string;
  category: string;
  title: string;
  relevanceScore: number;
}

export interface Evaluation {
  relevance: number;
  completeness: number;
  tone: number;
  actionability: number;
  overall: number;
  flag: boolean;
  flag_reason: string;
}

export interface StagePerf {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface Performance {
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  stages: {
    classify: StagePerf;
    rag: { latencyMs: number; docsRetrieved: number };
    draft: StagePerf;
    evaluate: StagePerf;
  };
}

export interface TriageResult {
  ticketId: string;
  timestamp: string;
  model: 'openai' | 'claude';
  ticket: string;
  classification: Classification;
  rag: { docsRetrieved: number; documents: RagDocument[] };
  draftResponse: string;
  evaluation: Evaluation;
  performance: Performance;
}

export interface Metrics {
  totalTickets: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  avgCostPerTicketUsd: number;
  latency: { avgMs: number; p95Ms: number; samples: number };
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  flaggedTickets: number;
  flagRate: number;
  avgEvalScore: number | null;
  startedAt: string;
  uptimeSeconds: number;
}

export interface TicketRecord {
  id: string;
  timestamp: string;
  ticket_text: string;
  category: string;
  priority: string;
  confidence: number;
  sentiment: string;
  summary: string;
  intent: string;
  draft_response: string;
  overall_score: number;
  flagged: number;
  flag_reason: string;
  total_latency_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  rag_docs_retrieved: number;
}

export interface KnowledgeBaseDoc {
  id: string;
  category: string;
  title: string;
  tags: string[];
  content?: string;
  relevanceScore?: number;
}
