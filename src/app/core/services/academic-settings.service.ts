import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { ApiClientService } from './api-client.service';

export type TermStructure = 'NONE' | 'SEMESTERS' | 'TERMS' | 'QUARTERS';
export type GradingScale = 'PERCENTAGE' | 'LETTER' | 'GPA' | 'PASS_FAIL';

/** com.school_management_webapi.dto.response.SettingsResponse.Academic */
export interface AcademicSettings {
  usePrograms: boolean;
  useLevels: boolean;
  useSections: boolean;
  useSubjects: boolean;
  useTerms: boolean;
  useRooms: boolean;
  levelLabel: string;
  classLabel: string;
  subjectLabel: string;
  studentLabel: string;
  teacherLabel: string;
  autoRollover: boolean;
  termStructure: TermStructure;
  gradingScale: GradingScale;
  passMark: number;
}

const DEFAULTS: AcademicSettings = {
  usePrograms: true,
  useLevels: true,
  useSections: true,
  useSubjects: true,
  useTerms: true,
  useRooms: true,
  levelLabel: 'Level',
  classLabel: 'Class',
  subjectLabel: 'Subject',
  studentLabel: 'Student',
  teacherLabel: 'Teacher',
  autoRollover: false,
  termStructure: 'SEMESTERS',
  gradingScale: 'PERCENTAGE',
  passMark: 50,
};

/** Which switch turns each switchable page off. Classes and years always stay. */
const CONCEPT_BY_ROUTE: Readonly<Record<string, keyof AcademicSettings>> = {
  '/academic/programs': 'usePrograms',
  '/academic/levels': 'useLevels',
  '/academic/subjects': 'useSubjects',
  '/academic/rooms': 'useRooms',
};

/**
 * 63-academic-settings.md: what this school uses and what it calls things.
 *
 * Read by the menu, the page trail and the route guard, so switching a concept
 * off removes it everywhere a person could reach it from, and renaming one
 * renames it in every place the menu's words appear.
 */
@Injectable({ providedIn: 'root' })
export class AcademicSettingsService {
  private readonly api = inject(ApiClientService);

  private readonly _settings = signal<AcademicSettings>(DEFAULTS);
  private readonly _loaded = signal(false);
  private request: Observable<AcademicSettings> | null = null;

  readonly settings = this._settings.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /**
   * Generic menu words mapped to this school's words. Built only for labels a
   * school has actually changed, so an untouched school reads exactly as before.
   */
  private readonly renames = computed(() => {
    const s = this._settings();
    const pairs: [string, string][] = [
      [DEFAULTS.levelLabel, s.levelLabel],
      [DEFAULTS.classLabel, s.classLabel],
      [DEFAULTS.subjectLabel, s.subjectLabel],
      [DEFAULTS.studentLabel, s.studentLabel],
      [DEFAULTS.teacherLabel, s.teacherLabel],
    ];
    const map = new Map<string, string>();
    for (const [generic, chosen] of pairs) {
      if (chosen && chosen !== generic) {
        map.set(plural(generic), plural(chosen));
        map.set(`${generic} Reports`, `${chosen} Reports`);
      }
    }
    return map;
  });

  /** Loads once per session; shared, so every guard on one navigation asks once. */
  ensureLoaded(): Observable<AcademicSettings> {
    this.request ??= this.api.get<AcademicSettings>('api/v1/settings/academic').pipe(
      map((settings) => ({ ...DEFAULTS, ...(settings ?? {}) })),
      tap((settings) => {
        this._settings.set(settings);
        this._loaded.set(true);
      }),
      // Settings that cannot be read leave everything switched on: hiding pages
      // a school uses would be worse than showing one it does not.
      catchError(() => of(DEFAULTS)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.request;
  }

  save(settings: AcademicSettings): Observable<AcademicSettings> {
    return this.api.put<AcademicSettings>('api/v1/settings/academic', settings).pipe(
      map((saved) => ({ ...DEFAULTS, ...(saved ?? settings) })),
      tap((saved) => this._settings.set(saved)),
    );
  }

  /** Cleared on sign-out, so the next school on this device starts from its own. */
  clear(): void {
    this.request = null;
    this._settings.set(DEFAULTS);
    this._loaded.set(false);
  }

  /** False for the page of a concept the school has switched off. */
  isRouteEnabled(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    const concept = CONCEPT_BY_ROUTE[path];
    return !concept || Boolean(this._settings()[concept]);
  }

  /** A menu or crumb label in this school's words. */
  rename(label: string | undefined): string | undefined {
    return label ? (this.renames().get(label) ?? label) : label;
  }
}

/** English plurals for the words schools use here: Grade → Grades, Class → Classes, Faculty → Faculties. */
export function plural(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (/[^aeiou]y$/i.test(trimmed)) {
    return trimmed.slice(0, -1) + 'ies';
  }
  if (/(s|x|z|ch|sh)$/i.test(trimmed)) {
    return trimmed + 'es';
  }
  return trimmed + 's';
}
