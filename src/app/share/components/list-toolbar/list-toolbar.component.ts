import { Component, model, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

/**
 * The bar above a record list: a search box the toolbar owns, plus two slots the
 * page fills — `k-filters` on the left and `k-actions` on the right.
 *
 * Search is a `model()`, so a page binds it with `[(search)]` and keeps the
 * filtering itself; the toolbar never decides what a term means.
 */
@Component({
  selector: 'k-list-toolbar',
  imports: [FormsModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './list-toolbar.component.html',
  styleUrl: './list-toolbar.component.scss',
})
export class ListToolbarComponent {
  readonly search = model<string>('');
  readonly searchPlaceholder = input<string>('Search…');
  readonly searchLabel = input<string>('Search');
}
