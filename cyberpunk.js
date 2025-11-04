// ===== WebGL Shader Setup =====
let gl, canvas, program;
let mouseX = 0.5, mouseY = 0.5;
let glitchIntensity = 0.0;
let statusIndicator;
const statusMessages = ['STABLE', 'FLUCTUATING', 'UNSTABLE', 'CRITICAL', 'CORRUPTED'];

// Ripple effect variables
let ripples = [];
const MAX_RIPPLES = 3;

// Vertex shader - simple passthrough
const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// Fragment shader - grid with localized glitch effect and ripples
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_glitchIntensity;
    uniform vec3 u_ripples[3]; // x, y, age for each ripple

    // Noise function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec3 color = vec3(0.0);

        // Distance from mouse
        float dist = distance(st, u_mouse);
        float mouseDist = smoothstep(0.3, 0.0, dist);

        // Grid parameters
        float gridSize = 30.0;
        vec2 grid = fract(st * gridSize);

        // Glitch effect near mouse
        float glitchZone = mouseDist * u_glitchIntensity;

        // Ripple wave effect
        float rippleEffect = 0.0;
        for (int i = 0; i < 3; i++) {
            vec2 rippleCenter = u_ripples[i].xy;
            float rippleAge = u_ripples[i].z;

            if (rippleAge > 0.0 && rippleAge < 1.0) {
                float rippleDist = distance(st, rippleCenter);
                float rippleRadius = rippleAge * 0.5; // Max radius
                float rippleWidth = 0.1;

                // Create wave that expands outward
                float wave = smoothstep(rippleRadius + rippleWidth, rippleRadius, rippleDist)
                           * smoothstep(rippleRadius - rippleWidth, rippleRadius, rippleDist);

                // Fade out over time
                wave *= (1.0 - rippleAge);

                rippleEffect += wave * 0.03 * sin(rippleDist * 50.0 - rippleAge * 20.0);
            }
        }

        // Horizontal scan line distortion
        float scanLine = sin(st.y * 100.0 + u_time * 5.0) * 0.5 + 0.5;
        float horizontalGlitch = noise(vec2(st.y * 10.0, u_time * 2.0)) * glitchZone;

        // Apply horizontal distortion and ripple
        vec2 distortedSt = st;
        distortedSt.x += horizontalGlitch * 0.3 * sin(u_time * 10.0);
        distortedSt.x += scanLine * glitchZone * 0.1;
        distortedSt += rippleEffect; // Add ripple displacement

        // Recalculate grid with distortion
        vec2 distortedGrid = fract(distortedSt * gridSize);

        // Grid lines
        float gridLine = 0.0;
        float lineWidth = 0.02 + glitchZone * 0.1;

        if (distortedGrid.x < lineWidth || distortedGrid.y < lineWidth) {
            gridLine = 1.0;
        }

        // Color cycling for glitch
        float colorShift = noise(vec2(u_time * 3.0, st.y * 5.0)) * glitchZone;

        // Emergency red grid with glitch color shifts
        vec3 gridColor = vec3(1.0, 0.165, 0.165); // Emergency Red
        vec3 glitchColor = vec3(1.0, 0.42, 0.21); // Alert Orange
        vec3 finalGridColor = mix(gridColor, glitchColor, colorShift);

        // Apply grid
        color += gridLine * finalGridColor * (0.15 + glitchZone * 0.6);

        // Horizontal tear lines
        float tearLine = step(0.995, noise(vec2(st.y * 2.0, u_time * 5.0)));
        color += tearLine * glitchZone * vec3(1.0, 0.165, 0.165);

        // RGB split effect
        if (glitchZone > 0.5) {
            float offset = glitchZone * 0.02;
            float r = step(0.98, fract((st.x + offset) * gridSize));
            float b = step(0.98, fract((st.x - offset) * gridSize));
            color.r += r * 0.5;
            color.b += b * 0.5;
        }

        gl_FragColor = vec4(color, 0.8);
    }
