<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\LoiNghiepVu;
use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\BulkRequest;
use App\Http\Requests\QuanLy\GiangVienRequest;
use App\Http\Requests\QuanLy\TrangThaiRequest;
use App\Http\Resources\GiangVienResource;
use App\Models\GiangVien;
use App\Services\QuanLyHoSoService;
use App\Traits\ApiResponseTrait;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GiangVienController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyHoSoService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_gv,ho_ten,email,chuyen_mon,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'chuyen_mon' => ['sometimes', 'string', 'max:255'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $query = GiangVien::query()->with('user')
            ->when($request->filled('q'), fn ($q) => $q->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_gv', 'like', $tuKhoa)
                    ->orWhere('ho_ten', 'like', $tuKhoa)
                    ->orWhere('email', 'like', $tuKhoa)
                    ->orWhere('so_dien_thoai', 'like', $tuKhoa);
            }))
            ->when($request->filled('chuyen_mon'), fn ($q) => $q->where('chuyen_mon', $request->string('chuyen_mon')))
            ->when($request->has('trang_thai'), fn ($q) => $q->where('trang_thai', $request->boolean('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            GiangVienResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(GiangVienRequest $request): JsonResponse
    {
        [$giangVien, $matKhau] = $this->service->taoGiangVien($request->validated());
        $data = (new GiangVienResource($giangVien))->resolve($request);
        $data['mat_khau_ban_dau'] = $matKhau;

        return $this->success($data, 'Tạo giảng viên thành công.', 201);
    }

    public function show(Request $request, GiangVien $giangVien): JsonResponse
    {
        $this->kiemTraSoHuu($request, $giangVien);

        return $this->success(new GiangVienResource($giangVien->load('user')));
    }

    public function update(GiangVienRequest $request, GiangVien $giangVien): JsonResponse
    {
        $this->kiemTraSoHuu($request, $giangVien);

        if ($request->user()->laGiangVien()) {
            $giangVien->update($request->validated());
            $giangVien = $giangVien->fresh('user');
        } else {
            $giangVien = $this->service->capNhatGiangVien($giangVien, $request->validated());
        }

        return $this->success(new GiangVienResource($giangVien), 'Cập nhật giảng viên thành công.');
    }

    public function destroy(GiangVien $giangVien): JsonResponse
    {
        $this->service->xoaGiangVien($giangVien);

        return $this->success(null, 'Xóa giảng viên thành công.');
    }

    public function capNhatTrangThai(TrangThaiRequest $request, GiangVien $giangVien): JsonResponse
    {
        $giangVien = $this->service->doiTrangThaiGiangVien($giangVien, $request->boolean('trang_thai'));

        return $this->success(new GiangVienResource($giangVien), 'Cập nhật trạng thái thành công.');
    }

    public function capNhatTrangThaiHangLoat(BulkRequest $request): JsonResponse
    {
        return $this->phanHoiHangLoat($request->validated('ids'), function (GiangVien $giangVien) use ($request) {
            $this->service->doiTrangThaiGiangVien($giangVien, $request->boolean('trang_thai'));
        });
    }

    public function xoaHangLoat(BulkRequest $request): JsonResponse
    {
        return $this->phanHoiHangLoat($request->validated('ids'), fn (GiangVien $giangVien) => $this->service->xoaGiangVien($giangVien));
    }

    private function kiemTraSoHuu(Request $request, GiangVien $giangVien): void
    {
        if ($request->user()->laAdmin()) {
            return;
        }

        $hoSoHienTai = $request->user()->giangVien;

        if (! $request->user()->laGiangVien() || $hoSoHienTai === null || $hoSoHienTai->isNot($giangVien)) {
            throw new AuthorizationException;
        }
    }

    private function phanHoiHangLoat(array $ids, callable $xuLy): JsonResponse
    {
        $chiTiet = [];

        foreach ($ids as $id) {
            $giangVien = GiangVien::query()->find($id);
            if ($giangVien === null) {
                $chiTiet[] = ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND', 'message' => 'Không tìm thấy giảng viên.'];

                continue;
            }

            try {
                $xuLy($giangVien);
                $chiTiet[] = ['id' => $id, 'ket_qua' => 'THANH_CONG'];
            } catch (LoiNghiepVu $e) {
                $chiTiet[] = ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => $e->maLoi, 'message' => $e->getMessage()];
            }
        }

        $thanhCong = count(array_filter($chiTiet, fn ($dong) => $dong['ket_qua'] === 'THANH_CONG'));

        return $this->success([
            'thanh_cong' => $thanhCong,
            'that_bai' => count($chiTiet) - $thanhCong,
            'chi_tiet' => $chiTiet,
        ], 'Đã xử lý '.count($chiTiet).' bản ghi.');
    }
}
