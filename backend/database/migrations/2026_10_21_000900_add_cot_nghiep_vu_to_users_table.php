<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bổ sung cột nghiệp vụ cho users theo docs/03-data-model.md mục 3.1.
     * Migration 2026_10_16_000001 đã thêm vai_tro và trang_thai.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(true)->after('trang_thai');
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();

            $table->index('vai_tro');
            $table->index('trang_thai');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropForeign(['restored_by']);
            $table->dropIndex(['vai_tro']);
            $table->dropIndex(['trang_thai']);
            $table->dropSoftDeletes();
            $table->dropColumn(['must_change_password', 'deleted_by', 'restored_by']);
        });
    }
};
