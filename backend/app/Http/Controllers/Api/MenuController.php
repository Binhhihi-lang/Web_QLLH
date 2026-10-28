<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\MenuRequest;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use App\Models\NhatKy;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MenuController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'vi_tri' => ['sometimes', 'string', Rule::in(array_keys(Menu::VI_TRI))],
        ]);

        // `$request->boolean()` nhận true/1/on/yes (và false/0/off/no) — quy ước
        // duy nhất cho tham số này, không dùng rule `boolean` vì query string
        // luôn là chuỗi nên `?quan_ly=true` sẽ bị 422 oan.
        $quanLy = $request->boolean('quan_ly');
        if ($quanLy && $request->user()->vai_tro !== User::ADMIN) {
            return $this->error('Bạn không có quyền quản lý danh sách menu.', 403, 'FORBIDDEN');
        }

        $query = Menu::query();
        if ($quanLy) {
            $query->orderBy('vi_tri')->orderBy('thu_tu')->orderBy('id');
        } else {
            $query->hienThiCho($request->user()->vai_tro);
        }

        if ($request->filled('vi_tri')) {
            $query->where('vi_tri', $request->string('vi_tri')->toString());
        }

        return $this->success(MenuResource::collection($query->get())->resolve($request));
    }

    public function store(MenuRequest $request): JsonResponse
    {
        $menu = Menu::query()->create($request->validated());

        return $this->success(new MenuResource($menu), 'Tạo menu thành công.', 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->success(new MenuResource($menu));
    }

    public function update(MenuRequest $request, Menu $menu): JsonResponse
    {
        $menu->update($request->validated());

        return $this->success(new MenuResource($menu->fresh()), 'Cập nhật menu thành công.');
    }

    public function destroy(Request $request, Menu $menu): JsonResponse
    {
        DB::transaction(function () use ($request, $menu): void {
            $menu->deleted_by = $request->user()->id;
            $menu->save();
            $menu->delete();

            NhatKy::ghi(
                'menu',
                $menu->id,
                NhatKy::XOA,
                nguoiThucHienId: $request->user()->id,
            );
        });

        return $this->success(null, 'Xóa menu thành công.');
    }
}
