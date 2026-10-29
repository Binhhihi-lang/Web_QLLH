<?php

namespace App\Services;

use App\Models\BuoiHoc;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\Menu;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ThungRacService
{
    /**
     * Bản đồ loại thực thể sang class Model tương ứng.
     */
    private const MAP_TYPE = [
        'users' => User::class,
        'students' => SinhVien::class,
        'teachers' => GiangVien::class,
        'admin-classes' => LopHanhChinh::class,
        'subjects' => MonHoc::class,
        'semesters' => HocKy::class,
        'rooms' => PhongHoc::class,
        'sections' => LopHocPhan::class,
        'sessions' => BuoiHoc::class,
        'menus' => Menu::class,
    ];

    /**
     * Lấy class Model theo loại thực thể.
     */
    public function layModelClass(string $type): string
    {
        if (! isset(self::MAP_TYPE[$type])) {
            throw new NotFoundHttpException("Loại thực thể '{$type}' không hợp lệ hoặc không hỗ trợ thùng rác.");
        }

        return self::MAP_TYPE[$type];
    }

    /**
     * Lấy danh sách bản ghi đã xóa mềm theo loại thực thể.
     */
    public function danhSach(string $type, Request $request): LengthAwarePaginator
    {
        $modelClass = $this->layModelClass($type);

        /** @var Builder $query */
        $query = $modelClass::onlyTrashed()->with('xoaBoi:id,name,email');

        // Lọc theo từ khóa
        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $this->apDungTimKiem($query, $type, $term);
        }

        // Lọc theo người xóa
        if ($request->filled('deleted_by')) {
            $query->where('deleted_by', $request->integer('deleted_by'));
        }

        // Lọc theo khoảng thời gian xóa
        if ($request->filled('deleted_tu')) {
            $query->where('deleted_at', '>=', $request->input('deleted_tu'));
        }
        if ($request->filled('deleted_den')) {
            $query->where('deleted_at', '<=', $request->input('deleted_den').' 23:59:59');
        }

        $query->orderByDesc('deleted_at');

        $perPage = in_array((int) $request->input('per_page'), [10, 25, 50, 100], true)
            ? (int) $request->input('per_page')
            : 10;

        return $query->paginate($perPage);
    }

    /**
     * Khôi phục bản ghi đã xóa mềm.
     */
    public function khoiPhuc(string $type, int $id, User $nguoiThucHien): Model
    {
        $modelClass = $this->layModelClass($type);

        /** @var Model|null $record */
        $record = $modelClass::onlyTrashed()->find($id);

        if (! $record) {
            throw new NotFoundHttpException("Không tìm thấy bản ghi cần khôi phục trong thùng rác.");
        }

        // Kiểm tra ràng buộc bản ghi cha
        $this->kiemTraRangBuocCha($type, $record);

        if (in_array('restored_by', $record->getFillable(), true) || property_exists($record, 'restored_by')) {
            $record->restored_by = $nguoiThucHien->id;
        }

        $record->restore();

        // Ghi nhật ký hệ thống
        NhatKy::ghi(
            doiTuongLoai: $record->getTable(),
            doiTuongId: $record->id,
            hanhDong: NhatKy::KHOI_PHUC,
            giaTriCu: null,
            giaTriMoi: $record->toArray(),
            ghiChu: "Khôi phục {$type} #{$record->id} từ thùng rác",
            nguoiThucHienId: $nguoiThucHien->id,
        );

        return $record;
    }

    /**
     * Tìm kiếm theo đặc thù từng model.
     */
    private function apDungTimKiem(Builder $query, string $type, string $term): void
    {
        $query->where(function (Builder $sub) use ($type, $term) {
            switch ($type) {
                case 'users':
                    $sub->where('name', 'like', $term)->orWhere('email', 'like', $term);
                    break;
                case 'students':
                    $sub->where('ma_sv', 'like', $term)->orWhere('ho_ten', 'like', $term);
                    break;
                case 'teachers':
                    $sub->where('ma_gv', 'like', $term)->orWhere('ho_ten', 'like', $term);
                    break;
                case 'admin-classes':
                    $sub->where('ma_lop', 'like', $term)->orWhere('ten_lop', 'like', $term);
                    break;
                case 'subjects':
                    $sub->where('ma_mon', 'like', $term)->orWhere('ten_mon', 'like', $term);
                    break;
                case 'semesters':
                    $sub->where('ma_hoc_ky', 'like', $term)->orWhere('ten_hoc_ky', 'like', $term);
                    break;
                case 'rooms':
                    $sub->where('ma_phong', 'like', $term)->orWhere('ten_phong', 'like', $term);
                    break;
                case 'sections':
                    $sub->where('ma_lop_hp', 'like', $term);
                    break;
                case 'menus':
                    $sub->where('ten_menu', 'like', $term)->orWhere('url', 'like', $term);
                    break;
                default:
                    $sub->where('id', 'like', $term);
                    break;
            }
        });
    }

    /**
     * Kiểm tra bản ghi cha có đang bị xóa mềm hay không.
     * Nếu cha bị xóa mềm thì ném lỗi 409 RESTORE_PARENT_DELETED.
     */
    private function kiemTraRangBuocCha(string $type, Model $record): void
    {
        if ($type === 'students' && ! empty($record->lop_hanh_chinh_id)) {
            $lopHanhChinh = LopHanhChinh::withTrashed()->find($record->lop_hanh_chinh_id);
            if ($lopHanhChinh && $lopHanhChinh->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì lớp hành chính của sinh viên đã bị xóa.");
            }
        }

        if ($type === 'sections') {
            if ($record->mon_hoc_id && MonHoc::withTrashed()->find($record->mon_hoc_id)?->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì môn học của lớp học phần đã bị xóa.");
            }
            if ($record->hoc_ky_id && HocKy::withTrashed()->find($record->hoc_ky_id)?->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì học kỳ của lớp học phần đã bị xóa.");
            }
            if ($record->giang_vien_id && GiangVien::withTrashed()->find($record->giang_vien_id)?->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì giảng viên phụ trách đã bị xóa.");
            }
        }

        if ($type === 'sessions') {
            if ($record->lop_hoc_phan_id && LopHocPhan::withTrashed()->find($record->lop_hoc_phan_id)?->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì lớp học phần chứa buổi học đã bị xóa.");
            }
            if ($record->phong_hoc_id && PhongHoc::withTrashed()->find($record->phong_hoc_id)?->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì phòng học của buổi học đã bị xóa.");
            }
        }

        if ($type === 'menus' && ! empty($record->parent_id)) {
            $menuCha = Menu::withTrashed()->find($record->parent_id);
            if ($menuCha && $menuCha->trashed()) {
                throw new HttpException(409, "Không thể khôi phục vì menu cha đã bị xóa.");
            }
        }
    }
}

