import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MockRegistry } from '@core/mock/mock-registry';
import { mockInterceptor } from './mock.interceptor';

describe('mockInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockRegistry, provideHttpClient(withInterceptors([mockInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  it('emits failed mock envelopes as HttpErrorResponse', async () => {
    const error = await firstValueFrom(
      http.post('http://localhost:8000/api/students', {
        ma_sv: '2000000',
        ho_ten: 'Sinh viên trùng mã',
        email: 'another@example.edu.vn',
      }),
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(422);
    expect((error as HttpErrorResponse).error.ma_loi).toBe('DUPLICATE_CODE');
  });

  it('returns 201 when a student is created', async () => {
    const response = await firstValueFrom(
      http.post(
        'http://localhost:8000/api/students',
        {
          ma_sv: 'SV-MOCK-201',
          ho_ten: 'Sinh viên mới',
          email: 'sv-mock-201@example.edu.vn',
        },
        { observe: 'response' },
      ),
    );

    expect(response.status).toBe(201);
  });
});
