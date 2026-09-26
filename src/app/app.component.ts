import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from './core/services/theme.service';
// Imported from their own files, not the share/components barrel: this is the
// one eagerly loaded component, and importing the barrel here put every shared
// component - dialogs, drawer, cards - into the first download.
import { AppLoaderComponent } from './share/components/app-loader/app-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, AppLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.loadConfig();
    });
  }
}
