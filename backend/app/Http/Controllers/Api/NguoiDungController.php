<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\BulkRequest;
use App\Http\Requests\QuanLy\NguoiDungRequest;
use App\Http\Requests\QuanLy\TrangThaiRequest;
use App\Http\Resources\NguoiDungResource;
use App\Models\User;
use App\Services\QuanLyNguoiDungService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * SCR-50/SCR-51 — quản lý tài khoản người dùng (docs/04-api-contract.md §3).
 * Toàn bộ endpoint chỉ mở cho ADMIN, khai ở routes/api.php.
 */
class NguoiDungController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyNguoiDungService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,name,email,vai_tro,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'vai_tro' => ['sometimes', Rule::in(array_keys(User::VAI_TRO))],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $truyVan = User::query()
            ->with(['sinhVien', 'giangVien'])
            ->when($request->filled('q'), fn ($truyVan) => $truyVan->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('name', 'like', $tuKhoa)->orWhere('email', 'like', $tuKhoa);
            }))
            ->when($request->filled('vai_tro'), fn ($truyVan) => $truyVan->where('vai_tro', $request->string('vai_tro')->toString()))
            ->when($request->has('trang_thai'), fn ($truyVan) => $truyVan->where('trang_thai', $request->boolean('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            NguoiDungResource::collection($truyVan->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(NguoiDungRequest $request): JsonResponse
    {
        [$nguoiDung, $matKhau] = $this->service->tao($request->validated(), $request->user()->id);

        $duLieu = (new NguoiDungResource($nguoiDung))->resolve($request);
        $duLieu['mat_khau_ban_dau'] = $matKhau;

        return $this->success($duLieu, 'Tạo tài khoản thành công.', 201);
    }

    public function show(User $nguoiDung): JsonResponse
    {
        return $this->success(new NguoiDungResource($nguoiDung->load(['sinhVien', 'giangVien'])));
    }

    public function update(NguoiDungRequest $request, User $nguoiDung): JsonResponse
    {
        $nguoiDung = $this->service->capNhat($nguoiDung, $request->validated(), $request->user()->id);

        return $this->success(new NguoiDungResource($nguoiDung), 'Cập nhật tài khoản thành công.');
    }

    public function destroy(Request $request, User $nguoiDung): JsonResponse
    {
        $this->service->xoa($nguoiDung, $request->user()->id);

        return $this->success(null, 'Xóa tài khoản thành công.');
    }

    public function capNhatTrangThai(TrangThaiRequest $request, User $nguoiDung): JsonResponse
    {
        $nguoiDung = $this->service->doiTrangThai(
            $nguoiDung,
            $request->boolean('trang_thai'),
            $request->user()->id,
        );

        return $this->success(new NguoiDungResource($nguoiDung), 'Cập nhật trạng thái thành công.');
    }

    public function capNhatTrangThaiHangLoat(BulkRequest $request): JsonResponse
    {
        $chiTiet = $this->service->doiTrangThaiHangLoat(
            $request->validated('ids'),
            $request->boolean('trang_thai'),
            $request->user()->id,
        );

        $thanhCong = count(array_filter($chiTiet, fn ($dong) => $dong['ket_qua'] === 'THANH_CONG'));

        return $this->success([
            'thanh_cong' => $thanhCong,
            'that_bai' => count($chiTiet) - $thanhCong,
            'chi_tiet' => $chiTiet,
        ], 'Đã xử lý '.count($chiTiet).' bản ghi.');
    }

    public function datLaiMatKhau(Request $request, User $nguoiDung): JsonResponse
    {
        [$nguoiDung, $matKhau] = $this->service->datLaiMatKhau($nguoiDung, $request->user()->id);

        $duLieu = (new NguoiDungResource($nguoiDung))->resolve($request);
        $duLieu['mat_khau_moi'] = $matKhau;

        return $this->success($duLieu, 'Đặt lại mật khẩu thành công.');
    }
}
