<?php

namespace Database\Seeders;

use App\Models\NhatKy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class NhatKySeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('vai_tro', User::ADMIN)->first();
        $adminId = $admin?->id ?? 1;

        $mauNhatKy = [
            [
                'doi_tuong_loai' => 'users',
                'doi_tuong_id' => 2,
                'hanh_dong' => NhatKy::TAO,
                'gia_tri_cu' => null,
                'gia_tri_moi' => ['email' => 'giangvien@example.com', 'vai_tro' => 'GIANG_VIEN'],
                'nguoi_thuc_hien_id' => $adminId,
                'ghi_chu' => 'Tạo tài khoản Giảng viên demo',
                'thoi_diem' => Carbon::now()->subDays(15),
            ],
            [
                'doi_tuong_loai' => 'hoc_ky',
                'doi_tuong_id' => 1,
                'hanh_dong' => NhatKy::DOI_TRANG_THAI,
                'gia_tri_cu' => ['trang_thai' => 'UPCOMING'],
                'gia_tri_moi' => ['trang_thai' => 'ONGOING'],
                'nguoi_thuc_hien_id' => $adminId,
                'ghi_chu' => 'Kích hoạt học kỳ 1 năm học 2026-2027',
                'thoi_diem' => Carbon::now()->subDays(10),
            ],
            [
                'doi_tuong_loai' => 'users',
                'doi_tuong_id' => 4,
                'hanh_dong' => NhatKy::KHOA,
                'gia_tri_cu' => ['trang_thai' => true],
                'gia_tri_moi' => ['trang_thai' => false],
                'nguoi_thuc_hien_id' => $adminId,
                'ghi_chu' => 'Khóa tài khoản sinh viên vi phạm quy chế',
                'thoi_diem' => Carbon::now()->subDays(5),
            ],
            [
                'doi_tuong_loai' => 'lop_hoc_phan',
                'doi_tuong_id' => 1,
                'hanh_dong' => NhatKy::MO_KHOA,
                'gia_tri_cu' => ['chot_diem_luc' => '2026-10-25 10:00:00'],
                'gia_tri_moi' => ['chot_diem_luc' => null],
                'nguoi_thuc_hien_id' => $adminId,
                'ghi_chu' => 'Mở khóa điểm lớp học phần INT3306 theo yêu cầu phúc khảo',
                'thoi_diem' => Carbon::now()->subDays(2),
            ],
            [
                'doi_tuong_loai' => 'cau_hinh',
                'doi_tuong_id' => 1,
                'hanh_dong' => NhatKy::CAP_NHAT,
                'gia_tri_cu' => ['diem.diem_danh.sua_trong_so_ngay' => 5],
                'gia_tri_moi' => ['diem.diem_danh.sua_trong_so_ngay' => 7],
                'nguoi_thuc_hien_id' => $adminId,
                'ghi_chu' => 'Cập nhật thời hạn sửa điểm danh lên 7 ngày theo BR-21',
                'thoi_diem' => Carbon::now()->subDay(),
            ],
        ];

        foreach ($mauNhatKy as $data) {
            NhatKy::query()->updateOrCreate(
                [
                    'doi_tuong_loai' => $data['doi_tuong_loai'],
                    'doi_tuong_id' => $data['doi_tuong_id'],
                    'hanh_dong' => $data['hanh_dong'],
                    'thoi_diem' => $data['thoi_diem'],
                ],
                $data
            );
        }
    }
}
