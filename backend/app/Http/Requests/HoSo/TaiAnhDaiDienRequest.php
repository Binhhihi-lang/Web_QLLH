<?php

namespace App\Http\Requests\HoSo;

use Illuminate\Foundation\Http\FormRequest;

class TaiAnhDaiDienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'anh' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,jpg,png,webp,gif',
                'max:'.(int) config('cloudinary.max_upload_kb', 5120),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'anh.required' => 'Vui lòng chọn ảnh.',
            'anh.file' => 'Ảnh tải lên không hợp lệ.',
            'anh.image' => 'Chỉ chấp nhận file ảnh.',
            'anh.mimes' => 'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.',
            'anh.max' => 'Ảnh không được vượt quá :max KB.',
        ];
    }
}
