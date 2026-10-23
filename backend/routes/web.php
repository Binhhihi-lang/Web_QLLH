<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web
|--------------------------------------------------------------------------
| Blade đã rời khỏi đường chạy chính (ADR-001). Toàn bộ UI nằm ở Angular,
| backend chỉ phục vụ /api. Giữ một route gốc để kiểm tra tình trạng.
*/

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'message' => 'QLLH API đang chạy. Xem /api/options/subjects để kiểm tra dữ liệu.',
        'data' => [
            'api' => url('/api'),
            'health' => url('/up'),
        ],
    ]);
});
