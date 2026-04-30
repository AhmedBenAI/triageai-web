import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string) { this.add('success', message); }
  error(message: string) { this.add('error', message); }
  info(message: string) { this.add('info', message); }

  remove(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.remove(id), 4000);
  }
}
