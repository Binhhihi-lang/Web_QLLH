import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CauHinhDiem } from '@core/models/he-thong.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class CauHinhService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/settings`;

  lay(): Observable<Partial<CauHinhDiem>> {
    return this.http
      .get<{ data: Partial<CauHinhDiem> }>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  capNhat(cauHinh: CauHinhDiem): Observable<Partial<CauHinhDiem>> {
    return this.http
      .put<{ data: Partial<CauHinhDiem> }>(this.endpoint, cauHinh)
      .pipe(map((response) => response.data));
  }
}
