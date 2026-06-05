import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  template: `
    @if (waking()) {
      <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <svg class="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-lg font-semibold">Waking up the server…</p>
        <p class="text-sm text-slate-400">This takes a few seconds after a period of inactivity.</p>
      </div>
    }
    <div [class.invisible]="waking()" class="flex h-screen overflow-hidden bg-slate-100">
      <app-sidebar />
      <main class="flex-1 overflow-y-auto">
        <div class="min-h-full p-6 lg:p-8">
          <router-outlet />
        </div>
      </main>
    </div>
    <app-toast />
  `,
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  waking = signal(true);

  async ngOnInit() {
    await this.waitForBackend();
  }

  private async waitForBackend() {
    for (let i = 0; i < 30; i++) {
      try {
        await this.api.getHealth();
        this.waking.set(false);
        return;
      } catch {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    this.waking.set(false); // give up after 60s, show app anyway
  }
}
