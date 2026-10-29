<?php

/**
 * Bootstrap cho PHPUnit.
 *
 * Chốt an toàn chạy TRƯỚC khi bất kỳ test nào được khởi tạo, nên nó chặn
 * được cả migrate:fresh của RefreshDatabase/DatabaseMigrations lẫn truncate
 * của DatabaseTruncation.
 *
 * Quy tắc: SQLite in-memory luôn an toàn. Mọi driver khác bắt buộc tên
 * database phải kết thúc bằng _Test, để không bao giờ chạm vào database
 * thật QLLopHoc.
 */

require __DIR__.'/../vendor/autoload.php';

use Dotenv\Dotenv;
use Dotenv\Repository\RepositoryBuilder;

$goc = dirname(__DIR__);

// Laravel nạp .env.{APP_ENV} nếu tồn tại; mô phỏng đúng thứ tự đó.
// Repository immutable: biến đã có sẵn (từ phpunit.xml) được ưu tiên.
$repository = RepositoryBuilder::createWithDefaultAdapters()->immutable()->make();

$moiTruong = $repository->get('APP_ENV') ?: ($_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? null);
$tepEnv = '.env';
if ($moiTruong && is_file($goc.'/.env.'.$moiTruong)) {
    $tepEnv = '.env.'.$moiTruong;
}

Dotenv::create($repository, $goc, $tepEnv)->safeLoad();

$driver = ($_SERVER['DB_CONNECTION'] ?? $_ENV['DB_CONNECTION'] ?? null) ?: ($repository->get('DB_CONNECTION') ?: 'sqlite');
$database = (string) (($_SERVER['DB_DATABASE'] ?? $_ENV['DB_DATABASE'] ?? null) ?: $repository->get('DB_DATABASE'));

// DB_URL ghi đè toàn bộ cấu hình rời; từ chối cho chắc chắn.
if ($repository->get('DB_URL')) {
    fwrite(STDERR, "\n[CHẶN] DB_URL đang được đặt. Test không được phép chạy với DB_URL.\n");
    exit(1);
}

if ($driver === 'sqlite' && ($database === ':memory:' || $database === '')) {
    return;
}

if (! str_ends_with($database, '_Test')) {
    fwrite(STDERR, sprintf(
        "\n[CHẶN] Từ chối chạy test: driver=%s, database=%s\n".
        "Database không kết thúc bằng _Test nên có thể là dữ liệu thật.\n".
        "Đã dừng trước khi chạy bất kỳ migration nào.\n\n",
        $driver,
        $database === '' ? '(rỗng)' : $database,
    ));
    exit(1);
}
