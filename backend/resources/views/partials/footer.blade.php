{{-- resources/views/partials/footer.blade.php --}}
@push('styles')
<style>
    footer{
        grid-area:footer; display:flex; align-items:center; justify-content:space-between;
        padding:0 26px; background:var(--navy); border-top:1px solid var(--navy-border);
        font-size:11.5px; color:#7A85AB;
    }
    footer .footer-tag{ color:var(--gold); }
</style>
@endpush

<footer>
    <div>© 2026 Hệ thống Quản lý Sinh viên</div>
    <div class="footer-tag mono">v1.0.0</div>
</footer>
