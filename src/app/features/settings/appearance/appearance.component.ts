import { Component } from '@angular/core';
import { KShareModule } from '../../../share/k-share.module';
import { ThemeSwitcherComponent } from "../../../share/components/theme-switcher/theme-switcher.component";

@Component({
  selector: 'app-appearance',
  imports: [KShareModule, ThemeSwitcherComponent],
  templateUrl: './appearance.component.html',
  styleUrl: './appearance.component.scss'
})
export class AppearanceComponent {

}
