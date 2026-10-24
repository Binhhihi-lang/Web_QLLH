<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary — nơi lưu ảnh đại diện (ADR-019)
    |--------------------------------------------------------------------------
    |
    | Không lưu file nhị phân trong DB và không lưu trên đĩa server: ảnh đi
    | thẳng lên Cloudinary, DB chỉ giữ URL và public_id. Cùng cách làm với
    | dự án đặt vé máy bay.
    |
    */

    'cloud_name' => env('CLOUDINARY_NAME'),

    'api_key' => env('CLOUDINARY_API_KEY'),

    'api_secret' => env('CLOUDINARY_API_SECRET'),

    // Thư mục gốc trên Cloudinary. Mọi ảnh của dự án nằm dưới đây.
    'folder' => env('CLOUDINARY_FOLDER', 'qllh'),

    // Chặn ảnh quá lớn trước khi gửi lên Cloudinary (KB).
    'max_upload_kb' => (int) env('CLOUDINARY_MAX_UPLOAD_KB', 5120),

];
