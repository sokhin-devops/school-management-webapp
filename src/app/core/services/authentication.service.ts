import { inject, Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  // Services
  private readonly apiClient = inject(ApiClientService);


  // Variables

  constructor() { }
}
