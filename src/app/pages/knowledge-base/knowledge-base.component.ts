import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { KnowledgeBaseDoc } from '../../models';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { BadgeComponent } from '../../components/badge/badge.component';
import { IconComponent } from '../../components/icon/icon.component';

type CategoryFilter = 'all' | 'billing' | 'technical' | 'account' | 'feature' | 'compliance';

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'billing',    label: 'Billing' },
  { value: 'technical',  label: 'Technical' },
  { value: 'account',    label: 'Account' },
  { value: 'feature',    label: 'Feature' },
  { value: 'compliance', label: 'Compliance' },
];

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent, LoadingSpinnerComponent,
    BadgeComponent, IconComponent,
  ],
  template: `
    <app-page-header title="Knowledge Base"
      subtitle="Browse and search the articles used for RAG-powered response generation." />

    <!-- Search bar -->
    <div class="mb-5 flex gap-2">
      <div class="relative flex-1">
        <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          [(ngModel)]="query"
          (keydown.enter)="handleSearch()"
          type="text"
          placeholder="Search articles… (min 3 chars)"
          class="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        @if (query) {
          <button (click)="clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <app-icon name="x" [size]="14" />
          </button>
        }
      </div>
      <button (click)="handleSearch()" [disabled]="searching || query.trim().length < 3"
        class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        @if (searching) { <app-loading-spinner size="sm" /> }
        @else { <app-icon name="search" [size]="14" /> }
        Search
      </button>
    </div>

    <!-- Category tabs -->
    @if (!isSearchResult) {
      <div class="mb-5 flex flex-wrap gap-1.5">
        @for (cat of categories; track cat.value) {
          <button (click)="setCategory(cat.value)"
            class="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all"
            [class]="cat.value === category ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">
            {{ cat.label }}
          </button>
        }
      </div>
    }

    @if (isSearchResult) {
      <div class="mb-4 flex items-center gap-2">
        <span class="text-sm text-slate-600">
          Showing <strong>{{ docs.length }}</strong> results for <strong>"{{ query }}"</strong>
        </span>
        <button (click)="clearSearch()" class="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <app-icon name="x" [size]="12" /> Clear
        </button>
      </div>
    }

    <!-- Document list -->
    @if (loading) {
      <div class="flex h-48 items-center justify-center">
        <app-loading-spinner size="lg" />
      </div>
    } @else if (docs.length === 0) {
      <div class="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white">
        <app-icon name="book-open" [size]="32" class="text-slate-300" />
        <p class="mt-2 text-sm text-slate-500">No articles found</p>
      </div>
    } @else {
      <div class="space-y-3">
        @for (doc of docs; track doc.id) {
          <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button (click)="toggleDoc(doc.id)"
              class="flex w-full items-start gap-4 p-5 text-left hover:bg-slate-50 transition-colors">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <app-badge type="category" [value]="doc.category" size="sm" />
                  @if (doc.relevanceScore != null) {
                    <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-2 py-0.5">
                      {{ (doc.relevanceScore * 100).toFixed(0) }}% match
                    </span>
                  }
                </div>
                <p class="text-sm font-semibold text-slate-800">{{ doc.title }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                  <app-icon name="tag" [size]="11" class="text-slate-400" />
                  @for (tag of doc.tags; track tag) {
                    <span class="rounded px-1.5 py-0.5 text-[11px] bg-slate-100 text-slate-500">{{ tag }}</span>
                  }
                </div>
              </div>
              <app-icon [name]="expandedId === doc.id ? 'chevron-up' : 'chevron-down'" [size]="16" class="flex-shrink-0 text-slate-400 mt-0.5" />
            </button>

            @if (expandedId === doc.id && doc.content) {
              <div class="border-t border-slate-100 bg-slate-50 px-5 py-4">
                <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ doc.content }}</p>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class KnowledgeBaseComponent implements OnInit {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);

  docs: KnowledgeBaseDoc[] = [];
  loading = true;
  searching = false;
  query = '';
  category: CategoryFilter = 'all';
  isSearchResult = false;
  expandedId: string | null = null;

  readonly categories = CATEGORIES;

  ngOnInit() {
    this.loadDocs();
  }

  async loadDocs() {
    this.loading = true;
    this.isSearchResult = false;
    try {
      const params = { full: true, ...(this.category !== 'all' && { category: this.category }) };
      const res = await this.apiService.getKnowledgeBase(params);
      this.docs = res.data;
    } catch {
      this.toast.error('Failed to load knowledge base');
    } finally {
      this.loading = false;
    }
  }

  async handleSearch() {
    const q = this.query.trim();
    if (q.length < 3) { this.toast.error('Search query must be at least 3 characters'); return; }
    this.searching = true;
    try {
      const res = await this.apiService.searchKnowledgeBase(q, 10);
      this.docs = res.data;
      this.isSearchResult = true;
    } catch {
      this.toast.error('Search failed');
    } finally {
      this.searching = false;
    }
  }

  setCategory(cat: CategoryFilter) {
    this.category = cat;
    this.query = '';
    this.loadDocs();
  }

  clearSearch() {
    this.query = '';
    this.loadDocs();
  }

  toggleDoc(id: string) {
    this.expandedId = this.expandedId === id ? null : id;
  }
}
