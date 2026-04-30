import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import type { TriageResult } from '../../models';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { ScoreBarComponent } from '../../components/score-bar/score-bar.component';
import { IconComponent } from '../../components/icon/icon.component';

interface PipelineStage { id: string; label: string; icon: string; }

const STAGES: PipelineStage[] = [
  { id: 'classify', label: 'Classifying ticket',         icon: 'brain' },
  { id: 'rag',      label: 'Retrieving knowledge base',  icon: 'book-open' },
  { id: 'draft',    label: 'Drafting response',          icon: 'file-text' },
  { id: 'evaluate', label: 'Evaluating quality',         icon: 'shield-check' },
];

const SAMPLES = [
  'I was charged twice for my subscription this month. My card ending in 4242 was billed $49 on the 1st and again on the 3rd. I need a refund immediately — this is unacceptable.',
  'Our API integration is returning 401 errors on every request even though I regenerated the key twice. This is blocking our entire production deployment.',
  "I can't log into my account. I reset my password three times but still get an error saying my credentials are invalid. I have an important presentation in 2 hours.",
];

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe,
    PageHeaderComponent, LoadingSpinnerComponent,
    BadgeComponent, ScoreBarComponent, IconComponent,
  ],
  template: `
    <app-page-header title="New Ticket Triage"
      subtitle="Paste a support ticket and let the AI pipeline classify, research, and draft a response." />

    <!-- Input form -->
    <form (ngSubmit)="handleSubmit()" class="mb-6">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div class="flex items-start justify-between gap-4">
          <label class="text-sm font-semibold text-slate-700">
            Ticket Content
            <span class="ml-2 text-xs font-normal text-slate-400">10–5000 characters</span>
          </label>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">Sample:</span>
            @for (s of samples; track $index) {
              <button type="button" (click)="ticket = s"
                class="rounded px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                #{{ $index + 1 }}
              </button>
            }
          </div>
        </div>

        <textarea
          [(ngModel)]="ticket"
          name="ticket"
          rows="6"
          [disabled]="loading"
          placeholder="Paste or type the customer support ticket here…"
          class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60"
        ></textarea>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-wrap">
            <label class="text-xs font-medium text-slate-600">Model:</label>
            <div class="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              @for (m of modelOptions; track m.value) {
                <button type="button" (click)="model = m.value" [disabled]="loading"
                  class="px-3 py-1.5 transition-colors"
                  [class]="model === m.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'">
                  {{ m.label }}
                </button>
              }
            </div>
            <label class="text-xs font-medium text-slate-600">Top-K:</label>
            <select [(ngModel)]="ragTopK" name="ragTopK" [disabled]="loading"
              class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              @for (n of [1,2,3,4,5]; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
            <span class="text-xs text-slate-400">{{ ticket.length }} / 5000</span>
          </div>

          <button type="submit" [disabled]="loading || ticket.trim().length < 10"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            @if (loading) {
              <app-loading-spinner size="sm" /> Processing…
            } @else {
              <app-icon name="zap" [size]="15" /> Analyze Ticket
            }
          </button>
        </div>
      </div>
    </form>

    <!-- Pipeline progress -->
    @if (loading) {
      <div class="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <p class="mb-4 text-sm font-semibold text-blue-800">Running AI pipeline…</p>
        <div class="space-y-3">
          @for (stage of stages; track stage.id; let i = $index) {
            <div class="flex items-center gap-3">
              <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300"
                [class]="stageCircleClass(i)">
                @if (stageIndex > i) {
                  <app-icon name="check" [size]="14" [strokeWidth]="2.5" />
                } @else if (stageIndex === i) {
                  <app-loading-spinner size="sm" />
                } @else {
                  <app-icon [name]="stage.icon" [size]="13" />
                }
              </div>
              <span class="text-sm transition-colors" [class]="stageLabelClass(i)">{{ stage.label }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Error -->
    @if (error) {
      <div class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <app-icon name="alert-triangle" [size]="18" class="flex-shrink-0 text-red-500 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-red-700">Triage failed</p>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>
    }

    <!-- Results -->
    @if (result) {
      <div class="space-y-4">
        @if (result.evaluation.flag) {
          <div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <app-icon name="alert-triangle" [size]="18" class="flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-amber-700">Response flagged for review</p>
              <p class="text-sm text-amber-600">{{ result.evaluation.flag_reason }}</p>
            </div>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Classification -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <app-icon name="brain" [size]="16" class="text-slate-400" />
              <h2 class="text-sm font-semibold text-slate-700">Classification</h2>
              <span class="ml-auto text-xs text-slate-400">{{ (result.classification.confidence * 100) | number:'1.0-0' }}% confidence</span>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Category</span>
                <app-badge type="category" [value]="result.classification.category" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Priority</span>
                <app-badge type="priority" [value]="result.classification.priority" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Sentiment</span>
                <app-badge type="sentiment" [value]="result.classification.sentiment" />
              </div>
              <div class="border-t border-slate-100 pt-3">
                <p class="text-xs font-medium text-slate-500 mb-1">Summary</p>
                <p class="text-sm text-slate-800">{{ result.classification.summary }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500 mb-1">Customer Intent</p>
                <p class="text-sm italic text-slate-600">"{{ result.classification.intent }}"</p>
              </div>
            </div>
          </div>

          <!-- Evaluation -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <app-icon name="shield-check" [size]="16" class="text-slate-400" />
              <h2 class="text-sm font-semibold text-slate-700">Quality Evaluation</h2>
              <span class="ml-auto text-xs font-bold tabular-nums" [class]="overallClass">
                {{ (result.evaluation.overall * 100) | number:'1.0-0' }}% overall
              </span>
            </div>
            <div class="space-y-3">
              <app-score-bar label="Relevance"     [value]="result.evaluation.relevance" />
              <app-score-bar label="Completeness"  [value]="result.evaluation.completeness" />
              <app-score-bar label="Tone"          [value]="result.evaluation.tone" />
              <app-score-bar label="Actionability" [value]="result.evaluation.actionability" />
            </div>
          </div>
        </div>

        <!-- Draft response -->
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <app-icon name="file-text" [size]="16" class="text-slate-400" />
            <h2 class="text-sm font-semibold text-slate-700">Suggested Response</h2>
            <button (click)="handleCopy()"
              class="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              @if (copied) {
                <app-icon name="check" [size]="13" class="text-emerald-500" /> Copied!
              } @else {
                <app-icon name="copy" [size]="13" /> Copy
              }
            </button>
          </div>
          <div class="rounded-lg bg-slate-50 border border-slate-100 px-4 py-4">
            <p class="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{{ result.draftResponse }}</p>
          </div>
        </div>

        <!-- RAG documents -->
        @if (result.rag.documents.length > 0) {
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <app-icon name="book-open" [size]="16" class="text-slate-400" />
              <h2 class="text-sm font-semibold text-slate-700">Knowledge Base References</h2>
              <span class="ml-auto text-xs text-slate-400">{{ result.rag.docsRetrieved }} documents retrieved</span>
            </div>
            <div class="space-y-2">
              @for (doc of result.rag.documents; track doc.id) {
                <div class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <app-badge type="category" [value]="doc.category" size="sm" />
                  <span class="flex-1 text-sm text-slate-700">{{ doc.title }}</span>
                  <span class="flex-shrink-0 text-xs font-semibold tabular-nums text-slate-400">
                    {{ (doc.relevanceScore * 100) | number:'1.0-0' }}% match
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Performance (collapsible) -->
        <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button (click)="perfExpanded = !perfExpanded"
            class="flex w-full items-center gap-2 p-5 text-left hover:bg-slate-50 transition-colors">
            <app-icon name="bar-chart-2" [size]="16" class="text-slate-400" />
            <h2 class="text-sm font-semibold text-slate-700">Performance Details</h2>
            <div class="ml-auto flex items-center gap-3">
              <span class="text-xs text-slate-500">
                {{ result.model === 'claude' ? 'Claude Haiku' : 'GPT-3.5 Turbo' }} ·
                {{ (result.performance.totalLatencyMs / 1000).toFixed(2) }}s ·
                {{ result.performance.totalTokens | number }} tokens ·
                {{ '$' + result.performance.totalCostUsd.toFixed(5) }}
              </span>
              <app-icon [name]="perfExpanded ? 'chevron-up' : 'chevron-down'" [size]="16" class="text-slate-400" />
            </div>
          </button>

          @if (perfExpanded) {
            <div class="border-t border-slate-100 px-5 pb-5 pt-4">
              <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                @for (stage of perfStages; track stage.name) {
                  <div class="rounded-lg bg-slate-50 border border-slate-100 p-3">
                    <p class="text-xs font-semibold text-slate-500 mb-2">{{ stage.name }}</p>
                    <div class="space-y-1 text-xs text-slate-600">
                      <div class="flex items-center gap-1.5">
                        <app-icon name="clock" [size]="11" class="text-slate-400" />
                        {{ stage.data.latencyMs }}ms
                      </div>
                      <div class="flex items-center gap-1.5">
                        <app-icon name="coins" [size]="11" class="text-slate-400" />
                        {{ stage.data.inputTokens + stage.data.outputTokens }} tokens
                      </div>
                      <div class="font-medium text-slate-700">{{ '$' + stage.data.costUsd.toFixed(5) }}</div>
                    </div>
                  </div>
                }
                <div class="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p class="text-xs font-semibold text-blue-600 mb-2">Total</p>
                  <div class="space-y-1 text-xs text-slate-600">
                    <div class="flex items-center gap-1.5">
                      <app-icon name="clock" [size]="11" class="text-slate-400" />
                      {{ result.performance.totalLatencyMs }}ms
                    </div>
                    <div class="flex items-center gap-1.5">
                      <app-icon name="coins" [size]="11" class="text-slate-400" />
                      {{ result.performance.totalTokens | number }} tokens
                    </div>
                    <div class="font-bold text-blue-700">{{ '$' + result.performance.totalCostUsd.toFixed(5) }}</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class TriageComponent {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);

  ticket = '';
  ragTopK = 3;
  model: 'openai' | 'claude' = 'openai';
  loading = false;

  readonly modelOptions = [
    { value: 'openai' as const, label: 'GPT-3.5 Turbo' },
    { value: 'claude' as const, label: 'Claude Haiku' },
  ];
  stageIndex = -1;
  result: TriageResult | null = null;
  error: string | null = null;
  copied = false;
  perfExpanded = false;

  readonly stages = STAGES;
  readonly samples = SAMPLES;

  async handleSubmit() {
    if (this.ticket.trim().length < 10) {
      this.toast.error('Ticket must be at least 10 characters');
      return;
    }

    this.loading = true;
    this.result = null;
    this.error = null;
    this.stageIndex = 0;

    const timer = setInterval(() => {
      if (this.stageIndex < STAGES.length - 1) this.stageIndex++;
      else clearInterval(timer);
    }, 1100);

    try {
      const res = await this.apiService.triageTicket(this.ticket, { ragTopK: this.ragTopK, model: this.model });
      clearInterval(timer);
      this.stageIndex = STAGES.length;
      this.result = res.data;
      this.toast.success('Triage complete');
    } catch (err) {
      clearInterval(timer);
      this.stageIndex = -1;
      if (err instanceof HttpErrorResponse) {
        this.error = err.error?.error ?? err.message ?? 'Something went wrong';
      } else {
        this.error = 'Something went wrong';
      }
      this.toast.error('Triage failed');
    } finally {
      this.loading = false;
    }
  }

  handleCopy() {
    if (!this.result?.draftResponse) return;
    navigator.clipboard.writeText(this.result.draftResponse);
    this.copied = true;
    this.toast.success('Copied to clipboard');
    setTimeout(() => (this.copied = false), 2000);
  }

  get overallClass(): string {
    const pct = (this.result?.evaluation.overall ?? 0) * 100;
    return pct >= 85 ? 'text-emerald-600' : pct >= 65 ? 'text-amber-600' : 'text-red-600';
  }

  get perfStages() {
    if (!this.result) return [];
    const p = this.result.performance.stages;
    return [
      { name: 'Classify', data: p.classify },
      { name: 'Draft',    data: p.draft },
      { name: 'Evaluate', data: p.evaluate },
    ];
  }

  stageCircleClass(i: number): string {
    if (this.stageIndex > i) return 'bg-emerald-500 text-white';
    if (this.stageIndex === i) return 'bg-blue-600 text-white';
    return 'bg-white text-slate-300 border border-slate-200';
  }

  stageLabelClass(i: number): string {
    if (this.stageIndex > i) return 'text-emerald-700 font-medium';
    if (this.stageIndex === i) return 'text-blue-800 font-semibold';
    return 'text-slate-400';
  }
}
