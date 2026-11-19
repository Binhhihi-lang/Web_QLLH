<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('chuong_trinh_dao_tao')) {
            Schema::table('chuong_trinh_dao_tao', function (Blueprint $table) {
                if (! Schema::hasColumn('chuong_trinh_dao_tao', 'so_nam')) {
                    $table->decimal('so_nam', 3, 1)->default(4.0)->after('ten');
                }
                if (! Schema::hasColumn('chuong_trinh_dao_tao', 'so_ky')) {
                    $table->unsignedTinyInteger('so_ky')->default(8)->after('so_nam');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('chuong_trinh_dao_tao')) {
            Schema::table('chuong_trinh_dao_tao', function (Blueprint $table) {
                if (Schema::hasColumn('chuong_trinh_dao_tao', 'so_ky')) {
                    $table->dropColumn('so_ky');
                }
                if (Schema::hasColumn('chuong_trinh_dao_tao', 'so_nam')) {
                    $table->dropColumn('so_nam');
                }
            });
        }
    }
};

