const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "stitch-output");

const HEAD = (title, extraStyle = "") => `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
tailwind.config={darkMode:"class",theme:{extend:{colors:{primary:"#4cdbcc","primary-container":"#0fbaac",background:"#0b1326",surface:"#0b1326","on-surface":"#dae2fd","on-surface-variant":"#bbcac6","surface-container-low":"#131b2e","surface-container":"#171f33","surface-container-high":"#222a3d","surface-container-highest":"#2d3449","secondary-container":"#0053db","on-secondary-container":"#cdd7ff","outline-variant":"#3c4947",outline:"#859491",error:"#ffb4ab","error-container":"#93000a"},spacing:{"sidebar-width":"280px","container-max":"1280px"},fontSize:{"headline-lg":["24px",{lineHeight:"32px",fontWeight:"600"}],"headline-md":["20px",{lineHeight:"28px",fontWeight:"600"}],"body-md":["16px",{lineHeight:"24px"}],"body-sm":["14px",{lineHeight:"20px"}],"label-md":["14px",{lineHeight:"16px",fontWeight:"600"}],"label-sm":["12px",{lineHeight:"14px",fontWeight:"500"}]}}}};
</script>
<style>
.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24}
::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:#0b1326}::-webkit-scrollbar-thumb{background:#3c4947;border-radius:4px}
${extraStyle}
</style>
</head>`;

const adminNav = (active) => {
  const items = [
    ["dashboard", "Dashboard"],
    ["badge", "Staff"],
    ["school", "Students"],
    ["perm_media", "Media"],
    ["account_tree", "Hierarchy"],
    ["group", "Users"],
    ["analytics", "Analytics"],
  ];
  return items
    .map(([icon, label]) => {
      const on = label === active;
      const cls = on
        ? "flex items-center gap-md bg-secondary-container text-on-secondary-container border-l-4 border-primary px-md py-sm"
        : "flex items-center gap-md text-on-surface-variant hover:text-on-surface px-md py-sm hover:bg-surface-container-high transition-colors";
      return `<a class="${cls}" href="#"><span class="material-symbols-outlined">${icon}</span><span class="text-label-md">${label}</span></a>`;
    })
    .join("\n");
};

const adminShell = (active, title, subtitle, body) => `${HEAD(title)}
<body class="bg-background text-on-surface overflow-hidden">
<aside class="hidden lg:flex flex-col fixed left-0 top-0 w-[280px] h-full bg-surface-container-low border-r border-outline-variant z-50">
<div class="p-6"><h1 class="text-headline-md font-bold text-primary">EduAdmin Pro</h1><p class="text-label-sm text-on-surface-variant">System Management</p></div>
<nav class="flex-1 px-4 space-y-1">${adminNav(active)}</nav>
</aside>
<main class="lg:ml-[280px] min-h-screen flex flex-col h-screen">
<header class="h-16 px-6 flex items-center justify-between border-b border-outline-variant bg-surface sticky top-0 z-40">
<h2 class="text-headline-md font-bold text-primary">${title}</h2>
<div class="flex items-center gap-3"><span class="material-symbols-outlined text-on-surface-variant">notifications</span><img class="h-8 w-8 rounded-full bg-surface-container-highest" alt="Admin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0Eu3Z0y23ZAKLm_njttfoaRaJVEyc4-hJuPc3RyJV90h0wKIA55xx7nzBi_X-On36fMI-yG9qOyAtPzV8HuonzTdS7Dc1iYWaWYLOrijqw-Yr_7Pbi2FQyhBMPUQxqV3Pn0D5T8Pyj4ZCAbuBI3UmHp4rieOWSFrWru77vRidQCDGAGC2MXsLS0cQP0vsHpAU_khjFa0DjG-0f_iSJlzri6LHNx6TbhkNP-CZrZQ-WTkZ1o5DM5b7jL6YXofc9wkEb-OVHXzJYJfA"/></div>
</header>
<div class="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1280px] w-full mx-auto">
<section><h1 class="text-headline-lg font-bold">${subtitle}</h1><p class="text-body-md text-on-surface-variant mt-1">${title} — stitch-output preview</p></section>
${body}
</div></main></body></html>`;

