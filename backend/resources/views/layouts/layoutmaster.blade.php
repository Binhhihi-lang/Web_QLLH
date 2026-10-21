<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $title ?? 'Quản lý Sinh viên' }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  /* ===== Biến dùng chung cho toàn bộ layout ===== */
  :root{
    --navy:          #16213E;
    --navy-2:        #1D2C52;
    --navy-border:   #2A3B68;
    --gold:          #C9A227;
    --gold-dim:      #3A331A;
    --paper:         #FBF9F4;
    --paper-2:       #F2EEE3;
    --ink:           #24262B;
    --ink-muted:     #6E7178;
    --line:          #E4DFD0;
    --radius:        10px;
  }

  *{ box-sizing:border-box; margin:0; padding:0; }

  /* ===== Khung grid tổng thể của trang ===== */
  body{
    background:var(--paper);
    color:var(--ink);
    font-family:'Inter', sans-serif;
    min-height:100vh;
    display:grid;
    grid-template-rows:68px 1fr 48px;
    grid-template-columns:250px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
  }

  h1, h2, .serif{ font-family:'Fraunces', serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }

  /* ===== Style cho vùng nội dung chính (main) ===== */
  main{ grid-area:main; padding:34px 38px; overflow-y:auto; }
  .page-title{ font-family:'Fraunces', serif; font-size:26px; font-weight:700; margin-bottom:6px; }
  .page-sub{ color:var(--ink-muted); font-size:13.5px; margin-bottom:26px; }
  .placeholder-box{
    border:1px dashed var(--line); background:var(--paper-2); border-radius:var(--radius);
    padding:44px 24px; text-align:center; color:var(--ink-muted); font-size:13.5px;
  }
  .placeholder-box code{
    display:inline-block; margin-top:10px; background:#fff; border:1px solid var(--line);
    padding:4px 10px; border-radius:6px; font-size:12px; color:var(--navy);
  }

  @media (max-width: 860px){
    body{ grid-template-columns:1fr; grid-template-areas: "header" "main" "footer"; }
  }
</style>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
</head>
<body>

    @include('partials.header')
    @include('partials.sidebar')

    <main>
        @yield('content')
    </main>

    @include('partials.footer')

    @stack('styles')
    @stack('scripts')

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>

<script>
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3500,
    };

    @if (session('success'))
        toastr.success("{{ session('success') }}");
    @endif

    @if (session('error'))
        toastr.error("{{ session('error') }}");
    @endif

    @if ($errors->any())
        @foreach ($errors->all() as $error)
            toastr.error("{{ $error }}");
        @endforeach
    @endif
</script>

@stack('scripts')

</body>
</html>