`;

function initWebGL() {
    canvas = document.getElementById('webgl-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
        console.log('WebGL not supported, falling back to standard effects');
        return;
    }

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create program
    program = createProgram(gl, vertexShader, fragmentShader);

    // Create buffer for a full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Set up position attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Start render loop
    renderWebGL();
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function renderWebGL() {
    if (!gl || !program) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Update ripples (age them)
    const currentTime = performance.now() / 1000.0;
    ripples.forEach(ripple => {
        if (ripple.active) {
            ripple.age = (currentTime - ripple.startTime) / 1.5; // 1.5 second duration
            if (ripple.age > 1.0) {
                ripple.active = false;
            }
        }
    });

    // Update uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    gl.uniform2f(mouseLocation, mouseX, mouseY);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLocation, currentTime);

    const glitchLocation = gl.getUniformLocation(program, 'u_glitchIntensity');
    gl.uniform1f(glitchLocation, glitchIntensity);

    // Update ripple uniforms
    const ripplesLocation = gl.getUniformLocation(program, 'u_ripples');
    const rippleData = [];
    for (let i = 0; i < MAX_RIPPLES; i++) {
        if (i < ripples.length && ripples[i].active) {
            rippleData.push(ripples[i].x, ripples[i].y, ripples[i].age);
        } else {
            rippleData.push(0.0, 0.0, -1.0); // Inactive ripple
        }
    }
    gl.uniform3fv(ripplesLocation, rippleData);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(renderWebGL);
}

// Update glitch intensity and status
function updateSystemStatus() {
    const dist = Math.sqrt(Math.pow(mouseX - 0.5, 2) + Math.pow(mouseY - 0.5, 2));
    const maxDist = Math.sqrt(0.5);
    const normalizedDist = 1 - (dist / maxDist);

    // Glitch intensity based on mouse movement
    glitchIntensity = normalizedDist * 2.0;

    // Update status indicator
    if (glitchIntensity < 0.3) {
        statusIndicator.querySelector('.status-value').textContent = 'STABLE';
        statusIndicator.classList.remove('glitching');
    } else if (glitchIntensity < 0.6) {
        statusIndicator.querySelector('.status-value').textContent = 'FLUCTUATING';
        statusIndicator.classList.add('glitching');
    } else if (glitchIntensity < 1.0) {
        statusIndicator.querySelector('.status-value').textContent = 'UNSTABLE';
        statusIndicator.classList.add('glitching');
    } else if (glitchIntensity < 1.5) {
        statusIndicator.querySelector('.status-value').textContent = 'CRITICAL';
        statusIndicator.classList.add('glitching');
    } else {
        statusIndicator.querySelector('.status-value').textContent = 'CORRUPTED';
        statusIndicator.classList.add('glitching');
    }

    requestAnimationFrame(updateSystemStatus);
}

// ===== Anime.js Animations =====
document.addEventListener('DOMContentLoaded', function() {
    statusIndicator = document.querySelector('.status-indicator');

    // Initialize WebGL
    initWebGL();
    updateSystemStatus();

    // Animate status indicator entrance
    anime({
        targets: '.status-indicator',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 1000,
        easing: 'easeOutExpo',
        delay: 500
    });

    // Animate main title entrance
    anime({
        targets: '.glitch',
        opacity: [0, 1],
        translateY: [-50, 0],
        duration: 1500,
        easing: 'easeOutExpo',
        delay: 300
    });

    // Animate subtitle
    anime({
        targets: '.subtitle',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 1200,
        easing: 'easeOutExpo',
        delay: 800
    });

    // Animate bio text lines
    anime({
        targets: '.bio-text',
        opacity: [0, 1],
        translateX: [-50, 0],
        duration: 1000,
        easing: 'easeOutQuad',
        delay: anime.stagger(200, {start: 1200})
    });

    // Animate contact section
    anime({
        targets: '.contact-section',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 1000,
        easing: 'easeOutElastic(1, .8)',
        delay: 1800
    });

    // Animate corner brackets
    anime({
        targets: '.corner',
        scale: [0, 1],
        rotate: [45, 0],
        duration: 1500,
        easing: 'easeOutElastic(1, .6)',
        delay: anime.stagger(150, {start: 500})
    });

    // Floating particles animation
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        anime({
            targets: particle,
            opacity: [
                { value: 0, duration: 0 },
                { value: [0, 1], duration: 1000 },
                { value: 1, duration: 3000 },
                { value: 0, duration: 1000 }
            ],
            translateX: () => anime.random(-200, 200),
            translateY: () => anime.random(-200, 200),
            scale: [
                { value: 0, duration: 0 },
                { value: 1, duration: 1000 },
                { value: 0.5, duration: 2000 },
                { value: 0, duration: 1000 }
            ],
            duration: 5000,
            delay: index * 500,
            loop: true,
            easing: 'easeInOutQuad'
        });
    });

    // Create matrix rain effect
    createMatrixRain();

    // Glitch effect on hover for email
    const emailLink = document.querySelector('.email-link');
    emailLink.addEventListener('mouseenter', () => {
        anime({
            targets: '.email-link',
            translateX: [
                { value: -2, duration: 50 },
                { value: 2, duration: 50 },
                { value: -2, duration: 50 },
                { value: 2, duration: 50 },
                { value: 0, duration: 50 }
            ],
            easing: 'linear'
        });
    });

    // Continuous background grid animation
    anime({
        targets: '.background-grid',
        translateZ: [0, 20],
        duration: 3000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
    });

    // Enhanced random glitch pulses with horizontal distortion
    setInterval(() => {
        if (Math.random() > 0.7) {
            anime({
                targets: '.glitch',
                translateX: [
                    { value: -15, duration: 50 },
                    { value: 20, duration: 50 },
                    { value: -10, duration: 50 },
                    { value: 15, duration: 50 },
                    { value: -8, duration: 50 },
                    { value: 0, duration: 50 }
                ],
                scaleX: [
                    { value: 1.2, duration: 50 },
                    { value: 0.8, duration: 50 },
                    { value: 1.3, duration: 50 },
                    { value: 0.9, duration: 50 },
                    { value: 1, duration: 50 }
                ],
                easing: 'linear'
            });
        }
    }, 3000);

    // Pulse effect on corners
    anime({
        targets: '.corner',
        scale: [1, 1.1, 1],
        duration: 2000,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad',
        delay: anime.stagger(500)
    });

    // Scanline animation enhancement
    anime({
        targets: '.scanlines',
        opacity: [0.3, 0.6, 0.3],
        duration: 4000,
        loop: true,
        easing: 'easeInOutSine'
    });
});

// Matrix rain effect
function createMatrixRain() {
    const matrixContainer = document.querySelector('.matrix-code');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

    for (let i = 0; i < 20; i++) {
        const column = document.createElement('div');
        column.style.position = 'absolute';
        column.style.left = (i * 5) + '%';
        column.style.top = '-100px';
        column.style.fontSize = '14px';
        column.style.color = 'rgba(255, 42, 42, 0.5)';
        column.style.textShadow = '0 0 5px #ff2a2a';
        column.style.whiteSpace = 'pre';
        column.style.fontFamily = 'monospace';

        let text = '';
        for (let j = 0; j < 30; j++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length)) + '\n';
        }
        column.textContent = text;

        matrixContainer.appendChild(column);

        anime({
            targets: column,
            translateY: [0, window.innerHeight + 200],
            opacity: [
                { value: 0, duration: 0 },
                { value: 0.5, duration: 500 },
                { value: 0.5, duration: 3000 },
                { value: 0, duration: 500 }
            ],
            duration: 8000,
            delay: i * 400,
            loop: true,
            easing: 'linear'
        });
    }
}

// Cyberpunk glitch on random elements
setInterval(() => {
    const elements = document.querySelectorAll('.glitch-text, .subtitle');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    if (randomElement && Math.random() > 0.5) {
        anime({
            targets: randomElement,
            opacity: [1, 0.3, 1, 0.5, 1],
            translateX: [0, -10, 5, -3, 0],
            scaleX: [1, 1.2, 0.9, 1.1, 1],
            duration: 200,
            easing: 'linear'
        });
    }
}, 5000);

// Mouse tracking for WebGL and parallax
document.addEventListener('mousemove', (e) => {
    // Update WebGL mouse position
    mouseX = e.clientX / window.innerWidth;
    mouseY = 1.0 - (e.clientY / window.innerHeight);

    // Parallax effect
    const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

    anime({
        targets: '.content',
        translateX: moveX,
        translateY: moveY,
        duration: 1000,
        easing: 'easeOutQuad'
    });

    anime({
        targets: '.background-grid',
        translateX: -moveX * 2,
        translateY: -moveY * 2,
        duration: 2000,
        easing: 'easeOutQuad'
    });
});

// Click to create ripple effect
document.addEventListener('click', (e) => {
    const clickX = e.clientX / window.innerWidth;
    const clickY = 1.0 - (e.clientY / window.innerHeight);

    // Add new ripple
    const newRipple = {
        x: clickX,
        y: clickY,
        age: 0.0,
        startTime: performance.now() / 1000.0,
        active: true
    };

    // Remove oldest inactive ripple if at max capacity
    if (ripples.length >= MAX_RIPPLES) {
        ripples = ripples.filter(r => r.active);
        if (ripples.length >= MAX_RIPPLES) {
            ripples.shift(); // Remove oldest
        }
    }

    ripples.push(newRipple);
});

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Emergency boot sequence
window.addEventListener('load', () => {
    const bootMessages = [
        '> SYSTEM INITIALIZATION...',
        '> WARNING: EMERGENCY MODE ACTIVE',
        '> LOADING WEBGL SHADERS...',
        '> NEURAL INTERFACE: ONLINE',
        '> GLITCH PROTOCOLS: ENGAGED',
        '> STATUS: OPERATIONAL'
    ];

    console.log('%c' + bootMessages.join('\n'), 'color: #ff2a2a; font-family: monospace; font-size: 12px; font-weight: bold;');
});
