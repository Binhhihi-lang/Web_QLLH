<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Trang chủ giờ là trang điều hướng: khách chưa đăng nhập bị đưa về /dang-nhap.
     */
    public function test_the_application_redirects_guests_to_login(): void
    {
        $this->get('/')->assertRedirect(route('login'));
    }

    public function test_login_page_returns_a_successful_response(): void
    {
        $this->get(route('login'))->assertStatus(200);
    }
}
