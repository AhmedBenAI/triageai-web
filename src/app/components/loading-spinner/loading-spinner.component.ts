import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div
      class="animate-spin rounded-full border-slate-200 border-t-blue-600"
      [style.width.px]="px"
      [style.height.px]="px"
      [style.border-width.px]="borderPx"
    ></div>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get px(): number {
    return this.size === 'sm' ? 14 : this.size === 'lg' ? 40 : 22;
  }
  get borderPx(): number {
    return this.size === 'lg' ? 3 : 2;
  }
}
