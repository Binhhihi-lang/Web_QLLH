<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use HasFactory;

    // Các vị trí hiển thị menu trên layout
    public const VI_TRI = [
        'header' => 'Header',
        'sidebar' => 'Sidebar',
    ];

    // Giá trị vai trò hợp lệ cho cột vai_tro (NULL = mọi vai trò).
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
            'trang_thai' => 'boolean',
            'thu_tu' => 'integer',
        ];
    }

    /**
     * Chỉ lấy menu đang hiển thị và phù hợp với vai trò đang đăng nhập.
     * Menu có vai_tro = NULL dành cho mọi vai trò.
     */
    public function scopeHienThiCho(Builder $query, ?string $vaiTro): Builder
    {
        return $query
            ->where('trang_thai', true)
            ->where(function (Builder $q) use ($vaiTro) {
                $q->whereNull('vai_tro');

                if ($vaiTro !== null) {
                    $q->orWhere('vai_tro', $vaiTro);
                }
            })
            ->orderBy('thu_tu')
            ->orderBy('id');
    }

    /**
     * Menu này có trỏ tới trang đang xem không (để tô sáng).
     */
    public function dangChon(): bool
    {
        $path = trim((string) parse_url($this->url, PHP_URL_PATH), '/');

        if ($path === '') {
            return $this->url === '/' && request()->is('/');
        }

        return request()->is($path, $path . '/*');
    }
}
