import { Directive, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input } from '@angular/core';

const MIN_THUMB = 28;
const EDGE_GAP = 3;
/** How long the bar stays visible after the last scroll event. */
const FADE_AFTER = 900;

/**
 * How much of the scroller's top is occupied by a header that does not scroll.
 * Read live rather than cached: the header is sticky only while the table is in
 * PrimeNG's scrollable mode, and the card view has none at all.
 */
function stickyHeaderHeight(scroller: HTMLElement): number {
  const header = scroller.querySelector<HTMLElement>('thead');
  if (!header) {
    return 0;
  }
  const cell = header.querySelector<HTMLElement>('th');
  const sticky = cell ? getComputedStyle(cell).position === 'sticky' : false;
  return sticky ? header.offsetHeight : 0;
}

/** A mutation that added or removed nothing but floating-scroll thumbs. */
function isOwnThumbs(record: MutationRecord): boolean {
  const nodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
  return (
    nodes.length > 0 &&
    nodes.every((node) => node instanceof HTMLElement && node.classList.contains('k-fscroll-thumb'))
  );
}

interface Managed {
  readonly scroller: HTMLElement;
  readonly track: HTMLElement;
  readonly thumbY: HTMLElement;
  readonly thumbX: HTMLElement;
  readonly dispose: () => void;
}

/**
 * Gives descendant scrollers a floating scrollbar.
 *
 * A native desktop scrollbar cannot be made to float — restyling it with
 * `scrollbar-width` or `::-webkit-scrollbar` changes how it looks but it still
 * reserves a column of layout width and squeezes the content. Measured in real
 * Chrome that is 10px off every table. So the native bar is hidden and a thumb
 * is drawn over the padding instead, leaving the content its full width.
 *
 * Applied once on a container (the list shell) rather than on each scroller, so
 * pages do not have to remember it, and re-scans when content changes because
 * the table that scrolls is created by PrimeNG well after this runs.
 */
