import { Component, inject } from '@angular/core';
import { AppLoadingService } from '../../../core/services/app-loading.service';

/**
 * The circular indicator shown while the app itself is busy — starting up,
 * signing in, switching branch.
 *
 * Kept for whole-app waits only. A list fetching its own rows shows skeletons
 * instead: an overlay that blocks the screen for something happening inside one
 * panel takes the page away for no reason.
 *
 * Drawn rather than taken from p-progressspinner, because that one animates its
 * stroke colour through four hues on a loop, which does not belong in a themed
 * app whose accent is a single colour.
 */
@Component({
  selector: 'k-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrl: './app-loader.component.scss',
})
export class AppLoaderComponent {
  protected readonly loading = inject(AppLoadingService);
}
