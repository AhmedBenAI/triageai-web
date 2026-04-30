import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ title }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900 tabular-nums truncate">{{ value }}</p>
          @if (subtitle) {
            <p class="mt-1 text-xs text-slate-500">{{ subtitle }}</p>
          }
        </div>
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50" [class]="iconColor">
          <app-icon [name]="icon" [size]="20" />
        </div>
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() iconColor = 'text-blue-600';
}
