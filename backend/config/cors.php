<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    | Angular SPA chạy ở origin riêng (mặc định http://localhost:4200).
    | Dùng Bearer token nên không cần supports_credentials = true.
    | Thêm origin khi deploy bằng biến CORS_ALLOWED_ORIGINS (phân tách dấu phẩy).
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:4200')),
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
