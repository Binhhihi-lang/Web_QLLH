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

  it('returns 201 when a teacher is created', async () => {
    const response = await firstValueFrom(
      http.post(
        'http://localhost:8000/api/teachers',
        {
          ma_gv: 'GV-MOCK-201',
          ho_ten: 'Giảng viên mới',
          email: 'gv-mock-201@example.edu.vn',
        },
        { observe: 'response' },
      ),
    );

    expect(response.status).toBe(201);
  });

  it('logs in with the demo admin and returns the matching mock user', async () => {
    const response = await firstValueFrom(
      http.post<{ data: { token: string; nguoi_dung: { vai_tro: string } } }>(
        'http://localhost:8000/api/auth/login',
        { email: 'admin@example.com', password: 'password' },
      ),
    );

    expect(response.data.token).toMatch(/^mock-access-/);
    expect(response.data.nguoi_dung.vai_tro).toBe('ADMIN');
  });

  it('requires a valid mock bearer token for the current-user endpoint', async () => {
    const login = await firstValueFrom(
      http.post<{ data: { token: string } }>('http://localhost:8000/api/auth/login', {
        email: 'admin@example.com',
        password: 'password',
      }),
    );
    const currentUser = await firstValueFrom(
      http.get<{ data: { email: string } }>('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${login.data.token}` },
      }),
    );

    expect(currentUser.data.email).toBe('admin@example.com');
  });

  it('rejects invalid mock credentials with HTTP 401', async () => {
    const error = await firstValueFrom(
      http.post('http://localhost:8000/api/auth/login', {
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
  });
});