const studentShell = (active, title, body, yearBanner = "Second Year") => `${HEAD(title, ".mono-code{font-family:ui-monospace,monospace;letter-spacing:.15em}")}
<body class="bg-background text-on-surface min-h-screen flex flex-col">
<header class="border-b border-outline-variant bg-surface-container-low px-6 py-4">
<div class="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary text-3xl">school</span>
<div><h1 class="text-headline-md font-bold text-primary">Education Center</h1><p class="text-label-sm text-on-surface-variant">Current Year: ${yearBanner}</p></div></div>
<nav class="flex items-center gap-2">
<a class="px-4 py-2 rounded-lg text-label-md ${active === "browse" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-high"}" href="#">Browse Content</a>
<a class="px-4 py-2 rounded-lg text-label-md ${active === "code" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-high"}" href="#">Enter Code</a>
<button class="px-4 py-2 rounded-lg text-label-md text-error hover:bg-surface-container-high">Logout</button>
</nav></div></header>
<main class="flex-1 p-6 max-w-[1280px] w-full mx-auto">${body}</main></body></html>`;

const pages = {
  "06.md": adminShell(
    "Hierarchy",
    "Academic Hierarchy",
    "Years, Terms, Subjects, Sections & Lectures",
    `<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
<div class="xl:col-span-1 bg-surface-container-low border border-outline-variant rounded-xl p-4 max-h-[70vh] overflow-y-auto">
<h3 class="text-headline-md font-bold mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-primary">account_tree</span>Hierarchy Tree</h3>
<ul class="space-y-2 text-body-sm" id="tree">
<li><button class="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-surface-container-high"><span class="material-symbols-outlined text-primary">folder</span>First Year</button>
<ul class="ml-6 mt-1 space-y-1 border-l border-outline-variant pl-3">
<li><button class="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-surface-container-high"><span class="material-symbols-outlined">folder</span>Term 1</button>
<ul class="ml-4 space-y-1">
<li class="p-2 rounded bg-surface-container border border-primary/40"><span class="material-symbols-outlined text-sm align-middle">menu_book</span> Mathematics → Section A</li>
<li class="text-on-surface-variant pl-6">🎬 Intro to Algebra <code class="text-primary text-xs">X7K9M2PL5VQ1</code></li>
</ul></li></ul></li>
<li class="opacity-60"><button class="w-full text-left flex items-center gap-2 p-2"><span class="material-symbols-outlined">folder</span>Second Year</button></li>
</ul>
<button class="mt-4 w-full py-2 bg-primary-container text-on-primary rounded font-label-md">+ Add Academic Year</button>
</div>
<div class="xl:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
<p class="text-label-sm text-on-surface-variant uppercase">Breadcrumb: First Year / Term 1 / Mathematics / Section A / Intro to Algebra</p>
<h3 class="text-headline-md font-bold">Edit Lecture</h3>
<label class="block text-label-sm text-on-surface-variant">Title</label>
<input class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm" value="Intro to Algebra"/>
<label class="block text-label-sm text-on-surface-variant mt-2">Description</label>
<textarea class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm h-24">Chapter 1 overview</textarea>
<div class="flex items-center gap-4 p-4 bg-surface-container rounded-lg border border-outline-variant">
<div><p class="text-label-sm text-on-surface-variant">Access Code</p><p class="mono-code text-xl text-primary font-bold" id="lec-code">X7K9M2PL5VQ1</p></div>
<button class="px-4 py-2 bg-primary text-on-primary rounded font-label-md" onclick="navigator.clipboard?.writeText(document.getElementById('lec-code').textContent);alert('Copied')">Copy</button>
<button class="px-4 py-2 border border-outline-variant rounded font-label-md hover:bg-surface-container-high">Regenerate Code</button>
</div>
<label class="flex items-center gap-2 mt-2"><input type="checkbox" checked class="rounded text-primary"/> Published</label>
<div class="flex gap-3 pt-4">
<button class="px-6 py-2 bg-primary-container rounded font-label-md">Save</button>
<button class="px-6 py-2 border border-error text-error rounded font-label-md">Delete</button>
</div></div></div>`,
  ),

  "07.md": adminShell(
    "Users",
    "Users & Subscriptions",
    "Assign term or full-year access",
    `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
<div class="p-4 border-b border-outline-variant flex gap-2"><input class="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm" placeholder="Search students..."/><select class="bg-surface border border-outline-variant rounded-lg px-3 text-body-sm"><option>All</option><option>Active subs</option></select></div>
<table class="w-full text-left text-body-sm"><thead class="bg-surface-container border-b border-outline-variant"><tr><th class="p-3">Student</th><th class="p-3">Status</th></tr></thead><tbody>
<tr class="border-b border-outline-variant hover:bg-surface-container-high cursor-pointer bg-surface-container"><td class="p-3">Mohamed Ali<br/><span class="text-on-surface-variant text-xs">m@school.com</span></td><td class="p-3"><span class="text-primary text-xs font-bold">ACTIVE</span></td></tr>
<tr class="border-b border-outline-variant hover:bg-surface-container-high cursor-pointer"><td class="p-3">Sara Hassan</td><td class="p-3"><span class="text-on-surface-variant text-xs">No sub</span></td></tr>
</tbody></table></div>
<div class="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
<h3 class="text-headline-md font-bold">Assign Subscription</h3>
<select class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm"><option>Mohamed Ali</option></select>
<div class="flex gap-4"><label class="flex items-center gap-2"><input type="radio" name="type" checked/> TERM</label><label class="flex items-center gap-2"><input type="radio" name="type"/> FULL_YEAR</label></div>
<select class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm"><option>2026-2027 — Term 1</option></select>
<div class="grid grid-cols-2 gap-3"><div><label class="text-label-sm text-on-surface-variant">Start</label><input type="date" class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm" value="2026-09-01"/></div>
<div><label class="text-label-sm text-on-surface-variant">End</label><input type="date" class="w-full bg-surface border border-outline-variant rounded-lg p-3 text-body-sm" value="2027-01-31"/></div></div>
<button class="w-full py-3 bg-primary-container text-on-primary rounded-lg font-label-md">POST /api/subscriptions</button>
<h4 class="text-label-md font-bold pt-2">Existing</h4>
<div class="p-3 bg-surface-container rounded-lg text-body-sm border border-outline-variant">TERM · Term 1 · ends Jan 31, 2027 <button class="text-error text-xs float-right">Revoke</button></div>
</div></div>`,
  ),

  "08.md": adminShell(
    "Analytics",
    "Usage Analytics",
    "Per-student media consumption",
    `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl"><p class="text-label-sm text-on-surface-variant">Total Hours</p><p class="text-headline-lg font-bold text-primary">1,284h</p></div>
<div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl"><p class="text-label-sm text-on-surface-variant">Completed</p><p class="text-headline-lg font-bold">42%</p></div>
<div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl"><p class="text-label-sm text-on-surface-variant">Active Students</p><p class="text-headline-lg font-bold">318</p></div>
<div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between"><div><p class="text-label-sm text-on-surface-variant">Export</p><p class="text-body-sm">CSV download</p></div><button class="px-3 py-2 bg-primary-container rounded font-label-md text-sm">Export CSV</button></div>
</div>
<div class="flex flex-wrap gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
<input class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm" placeholder="Search student"/>
<select class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm"><option>All types</option><option>VIDEO</option><option>AUDIO</option></select>
<select class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm"><option>All completion</option><option>Completed ≥95%</option></select>
<input type="date" class="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm"/>
</div>
<div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-x-auto">
<table class="w-full text-left text-body-sm"><thead class="bg-surface-container border-b border-outline-variant"><tr>
<th class="p-3">Student</th><th class="p-3">Media</th><th class="p-3">Lecture</th><th class="p-3">Progress</th><th class="p-3">Updated</th>
</tr></thead><tbody>
<tr class="border-b border-outline-variant"><td class="p-3">Mohamed Ali</td><td class="p-3">lesson1.mp4</td><td class="p-3">Intro to Physics</td><td class="p-3"><div class="w-32 h-2 bg-surface-container rounded-full"><div class="h-full bg-primary rounded-full" style="width:51%"></div></div><span class="text-xs text-on-surface-variant">51%</span></td><td class="p-3 text-on-surface-variant">May 25, 2026</td></tr>
</tbody></table></div>`,
  ),

  "09.md": studentShell(
    "browse",
    "Student App Shell",
    `<div class="bg-surface-container-low border border-dashed border-primary/50 rounded-xl p-12 text-center">
<span class="material-symbols-outlined text-5xl text-primary mb-4">widgets</span>
<h2 class="text-headline-lg font-bold mb-2">Student Layout Shell</h2>
<p class="text-body-md text-on-surface-variant max-w-lg mx-auto">Wraps /student, /student/code, /student/watch/[lectureId]. Session via GET /api/auth/session — redirect non-STUDENT to /login.</p>
<p class="text-label-sm text-primary mt-6">{children} slot renders here</p></div>`,
    "Second Year",
  ),

  "10.md": studentShell(
    "code",
    "Enter Lecture Code",
    `<div class="flex justify-center py-12">
<div class="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-xl space-y-6 text-center">
<span class="material-symbols-outlined text-4xl text-primary">key</span>
<h2 class="text-headline-md font-bold">Enter Lecture Code</h2>
<input id="code-input" maxlength="12" class="mono-code w-full text-center text-2xl bg-surface border-2 border-outline-variant focus:border-primary rounded-xl p-4 uppercase tracking-widest" placeholder="XXXXXXXXXXXX" value=""/>
<p class="text-body-sm text-on-surface-variant">Enter the code provided by your instructor.</p>
<button id="redeem-btn" class="w-full py-3 bg-primary-container text-on-primary rounded-xl font-label-md hover:brightness-110">Unlock Lecture</button>
<p id="code-msg" class="text-body-sm text-error hidden"></p>
</div></div>
<script>
const inp=document.getElementById('code-input');
inp.addEventListener('input',()=>{inp.value=inp.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);});
document.getElementById('redeem-btn').onclick=()=>{
const c=inp.value;if(c.length!==12){document.getElementById('code-msg').textContent='Code must be 12 characters';document.getElementById('code-msg').classList.remove('hidden');return;}
document.getElementById('code-msg').textContent='POST /api/lecture-codes/redeem → redirect /student/watch/'+c;
document.getElementById('code-msg').classList.remove('hidden');document.getElementById('code-msg').classList.remove('text-error');document.getElementById('code-msg').classList.add('text-primary');
};
</script>`,
    "Second Year",
  ),

  "11.md": studentShell(
    "browse",
    "Browse Content",
    `<div class="space-y-4" id="content-tree">
<details open class="bg-surface-container-low border border-outline-variant rounded-xl"><summary class="p-4 cursor-pointer font-bold flex items-center gap-2"><span class="material-symbols-outlined">folder</span>First Year</summary>
<details open class="mx-4 mb-4 border-l border-outline-variant pl-4"><summary class="p-3 cursor-pointer font-medium">Term 1</summary>
<div class="grid md:grid-cols-2 gap-3 p-3">
<div class="p-4 bg-surface-container rounded-lg border border-outline-variant"><h4 class="font-bold mb-2">Mathematics — Section A</h4>
<a class="flex items-center justify-between p-2 rounded hover:bg-surface-container-high" href="#"><span class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">play_circle</span>Introduction</span><span class="text-xs text-primary">Unlocked</span></a>
<div class="flex items-center justify-between p-2 rounded opacity-60"><span class="flex items-center gap-2"><span class="material-symbols-outlined">lock</span>Advanced Topic</span><span class="text-xs">Enter code</span></div>
</div></div></details></details>
<p class="text-label-sm text-on-surface-variant text-center">GET /api/student/content-tree</p></div>`,
    "Second Year",
  ),

  "12.md": `${HEAD("Protected Video Player", ".video-shell{user-select:none;-webkit-user-select:none}")}
<body class="bg-background text-on-surface p-8 max-w-4xl mx-auto">
<h1 class="text-headline-lg font-bold mb-2">VideoPlayer.tsx</h1>
<p class="text-body-sm text-on-surface-variant mb-6">HLS via hls.js · GET /api/stream/:mediaId/manifest · progress every 5s</p>
<div class="video-shell relative bg-black rounded-xl overflow-hidden aspect-video border border-outline-variant" oncontextmenu="return false">
<video id="vid" class="w-full h-full" controls controlsList="nodownload" disablePictureInPicture></video>
<div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 flex items-center justify-between">
<div class="flex gap-2"><button class="px-2 py-1 bg-white/10 rounded text-sm speed-btn" data-s="1">1x</button><button class="px-2 py-1 bg-white/10 rounded text-sm speed-btn" data-s="1.5">1.5x</button><button class="px-2 py-1 bg-white/10 rounded text-sm speed-btn" data-s="2">2x</button><button class="px-2 py-1 bg-white/10 rounded text-sm speed-btn" data-s="3">3x</button></div>
<span class="text-xs text-white/70">Protected stream · no right-click</span></div>
</div>
<p class="text-label-sm text-on-surface-variant mt-4">Props: lectureId, mediaId · Watermark overlay optional</p>
<script>document.querySelectorAll('.speed-btn').forEach(b=>b.onclick=()=>{document.getElementById('vid').playbackRate=parseFloat(b.dataset.s);});</script>
</body></html>`,

  "13.md": `${HEAD("Protected Audio Player")}
<body class="bg-background text-on-surface p-8 max-w-xl mx-auto">
<h1 class="text-headline-lg font-bold mb-6">AudioPlayer.tsx</h1>
<div class="bg-surface-container-low border border-outline-variant rounded-2xl p-8 space-y-6">
<div class="flex items-center justify-center"><span class="material-symbols-outlined text-6xl text-primary">graphic_eq</span></div>
<p class="text-center font-bold">Lab Session 2 — Audio</p>
<audio id="aud" class="w-full" controls controlsList="nodownload"></audio>
<div class="flex justify-center gap-2"><button class="px-3 py-1 bg-surface-container rounded speed" data-s="1">1x</button><button class="px-3 py-1 bg-surface-container rounded speed" data-s="1.5">1.5x</button><button class="px-3 py-1 bg-surface-container rounded speed" data-s="2">2x</button></div>
<p class="text-label-sm text-center text-on-surface-variant">GET /api/stream/:mediaId/manifest · POST progress</p>
</div>
<script>document.querySelectorAll('.speed').forEach(b=>b.onclick=()=>{document.getElementById('aud').playbackRate=parseFloat(b.dataset.s);});</script>
</body></html>`,

  "14.md": `${HEAD("Protected PDF Viewer", ".pdf-frame{user-select:none}")}
<body class="bg-background text-on-surface p-8">
<h1 class="text-headline-lg font-bold mb-2 max-w-5xl mx-auto">PdfViewer.tsx</h1>
<p class="text-body-sm text-on-surface-variant mb-4 max-w-5xl mx-auto">GET /api/stream/:mediaId/pdf?token=… · iframe sandbox · watermark with student email</p>
<div class="pdf-frame relative max-w-5xl mx-auto bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden" style="height:70vh">
<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-4xl font-bold rotate-[-25deg] z-10">student@school.com</div>
<iframe class="w-full h-full bg-white" title="PDF" src="about:blank"></iframe>
<div class="absolute bottom-4 right-4 flex gap-2 z-20">
<button class="px-3 py-2 bg-surface-container rounded shadow material-symbols-outlined">zoom_in</button>
<button class="px-3 py-2 bg-surface-container rounded shadow material-symbols-outlined">zoom_out</button>
</div></div>
<p class="text-center text-label-sm text-on-surface-variant mt-4 max-w-5xl mx-auto">Disable print/download · context menu blocked</p>
</body></html>`,

  "15.md": studentShell(
    "browse",
    "Watch Lecture",
    `<div class="space-y-4">
<div class="flex items-center justify-between"><a href="#" class="flex items-center gap-1 text-primary text-body-sm"><span class="material-symbols-outlined">arrow_back</span>Back to Content</a>
<h2 class="text-headline-md font-bold">Introduction to Physics</h2></div>
<div class="flex border-b border-outline-variant gap-2">
<button class="px-4 py-2 border-b-2 border-primary text-primary font-label-md">Video</button>
<button class="px-4 py-2 text-on-surface-variant font-label-md">Audio</button>
<button class="px-4 py-2 text-on-surface-variant font-label-md">PDF</button>
</div>
<div class="bg-black rounded-xl aspect-video flex items-center justify-center border border-outline-variant relative">
<span class="material-symbols-outlined text-6xl text-primary/80">play_circle</span>
<p class="absolute bottom-4 left-4 text-xs text-white/60">VideoPlayer · mediaId · lectureId</p>
</div>
<p class="text-label-sm text-on-surface-variant">GET /api/media?lectureId=… · canAccess check · tabs for VIDEO/AUDIO/PDF</p></div>`,
    "Second Year",
  ),
};

for (const [file, html] of Object.entries(pages)) {
  const outPath = path.join(OUT, file);
  fs.writeFileSync(outPath, html, "utf8");
  console.log("Wrote", outPath, "(" + html.length + " bytes)");
}
