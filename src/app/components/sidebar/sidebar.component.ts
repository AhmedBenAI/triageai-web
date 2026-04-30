import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { ApiService } from '../../services/api.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="flex h-full w-60 flex-shrink-0 flex-col bg-slate-900">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-6 border-b border-slate-700/50">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
          <app-icon name="zap" [size]="18" [strokeWidth]="2.5" class="text-white" />
        </div>
        <div>
          <p class="text-sm font-bold tracking-tight text-white">TriageAI</p>
          <p class="text-[11px] text-slate-400">Support Automation</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-0.5">
        <p class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Menu</p>
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            [class]="linkClass(rla.isActive)"
          >
            <app-icon [name]="item.icon" [size]="18" [class]="rla.isActive ? 'text-blue-400' : 'text-slate-500'" />
            {{ item.label }}
          </a>
        }
      </nav>

      <!-- Status -->
      <div class="border-t border-slate-700/50 px-5 py-4">
        <div class="flex items-center gap-2.5">
          <span class="h-2 w-2 rounded-full flex-shrink-0" [class]="statusDot"></span>
          <span class="text-xs text-slate-400">{{ statusLabel }}</span>
        </div>
        <p class="mt-1 text-[10px] text-slate-600">GPT-3.5 Turbo · Claude Haiku</p>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  online: boolean | null = null;

  readonly navItems: NavItem[] = [
    { path: '/', icon: 'layout-dashboard', label: 'Dashboard', exact: true },
    { path: '/triage', icon: 'zap', label: 'New Triage', exact: false },
    { path: '/knowledge-base', icon: 'book-open', label: 'Knowledge Base', exact: false },
  ];

  ngOnInit() {
    this.checkHealth();
    this.intervalId = setInterval(() => this.checkHealth(), 30_000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async checkHealth() {
    try {
      await this.apiService.getHealth();
      this.online = true;
    } catch {
      this.online = false;
    }
  }

  get statusDot(): string {
    return this.online === null ? 'bg-slate-500'
         : this.online ? 'bg-emerald-400'
         : 'bg-red-400';
  }

  get statusLabel(): string {
    return this.online === null ? 'Checking…'
         : this.online ? 'Backend online'
         : 'Backend offline';
  }

  linkClass(isActive: boolean): string {
    const base = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150';
    return isActive
      ? `${base} bg-blue-600/20 text-blue-400`
      : `${base} text-slate-400 hover:bg-slate-800 hover:text-slate-200`;
  }
}
