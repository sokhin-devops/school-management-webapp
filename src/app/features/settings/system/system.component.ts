import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { SettingsSectionComponent } from '../../../share/components';
import { CanDirective } from '../../../share/directives/can.directive';
import { SystemInfo, SystemService } from '../../../core/services/system.service';
import { PermissionService } from '../../../core/services/permission.service';
import { SchoolService } from '../../../core/services/school.service';
import { describeFailure } from '../../../core/api/api-failure';

/**
 * 69-system-settings.md — platform-level configuration, kept out of School and
 * Academic settings, and deliberately small for the first release: what is
 * running, maintenance, and the operations that act on the whole school.
 */
@Component({
  selector: 'app-system-settings',
  imports: [
    CanDirective,
    DatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    SkeletonModule,
    ToggleSwitchModule,
    SettingsSectionComponent,
  ],
  templateUrl: './system.component.html',
  styleUrl: './system.component.scss',
})
export class SystemSettingsComponent {
  private readonly system = inject(SystemService);
  private readonly messages = inject(MessageService);
  protected readonly permissions = inject(PermissionService);
  private readonly schoolService = inject(SchoolService);

  protected readonly info = signal<SystemInfo | null>(null);

  protected readonly maintenanceMode = signal(false);
  private readonly savedMaintenance = signal(false);
  protected readonly maintenanceChanged = computed(() => this.maintenanceMode() !== this.savedMaintenance());
  protected readonly savingMaintenance = signal(false);

  protected readonly exporting = signal(false);

  protected readonly deleteVisible = signal(false);
  protected readonly deleteTyped = signal('');
  protected readonly deleting = signal(false);
  protected readonly deleteResult = signal<number | null>(null);
  protected readonly schoolName = computed(() => this.schoolService.school()?.name ?? '');
  /** The button unlocks only once the school's name has been typed - as the server will check. */
  protected readonly deleteConfirmed = computed(
    () => !!this.schoolName() && this.deleteTyped().trim().toLowerCase() === this.schoolName().trim().toLowerCase(),
  );

  constructor() {
    this.schoolService.ensureLoaded();
    this.system.info().subscribe({ next: (info) => this.info.set(info), error: () => undefined });
    this.system.maintenance().subscribe({
      next: (state) => {
        this.maintenanceMode.set(state.maintenanceMode);
        this.savedMaintenance.set(state.maintenanceMode);
      },
      error: () => undefined,
    });
  }

  protected saveMaintenance(): void {
    this.savingMaintenance.set(true);
    this.system.setMaintenance(this.maintenanceMode()).subscribe({
      next: (state) => {
        this.savingMaintenance.set(false);
        this.savedMaintenance.set(state.maintenanceMode);
        this.messages.add({
          severity: state.maintenanceMode ? 'warn' : 'success',
          summary: state.maintenanceMode ? 'Maintenance mode is on' : 'Maintenance mode is off',
          detail: state.maintenanceMode ? 'Only owners can sign in until it is turned off.' : 'Everyone can sign in again.',
          life: 5000,
        });
      },
      error: (failure: unknown) => {
        this.savingMaintenance.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not save', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  protected exportAll(): void {
    this.exporting.set(true);
    this.system.export().subscribe({
      next: (file) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `school-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (failure: unknown) => {
        this.exporting.set(false);
        this.messages.add({ severity: 'error', summary: 'Could not export', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  protected openDelete(): void {
    this.deleteTyped.set('');
    this.deleteResult.set(null);
    this.deleteVisible.set(true);
  }

  protected confirmDelete(): void {
    if (!this.deleteConfirmed() || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.system.deleteAllData(this.deleteTyped()).subscribe({
      next: (counts) => {
        this.deleting.set(false);
        this.deleteResult.set(Object.values(counts ?? {}).reduce((sum, count) => sum + count, 0));
      },
      error: (failure: unknown) => {
        this.deleting.set(false);
        this.messages.add({ severity: 'error', summary: 'Nothing was deleted', detail: describeFailure(failure), life: 6000 });
      },
    });
  }

  /**
   * Every list in the app holds what it last loaded; after emptying the school
   * the simplest honest state is a fresh start.
   */
  protected finishDelete(): void {
    window.location.assign('/dashboard');
  }
}
