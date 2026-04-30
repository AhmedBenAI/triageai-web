import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg pointer-events-auto"
          [class]="toastBg(toast.type)"
        >
          <app-icon [name]="toastIcon(toast.type)" [size]="16" />
          {{ toast.message }}
          <button class="ml-2 opacity-70 hover:opacity-100" (click)="toastService.remove(toast.id)">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  toastBg(type: string): string {
    return type === 'success' ? 'bg-emerald-600'
         : type === 'error'   ? 'bg-red-600'
         : 'bg-blue-600';
  }

  toastIcon(type: string): string {
    return type === 'success' ? 'check' : type === 'error' ? 'alert-triangle' : 'zap';
  }
}