@Directive({ selector: '[kFloatingScroll]' })
export class FloatingScrollDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  /** Selector for the scrolling elements inside the host. */
  readonly within = input<string>('', { alias: 'kFloatingScroll' });

  private readonly managed = new Map<HTMLElement, Managed>();
  private mutations?: MutationObserver;
  private hostSize?: ResizeObserver;

  constructor() {
    afterNextRender(() => {
      this.zone.runOutsideAngular(() => {
        this.scan();
        // PrimeNG creates and destroys the scroll container as the view switches
        // between table and card layouts, and as pages come and go.
        // Mutations that are only this directive adding or removing its own
        // thumbs change nothing worth scanning for, and reacting to them is
        // how a scan ends up triggering itself.
        this.mutations = new MutationObserver((records) => {
          if (records.some((record) => !isOwnThumbs(record))) {
            this.scan();
          }
        });
        this.mutations.observe(this.host, { childList: true, subtree: true });
        // A tab brought back puts the host on the page again without a single
        // mutation inside it; its size changing from nothing is the signal.
        this.hostSize = new ResizeObserver(() => this.scan());
        this.hostSize.observe(this.host);
      });
    });
  }

  ngOnDestroy(): void {
    this.mutations?.disconnect();
    this.hostSize?.disconnect();
    this.managed.forEach((entry) => entry.dispose());
    this.managed.clear();
  }

  private scan(): void {
    // A host taken out of the document - the view of an inactive tab stays alive
    // but loses its place on the page - has nothing to measure. Scanning it used
    // to be an infinite loop: off the page every element reads as disconnected,
    // so each scan disposed its scroller and attached it again, and attaching
    // is itself a mutation that fires the next scan. That is what froze Users &
    // Roles, the one page with a list shell in each of two tabs. The entries are
    // kept, so everything is in place when the tab comes back.
    if (!this.host.isConnected) {
      return;
    }

    const selector = this.within();
    const found = selector ? Array.from(this.host.querySelectorAll<HTMLElement>(selector)) : [this.host];

    for (const [element, entry] of this.managed) {
      if (!this.host.contains(element) || !found.includes(element)) {
        entry.dispose();
        this.managed.delete(element);
      }
    }

    for (const scroller of found) {
      if (!this.managed.has(scroller)) {
        this.managed.set(scroller, this.attach(scroller));
      }
    }
  }

  private attach(scroller: HTMLElement): Managed {
    // The thumb cannot live inside the scroller — an absolutely positioned child
    // of a scroll container scrolls away with the content. It goes in the parent,
    // which is made a positioning context for it.
    const track = scroller.parentElement ?? this.host;
    track.classList.add('k-fscroll-track');
    scroller.classList.add('k-fscroll-host');

    const thumbY = document.createElement('span');
    thumbY.className = 'k-fscroll-thumb k-fscroll-thumb-y';
    const thumbX = document.createElement('span');
    thumbX.className = 'k-fscroll-thumb k-fscroll-thumb-x';
    track.append(thumbY, thumbX);

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const wake = () => {
      track.classList.add('k-fscroll-active');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => track.classList.remove('k-fscroll-active'), FADE_AFTER);
    };

    const update = () => {
      const { clientHeight: ch, scrollHeight: sh, clientWidth: cw, scrollWidth: sw } = scroller;

      // A sticky header stays put while the rows move under it, so the bar
      // belongs beside the rows only — running it up behind the header would
      // imply the header scrolls too.
      const inset = stickyHeaderHeight(scroller);
      const trackH = ch - inset;

      const canY = sh - ch > 1 && trackH > MIN_THUMB;
      thumbY.style.display = canY ? '' : 'none';
      if (canY) {
        const height = Math.max(MIN_THUMB, (ch / sh) * trackH);
        const offset = (scroller.scrollTop / (sh - ch)) * (trackH - height);
        thumbY.style.height = `${height}px`;
        thumbY.style.top = `${scroller.offsetTop + inset}px`;
        thumbY.style.left = `${scroller.offsetLeft + cw - EDGE_GAP - 6}px`;
        thumbY.style.transform = `translateY(${offset}px)`;
      }

      const canX = sw - cw > 1;
      thumbX.style.display = canX ? '' : 'none';
      if (canX) {
        const width = Math.max(MIN_THUMB, (cw / sw) * cw);
        const offset = (scroller.scrollLeft / (sw - cw)) * (cw - width);
        thumbX.style.width = `${width}px`;
        thumbX.style.left = `${scroller.offsetLeft}px`;
        thumbX.style.top = `${scroller.offsetTop + ch - EDGE_GAP - 6}px`;
        thumbX.style.transform = `translateX(${offset}px)`;
      }
    };

    const onScroll = () => {
      update();
      wake();
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });

    const resize = new ResizeObserver(update);
    resize.observe(scroller);
    if (scroller.firstElementChild) {
      resize.observe(scroller.firstElementChild);
    }

    const dragY = this.makeDraggable(thumbY, scroller, 'y', update, wake);
    const dragX = this.makeDraggable(thumbX, scroller, 'x', update, wake);

    update();

    return {
      scroller,
      track,
      thumbY,
      thumbX,
      dispose: () => {
        clearTimeout(fadeTimer);
        scroller.removeEventListener('scroll', onScroll);
        resize.disconnect();
        dragY();
        dragX();
        thumbY.remove();
        thumbX.remove();
        scroller.classList.remove('k-fscroll-host');
        track.classList.remove('k-fscroll-track', 'k-fscroll-active');
      },
    };
  }

  /** Lets the thumb be dragged, which is the half people notice is missing. */
  private makeDraggable(
    thumb: HTMLElement,
    scroller: HTMLElement,
    axis: 'x' | 'y',
    update: () => void,
    wake: () => void,
  ): () => void {
    let start = 0;
    let startScroll = 0;

    const onMove = (event: PointerEvent) => {
      const vertical = axis === 'y';
      const travelled = (vertical ? event.clientY : event.clientX) - start;
      const client = vertical
        ? scroller.clientHeight - stickyHeaderHeight(scroller)
        : scroller.clientWidth;
      const scroll = vertical ? scroller.scrollHeight : scroller.scrollWidth;
      const thumbSize = vertical ? thumb.offsetHeight : thumb.offsetWidth;
      const room = client - thumbSize;
      if (room <= 0) {
        return;
      }

      const viewport = vertical ? scroller.clientHeight : scroller.clientWidth;
      const next = startScroll + (travelled / room) * (scroll - viewport);
      if (vertical) {
        scroller.scrollTop = next;
      } else {
        scroller.scrollLeft = next;
      }
      update();
      wake();
    };

    const onUp = (event: PointerEvent) => {
      thumb.releasePointerCapture?.(event.pointerId);
      thumb.classList.remove('k-fscroll-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      start = axis === 'y' ? event.clientY : event.clientX;
      startScroll = axis === 'y' ? scroller.scrollTop : scroller.scrollLeft;
      thumb.setPointerCapture?.(event.pointerId);
      thumb.classList.add('k-fscroll-dragging');
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    thumb.addEventListener('pointerdown', onDown);
    return () => {
      thumb.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }
}
