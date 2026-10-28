<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Menu extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'menu';

    public const VI_TRI = [
        'header' => 'Header',
        'sidebar' => 'Sidebar',
    ];

    // Lấy chung từ User để hai bảng không bị lệch giá trị.
    public const VAI_TRO = User::VAI_TRO;

    protected $fillable = [
        'ten',
        'url',
        'vi_tri',
        'nhom',
        'vai_tro',
        'thu_tu',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'vai_tro' => 'array',
            'trang_thai' => 'boolean',
            'thu_tu' => 'integer',
        ];
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    /**
     * Chỉ lấy menu đang hiển thị và phù hợp với vai trò đang đăng nhập.
     *
     * `vai_tro` là MẢNG vai trò được thấy mục; NULL = mọi vai trò. Không có
     * ngoại lệ cho ADMIN: mục nào ADMIN không được thấy thì đừng ghi ADMIN vào
     * mảng — nhờ vậy ADMIN không thấy "/dang-ky-cua-toi" hay "/diem-cua-toi",
     * hai trang chỉ có nghĩa với sinh viên.
     *
     * FE lọc y hệt ở `core/utils/menu-vai-tro.ts` — sửa bên này thì sửa bên kia.
     * Khi làm SCR-52 (xem theo vai trò), truyền vào đây vai trò ĐANG XEM.
     */
    public function scopeHienThiCho(Builder $query, ?string $vaiTro): Builder
    {
        return $query
            ->where('trang_thai', true)
            ->when($vaiTro !== null, function (Builder $q) use ($vaiTro) {
                $q->where(function (Builder $con) use ($vaiTro) {
                    $con->whereNull('vai_tro')
                        ->orWhereJsonContains('vai_tro', $vaiTro);
                });
            })
            ->orderBy('thu_tu')
            ->orderBy('id');
    }

    /** Vai trò hiện tại có được thấy mục này không — dùng khi đã có model trong tay. */
    public function hienThiVoi(?string $vaiTro): bool
    {
        if (! $this->trang_thai) {
            return false;
        }

        if (empty($this->vai_tro)) {
            return true;
        }

        return $vaiTro !== null && in_array($vaiTro, $this->vai_tro, true);
    }
}
