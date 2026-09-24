import { Component, computed, inject } from '@angular/core';
import type { ChartData, ChartOptions, ScriptableContext, TooltipItem } from 'chart.js';
import { KShareModule } from '../../share/k-share.module';
import { ChartThemeService, withAlpha, type ChartTheme } from '../../core/services/chart-theme.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ApiDashboardSummary } from '../../core/api/api.models';

type Tone = 'info' | 'success' | 'warning';
type Severity = 'ok' | 'warning' | 'critical';

interface StatDelta {
  readonly percent: number;
  readonly caption: string;
  /** Whether a rise is the good outcome — outstanding fees climbing is not. */
  readonly upIsGood: boolean;
}

interface StatTile {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly delta?: StatDelta;
  /** Twelve readings, oldest first, drawn as the tile's sparkline. */
  readonly trend?: readonly number[];
  /** Shown instead of a delta for figures that have no meaningful trend. */
  readonly note?: string;
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

// ---------------------------------------------------------------------------
// Sample figures. These stand in until the dashboard endpoint exists; the shapes
// above are what the API is expected to fill.
// ---------------------------------------------------------------------------

const STAT_TILES: readonly StatTile[] = [
  {
    key: 'students',
    label: 'Students',
    value: '342',
    icon: 'pi-graduation-cap',
    delta: { percent: 4.6, caption: 'vs last term', upIsGood: true },
    trend: [298, 305, 309, 312, 318, 321, 325, 328, 330, 336, 339, 342],
  },
  {
    key: 'staff',
    label: 'Teachers & staff',
    value: '28',
    icon: 'pi-id-card',
    delta: { percent: 7.7, caption: 'vs last term', upIsGood: true },
    trend: [24, 24, 25, 25, 26, 26, 26, 27, 27, 27, 28, 28],
  },
  {
    key: 'classes',
    label: 'Classes',
    value: '14',
    icon: 'pi-th-large',
    note: '2 opened this term',
  },
  {
    key: 'attendance',
    label: 'Attendance today',
    value: '96.8%',
    icon: 'pi-calendar-clock',
    delta: { percent: 1.2, caption: 'vs last week', upIsGood: true },
    trend: [93.8, 94.6, 95.1, 94.2, 95.8, 96.1, 95.4, 96.6, 95.9, 96.2, 97.0, 96.8],
  },
  {
    key: 'collected',
    label: 'Collected this month',
    value: '$18,400',
    icon: 'pi-wallet',
    delta: { percent: 9.4, caption: 'vs last month', upIsGood: true },
    trend: [12.1, 13.4, 12.9, 14.2, 15.0, 14.6, 15.8, 16.4, 16.1, 17.2, 17.9, 18.4],
  },
  {
    key: 'outstanding',
    label: 'Outstanding fees',
    value: '$4,250',
    icon: 'pi-exclamation-circle',
    delta: { percent: 6.1, caption: 'vs last month', upIsGood: false },
    trend: [5.9, 5.4, 5.6, 5.1, 4.8, 5.0, 4.6, 4.4, 4.7, 4.3, 4.0, 4.25],
  },
];

const ATTENDANCE_DAYS = ['Sep 9', 'Sep 10', 'Sep 11', 'Sep 14', 'Sep 15', 'Sep 16', 'Sep 17', 'Sep 18'];
const ATTENDANCE_RATE = [94.1, 95.3, 93.8, 96.2, 95.7, 97.0, 96.4, 96.8];
const ATTENDANCE_TARGET = 95;

const PROGRAMS: readonly Program[] = [
  { name: 'Primary', students: 156 },
  { name: 'Lower secondary', students: 92 },
  { name: 'Upper secondary', students: 64 },
  { name: 'Language centre', students: 30 },
];

const FEE_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const FEE_COLLECTED = [14200, 15800, 16400, 17100, 17900, 18400];
const FEE_OUTSTANDING = [5100, 4800, 4600, 4400, 4100, 4250];

const CLASS_CAPACITY: readonly ClassCapacity[] = [
  { name: 'Grade 7A', enrolled: 35, capacity: 35 },
  { name: 'Grade 5A', enrolled: 32, capacity: 35 },
  { name: 'Grade 6B', enrolled: 28, capacity: 35 },
  { name: 'Language B1', enrolled: 18, capacity: 24 },
  { name: 'Grade 8C', enrolled: 21, capacity: 30 },
];

const NOTIFICATIONS: readonly NotificationItem[] = [
  { icon: 'pi-user-plus', tone: 'info', message: 'New student registration submitted', time: '2h ago' },
  { icon: 'pi-check-circle', tone: 'success', message: 'Fee payment received — $480', time: '5h ago' },
  { icon: 'pi-exclamation-triangle', tone: 'warning', message: '3 invoices are past their due date', time: '1d ago' },
  { icon: 'pi-calendar', tone: 'info', message: 'Academic year 2026 - 2027 created', time: '2d ago' },
];

const RECENT_ACTIVITY: readonly ActivityItem[] = [
  { actor: 'Sophea Chan', initials: 'SC', action: 'invited a new teacher', time: '3h ago' },
  { actor: 'Dara Kim', initials: 'DK', action: 'updated the branch details', time: '1d ago' },
  { actor: 'Sophea Chan', initials: 'SC', action: 'created academic year 2026 - 2027', time: '2d ago' },
  { actor: 'Mealea Sok', initials: 'MS', action: 'published the Grade 7A timetable', time: '3d ago' },
];

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-dashboard',
  imports: [KShareModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly chartTheme = inject(ChartThemeService);
  protected readonly dashboard = inject(DashboardService);

  protected readonly notifications = NOTIFICATIONS;
  protected readonly recentActivity = RECENT_ACTIVITY;

  /**
   * Tiles carry their own sparkline config rather than the template calling a
   * builder: PrimeNG's chart destroys and rebuilds itself whenever its `data` or
   * `options` binding changes identity, so these references have to stay stable
   * across change detection and move only when the theme does.
   */
  protected readonly tiles = computed(() => {
    const theme = this.chartTheme.theme();
    const summary = this.dashboard.summary();

    return this.headlineTiles(summary).map((tile) => ({
      ...tile,
      rising: (tile.delta?.percent ?? 0) >= 0,
      deltaGood: tile.delta ? tile.delta.percent >= 0 === tile.delta.upIsGood : false,
      spark: tile.trend ? sparkline(tile.trend, theme) : null,
    }));
  });

  /**
   * The six headline figures, from the server's one summary call.
   *
   * The shapes STAT_TILES describes are kept for the ones the API has nothing
   * to say about — a trend against last term, and the outstanding-fee total —
   * so the layout stays whole while those are still unanswered. The counts and
   * the money are real.
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
          min: 80,
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

  protected readonly totalStudents = PROGRAMS.reduce((sum, program) => sum + program.students, 0);

  /** The ring's legend and its table view at once — every slice's value is here. */
  protected readonly programBreakdown = computed(() => {
    const theme = this.chartTheme.theme();

    return PROGRAMS.map((program, index) => ({
      ...program,
      color: theme.categorical[index % theme.categorical.length],
      share: Math.round((program.students / this.totalStudents) * 100),
    }));
  });

  protected readonly programData = computed<ChartData<'doughnut'>>(() => {
    const theme = this.chartTheme.theme();

    return {
      labels: PROGRAMS.map((program) => program.name),
      datasets: [
        {
          data: PROGRAMS.map((program) => program.students),
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
      collected: CURRENCY.format(collected),
      spent: CURRENCY.format(spent),
      net: CURRENCY.format(collected - spent),
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
          borderSkipped: false,
        },
        {
          label: 'Outstanding',
          data: [...FEE_OUTSTANDING],
          backgroundColor: theme.categorical[1],
          maxBarThickness: 24,
          // Rounded where the stack ends, square where it meets the baseline.
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          // 2px of surface between the segments in place of a stroke around them.
          borderColor: theme.surface,
          borderWidth: { top: 0, right: 0, bottom: 2, left: 0 },
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
            label: (item: TooltipItem<'bar'>) => ` ${CURRENCY.format(item.parsed.y ?? 0)}   ${item.dataset.label}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { color: theme.grid },
          ticks: { color: theme.muted, font: { size: 12 } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: theme.grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: theme.muted,
            font: { size: 12 },
            callback: (value) => `$${Number(value) / 1000}k`,
          },
        },
      },
    };
  });

  // --- Class capacity -----------------------------------------------------

  protected readonly classCapacity = CLASS_CAPACITY.map((entry) => {
    const percent = Math.round((entry.enrolled / entry.capacity) * 100);

    return {
      ...entry,
      percent,
      severity: (percent >= 100 ? 'critical' : percent >= 85 ? 'warning' : 'ok') satisfies Severity as Severity,
    };
  });

  protected readonly classesAtCapacity = this.classCapacity.filter((entry) => entry.percent >= 100).length;
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

/**
 * A stat tile's 12-point trend line: no axes, no grid, no tooltip. The tile's own
 * value and delta carry the numbers, so nothing here is gated behind a hover.
 */
function sparkline(trend: readonly number[], theme: ChartTheme) {
  const low = Math.min(...trend);
  const high = Math.max(...trend);
  // Breathing room top and bottom so the stroke is never clipped by the plot edge.
  const padding = (high - low || 1) * 0.25;

  const data: ChartData<'line'> = {
    labels: trend.map((_, index) => String(index)),
    datasets: [
      {
        data: [...trend],
        borderColor: theme.primary,
        backgroundColor: withAlpha(theme.primary, 0.12),
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: low - padding, max: high + padding },
    },
    elements: { line: { capBezierPoints: true } },
  };

  return { data, options };
}

/** A count that has not arrived yet is a dash, not a zero. */
function format(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString();
}

function money(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** 2026-09-24 as "Sep 24", which is all the axis has room for. */
function shortDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** The API sends a YearMonth, "2026-09"; the axis shows "Sep". */
function shortMonth(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short' });
}
