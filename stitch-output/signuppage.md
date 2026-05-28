<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>EduPortal - Sign Up</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "secondary": "#b4c5ff",
                      "on-secondary-fixed-variant": "#003ea8",
                      "tertiary-fixed-dim": "#ffb59b",
                      "surface-container-lowest": "#060e20",
                      "surface": "#0b1326",
                      "on-primary": "#003732",
                      "on-primary-fixed-variant": "#005049",
                      "on-primary-container": "#00443e",
                      "on-secondary-fixed": "#00174b",
                      "surface-container-highest": "#2d3449",
                      "on-background": "#dae2fd",
                      "surface-tint": "#4cdbcc",
                      "surface-container-high": "#222a3d",
                      "inverse-surface": "#dae2fd",
                      "tertiary-fixed": "#ffdbcf",
                      "secondary-fixed-dim": "#b4c5ff",
                      "primary-fixed": "#6ef8e8",
                      "on-secondary": "#002a78",
                      "on-primary-fixed": "#00201d",
                      "background": "#0b1326",
                      "on-tertiary-container": "#6d2301",
                      "surface-container": "#171f33",
                      "surface-container-low": "#131b2e",
                      "on-surface": "#dae2fd",
                      "on-error-container": "#ffdad6",
                      "tertiary-container": "#f58960",
                      "surface-variant": "#2d3449",
                      "surface-dim": "#0b1326",
                      "secondary-container": "#0053db",
                      "on-surface-variant": "#bbcac6",
                      "outline-variant": "#3c4947",
                      "on-secondary-container": "#cdd7ff",
                      "on-tertiary-fixed": "#380d00",
                      "primary-fixed-dim": "#4cdbcc",
                      "error-container": "#93000a",
                      "error": "#ffb4ab",
                      "on-tertiary": "#5b1b00",
                      "on-error": "#690005",
                      "primary": "#4cdbcc",
                      "inverse-primary": "#006a62",
                      "secondary-fixed": "#dbe1ff",
                      "on-tertiary-fixed-variant": "#7c2d0b",
                      "tertiary": "#ffb59b",
                      "surface-bright": "#31394d",
                      "primary-container": "#0fbaac",
                      "inverse-on-surface": "#283044",
                      "outline": "#859491"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "xs": "4px",
                      "md": "16px",
                      "container-max": "1280px",
                      "sm": "8px",
                      "unit": "4px",
                      "lg": "24px",
                      "xl": "48px"
              },
              "fontFamily": {
                      "headline-xl": ["Inter"],
                      "headline-lg": ["Inter"],
                      "headline-md": ["Inter"],
                      "body-sm": ["Inter"],
                      "body-md": ["Inter"],
                      "body-lg": ["Inter"],
                      "label-sm": ["Inter"],
                      "label-md": ["Inter"],
                      "headline-xl-mobile": ["Inter"]
              },
              "fontSize": {
                      "headline-xl": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                      "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                      "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                      "label-sm": ["12px", {"lineHeight": "14px", "fontWeight": "500"}],
                      "label-md": ["14px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "headline-xl-mobile": ["28px", {"lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "700"}]
              }
            },
          },
        }
    </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0b1326;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .geometric-bg {
            background: linear-gradient(135deg, #0b1326 25%, transparent 25%) -50px 0,
                        linear-gradient(225deg, #0b1326 25%, transparent 25%) -50px 0,
                        linear-gradient(315deg, #0b1326 25%, transparent 25%),
                        linear-gradient(45deg, #0b1326 25%, transparent 25%);
            background-size: 100px 100px;
            background-color: #060e20;
        }
        .form-recess {
            background-color: #0b1326;
        }
        .canvas-interactive {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex">
<main class="flex w-full min-h-screen">
<!-- Left Side: Form Section -->
<section class="w-full md:w-1/2 flex items-center justify-center p-lg bg-surface relative z-10">
<div class="w-full max-w-md space-y-xl">
<!-- Mobile Branding -->
<div class="md:hidden mb-lg flex items-center gap-sm">
<span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">school</span>
<span class="font-headline-lg text-headline-lg font-bold text-primary">EduPortal</span>
</div>
<div class="space-y-sm">
<h1 class="font-headline-xl text-headline-xl md:text-headline-xl text-on-surface">Join the Academic Hub</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Create your professional account to access advanced learning resources.</p>
</div>
<form action="#" class="space-y-md" method="POST">
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant" for="full_name">Full Name</label>
<div class="relative">
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-md py-sm rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 font-body-md text-body-md" id="full_name" name="full_name" placeholder="Dr. Jane Smith" required="" type="text"/>
</div>
</div>
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant" for="email">Email Address</label>
<div class="relative">
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-md py-sm rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 font-body-md text-body-md" id="email" name="email" placeholder="jane.smith@university.edu" required="" type="email"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant" for="password">Password</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-md py-sm rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 font-body-md text-body-md" id="password" name="password" required="" type="password"/>
</div>
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant" for="confirm_password">Confirm Password</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface px-md py-sm rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 font-body-md text-body-md" id="confirm_password" name="confirm_password" required="" type="password"/>
</div>
</div>
<div class="pt-sm">
<button class="w-full bg-primary text-on-primary font-label-md text-label-md py-md rounded font-bold hover:bg-primary-container active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-sm" type="submit">
                            Create Account
                            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</div>
</form>
<div class="flex flex-col items-center gap-md border-t border-outline-variant pt-lg">
<p class="font-body-sm text-body-sm text-on-surface-variant">
                        Already have an account? 
                        <a class="text-primary font-bold hover:underline" href="#">Sign in</a>
</p>
<div class="flex gap-md">
<button class="p-sm bg-surface-container text-on-surface-variant rounded border border-outline-variant hover:border-primary transition-colors">
<span class="material-symbols-outlined">shield</span>
</button>
<button class="p-sm bg-surface-container text-on-surface-variant rounded border border-outline-variant hover:border-primary transition-colors">
<span class="material-symbols-outlined">help</span>
</button>
</div>
</div>
</div>
</section>
<!-- Right Side: Geometric Branding -->
<section class="hidden md:flex w-1/2 relative overflow-hidden bg-surface-container-lowest items-center justify-center">
<!-- Background Layer -->
<div class="absolute inset-0 geometric-bg opacity-30"></div>
<canvas class="canvas-interactive" id="atmosphereCanvas"></canvas>
<!-- Abstract Shapes -->
<div class="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
<div class="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]"></div>
<!-- Logo Content -->
<div class="relative z-10 text-center space-y-lg animate-fade-in">
<div class="inline-flex items-center justify-center p-xl rounded-full bg-surface-container-highest/50 backdrop-blur-md border border-outline-variant shadow-2xl mb-lg">
<span class="material-symbols-outlined text-primary text-[80px]" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<h2 class="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold mb-sm">EduPortal</h2>
<p class="font-body-lg text-body-lg text-secondary-fixed opacity-80 max-w-xs mx-auto">Precision-engineered learning for the modern researcher.</p>
</div>
<div class="grid grid-cols-3 gap-lg pt-xl">
<div class="flex flex-col items-center">
<span class="material-symbols-outlined text-primary-fixed-dim text-2xl mb-xs">verified_user</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Secure</span>
</div>
<div class="flex flex-col items-center border-x border-outline-variant px-lg">
<span class="material-symbols-outlined text-primary-fixed-dim text-2xl mb-xs">bolt</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Fast</span>
</div>
<div class="flex flex-col items-center">
<span class="material-symbols-outlined text-primary-fixed-dim text-2xl mb-xs">database</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Reliable</span>
</div>
</div>
</div>
<!-- Footer-style credits in the corner -->
<div class="absolute bottom-md right-md">
<span class="font-label-sm text-label-sm text-on-surface-variant opacity-50">© 2024 EduPortal Ecosystem</span>
</div>
</section>
</main>
<script>
        // Micro-interaction: Atmosphere Particles on Right Side
        const canvas = document.getElementById('atmosphereCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = `rgba(76, 219, 204, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            particles = [];
            for (let i = 0; i < 40; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }

        init();
        animate();

        // Form Submission visual feedback
        const form = document.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Processing...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Success';
                btn.classList.replace('bg-primary', 'bg-green-600');
            }, 1500);
        });
    </script>
</body></html>