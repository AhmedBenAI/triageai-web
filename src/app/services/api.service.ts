import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Metrics, TriageResult, TicketRecord, KnowledgeBaseDoc } from '../models';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  triageTicket(ticket: string, options?: { ragTopK?: number; model?: 'openai' | 'claude' }) {
    return firstValueFrom(
      this.http.post<{ success: boolean; data: TriageResult }>(`${BASE}/api/triage`, { ticket, options })
    );
  }

  getMetrics() {
    return firstValueFrom(
      this.http.get<{ success: boolean; data: Metrics }>(`${BASE}/api/metrics`)
    );
  }

  resetMetrics() {
    return firstValueFrom(
      this.http.delete<{ success: boolean; message: string }>(`${BASE}/api/metrics`)
    );
  }

  getKnowledgeBase(params?: { full?: boolean; category?: string }) {
    return firstValueFrom(
      this.http.get<{ success: boolean; count: number; data: KnowledgeBaseDoc[] }>(
        `${BASE}/api/knowledge-base`,
        { params: params as Record<string, string | boolean> }
      )
    );
  }

  searchKnowledgeBase(q: string, topK?: number) {
    return firstValueFrom(
      this.http.get<{ success: boolean; query: string; count: number; data: KnowledgeBaseDoc[] }>(
        `${BASE}/api/knowledge-base/search`,
        { params: topK ? { q, topK } : { q } }
      )
    );
  }

  getTickets(limit = 20) {
    return firstValueFrom(
      this.http.get<{ success: boolean; count: number; data: TicketRecord[] }>(
        `${BASE}/api/tickets`, { params: { limit } }
      )
    );
  }

  getHealth() {
    return firstValueFrom(
      this.http.get<{ status: string; service: string; timestamp: string; version: string }>(`${BASE}/health`)
    );
  }
}
