<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = app()->getLocale();
        app()->setLocale('vi');

        try {
            return $next($request);
        } finally {
            app()->setLocale($locale);
        }
    }
}
