import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-coming-soon',
  imports: [CardModule],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss',
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title: string = this.route.snapshot.data['title'] ?? 'This page';
}
