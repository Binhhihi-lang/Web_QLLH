import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // App chỉ còn <router-outlet>, nên cần router provider mới khởi tạo được.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('khởi tạo được', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('chỉ render router-outlet, không còn template mặc định của ng-cli', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    // Template chào mặc định đã bị xoá — nếu nó quay lại thì test này bắt được.
    expect(compiled.querySelector('h1')).toBeNull();
  });
});
