/* Interactive effects: hero smoke trail (2D canvas) + liquid hover distortion on project images (WebGL). */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- 1. Hero smoke / fluid trail ---------- */
    (function hero() {
        var banner = document.getElementById('home');
        if (!banner) return;
        var cv = document.createElement('canvas');
        cv.className = 'hero-fx';
        banner.insertBefore(cv, banner.firstChild);
        var ctx = cv.getContext('2d');
        var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
        var parts = [], mouse = {x: -1, y: -1, px: -1, py: -1, active: false};
        var visible = true;

        function resize() {
            var r = banner.getBoundingClientRect();
            w = r.width; h = r.height;
            cv.width = w * dpr; cv.height = h * dpr;
            cv.style.width = w + 'px'; cv.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        function spawn(x, y, vx, vy, big) {
            if (parts.length > 160) parts.shift();
            parts.push({
                x: x, y: y,
                vx: vx + (Math.random() - 0.5) * 0.8,
                vy: vy + (Math.random() - 0.5) * 0.8 - 0.25,
                r: (big ? 40 : 22) + Math.random() * 34,
                life: 1,
                decay: 0.006 + Math.random() * 0.01,
                hue: 285 + Math.random() * 50 // purple -> pink
            });
        }
        banner.addEventListener('mousemove', function (e) {
            var r = banner.getBoundingClientRect();
            mouse.px = mouse.x; mouse.py = mouse.y;
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
            mouse.active = true;
            if (mouse.px >= 0) {
                var dx = mouse.x - mouse.px, dy = mouse.y - mouse.py;
                var sp = Math.min(Math.sqrt(dx * dx + dy * dy), 60);
                var n = Math.ceil(sp / 12);
                for (var i = 0; i < n; i++) spawn(mouse.px + dx * i / n, mouse.py + dy * i / n, dx * 0.06, dy * 0.06, sp > 25);
            }
        });
        banner.addEventListener('mouseleave', function () { mouse.px = mouse.x = -1; mouse.active = false; });
        banner.addEventListener('click', function (e) {
            var r = banner.getBoundingClientRect();
            for (var i = 0; i < 14; i++) {
                var a = Math.random() * 6.283, s = 1 + Math.random() * 3;
                spawn(e.clientX - r.left, e.clientY - r.top, Math.cos(a) * s, Math.sin(a) * s, true);
            }
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(banner);
        }
        // ambient drifting smoke so touch devices / idle visitors still see motion
        var t = 0;
        function frame() {
            requestAnimationFrame(frame);
            if (!visible) return;
            t += 0.01;
            if (!mouse.active && Math.random() < 0.06) spawn(w * (0.2 + 0.6 * Math.random()), h * (0.5 + 0.4 * Math.random()), Math.sin(t) * 0.4, -0.4, true);
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';
            for (var i = parts.length - 1; i >= 0; i--) {
                var p = parts[i];
                p.x += p.vx; p.y += p.vy;
                p.vx *= 0.985; p.vy *= 0.985; p.vy -= 0.004;
                p.r += 0.35; p.life -= p.decay;
                if (p.life <= 0) { parts.splice(i, 1); continue; }
                var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                var a = 0.16 * p.life;
                g.addColorStop(0, 'hsla(' + p.hue + ',90%,70%,' + a + ')');
                g.addColorStop(1, 'hsla(' + p.hue + ',90%,50%,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        window.addEventListener('resize', resize);
        resize(); frame();
    })();

    /* ---------- 2. Liquid distortion on project thumbnails (WebGL) ---------- */
    if (!fine) return;

    var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;v.y=1.0-v.y;gl_Position=vec4(p,0.,1.);}';
    var FS = [
        'precision mediump float;varying vec2 v;uniform sampler2D tex;uniform vec2 mouse;uniform float hover,time,ratio;uniform vec2 scale;',
        'void main(){',
        '  vec2 uv=v;',                                       // canvas uv (0..1, y down)
        '  vec2 d=(uv-mouse)*vec2(ratio,1.0);float dist=length(d);',
        '  vec2 dir=dist>0.0001?normalize(d):vec2(0.0);',
        '  float ring=sin(dist*34.0-time*5.0)*exp(-dist*4.5);',
        '  vec2 flow=vec2(sin(uv.y*11.0+time*2.0),cos(uv.x*11.0+time*2.3))*0.006;',
        '  vec2 off=(dir*ring*0.016+flow*exp(-dist*2.0))*hover;',
        '  vec2 t=uv+off;',
        '  t=(t-0.5)*scale+0.5; t.y=(uv.y+off.y)*scale.y;',    // cover mapping, anchored to top
        '  float s=0.003*hover;',
        '  float r=texture2D(tex,t+vec2(s,0.)).r;float g=texture2D(tex,t).g;float b=texture2D(tex,t-vec2(s,0.)).b;',
        '  gl_FragColor=vec4(r,g,b,1.0);',
        '}'
    ].join('\n');

    function sh(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }

    function setup(thumb) {
        var img = thumb.querySelector('img');
        if (!img) return;
        var state = null, failed = false;

        function build() {
            var cv = document.createElement('canvas');
            cv.className = 'liquid-fx';
            var gl = cv.getContext('webgl', {alpha: false, antialias: false}) || cv.getContext('experimental-webgl');
            if (!gl) { failed = true; return null; }
            var vs = sh(gl, gl.VERTEX_SHADER, VS), fs = sh(gl, gl.FRAGMENT_SHADER, FS);
            if (!vs || !fs) { failed = true; return null; }
            var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
            gl.useProgram(pr);
            var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }
            catch (e) { failed = true; return null; }
            return {cv: cv, gl: gl, pr: pr, u: {
                mouse: gl.getUniformLocation(pr, 'mouse'), hover: gl.getUniformLocation(pr, 'hover'),
                time: gl.getUniformLocation(pr, 'time'), ratio: gl.getUniformLocation(pr, 'ratio'),
                scale: gl.getUniformLocation(pr, 'scale')},
                mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, hover: 0, target: 0, raf: 0, t0: performance.now()};
        }

        function size(s) {
            var r = thumb.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
            s.cv.width = Math.round(r.width * d); s.cv.height = Math.round(r.height * d);
            s.gl.viewport(0, 0, s.cv.width, s.cv.height);
            var ca = r.width / r.height, ia = img.naturalWidth / img.naturalHeight;
            // object-fit: cover scale factors in uv space
            s.sx = ca > ia ? 1.0 : ca / ia;
            s.sy = ca > ia ? ia / ca : 1.0;
            s.ratio = ca;
        }

        function draw(s) {
            s.raf = requestAnimationFrame(function () { draw(s); });
            s.mx += (s.tx - s.mx) * 0.12; s.my += (s.ty - s.my) * 0.12;
            s.hover += (s.target - s.hover) * 0.08;
            var gl = s.gl;
            gl.uniform2f(s.u.mouse, s.mx, s.my); gl.uniform1f(s.u.hover, s.hover);
            gl.uniform1f(s.u.time, (performance.now() - s.t0) / 1000); gl.uniform1f(s.u.ratio, s.ratio);
            gl.uniform2f(s.u.scale, s.sx, s.sy);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            if (s.target === 0 && s.hover < 0.01) { cancelAnimationFrame(s.raf); s.raf = 0; s.cv.style.opacity = 0; setTimeout(function () { if (s.target === 0 && s.cv.parentNode) s.cv.parentNode.removeChild(s.cv); }, 250); }
        }

        thumb.addEventListener('mouseenter', function () {
            if (failed || !img.complete || !img.naturalWidth) return;
            if (!state) state = build();
            if (!state) return;
            var s = state;
            if (!s.cv.parentNode) thumb.appendChild(s.cv);
            size(s); s.target = 1;
            s.gl.useProgram(s.pr);
            requestAnimationFrame(function () { s.cv.style.opacity = 1; });
            if (!s.raf) draw(s);
        });
        thumb.addEventListener('mousemove', function (e) {
            if (!state) return;
            var r = thumb.getBoundingClientRect();
            state.tx = (e.clientX - r.left) / r.width; state.ty = (e.clientY - r.top) / r.height;
        });
        thumb.addEventListener('mouseleave', function () { if (state) state.target = 0; });
    }

    var thumbs = document.querySelectorAll('.project-card .thumb');
    for (var i = 0; i < thumbs.length; i++) setup(thumbs[i]);
})();
