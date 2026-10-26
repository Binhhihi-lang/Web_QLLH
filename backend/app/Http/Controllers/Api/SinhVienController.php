<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\BulkRequest;
use App\Http\Requests\QuanLy\SinhVienRequest;
use App\Http\Requests\QuanLy\TrangThaiRequest;
use App\Http\Resources\SinhVienResource;
use App\Models\DangKyHocPhan;
use App\Models\SinhVien;
use App\Services\QuanLyHoSoService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SinhVienController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyHoSoService $service) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('xemDanhSach', SinhVien::class);
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_sv,ho_ten,email,ngay_sinh,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'lop_hanh_chinh_id' => ['sometimes', 'integer'],
            'khoa_hoc' => ['sometimes', 'string', 'max:20'],
            'gioi_tinh' => ['sometimes', 'in:true,false,1,0'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
            'ngay_sinh_tu' => ['sometimes', 'date_format:Y-m-d'],
            'ngay_sinh_den' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:ngay_sinh_tu'],
        ]);

        $query = SinhVien::query()->with(['lopHanhChinh', 'user']);

        if ($request->user()->laGiangVien()) {
            $giangVienId = $request->user()->giangVien?->id;
            $query->whereHas('dangKyHocPhan', fn ($dangKy) => $dangKy
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('lopHocPhan', fn ($lop) => $lop->where('giang_vien_id', $giangVienId)));
        }

        $query
            ->when($request->filled('q'), fn ($q) => $q->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_sv', 'like', $tuKhoa)
                    ->orWhere('ho_ten', 'like', $tuKhoa)
                    ->orWhere('email', 'like', $tuKhoa)
                    ->orWhere('so_dien_thoai', 'like', $tuKhoa);
            }))
            ->when($request->filled('lop_hanh_chinh_id'), fn ($q) => $q->where('lop_hanh_chinh_id', $request->integer('lop_hanh_chinh_id')))
            ->when($request->filled('khoa_hoc'), fn ($q) => $q->whereHas('lopHanhChinh', fn ($lop) => $lop->where('khoa_hoc', $request->string('khoa_hoc'))))
            ->when($request->has('gioi_tinh'), fn ($q) => $q->where('gioi_tinh', $request->boolean('gioi_tinh')))
            ->when($request->has('trang_thai'), fn ($q) => $q->where('trang_thai', $request->boolean('trang_thai')))
            ->when($request->filled('ngay_sinh_tu'), fn ($q) => $q->whereDate('ngay_sinh', '>=', $request->string('ngay_sinh_tu')))
            ->when($request->filled('ngay_sinh_den'), fn ($q) => $q->whereDate('ngay_sinh', '<=', $request->string('ngay_sinh_den')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            SinhVienResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(SinhVienRequest $request): JsonResponse
    {
        [$sinhVien, $matKhau] = $this->service->taoSinhVien($request->validated());
        $data = (new SinhVienResource($sinhVien))->resolve($request);
        $data['mat_khau_ban_dau'] = $matKhau;

        return $this->success($data, 'Tạo sinh viên thành công.', 201);
    }

    public function show(SinhVien $sinhVien): JsonResponse
    {
        Gate::authorize('xem', $sinhVien);

        return $this->success(new SinhVienResource($sinhVien->load(['lopHanhChinh', 'user'])));
    }

    public function update(SinhVienRequest $request, SinhVien $sinhVien): JsonResponse
    {
        return $this->success(
            new SinhVienResource($this->service->capNhatSinhVien($sinhVien, $request->validated())),
            'Cập nhật sinh viên thành công.',
        );
    }

    public function destroy(SinhVien $sinhVien): JsonResponse
    {
        $this->service->xoaSinhVien($sinhVien);

        return $this->success(null, 'Xóa sinh viên thành công.');
    }

    public function capNhatTrangThai(TrangThaiRequest $request, SinhVien $sinhVien): JsonResponse
    {
        $sinhVien = $this->service->doiTrangThaiSinhVien($sinhVien, $request->boolean('trang_thai'));

        return $this->success(new SinhVienResource($sinhVien), 'Cập nhật trạng thái thành công.');
    }

    public function capNhatTrangThaiHangLoat(BulkRequest $request): JsonResponse
    {
        $chiTiet = $this->service->doiTrangThaiSinhVienHangLoat(
            $request->validated('ids'),
            $request->boolean('trang_thai'),
        );

        return $this->phanHoiKetQuaHangLoat($chiTiet);
    }

    public function xoaHangLoat(BulkRequest $request): JsonResponse
    {
        $chiTiet = $this->service->xoaSinhVienHangLoat($request->validated('ids'));

        return $this->phanHoiKetQuaHangLoat($chiTiet);
    }

    private function phanHoiKetQuaHangLoat(array $chiTiet): JsonResponse
    {
        $thanhCong = count(array_filter($chiTiet, fn ($dong) => $dong['ket_qua'] === 'THANH_CONG'));

        return $this->success([
            'thanh_cong' => $thanhCong,
            'that_bai' => count($chiTiet) - $thanhCong,
            'chi_tiet' => $chiTiet,
        ], 'Đã xử lý '.count($chiTiet).' bản ghi.');
    }
}
