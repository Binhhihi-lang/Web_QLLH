<?php

namespace App\Providers;

use App\Models\BuoiHoc;
use App\Models\Diem;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Policies\DiemDanhPolicy;
use App\Policies\DiemPolicy;
use App\Policies\LopHocPhanPolicy;
use App\Policies\SinhVienPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(LopHocPhan::class, LopHocPhanPolicy::class);
        Gate::policy(SinhVien::class, SinhVienPolicy::class);
        Gate::policy(Diem::class, DiemPolicy::class);
        Gate::policy(BuoiHoc::class, DiemDanhPolicy::class);

        // ADMIN bỏ qua mọi kiểm tra Policy (FR-01.04).
        Gate::before(fn ($nguoiDung) => $nguoiDung->laAdmin() ? true : null);
    }
}
