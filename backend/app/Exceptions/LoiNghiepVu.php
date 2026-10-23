<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;

/**
 * Lỗi nghiệp vụ có mã lỗi, khớp bảng ma_loi trong docs/04-api-contract.md mục 1.5.
 */
class LoiNghiepVu extends \RuntimeException
{
    public function __construct(
        public readonly string $maLoi,
        string $message,
        public readonly int $status = 409,
        public readonly mixed $errors = null,
    ) {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'ma_loi' => $this->maLoi,
            'errors' => $this->errors,
        ], $this->status);
    }
}
