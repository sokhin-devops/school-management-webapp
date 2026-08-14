import { Component } from '@angular/core';
import { KShareModule } from '../../share/k-share.module';

interface StatTile {
  label: string;
  value: string;
  icon: string;
}

interface ActivityItem {
  icon: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [KShareModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly statTiles: StatTile[] = [
    { label: 'Students', value: '342', icon: 'pi-graduation-cap' },
    { label: 'Teachers / Staff', value: '28', icon: 'pi-id-card' },
    { label: 'Classes', value: '14', icon: 'pi-th-large' },
    { label: 'Attendance today', value: '96%', icon: 'pi-calendar-clock' },
    { label: 'Active academic year', value: '2026 - 2027', icon: 'pi-calendar' },
    { label: 'Outstanding fees', value: '$4,250', icon: 'pi-wallet' },
  ];

  readonly notifications: ActivityItem[] = [
    { icon: 'pi-graduation-cap', message: 'New student registration submitted', time: '2h ago' },
    { icon: 'pi-wallet', message: 'Fee payment received', time: '5h ago' },
    { icon: 'pi-calendar', message: 'New academic year created', time: '1d ago' },
  ];

  readonly recentActivity: ActivityItem[] = [
    { icon: 'pi-user', message: 'Admin invited a new teacher', time: '3h ago' },
    { icon: 'pi-building', message: 'Branch details were updated', time: '1d ago' },
    { icon: 'pi-calendar', message: 'Academic year "2026 - 2027" was created', time: '2d ago' },
  ];
}
