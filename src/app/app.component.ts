import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-100">
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
export class AppComponent {}
