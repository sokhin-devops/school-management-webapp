import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { QuickAddAction, QuickAddService } from '../../../core/services/quick-add.service';

/**
 * Start a new record of any kind, from any page.
 *
 * Alt plus the entry's letter opens that form directly, without going through
 * the menu first; Ctrl+K opens the menu for when the letter has been forgotten,
 * and a bare letter works while the menu is open.
 */
@Component({
  selector: 'app-k-quick-add',
  imports: [ButtonModule, PopoverModule, TooltipModule],
  templateUrl: './k-quick-add.component.html',
  styleUrl: './k-quick-add.component.scss',
})
export class KQuickAddComponent {
  protected readonly quickAdd = inject(QuickAddService);

  // `read: ElementRef` is the point: a template reference on a PrimeNG component
  // resolves to the component instance, which has no nativeElement.
  private readonly trigger = viewChild.required('trigger', { read: ElementRef });

  protected readonly isOpen = signal(false);

  protected run(action: QuickAddAction, popover: { hide: () => void }): void {
    popover.hide();
    this.quickAdd.request(action);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    // A form already has the screen, and it is full of fields to type into.
    if (this.isDialogOpen() || event.repeat) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      // The browser binds Ctrl+K to its own search box, so this has to claim it.
      event.preventDefault();
      this.clickTrigger();
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Alt+letter anywhere, or a bare letter while the menu is open, where there
    // is nothing else the keystroke could mean.
    const armed = event.altKey || this.isOpen();
    if (!armed) {
      return;
    }

    // A bare letter is a character wherever text is being entered; Alt+letter is
    // not, so it stays live inside the search boxes and filters.
    if (!event.altKey && this.isTyping(event.target)) {
      return;
    }

    const letter = letterOf(event);
    const action = letter ? this.quickAdd.byKey(letter) : undefined;
    if (!action) {
      return;
    }

    // Several of these letters are browser menu accelerators (Alt+E, Alt+F);
    // claiming the event is what keeps those menus shut.
    event.preventDefault();
    if (this.isOpen()) {
      this.clickTrigger();
    }
    this.quickAdd.request(action);
  }

  /** True wherever the keystroke is more likely to be a character than a command. */
  private isTyping(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) {
      return false;
    }
    return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }

  private isDialogOpen(): boolean {
    return document.querySelector('.p-dialog-mask') !== null;
  }

  /**
   * Opens and closes through a real click on the button, so the popover anchors
   * itself the same way whether it was reached by mouse or by keyboard.
   */
  private clickTrigger(): void {
    const host = this.trigger().nativeElement as HTMLElement;
    host.querySelector('button')?.click();
  }
}

/**
 * The letter a keystroke stands for.
 *
 * The physical key comes first because Alt composes a different character on
 * macOS — Alt+S arrives as 'ß' — which would leave every shortcut dead there.
 */
function letterOf(event: KeyboardEvent): string | null {
  const physical = /^Key([A-Z])$/.exec(event.code);
  if (physical) {
    return physical[1];
  }
  return event.key.length === 1 ? event.key.toUpperCase() : null;
}
