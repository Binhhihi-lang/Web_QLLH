<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\CapNhatDiemHangLoatRequest;
use App\Http\Requests\QuanLy\LopHocPhanRequest;
use App\Http\Requests\QuanLy\MoKhoaDiemRequest;
use App\Http\Requests\QuanLy\TrangThaiLopRequest;
use App\Http\Resources\LopHocPhanResource;
use App\Models\DangKyHocPhan;
use App\Models\LopHocPhan;
use App\Services\QuanLyLopHocPhanService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * SCR-25 → SCR-29, SCR-40/SCR-41 — module lớp học phần.
 * Hợp đồng: docs/04-api-contract.md §10.
 */
class LopHocPhanController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyLopHocPhanService $service) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('xemDanhSach', LopHocPhan::class);

        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_lop_hp,si_so_toi_da,nam_thu,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'hoc_ky_id' => ['sometimes', 'integer'],
            'mon_hoc_id' => ['sometimes', 'integer'],
            'giang_vien_id' => ['sometimes', 'integer'],
            'nam_thu' => ['sometimes', 'integer', 'between:1,6'],
            'trang_thai' => ['sometimes', Rule::in([LopHocPhan::OPEN, LopHocPhan::CLOSED, LopHocPhan::CANCELLED])],
            'con_cho' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $nguoiDung = $request->user();

        $truyVan = LopHocPhan::query()
            ->with(['monHoc', 'hocKy', 'giangVien'])
            // Đếm sẵn số đăng ký ACTIVE để LopHocPhanResource không phát sinh N+1.
            ->withCount([
                'dangKyHocPhan as dang_ky_active_count' => fn ($truyVan) => $truyVan
                    ->where('trang_thai', DangKyHocPhan::ACTIVE),
            ]);

        // FR-08.02 — phạm vi xem theo vai trò.
        if ($nguoiDung->laGiangVien()) {
            $truyVan->where('giang_vien_id', $nguoiDung->giangVien?->id);
        } elseif ($nguoiDung->laSinhVien()) {
            $sinhVienId = $nguoiDung->sinhVien?->id;
            $truyVan->where(fn ($truyVan) => $truyVan
                ->where('trang_thai', LopHocPhan::OPEN)
                ->orWhereHas('dangKyHocPhan', fn ($dangKy) => $dangKy
                    ->where('sinh_vien_id', $sinhVienId)
                    ->where('trang_thai', DangKyHocPhan::ACTIVE)));
        }

        $truyVan
            ->when($request->filled('q'), fn ($truyVan) => $truyVan->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_lop_hp', 'like', $tuKhoa)
                    ->orWhereHas('monHoc', fn ($mon) => $mon
                        ->where('ten_mon', 'like', $tuKhoa)
                        ->orWhere('ma_mon', 'like', $tuKhoa))
                    ->orWhereHas('giangVien', fn ($gv) => $gv->where('ho_ten', 'like', $tuKhoa));
            }))
            ->when($request->filled('hoc_ky_id'), fn ($truyVan) => $truyVan->where('hoc_ky_id', $request->integer('hoc_ky_id')))
            ->when($request->filled('mon_hoc_id'), fn ($truyVan) => $truyVan->where('mon_hoc_id', $request->integer('mon_hoc_id')))
            ->when($request->filled('giang_vien_id'), fn ($truyVan) => $truyVan->where('giang_vien_id', $request->integer('giang_vien_id')))
            ->when($request->filled('nam_thu'), fn ($truyVan) => $truyVan->where('nam_thu', $request->integer('nam_thu')))
            ->when($request->filled('trang_thai'), fn ($truyVan) => $truyVan->where('trang_thai', $request->string('trang_thai')->toString()))
            ->when($request->has('con_cho'), function ($truyVan) use ($request) {
                $chiLayConCho = $request->boolean('con_cho');

                $truyVan->whereRaw(
                    'si_so_toi_da '.(! $chiLayConCho ? '<=' : '>').' (
                        select count(*) from dang_ky_hoc_phan
                        where dang_ky_hoc_phan.lop_hoc_phan_id = lop_hoc_phan.id
                          and dang_ky_hoc_phan.trang_thai = ?
                    )',
                    [DangKyHocPhan::ACTIVE],
                );
            })
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            LopHocPhanResource::collection($truyVan->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(LopHocPhanRequest $request): JsonResponse
    {
        $lop = $this->service->tao($request->validated(), $request->user()->id);

        return $this->success(new LopHocPhanResource($lop), 'Mở lớp học phần thành công.', 201);
    }

    public function show(LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('xem', $lopHocPhan);

        return $this->success(new LopHocPhanResource(
            $lopHocPhan->load(['monHoc', 'hocKy', 'giangVien']),
        ));
    }

    public function update(LopHocPhanRequest $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        $lop = $this->service->capNhat($lopHocPhan, $request->validated(), $request->user()->id);

        return $this->success(new LopHocPhanResource($lop), 'Cập nhật lớp học phần thành công.');
    }

    public function destroy(LopHocPhan $lopHocPhan): JsonResponse
    {
        $this->service->xoa($lopHocPhan, request()->user()->id);

        return $this->success(null, 'Xóa lớp học phần thành công.');
    }

    public function capNhatTrangThai(TrangThaiLopRequest $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        $lop = $this->service->doiTrangThai(
            $lopHocPhan,
            $request->validated('trang_thai'),
            $request->user()->id,
        );

        return $this->success(new LopHocPhanResource($lop), 'Cập nhật trạng thái lớp thành công.');
    }

    public function danhSachSinhVien(LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('xemSinhVien', $lopHocPhan);

        return $this->success($this->service->danhSachSinhVien($lopHocPhan));
    }

    public function bangDiem(LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('xemDiem', $lopHocPhan);

        return $this->success($this->service->bangDiem($lopHocPhan));
    }

    public function capNhatDiemHangLoat(
        CapNhatDiemHangLoatRequest $request,
        LopHocPhan $lopHocPhan,
    ): JsonResponse {
        Gate::authorize('nhapDiem', $lopHocPhan);

        return $this->success($this->service->capNhatDiemHangLoat(
            $lopHocPhan,
            $request->validated('diem'),
            $request->user()->id,
            $request->validated('ly_do'),
        ));
    }

    public function thongKeChuyenCan(LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('xemDiem', $lopHocPhan);

        return $this->success($this->service->thongKeChuyenCan($lopHocPhan));
    }

    public function chotDiem(Request $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('chotDiem', $lopHocPhan);

        [$lop, $soDongDiem] = $this->service->chotDiem($lopHocPhan, $request->user()->id);

        $duLieu = (new LopHocPhanResource($lop))->resolve($request);
        $duLieu['so_dong_diem'] = $soDongDiem;

        return $this->success($duLieu, 'Chốt điểm thành công.');
    }

    public function moKhoaDiem(MoKhoaDiemRequest $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('moKhoaDiem', $lopHocPhan);

        [$lop, $daMoKhoa] = $this->service->moKhoaDiem(
            $lopHocPhan,
            $request->validated('ly_do'),
            $request->user()->id,
        );

        return $this->success(
            new LopHocPhanResource($lop),
            $daMoKhoa
                ? 'Mở khóa điểm thành công.'
                : 'Lớp chưa chốt điểm nên không có gì để mở khóa.',
        );
    }
}
