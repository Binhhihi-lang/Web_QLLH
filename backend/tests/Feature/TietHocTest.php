<?php

namespace Tests\Feature;

use App\Models\MonHoc;
use App\Models\TietHoc;
use App\Models\User;
use Database\Seeders\TietHocSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TietHocTest extends TestCase
{
    use RefreshDatabase;

    public function test_bieu_tiet_co_du_15_tiet_chia_ba_ca(): void
    {
        $this->seed(TietHocSeeder::class);

        $this->assertSame(15, TietHoc::query()->count());
        $this->assertSame(6, TietHoc::query()->where('ca', TietHoc::SANG)->count());
        $this->assertSame(6, TietHoc::query()->where('ca', TietHoc::CHIEU)->count());
        $this->assertSame(3, TietHoc::query()->where('ca', TietHoc::TOI)->count());

        $dau = TietHoc::query()->where('so_tiet', 1)->firstOrFail();
        $this->assertSame('06:30', substr($dau->gio_bat_dau, 0, 5));
        $this->assertSame('07:20', substr($dau->gio_ket_thuc, 0, 5));

        $cuoi = TietHoc::query()->where('so_tiet', 15)->firstOrFail();
        $this->assertSame('20:05', substr($cuoi->gio_bat_dau, 0, 5));
        $this->assertSame('20:55', substr($cuoi->gio_ket_thuc, 0, 5));
    }

    public function test_seeder_khong_tao_trung_khi_chay_lai(): void
    {
        $this->seed(TietHocSeeder::class);
        $this->seed(TietHocSeeder::class);

        $this->assertSame(15, TietHoc::query()->count());
    }

    public function test_options_periods_tra_du_15_tiet_theo_thu_tu(): void
    {
        $this->seed(TietHocSeeder::class);
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');

        $response = $this->getJson('/api/options/periods')->assertOk();

        $duLieu = $response->json('data');
        $this->assertCount(15, $duLieu);
        $this->assertSame(1, $duLieu[0]['so_tiet']);
        $this->assertSame('Tiết 1 (06:30–07:20)', $duLieu[0]['label']);
        $this->assertSame(TietHoc::SANG, $duLieu[0]['ca']);
        $this->assertSame(15, $duLieu[14]['so_tiet']);
        $this->assertSame(TietHoc::TOI, $duLieu[14]['ca']);
    }

    public function test_options_subjects_tim_duoc_khong_dau_va_co_ma_mon(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');
        MonHoc::factory()->create(['ma_mon' => 'INT3306', 'ten_mon' => 'Lập trình web']);
        MonHoc::factory()->create(['ma_mon' => 'INT2203', 'ten_mon' => 'Cơ sở dữ liệu']);

        $duLieu = $this->getJson('/api/options/subjects?q=lap trinh')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $duLieu);
        $this->assertSame('INT3306', $duLieu[0]['ma_mon']);
        $this->assertSame('Lập trình web', $duLieu[0]['label']);

        $theoMa = $this->getJson('/api/options/subjects?q=2203')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $theoMa);
        $this->assertSame('Cơ sở dữ liệu', $theoMa[0]['ten_mon']);
    }
}
