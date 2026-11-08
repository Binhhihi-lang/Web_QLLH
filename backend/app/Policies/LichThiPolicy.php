<?php

namespace App\Policies;

use App\Models\User;

class LichThiPolicy
{
    public function xemDanhSach(User $nguoiDung): bool
    {
        return true;
    }

    public function tao(User $nguoiDung): bool
    {
        return $nguoiDung->laAdmin();
    }
}
