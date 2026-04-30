import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
        }
      </div>
      <ng-content />
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
