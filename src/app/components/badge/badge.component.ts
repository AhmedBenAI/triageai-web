import { Component, Input } from '@angular/core';

const CATEGORY_STYLES: Record<string, string> = {
  billing: 'bg-blue-100 text-blue-700 ring-blue-200',
  technical: 'bg-purple-100 text-purple-700 ring-purple-200',
  account: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  feature: 'bg-orange-100 text-orange-700 ring-orange-200',
  compliance: 'bg-red-100 text-red-700 ring-red-200',
  general: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 ring-red-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  medium: 'bg-amber-100 text-amber-700 ring-amber-200',
  low: 'bg-green-100 text-green-700 ring-green-200',
};

const SENTIMENT_STYLES: Record<string, string> = {
  frustrated: 'bg-red-100 text-red-600 ring-red-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  positive: 'bg-emerald-100 text-emerald-600 ring-emerald-200',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span [class]="badgeClass">{{ value }}</span>`,
})
export class BadgeComponent {
  @Input() type: 'category' | 'priority' | 'sentiment' = 'category';
  @Input() value = '';
  @Input() size: 'sm' | 'md' = 'md';

  get badgeClass(): string {
    const base = 'inline-flex items-center rounded-full font-medium ring-1 ring-inset capitalize';
    const sz = this.size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
    const map = this.type === 'category' ? CATEGORY_STYLES
              : this.type === 'priority' ? PRIORITY_STYLES
              : SENTIMENT_STYLES;
    const color = map[this.value] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
    return `${base} ${sz} ${color}`;
  }
}
