<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Backend chỉ phục vụ /api (ADR-001); route gốc trả JSON tình trạng.
     */
    public function test_route_goc_tra_json_tinh_trang_api(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'data' => ['api', 'health']]);
    }
}
