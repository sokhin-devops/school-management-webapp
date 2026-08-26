import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EMethod } from '../models/enums';
import { environment } from '../../environment/environment';

export type ApiParams = Record<string, string | number | boolean>;

/** Shape of com.school_management_webapi.dto.response.ApiResponse<T>, returned by every endpoint. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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
      .request<ApiEnvelope<T>>(method, this.url(path), {
        body: options.body,
        params: this.toHttpParams(options.params),
      })
      .pipe(map((envelope) => envelope.data));
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
      httpParams = httpParams.set(key, value);
    }
    return httpParams;
  }
}
