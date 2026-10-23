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
}
