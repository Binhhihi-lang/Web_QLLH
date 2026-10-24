<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Upload / xóa ảnh đại diện trên Cloudinary (ADR-019).
 *
 * Không lưu file trên đĩa server và không lưu nhị phân trong DB — DB chỉ giữ
 * `users.avatar_url` (để hiển thị) và `users.avatar_public_id` (để xóa ảnh cũ).
 */
class CloudinaryService
{
    /**
     * Cấu hình Cloudinary có sẵn không. Thiếu cấu hình thì endpoint upload
     * trả 503 thay vì nổ 500 — phần còn lại của hệ thống vẫn chạy.
     */
    public function daCauHinh(): bool
    {
        return filled(config('cloudinary.cloud_name'))
            && filled(config('cloudinary.api_key'))
            && filled(config('cloudinary.api_secret'));
    }

    /**
     * Upload ảnh, trả [url, public_id].
     *
     * @return array{url: string, public_id: string}
     */
    public function uploadAvatar(UploadedFile $file): array
    {
        $this->damBaoDaCauHinh();
        $this->damBaoLaAnh($file);

        try {
            $ketQua = $this->khoiTao()->upload($file->getRealPath(), [
                'folder' => $this->thuMucAvatar(),
                'resource_type' => 'image',
                // Ảnh đại diện không cần kích thước gốc: cắt vuông 512px,
                // giảm dung lượng và tránh truyền ảnh 10MP về trình duyệt.
                'transformation' => [
                    ['width' => 512, 'height' => 512, 'crop' => 'fill', 'gravity' => 'face'],
                ],
                'overwrite' => false,
            ]);
        } catch (Throwable $e) {
            Log::error('Upload avatar lên Cloudinary thất bại', ['loi' => $e->getMessage()]);

            throw new LoiNghiepVu('UPLOAD_FAILED', 'Tải ảnh lên thất bại, vui lòng thử lại.', 502);
        }

        $url = $ketQua['secure_url'] ?? null;
        $publicId = $ketQua['public_id'] ?? null;

        if ($url === null || $publicId === null) {
            throw new LoiNghiepVu('UPLOAD_FAILED', 'Tải ảnh lên thất bại, vui lòng thử lại.', 502);
        }

        return ['url' => (string) $url, 'public_id' => (string) $publicId];
    }

    /**
     * Xóa ảnh trên Cloudinary. Không ném lỗi: ảnh mồ côi trên Cloudinary
     * không đáng để làm hỏng thao tác xóa tài khoản hay đổi ảnh.
     */
    public function xoaAvatar(?string $publicId): void
    {
        if (blank($publicId) || ! $this->daCauHinh()) {
            return;
        }

        try {
            $this->khoiTao()->destroy($publicId, ['invalidate' => true]);
        } catch (Throwable $e) {
            Log::warning('Xóa avatar trên Cloudinary thất bại', [
                'public_id' => $publicId,
                'loi' => $e->getMessage(),
            ]);
        }
    }

    private function khoiTao(): UploadApi
    {
        return new UploadApi(Configuration::instance([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => ['secure' => true],
        ]));
    }

    private function thuMucAvatar(): string
    {
        return trim((string) config('cloudinary.folder', 'qllh'), '/').'/avatars';
    }

    private function damBaoDaCauHinh(): void
    {
        if (! $this->daCauHinh()) {
            throw new LoiNghiepVu(
                'UPLOAD_NOT_CONFIGURED',
                'Chức năng tải ảnh chưa được cấu hình trên máy chủ.',
                503,
            );
        }
    }

    private function damBaoLaAnh(UploadedFile $file): void
    {
        $gioiHanKb = (int) config('cloudinary.max_upload_kb', 5120);

        if ($file->getSize() > $gioiHanKb * 1024) {
            throw new LoiNghiepVu(
                'VALIDATION_ERROR',
                'Dữ liệu không hợp lệ.',
                422,
                ['anh' => ["Ảnh không được vượt quá {$gioiHanKb} KB."]],
            );
        }

        // Kiểm tra bằng nội dung file, không tin phần mở rộng hay MIME do client gửi.
        $mime = $file->getMimeType();
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            throw new LoiNghiepVu(
                'VALIDATION_ERROR',
                'Dữ liệu không hợp lệ.',
                422,
                ['anh' => ['Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.']],
            );
        }
    }
}
