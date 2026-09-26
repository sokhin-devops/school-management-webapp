import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { environment } from '../../environment/environment';

/** com.school_management_webapi.dto.response.SettingsResponse.SystemInfo */
export interface SystemInfo {
  version: string;
  environment: string;
  database: string;
  startedAt: string;
  serverTime: string;
}

/** 69-system-settings.md: what is running, maintenance, and whole-school data operations. */
@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);

  info(): Observable<SystemInfo> {
    return this.api.get<SystemInfo>('api/v1/system/info');
  }

  maintenance(): Observable<{ maintenanceMode: boolean }> {
    return this.api.get<{ maintenanceMode: boolean }>('api/v1/settings/system');
  }

  setMaintenance(on: boolean): Observable<{ maintenanceMode: boolean }> {
    return this.api.put<{ maintenanceMode: boolean }>('api/v1/settings/system', { maintenanceMode: on });
  }

  /**
   * The export as a file. Fetched through HttpClient rather than a link, so the
   * request carries the session like every other call.
   */
  export(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}api/v1/system/export`, { responseType: 'blob' });
  }

  deleteAllData(confirmation: string): Observable<Record<string, number>> {
    return this.api.post<Record<string, number>>('api/v1/system/delete-data', { confirmation });
  }
}
