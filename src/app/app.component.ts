import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from './core/services/theme.service';
import { AppLoaderComponent } from './share/components';

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
