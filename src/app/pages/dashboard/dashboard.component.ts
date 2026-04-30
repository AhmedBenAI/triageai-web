import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone, inject,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import type { Metrics, TicketRecord } from '../../models';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { MetricCardComponent } from '../../components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { IconComponent } from '../../components/icon/icon.component';

Chart.register(...registerables);

const CATEGORY_COLORS: Record<string, string> = {
  billing: '#3b82f6', technical: '#8b5cf6', account: '#10b981',
  feature: '#f97316', compliance: '#ef4444', general: '#94a3b8',
};
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981',
};

function formatUptime(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MetricCardComponent, PageHeaderComponent, LoadingSpinnerComponent, IconComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Real-time pipeline performance and analytics">
      <div class="flex items-center gap-2">
        <button (click)="loadAll()" class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
          <app-icon name="refresh-cw" [size]="14" /> Refresh
        </button>
        <button (click)="handleReset()" [disabled]="resetting" class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50">
          <app-icon name="alert-triangle" [size]="14" /> Reset
        </button>
      </div>
    </app-page-header>

    @if (loading) {
      <div class="flex h-64 items-center justify-center">
        <app-loading-spinner size="lg" />
      </div>
    } @else {
      <!-- Stat cards -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <app-metric-card title="Total Tickets" [value]="metrics?.totalTickets ?? 0"
          [subtitle]="ticketSubtitle"
          icon="ticket" iconColor="text-blue-600" />
        <app-metric-card title="Avg Cost / Ticket"
          [value]="avgCostValue"
          [subtitle]="totalCostSubtitle"
          icon="dollar-sign" iconColor="text-emerald-600" />
        <app-metric-card title="Avg Latency"
          [value]="avgLatencyValue"
          [subtitle]="p95Subtitle"
          icon="clock" iconColor="text-amber-600" />
        <app-metric-card title="Avg Quality Score"
          [value]="avgScoreValue"
          [subtitle]="(metrics?.flaggedTickets ?? 0) + ' flagged'"
          icon="star" iconColor="text-purple-600" />
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-6">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <app-icon name="trending-up" [size]="16" class="text-slate-400" />
            <h2 class="text-sm font-semibold text-slate-700">Category Breakdown</h2>
          </div>
          @if (hasCategoryData) {
            <div class="relative h-[220px]"><canvas #categoryCanvas></canvas></div>
          } @else {
            <div class="flex h-[220px] flex-col items-center justify-center">
              <app-icon name="ticket" [size]="28" class="text-slate-300" />
              <p class="mt-2 text-sm text-slate-400">No data yet</p>
            </div>
          }
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <app-icon name="flag" [size]="16" class="text-slate-400" />
            <h2 class="text-sm font-semibold text-slate-700">Priority Breakdown</h2>
          </div>
          @if (hasPriorityData) {
            <div class="relative h-[220px]"><canvas #priorityCanvas></canvas></div>
          } @else {
            <div class="flex h-[220px] flex-col items-center justify-center">
              <app-icon name="ticket" [size]="28" class="text-slate-300" />
              <p class="mt-2 text-sm text-slate-400">No data yet</p>
            </div>
          }
        </div>
      </div>

      <!-- Bottom stats -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Tokens Used</p>
          <p class="mt-2 text-xl font-bold text-slate-900 tabular-nums">{{ totalTokens }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ totalInputTokens }} in / {{ totalOutputTokens }} out</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Flag Rate</p>
          <p class="mt-2 text-xl font-bold text-slate-900 tabular-nums">{{ flagRatePct }}%</p>
          <p class="mt-1 text-xs text-slate-500">{{ metrics?.flaggedTickets ?? 0 }} tickets flagged for review</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Uptime</p>
          <p class="mt-2 text-xl font-bold text-slate-900">{{ uptime }}</p>
          <p class="mt-1 text-xs text-slate-500">Started {{ startedAt }}</p>
        </div>
      </div>

      <!-- Ticket history -->
      <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <app-icon name="clock" [size]="16" class="text-slate-400" />
            <h2 class="text-sm font-semibold text-slate-700">Recent Tickets</h2>
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{{ tickets.length }}</span>
          </div>
          <a routerLink="/triage" class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            <app-icon name="zap" [size]="12" /> New Ticket
          </a>
        </div>

        @if (tickets.length === 0) {
          <div class="flex flex-col items-center justify-center py-12">
            <app-icon name="ticket" [size]="32" class="text-slate-300" />
            <p class="mt-2 text-sm text-slate-400">No tickets yet — submit one to get started</p>
            <a routerLink="/triage" class="mt-3 text-xs font-semibold text-blue-600 hover:underline">Go to New Triage</a>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50 text-left">
                  <th class="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Time</th>
                  <th class="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Summary</th>
                  <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</th>
                  <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Priority</th>
                  <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Score</th>
                  <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cost</th>
                  <th class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Latency</th>
                </tr>
              </thead>
              <tbody>
                @for (t of tickets; track t.id) {
                  <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" (click)="expandedTicketId = expandedTicketId === t.id ? null : t.id">
                    <td class="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{{ relativeTime(t.timestamp) }}</td>
                    <td class="px-5 py-3 max-w-[260px]">
                      <p class="truncate text-xs text-slate-700 font-medium">{{ t.summary }}</p>
                      <p class="truncate text-[11px] text-slate-400 mt-0.5">{{ t.intent }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" [class]="categoryClass(t.category)">{{ t.category }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" [class]="priorityClass(t.priority)">{{ t.priority }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-xs font-bold tabular-nums" [class]="scoreClass(t.overall_score)">
                        {{ (t.overall_score * 100).toFixed(0) }}%
                      </span>
                      @if (t.flagged) {
                        <app-icon name="alert-triangle" [size]="12" class="ml-1 text-amber-500" />
                      }
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">\${{ t.total_cost_usd.toFixed(5) }}</td>
                    <td class="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">{{ (t.total_latency_ms / 1000).toFixed(1) }}s</td>
                  </tr>
                  @if (expandedTicketId === t.id) {
                    <tr class="bg-slate-50">
                      <td colspan="7" class="px-5 py-4">
                        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Ticket</p>
                            <p class="text-xs text-slate-700 leading-relaxed line-clamp-4">{{ t.ticket_text }}</p>
                          </div>
                          <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Draft Response</p>
                            <p class="text-xs text-slate-700 leading-relaxed line-clamp-4">{{ t.draft_response }}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('categoryCanvas') categoryCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityCanvas') priorityCanvas?: ElementRef<HTMLCanvasElement>;

  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private categoryChart: Chart | null = null;
  private priorityChart: Chart | null = null;
  private viewReady = false;

  metrics: Metrics | null = null;
  tickets: TicketRecord[] = [];
  loading = true;
  resetting = false;
  expandedTicketId: string | null = null;

  ngOnInit() {
    this.loadAll();
    this.refreshInterval = setInterval(() => this.loadAll(), 5_000);
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.metrics) {
      this.zone.runOutsideAngular(() => this.buildCharts());
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.categoryChart?.destroy();
    this.priorityChart?.destroy();
  }

  async loadAll() {
    try {
      const [metricsRes, ticketsRes] = await Promise.all([
        this.apiService.getMetrics(),
        this.apiService.getTickets(50),
      ]);
      this.metrics = metricsRes.data;
      this.tickets = ticketsRes.data;
      if (this.viewReady) {
        this.zone.runOutsideAngular(() => setTimeout(() => this.buildCharts(), 0));
      }
    } catch {
      this.toast.error('Failed to load dashboard');
    } finally {
      this.loading = false;
    }
  }

  async handleReset() {
    if (!confirm('Reset all metrics and ticket history? This cannot be undone.')) return;
    this.resetting = true;
    try {
      await this.apiService.resetMetrics();
      this.toast.success('Metrics reset');
      await this.loadAll();
    } catch {
      this.toast.error('Reset failed');
    } finally {
      this.resetting = false;
    }
  }

  get hasCategoryData(): boolean {
    return !!this.metrics && Object.keys(this.metrics.categoryBreakdown).length > 0;
  }
  get hasPriorityData(): boolean {
    return !!this.metrics && Object.keys(this.metrics.priorityBreakdown).length > 0;
  }
  get flagRatePct(): string {
    if (!this.metrics || this.metrics.totalTickets === 0) return '0.0';
    return (this.metrics.flagRate * 100).toFixed(1);
  }
  get uptime(): string { return formatUptime(this.metrics?.uptimeSeconds ?? 0); }

  get ticketSubtitle(): string {
    return this.metrics ? 'Since ' + new Date(this.metrics.startedAt).toLocaleDateString() : '—';
  }
  get avgCostValue(): string {
    return this.metrics ? '$' + this.metrics.avgCostPerTicketUsd.toFixed(4) : '$0.0000';
  }
  get totalCostSubtitle(): string {
    return 'Total: $' + (this.metrics ? this.metrics.totalCostUsd.toFixed(4) : '0.0000');
  }
  get avgLatencyValue(): string {
    return this.metrics?.latency?.avgMs ? (this.metrics.latency.avgMs / 1000).toFixed(1) + 's' : '—';
  }
  get p95Subtitle(): string {
    return 'P95: ' + (this.metrics?.latency?.p95Ms ? (this.metrics.latency.p95Ms / 1000).toFixed(1) + 's' : '—');
  }
  get avgScoreValue(): string {
    return this.metrics?.avgEvalScore != null ? Math.round(this.metrics.avgEvalScore * 100) + '%' : '—';
  }
  get totalTokens(): string { return (this.metrics?.totalTokens ?? 0).toLocaleString(); }
  get totalInputTokens(): string { return (this.metrics?.totalInputTokens ?? 0).toLocaleString(); }
  get totalOutputTokens(): string { return (this.metrics?.totalOutputTokens ?? 0).toLocaleString(); }
  get startedAt(): string {
    return this.metrics ? new Date(this.metrics.startedAt).toLocaleString() : '—';
  }

  relativeTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  categoryClass(cat: string): string {
    const map: Record<string, string> = {
      billing: 'bg-blue-100 text-blue-700',
      technical: 'bg-purple-100 text-purple-700',
      account: 'bg-emerald-100 text-emerald-700',
      feature: 'bg-orange-100 text-orange-700',
      compliance: 'bg-red-100 text-red-700',
      general: 'bg-slate-100 text-slate-600',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-600';
  }

  priorityClass(pri: string): string {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return map[pri] ?? 'bg-slate-100 text-slate-600';
  }

  scoreClass(score: number): string {
    const pct = score * 100;
    return pct >= 85 ? 'text-emerald-600' : pct >= 65 ? 'text-amber-600' : 'text-red-600';
  }

  private buildCharts() {
    if (!this.metrics) return;
    try {
      this.buildCategoryChart();
      this.buildPriorityChart();
    } catch (err) {
      console.error('Chart build error:', err);
    }
  }

  private buildCategoryChart() {
    if (!this.categoryCanvas || !this.hasCategoryData) return;
    this.categoryChart?.destroy();
    const entries = Object.entries(this.metrics!.categoryBreakdown);
    this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => CATEGORY_COLORS[k] ?? '#94a3b8'),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '55%',
        plugins: {
          legend: { position: 'right', labels: { color: '#64748b', font: { size: 12 }, boxWidth: 10, padding: 12 } },
          tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', cornerRadius: 8 },
        },
      },
    });
  }

  private buildPriorityChart() {
    if (!this.priorityCanvas || !this.hasPriorityData) return;
    this.priorityChart?.destroy();
    const entries = Object.entries(this.metrics!.priorityBreakdown);
    this.priorityChart = new Chart(this.priorityCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => PRIORITY_COLORS[k] ?? '#94a3b8'),
          borderRadius: 4,
          barThickness: 36,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#f1f5f9', cornerRadius: 8 },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 12 } } },
          y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 12 } }, beginAtZero: true },
        },
      },
    });
  }
}
