import { Component, computed, inject, signal } from '@angular/core';
import type { ChartData, ChartOptions, ScriptableContext, TooltipItem } from 'chart.js';
import { RouterLink } from '@angular/router';
import { KShareModule } from '../../share/k-share.module';
import { ChartThemeService, withAlpha, type ChartTheme } from '../../core/services/chart-theme.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ApiDashboardSummary } from '../../core/api/api.models';
import { StudentService } from '../../core/services/student.service';
import { ClassGroupService } from '../../core/services/class-group.service';
import { ProgramService } from '../../core/services/program.service';
import { LevelService } from '../../core/services/level.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { AcademicSettingsService, plural } from '../../core/services/academic-settings.service';
import { AppNotification, NotificationService } from '../../core/services/notification.service';
import { AuditEntry, SecuritySettingsService } from '../../core/services/security-settings.service';
import { PermissionService } from '../../core/services/permission.service';
import { money } from '../../share/data/format';

type Tone = 'info' | 'success' | 'warning';
type Severity = 'ok' | 'warning' | 'critical';

interface StatTile {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  /** What the figure counts, under it. */
  readonly note: string;
}

interface Program {
  readonly name: string;
  readonly students: number;
}

interface ClassCapacity {
  readonly name: string;
  readonly enrolled: number;
  readonly capacity: number;
}

interface NotificationItem {
  readonly icon: string;
  readonly tone: Tone;
  readonly message: string;
  readonly time: string;
}

interface ActivityItem {
  readonly actor: string;
  readonly initials: string;
  readonly action: string;
  readonly time: string;
}

/** The line the attendance chart measures against. */
const ATTENDANCE_TARGET = 95;

/** How many slices the student ring shows before folding the rest into "Other". */
const MIX_SLICES = 5;

/** What each notification looks like in the feed, by the event that raised it. */
const EVENT_LOOK: Readonly<Record<string, { icon: string; tone: Tone }>> = {
  student_enrolled: { icon: 'pi-user-plus', tone: 'info' },
  payment_received: { icon: 'pi-check-circle', tone: 'success' },
  expense_submitted: { icon: 'pi-receipt', tone: 'warning' },
  attendance_submitted: { icon: 'pi-calendar', tone: 'info' },
  grades_published: { icon: 'pi-chart-bar', tone: 'success' },
  year_rolled_over: { icon: 'pi-calendar-plus', tone: 'info' },
  staff_changed: { icon: 'pi-id-card', tone: 'info' },
  user_invited: { icon: 'pi-send', tone: 'info' },
  role_changed: { icon: 'pi-lock', tone: 'warning' },
  new_device_sign_in: { icon: 'pi-shield', tone: 'warning' },
  maintenance: { icon: 'pi-wrench', tone: 'warning' },
};

/** The audit log's actions, as a sentence after the actor's name. */
const ACTIVITY_WORDS: Readonly<Record<string, string>> = {
  SIGNED_IN: 'signed in',
  SIGN_IN_FAILED: 'had a failed sign-in attempt',
  SIGNED_OUT: 'signed out',
  PASSWORD_RESET: 'reset their password',
  SESSION_REVOKED: 'signed a session out',
  USER_INVITED: 'invited a user',
  USER_UPDATED: "changed a user's access",
  USER_REMOVED: 'removed a user',
  ROLE_CREATED: 'created a role',
  ROLE_UPDATED: 'changed a role',
  ROLE_DELETED: 'deleted a role',
  SECURITY_SETTINGS_CHANGED: 'changed the security settings',
  ACADEMIC_SETTINGS_CHANGED: 'changed the academic settings',
  SYSTEM_SETTINGS_CHANGED: 'changed the system settings',
  MAINTENANCE_MODE_CHANGED: 'changed maintenance mode',
  DATA_EXPORTED: 'exported all data',
  DATA_DELETED: 'deleted all school data',
  PLAN_CHANGED: 'changed the plan',
  PLAN_CANCELED: 'cancelled the plan',
};

