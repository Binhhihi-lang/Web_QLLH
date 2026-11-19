<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\ChuongTrinhDaoTaoRequest;
use App\Http\Requests\QuanLy\ChuongTrinhMonRequest;
use App\Http\Requests\QuanLy\ImportChuongTrinhRequest;
use App\Http\Resources\ChuongTrinhDaoTaoResource;
use App\Http\Resources\ChuongTrinhMonResource;
use App\Models\ChuongTrinhDaoTao;
use App\Models\ChuongTrinhMon;
use App\Services\QuanLyChuongTrinhService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Chương trình đào tạo — ADMIN ghi, cả ba vai trò đọc (sinh viên cần biết môn
 * theo kỳ để chọn lớp ở màn đăng ký).
 */
class ChuongTrinhDaoTaoController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyChuongTrinhService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'nganh_id' => ['sometimes', 'integer'],
            'khoa_hoc' => ['sometimes', 'string', 'max:20'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
            'sort_by' => ['sometimes', 'in:id,ma_ctdt,ten,khoa_hoc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
        ]);

        $loc = $request->only(['q', 'nganh_id', 'khoa_hoc', 'page', 'per_page', 'sort_by', 'sort_dir']);
        // null = không lọc; false/true = lọc theo trạng thái (has() phân biệt với vắng mặt).
        $loc['trang_thai'] = $request->has('trang_thai') ? $request->boolean('trang_thai') : null;

        return $this->successPhanTrang(
            ChuongTrinhDaoTaoResource::collection($this->service->danhSach($loc)),
        );
    }

    public function store(ChuongTrinhDaoTaoRequest $request): JsonResponse
    {
        $chuongTrinh = $this->service->tao($request->validated(), $request->user()->id);

        return $this->success(
            new ChuongTrinhDaoTaoResource($chuongTrinh),
            'Tạo chương trình đào tạo thành công.',
            201,
        );
    }

    public function show(ChuongTrinhDaoTao $chuongTrinh): JsonResponse
    {
        return $this->success(new ChuongTrinhDaoTaoResource($this->service->chiTiet($chuongTrinh)));
    }

    public function update(ChuongTrinhDaoTaoRequest $request, ChuongTrinhDaoTao $chuongTrinh): JsonResponse
    {
        $chuongTrinh = $this->service->sua($chuongTrinh, $request->validated(), $request->user()->id);

        return $this->success(
            new ChuongTrinhDaoTaoResource($chuongTrinh),
            'Cập nhật chương trình đào tạo thành công.',
        );
    }

    public function destroy(Request $request, ChuongTrinhDaoTao $chuongTrinh): JsonResponse
    {
        $this->service->xoa($chuongTrinh, $request->user());

        return $this->success(null, 'Xóa chương trình đào tạo thành công.');
    }

    public function themMon(ChuongTrinhMonRequest $request, ChuongTrinhDaoTao $chuongTrinh): JsonResponse
    {
        $duLieu = $request->validated();
        $ketQua = $this->service->themMon(
            $chuongTrinh,
            $duLieu['mon_hoc_ids'],
            $duLieu['ky_thu'] ?? null,
            (bool) ($duLieu['bat_buoc'] ?? true),
            $request->user()->id,
        );

        return $this->success(
            $ketQua,
            'Đã thêm '.$ketQua['thanh_cong'].' môn vào chương trình.',
        );
    }

    public function suaMon(ChuongTrinhMonRequest $request, ChuongTrinhDaoTao $chuongTrinh, ChuongTrinhMon $mon): JsonResponse
    {
        $this->damBaoThuocChuongTrinh($chuongTrinh, $mon);

        $mon = $this->service->suaMon($mon, $request->validated(), $request->user()->id);

        return $this->success(new ChuongTrinhMonResource($mon), 'Cập nhật môn trong chương trình thành công.');
    }

    public function xoaMon(Request $request, ChuongTrinhDaoTao $chuongTrinh, ChuongTrinhMon $mon): JsonResponse
    {
        $this->damBaoThuocChuongTrinh($chuongTrinh, $mon);

        $this->service->xoaMon($mon, $request->user()->id);

        return $this->success(null, 'Đã gỡ môn khỏi chương trình.');
    }

    public function import(ImportChuongTrinhRequest $request, ChuongTrinhDaoTao $chuongTrinh): JsonResponse
    {
        $ketQua = $this->service->importCsv(
            $chuongTrinh,
            $request->validated('rows'),
            $request->user()->id,
        );

        return $this->success(
            $ketQua,
            "Import xong: {$ketQua['thanh_cong']} thành công, {$ketQua['that_bai']} lỗi.",
        );
    }

    /**
     * GET /api/me/curriculum — chương trình của chính sinh viên đang đăng nhập.
     */
    public function cuaToi(Request $request): JsonResponse
    {
        $sinhVien = $request->user()->sinhVien;
        abort_if($sinhVien === null, 404, 'Không tìm thấy hồ sơ sinh viên.');

        $duLieu = $this->service->chuongTrinhCuaSinhVien($sinhVien);

        return $this->success([
            'chuong_trinh' => new ChuongTrinhDaoTaoResource($duLieu['chuong_trinh']),
            'ky' => $duLieu['ky']->map(fn (array $nhom) => [
                'ky_thu' => $nhom['ky_thu'],
                'so_mon' => $nhom['so_mon'],
                'tong_tin_chi' => $nhom['tong_tin_chi'],
                'mon' => ChuongTrinhMonResource::collection($nhom['mon']),
            ])->all(),
        ]);
    }

    /**
     * Dòng `chuong_trinh_mon` phải thuộc chương trình trên URL, nếu không thì
     * coi như không tồn tại — tránh sửa/xóa môn của chương trình khác qua id.
     */
    private function damBaoThuocChuongTrinh(ChuongTrinhDaoTao $chuongTrinh, ChuongTrinhMon $mon): void
    {
        abort_unless($mon->chuong_trinh_id === $chuongTrinh->id, 404);
    }
}
