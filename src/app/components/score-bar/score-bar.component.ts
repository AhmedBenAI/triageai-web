import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-score-bar',
  standalone: true,
  template: `
    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700 capitalize">{{ label }}</span>
        <span [class]="valueClass">{{ pct }}%</span>
      </div>
      <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" [class]="barColor" [style.width.%]="pct"></div>
      </div>
    </div>
  `,
})
export class ScoreBarComponent {
  @Input() label = '';
  @Input() value = 0;

  get pct(): number { return Math.round(this.value * 100); }

  get barColor(): string {
    return this.pct >= 85 ? 'bg-emerald-500' : this.pct >= 65 ? 'bg-amber-500' : 'bg-red-500';
  }

  get valueClass(): string {
    const base = 'text-xs font-semibold tabular-nums';
    return this.pct >= 85 ? `${base} text-emerald-600`
         : this.pct >= 65 ? `${base} text-amber-600`
         : `${base} text-red-600`;
  }
}
