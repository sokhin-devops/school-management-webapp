import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Material from '@primeng/themes/material';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideAnimationsAsync(),
  providePrimeNG({
    // Overlays are appended to <body> so a dropdown opened inside a scrolling
    // pane (every Settings page) is not clipped by that pane's overflow.
    overlayOptions: { appendTo: 'body' },
    theme: {
      preset: Material,
      options: {
        darkModeSelector: '.app-dark',
      }
    }
  }),
    ConfirmationService,
    MessageService]
};
