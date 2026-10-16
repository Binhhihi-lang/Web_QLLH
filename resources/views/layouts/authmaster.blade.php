{{-- resources/views/layouts/authmaster.blade.php --}}
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $title ?? 'Đăng nhập' }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --navy:        #16213E;
    --navy-2:      #1D2C52;
    --navy-border: #2A3B68;
    --gold:        #C9A227;
    --paper:       #FBF9F4;
    --ink:         #24262B;
    --ink-muted:   #6E7178;
    --line:        #E4DFD0;
    --radius:      10px;
  }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{
    background: var(--navy);
    color: var(--ink);
    font-family:'Inter', sans-serif;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
  }
  h1{ font-family:'Fraunces', serif; }
  .mono{ font-family:'JetBrains Mono', monospace; }
</style>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
@stack('styles')
</head>
<body>

@yield('content')

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
<script>
    toastr.options = { closeButton:true, progressBar:true, positionClass:"toast-top-right", timeOut:3500 };

    @if (session('success')) toastr.success("{{ session('success') }}"); @endif
    @if (session('error'))   toastr.error("{{ session('error') }}"); @endif
</script>

@stack('scripts')
</body>
</html>
