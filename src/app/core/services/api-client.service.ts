import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EMethod } from '../models/enums';
import { environment } from '../../environment/environment';

export type ApiParams = Record<string, string | number | boolean | null | undefined>;

/** Shape of com.school_management_webapi.dto.response.ApiResponse<T>. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * The API is not consistent about the envelope: auth, onboarding, schools,
 * branches, academic years, plans and subscriptions wrap their body in one,
 * while students and every module added after them return the DTO directly.
 *
 * Rather than have each caller know which is which, the shape is recognised
 * here. Worth settling on the API side eventually - this is the seam, not the
 * fix.
 */
function unwrap<T>(body: T | ApiEnvelope<T>): T {
  const envelope = body as ApiEnvelope<T>;
  const isEnvelope =
    envelope !== null &&
    typeof envelope === 'object' &&
    typeof envelope.success === 'boolean' &&
    'data' in envelope;

  return isEnvelope ? envelope.data : (body as T);
}

/** Thin HttpClient wrapper that resolves paths against environment.apiUrl and unwraps the ApiResponse envelope. */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  get<T>(path: string, params?: ApiParams): Observable<T> {
    return this.request<T>(EMethod.Get, path, { params });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>(EMethod.Post, path, { body });
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>(EMethod.Put, path, { body });
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.request<T>(EMethod.Patch, path, { body });
  }

  delete<T>(path: string, params?: ApiParams): Observable<T> {
    return this.request<T>(EMethod.Delete, path, { params });
  }

  private request<T>(method: EMethod, path: string, options: { body?: unknown; params?: ApiParams }): Observable<T> {
    return this.http
      .request<T | ApiEnvelope<T>>(method, this.url(path), {
        body: options.body,
        params: this.toHttpParams(options.params),
      })
      .pipe(map(unwrap));
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private toHttpParams(params?: ApiParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      // A filter that is off is left out entirely; sending "undefined" as a
      // value would be read by the server as a filter that is on.
      if (value === undefined || value === null || value === '') {
        continue;
      }
      httpParams = httpParams.set(key, value);
    }
    return httpParams;
  }
}
