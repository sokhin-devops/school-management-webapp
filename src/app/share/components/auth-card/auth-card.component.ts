import { Component, Input } from '@angular/core';
import { KShareModule } from '../../k-share.module';

@Component({
  selector: 'app-auth-card',
  imports: [KShareModule],
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss',
})
export class AuthCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() maxWidth = '440px';
}