/** "Just now", "12 min ago", "3 h ago", "Yesterday", then the date. */
function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

@Component({
  selector: 'app-dashboard',
  imports: [KShareModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly chartTheme = inject(ChartThemeService);
  protected readonly dashboard = inject(DashboardService);

  private readonly students = inject(StudentService);
  private readonly classes = inject(ClassGroupService);
  private readonly programs = inject(ProgramService);
  private readonly levels = inject(LevelService);
  private readonly branchContext = inject(BranchContextService);
  private readonly academic = inject(AcademicSettingsService);
  private readonly bell = inject(NotificationService);
  private readonly security = inject(SecuritySettingsService);
  protected readonly permissions = inject(PermissionService);

  /** The feed under the bell, as the dashboard shows it: the latest five. */
  protected readonly notifications = computed(() =>
    this.bell.items().slice(0, 5).map((item: AppNotification) => ({
      ...(EVENT_LOOK[item.eventKey] ?? { icon: 'pi-bell', tone: 'info' as Tone }),
      message: item.message ? `${item.title} — ${item.message}` : item.title,
      time: timeAgo(item.createdAt),
      link: item.link,
      read: item.read,
    })),
  );

  /** Only those who can see Settings can read the audit log it comes from. */
  protected readonly canSeeActivity = computed(() => this.permissions.canView('settings'));
  protected readonly hasFinance = computed(() => this.permissions.planIncludes('FINANCE'));
  private readonly audit = signal<AuditEntry[]>([]);
  protected readonly recentActivity = computed(() =>
    this.audit().map((entry) => ({
      actor: entry.actorName,
      initials: initialsOf(entry.actorName),
      action: ACTIVITY_WORDS[entry.action] ?? entry.action.toLowerCase().replace(/_/g, ' '),
      time: timeAgo(entry.occurredAt),
    })),
  );

  constructor() {
    this.permissions.ensureLoaded().subscribe(() => {
      if (this.canSeeActivity()) {
        this.security.audit(6).subscribe({ next: (entries) => this.audit.set(entries ?? []), error: () => undefined });
      }
    });
  }

  /** The branch on screen's students - the dashboard is for one branch. */
  private readonly branchStudents = computed(() => {
    const branchId = this.branchContext.selectedBranch()?.id;
    return this.students.students().filter((student) => !branchId || student.branchIds.includes(branchId));
  });

  private readonly enrolledByClass = computed(() => {
    const counts = new Map<string, number>();
    for (const student of this.branchStudents()) {
      if (student.classGroupId) {
        counts.set(student.classGroupId, (counts.get(student.classGroupId) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected readonly tiles = computed(() => {
    const summary = this.dashboard.summary();

    // Money tiles only where the plan includes Finance: a Starter school has no
    // fees or payments to count, and two tiles of zero would read as a bad month.
    const finance = this.permissions.planIncludes('FINANCE');
    return this.headlineTiles(summary)
      .filter((tile) => finance || (tile.key !== 'collected' && tile.key !== 'spent'));
  });

  /**
   * The six headline figures, all from the server's one summary call. None
   * carries a trend: the API reports this month, not a history to compare it
   * with, and an arrow drawn against nothing would be decoration.
   */
  private headlineTiles(summary: ApiDashboardSummary | null): StatTile[] {
    const attendance = summary?.attendanceToday;

    return [
      {
        key: 'students',
        label: 'Students',
        value: format(summary?.students),
        icon: 'pi-graduation-cap',
        note: 'On the roster',
      },
      {
        key: 'staff',
        label: 'Teachers & staff',
        value: format(summary?.teachers),
        icon: 'pi-id-card',
        note: 'Teaching staff',
      },
      {
        key: 'classes',
        label: 'Classes',
        value: format(summary?.classes),
        icon: 'pi-th-large',
        note: 'Running this year',
      },
      {
        key: 'attendance',
        label: 'Attendance today',
        value: attendance?.percent == null ? '—' : `${attendance.percent}%`,
        icon: 'pi-calendar-clock',
        // Nothing marked is not the same as nobody present, so it says so.
        note: attendance?.marked ? `${attendance.present} of ${attendance.marked} marked` : 'Not taken yet',
      },
      {
        key: 'collected',
        label: 'Collected this month',
        value: money(summary?.collectedThisMonth ?? 0),
        icon: 'pi-wallet',
        note: 'Payments received',
      },
      {
        key: 'spent',
        label: 'Spent this month',
        value: money(summary?.spentThisMonth ?? 0),
        icon: 'pi-receipt',
        note: 'Expenses paid',
      },
    ];
  }

  /**
   * The two series the summary carries, as the charts want them.
   *
   * Days with no register are absent from the API's answer rather than reported
   * as zero percent — a weekend nobody marked is not a day everybody missed — so
   * the labels come from the rows that exist rather than from a fixed window.
   */
  private readonly attendanceSeries = computed(() => {
    const trend = this.dashboard.summary()?.attendanceTrend ?? [];
    return {
      labels: trend.map((point) => shortDay(point.date)),
      values: trend.map((point) => point.percent ?? 0),
    };
  });

  private readonly collectionSeries = computed(() => {
    const trend = this.dashboard.summary()?.collectionTrend ?? [];
    return {
      labels: trend.map((point) => shortMonth(point.month)),
      collected: trend.map((point) => point.collected),
      spent: trend.map((point) => point.spent),
    };
  });

  // --- Attendance --------------------------------------------------------

  protected readonly attendanceLatest = computed(() => {
    const values = this.attendanceSeries().values;
    return values.length ? values[values.length - 1] : null;
  });

  protected readonly attendanceData = computed<ChartData<'line'>>(() => {
    const theme = this.chartTheme.theme();
    const series = this.attendanceSeries();
    const latest = series.values.length - 1;

    return {
      labels: series.labels,
      datasets: [
        {
          label: 'Attendance',
          data: [...series.values],
          borderColor: theme.primary,
          backgroundColor: withAlpha(theme.primary, 0.1),
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          // Only the latest reading is marked. A dot on every day restates the
          // line without adding a value the axis doesn't already carry.
          pointRadius: (ctx: ScriptableContext<'line'>) => (ctx.dataIndex === latest ? 4.5 : 0),
          pointBackgroundColor: theme.primary,
          // A ring in the surface colour keeps the marker readable where it sits
          // on top of the line.
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
          pointHoverRadius: 5,
          pointHoverBorderColor: theme.surface,
          pointHitRadius: 24,
        },
        {
          label: `Target ${ATTENDANCE_TARGET}%`,
          data: series.values.map(() => ATTENDANCE_TARGET),
          borderColor: theme.muted,
          borderWidth: 1.5,
          borderDash: [4, 4],
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHitRadius: 0,
        },
      ],
    };
  });

  protected readonly attendanceOptions = computed<ChartOptions<'line'>>(() => {
    const theme = this.chartTheme.theme();

    return {
      maintainAspectRatio: false,
      // The reader aims at a day, never at a 2px line.
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            boxWidth: 20,
            boxHeight: 2,
            padding: 16,
            color: theme.muted,
            font: { size: 12 },
          },
        },
        tooltip: {
          ...tooltipStyle(theme),
          callbacks: {
            label: (item: TooltipItem<'line'>) => ` ${item.parsed.y}%   ${item.dataset.label}`,
            labelPointStyle: () => ({ pointStyle: 'line' as const, rotation: 0 }),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: theme.grid },
          ticks: { color: theme.muted, font: { size: 12 } },
        },
        y: {
          // A floor that still shows a bad day, rather than clipping it off.
          suggestedMin: 80,
          max: 100,
          grid: { color: theme.grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: theme.muted,
            font: { size: 12 },
            stepSize: 5,
            callback: (value) => `${value}%`,
          },
        },
      },
    };
  });

  // --- Students by program ------------------------------------------------

  /**
   * How the branch's students divide: by program where the school uses them,
   * by level where it does not, and by class where it uses neither. Students
   * not yet placed in a class are a slice of their own.
   */
  protected readonly mix = computed(() => {
    const settings = this.academic.settings();
    const classes = new Map(this.classes.classes().map((group) => [group.id, group]));
    const programs = new Map(this.programs.programs().map((program) => [program.id, program.name]));
    const levels = new Map(this.levels.levels().map((level) => [level.id, level.name]));

    const by: 'program' | 'level' | 'class' = settings.usePrograms && programs.size
      ? 'program'
      : settings.useLevels && levels.size
        ? 'level'
        : 'class';

    const counts = new Map<string, number>();
    for (const student of this.branchStudents()) {
      const group = student.classGroupId ? classes.get(student.classGroupId) : undefined;
      let name: string;
      if (!group) {
        name = 'Not placed';
      } else if (by === 'program') {
        name = (group.programId && programs.get(group.programId)) || 'No program';
      } else if (by === 'level') {
        name = (group.levelId && levels.get(group.levelId)) || `No ${settings.levelLabel.toLowerCase()}`;
      } else {
        name = group.name;
      }
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const shown = sorted.slice(0, MIX_SLICES);
    const rest = sorted.slice(MIX_SLICES).reduce((sum, [, count]) => sum + count, 0);
    if (rest) {
      shown.push(['Other', rest]);
    }

    const title = by === 'program' ? 'program' : by === 'level' ? settings.levelLabel.toLowerCase() : settings.classLabel.toLowerCase();
    return {
      title: `${plural(settings.studentLabel)} by ${title}`,
      slices: shown.map(([name, students]) => ({ name, students })),
    };
  });

  protected readonly totalStudents = computed(() => this.branchStudents().length);

  /** The ring's legend and its table view at once — every slice's value is here. */
  protected readonly programBreakdown = computed(() => {
    const theme = this.chartTheme.theme();
    const total = this.totalStudents();

    return this.mix().slices.map((slice, index) => ({
      ...slice,
      color: theme.categorical[index % theme.categorical.length],
      share: total ? Math.round((slice.students / total) * 100) : 0,
    }));
  });

  protected readonly programData = computed<ChartData<'doughnut'>>(() => {
    const theme = this.chartTheme.theme();
    const slices = this.mix().slices;

    return {
      labels: slices.map((slice) => slice.name),
      datasets: [
        {
          data: slices.map((slice) => slice.students),
          backgroundColor: [...theme.categorical],
          // Painted in the surface colour this reads as a gap between segments;
          // a stroke in any other colour would be ink that isn't data.
          borderColor: theme.surface,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  });

  protected readonly programOptions = computed<ChartOptions<'doughnut'>>(() => {
    const theme = this.chartTheme.theme();

    return {
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        // Identity lives in the list beside the ring, which carries the values too.
        legend: { display: false },
        tooltip: {
          ...tooltipStyle(theme),
          callbacks: {
            label: (item: TooltipItem<'doughnut'>) => ` ${item.parsed} students   ${item.label}`,
          },
        },
      },
    };
  });

  // --- Fee collection -----------------------------------------------------

  /**
   * Collected against spent, for the month on the right of the chart.
   *
   * It used to read billed / collected / outstanding. The server counts money
   * received and money paid out; what was *billed* would need the fees due
   * across every student, which nothing computes yet — so the panel says what
   * is known rather than dividing by a number that was invented.
   */
  protected readonly feeSummary = computed(() => {
    const series = this.collectionSeries();
    const last = series.collected.length - 1;
    const collected = last >= 0 ? series.collected[last] : 0;
    const spent = last >= 0 ? series.spent[last] : 0;

    return {
      collected: money(collected),
      spent: money(spent),
      net: money(collected - spent),
      positive: collected - spent >= 0,
    };
  });

  protected readonly feeData = computed<ChartData<'bar'>>(() => {
    const theme = this.chartTheme.theme();
    const series = this.collectionSeries();

    return {
      labels: series.labels,
      datasets: [
        {
          label: 'Collected',
          data: [...series.collected],
          backgroundColor: theme.categorical[0],
          maxBarThickness: 24,
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
        },
        {
          // What went out beside what came in: the server counts both, and
          // "outstanding" would need fees billed per student, which nothing
          // issues yet.
          label: 'Spent',
          data: [...series.spent],
          backgroundColor: theme.categorical[1],
          maxBarThickness: 24,
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
        },
      ],
    };
  });

  protected readonly feeOptions = computed<ChartOptions<'bar'>>(() => {
    const theme = this.chartTheme.theme();

    return {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 10,
            boxHeight: 10,
            padding: 16,
            color: theme.muted,
            font: { size: 12 },
          },
        },
        tooltip: {
          ...tooltipStyle(theme),
          callbacks: {
            label: (item: TooltipItem<'bar'>) => ` ${money(item.parsed.y ?? 0)}   ${item.dataset.label}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: theme.grid },
          ticks: { color: theme.muted, font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: theme.muted,
            font: { size: 12 },
            callback: (value) => compactMoney(Number(value)),
          },
        },
      },
    };
  });

  // --- Class capacity -----------------------------------------------------

  /** The branch's fullest classes, counted from the students placed in them. */
  protected readonly classCapacity = computed(() => {
    const enrolled = this.enrolledByClass();
    const branchId = this.branchContext.selectedBranch()?.id;
    return this.classes
      .classes()
      .filter((group) => (!branchId || group.branchId === branchId) && (group.capacity ?? 0) > 0)
      .map((group) => {
        const count = enrolled.get(group.id) ?? 0;
        const capacity = group.capacity ?? 0;
        const percent = Math.round((count / capacity) * 100);
        return {
          name: group.name,
          enrolled: count,
          capacity,
          percent: Math.min(percent, 100),
          severity: (percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : 'ok') satisfies Severity as Severity,
          full: percent >= 100,
        };
      })
      .sort((a, b) => b.percent - a.percent || b.enrolled - a.enrolled)
      .slice(0, 5);
  });

  protected readonly classCount = computed(() => {
    const branchId = this.branchContext.selectedBranch()?.id;
    return this.classes.classes().filter((group) => !branchId || group.branchId === branchId).length;
  });

  protected readonly classesAtCapacity = computed(() => {
    const enrolled = this.enrolledByClass();
    return this.classes
      .classes()
      .filter((group) => (group.capacity ?? 0) > 0 && (enrolled.get(group.id) ?? 0) >= (group.capacity ?? 0)).length;
  });
}

/** Shared tooltip chrome: a card on the surface, text in ink, hairline ring. */
function tooltipStyle(theme: ChartTheme) {
  return {
    backgroundColor: theme.surface,
    titleColor: theme.muted,
    bodyColor: theme.text,
    borderColor: theme.grid,
    borderWidth: 1,
    cornerRadius: 8,
    padding: 10,
    boxPadding: 6,
    usePointStyle: true,
    titleFont: { size: 12, weight: 400 },
    // The reader already has the series and wants the number, so the value leads.
    bodyFont: { size: 13, weight: 600 },
  };
}


/** A count that has not arrived yet is a dash, not a zero. */
function format(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString();
}

/** 2026-09-24 as "Sep 24", which is all the axis has room for. */
function shortDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** The API sends a YearMonth, "2026-09"; the axis shows "Sep". */
function shortMonth(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' });
}

/** Axis money: 1200 as "$1.2k", in the school's currency. */
function compactMoney(value: number): string {
  if (Math.abs(value) < 1000) {
    return money(value);
  }
  const full = money(value);
  const symbol = full.replace(/[\d.,\s-]/g, '');
  return `${symbol}${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
}
