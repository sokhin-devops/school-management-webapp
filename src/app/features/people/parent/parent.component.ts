import { Component } from '@angular/core';
import { KShareModule } from '../../../share/k-share.module';

@Component({
  selector: 'app-parent',
  imports: [KShareModule],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss'
})
export class ParentComponent {

}
