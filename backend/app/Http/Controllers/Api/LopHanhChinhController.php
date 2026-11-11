<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\GanSinhVienRequest;
use App\Http\Requests\QuanLy\LopHanhChinhRequest;
use App\Http\Resources\LopHanhChinhResource;
use App\Http\Resources\SinhVienResource;
use App\Models\DangKyHocPhan;
use App\Models\LopHanhChinh;
use App\Models\SinhVien;
use App\Services\QuanLyHoSoService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LopHanhChinhController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyHoSoService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_lop,ten_lop,khoa_hoc,nganh_id,nam_nhap_hoc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'khoa_hoc' => ['sometimes', 'string', 'max:20'],
            'nganh_id' => ['sometimes', 'integer'],
            'khoa_id' => ['sometimes', 'integer'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $query = LopHanhChinh::query()->with(['nganh.khoa'])->withCount('sinhVien');

        if ($request->user()->laSinhVien()) {
            $query->whereKey($request->user()->sinhVien?->lop_hanh_chinh_id ?? 0);
        } elseif ($request->user()->laGiangVien()) {
            // BR-03: giảng viên chỉ thấy lớp hành chính có sinh viên mình đang dạy.
            $giangVienId = $request->user()->giangVien?->id;
            $query->whereHas('sinhVien.dangKyHocPhan', fn ($dangKy) => $dangKy
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('lopHocPhan', fn ($lop) => $lop->where('giang_vien_id', $giangVienId)));
        }

        $query
            ->when($request->filled('q'), fn ($q) => $q->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_lop', 'like', $tuKhoa)->orWhere('ten_lop', 'like', $tuKhoa);
            }))
            ->when($request->filled('khoa_hoc'), fn ($q) => $q->where('khoa_hoc', $request->string('khoa_hoc')))
            ->when($request->filled('nganh_id'), fn ($q) => $q->where('nganh_id', $request->integer('nganh_id')))
            ->when($request->filled('khoa_id'), fn ($q) => $q->whereHas(
                'nganh',
                fn ($nganh) => $nganh->where('khoa_id', $request->integer('khoa_id')),
            ))
            ->when($request->has('trang_thai'), fn ($q) => $q->where('trang_thai', $request->boolean('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            LopHanhChinhResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(LopHanhChinhRequest $request): JsonResponse
    {
        $lop = LopHanhChinh::query()->create($request->validated())
            ->load(['nganh.khoa'])
            ->loadCount('sinhVien');

        return $this->success(new LopHanhChinhResource($lop), 'Tạo lớp hành chính thành công.', 201);
    }

    public function show(LopHanhChinh $lopHanhChinh): JsonResponse
    {
        Gate::authorize('xem', $lopHanhChinh);

        return $this->success(new LopHanhChinhResource(
            $lopHanhChinh->load(['nganh.khoa'])->loadCount('sinhVien'),
        ));
    }

    public function update(LopHanhChinhRequest $request, LopHanhChinh $lopHanhChinh): JsonResponse
    {
        $lopHanhChinh->update($request->validated());

        return $this->success(
            new LopHanhChinhResource($lopHanhChinh->fresh(['nganh.khoa'])->loadCount('sinhVien')),
            'Cập nhật lớp hành chính thành công.',
        );
    }

    public function destroy(LopHanhChinh $lopHanhChinh): JsonResponse
    {
        $this->service->xoaLopHanhChinh($lopHanhChinh);

        return $this->success(null, 'Xóa lớp hành chính thành công.');
    }

    public function danhSachSinhVien(Request $request, LopHanhChinh $lopHanhChinh): JsonResponse
    {
        Gate::authorize('xemSinhVien', $lopHanhChinh);

        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
        ]);

        $query = $lopHanhChinh->sinhVien()->with(['lopHanhChinh.nganh', 'user'])
            ->when($request->filled('q'), fn ($q) => $q->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_sv', 'like', $tuKhoa)->orWhere('ho_ten', 'like', $tuKhoa)->orWhere('email', 'like', $tuKhoa);
            }))
            ->orderBy('ho_ten');

        return $this->successPhanTrang(
            SinhVienResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function ganSinhVien(GanSinhVienRequest $request, LopHanhChinh $lopHanhChinh): JsonResponse
    {
        $soLuong = SinhVien::query()
            ->whereKey($request->validated('sinh_vien_ids'))
            ->update(['lop_hanh_chinh_id' => $lopHanhChinh->id]);

        return $this->success(['so_luong' => $soLuong], 'Gán sinh viên vào lớp thành công.');
    }

    public function goSinhVien(LopHanhChinh $lopHanhChinh, SinhVien $sinhVien): JsonResponse
    {
        if ($sinhVien->lop_hanh_chinh_id !== $lopHanhChinh->id) {
            abort(404);
        }

        $sinhVien->update(['lop_hanh_chinh_id' => null]);

        return $this->success(null, 'Gỡ sinh viên khỏi lớp thành công.');
    }
}
