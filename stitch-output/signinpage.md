<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Sign In | EduPortal</title>
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
                        "sidebar-collapsed": "72px",
                        "sm": "8px",
                        "sidebar-width": "280px",
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
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .geometric-pattern {
            background-color: #0b1326;
            background-image: radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: 0 0, 20px 20px;
        }
        .form-input-recessed {
            background-color: #0b1326 !important;
            border-color: #3c4947 !important;
        }
        .form-input-recessed:focus {
            border-color: #4cdbcc !important;
            box-shadow: 0 0 0 2px rgba(76, 219, 204, 0.2);
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
<main class="flex min-h-screen flex-col md:flex-row overflow-hidden">
<!-- Left Side: Sign In Form (50% on Desktop) -->
<section class="flex-1 flex items-center justify-center p-lg md:p-xl z-10 bg-surface">
<div class="w-full max-w-[400px]">
<!-- Header Info for Mobile (Hidden on Desktop because logo is on right) -->
<div class="md:hidden mb-lg">
<h1 class="font-headline-lg text-headline-lg text-primary font-bold">EduPortal</h1>
</div>
<div class="mb-xl">
<h2 class="font-headline-xl text-headline-xl mb-sm text-on-surface">Welcome back</h2>
<p class="font-body-md text-on-surface-variant">Please enter your academic credentials to continue your curriculum.</p>
</div>
<form class="space-y-lg" id="signin-form" onsubmit="event.preventDefault();">
<div class="space-y-xs">
<label class="font-label-md text-label-md text-on-surface-variant block" for="email">Email Address</label>
<input class="w-full h-11 px-md rounded form-input-recessed text-on-surface transition-all duration-200" id="email" name="email" placeholder="student@university.edu" required="" type="email"/>
</div>
<div class="space-y-xs">
<div class="flex justify-between items-center">
<label class="font-label-md text-label-md text-on-surface-variant block" for="password">Password</label>
<a class="font-label-sm text-label-sm text-primary hover:underline transition-all" href="#">Forgot?</a>
</div>
<div class="relative">
<input class="w-full h-11 px-md rounded form-input-recessed text-on-surface transition-all duration-200 pr-10" id="password" name="password" placeholder="••••••••" required="" type="password"/>
<button class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors" type="button">
<span class="material-symbols-outlined text-[20px]">visibility</span>
</button>
</div>
</div>
<div class="flex items-center space-x-sm pt-xs">
<input class="w-4 h-4 rounded border-outline-variant bg-surface text-primary focus:ring-primary focus:ring-offset-background" id="remember" type="checkbox"/>
<label class="font-label-sm text-label-sm text-on-surface-variant" for="remember">Keep me signed in on this device</label>
</div>
<button class="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded flex items-center justify-center space-x-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200" type="submit">
<span>Sign In</span>
<span class="material-symbols-outlined text-[18px]">login</span>
</button>
</form>
<div class="mt-xl text-center">
<p class="font-body-sm text-body-sm text-on-surface-variant">
                        Don't have an institutional account? 
                        <a class="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-xs" href="#">Create Account</a>
</p>
</div>
<!-- Subtle Footer for Sign In -->
<div class="mt-xl pt-lg border-t border-outline-variant/30 flex justify-between">
<span class="font-label-sm text-label-sm text-on-surface-variant/60">System Status: Optimal</span>
<span class="font-label-sm text-label-sm text-on-surface-variant/60">v2.4.0</span>
</div>
</div>
</section>
<!-- Right Side: Brand Experience (50% on Desktop) -->
<section class="hidden md:flex flex-1 relative items-center justify-center overflow-hidden bg-background">
<!-- Background Graphic -->
<div class="absolute inset-0 geometric-pattern opacity-40"></div>
<!-- Atmospheric Glows -->
<div class="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px]"></div>
<div class="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary/5 rounded-full blur-[140px]"></div>
<div class="relative z-10 text-center px-xl">
<div class="mb-lg inline-flex items-center justify-center w-24 h-24 rounded-xl bg-surface-container border border-outline-variant shadow-2xl">
<span class="material-symbols-outlined text-[48px] text-primary" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<h1 class="font-headline-xl text-headline-xl font-bold tracking-tight text-on-surface mb-md">EduPortal</h1>
<div class="w-16 h-1 bg-primary mx-auto mb-lg"></div>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                    The precision platform for modern academic excellence and research management.
                </p>
<!-- Course Progress Teaser (Atmospheric Component) -->
<div class="mt-xl p-md bg-surface-container-high border border-outline-variant rounded-lg text-left max-w-xs mx-auto animate-pulse">
<div class="flex justify-between items-center mb-sm">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-wider">Active Curriculum</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">78%</span>
</div>
<div class="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-primary w-[78%]"></div>
</div>
<p class="mt-sm font-label-sm text-label-sm text-on-surface-variant">Advanced Theoretical Physics</p>
</div>
</div>
<!-- Absolute Bottom Corner Text -->
<div class="absolute bottom-md right-lg text-right">
<p class="font-label-sm text-label-sm text-on-surface-variant/40">Secure Institutional Node: 0xF249-ADMIN</p>
</div>
</section>
</main>
<script>
        // Subtle interaction for the "Sign In" button
        const signInBtn = document.querySelector('button[type="submit"]');
        signInBtn.addEventListener('click', () => {
            signInBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="ml-2">Authenticating...</span>
            `;
            setTimeout(() => {
                signInBtn.innerHTML = `<span>Success</span><span class="material-symbols-outlined">check_circle</span>`;
                signInBtn.classList.remove('bg-primary');
                signInBtn.classList.add('bg-green-500');
            }, 1500);
        });

        // Toggle password visibility
        const togglePass = document.querySelector('button[type="button"]');
        const passInput = document.getElementById('password');
        togglePass.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            const icon = togglePass.querySelector('.material-symbols-outlined');
            icon.innerText = type === 'password' ? 'visibility' : 'visibility_off';
        });
    </script>
</body></html>