// ===== WebGL Shader Setup =====
let gl, canvas, program;
let mouseX = 0.5, mouseY = 0.5;
let glitchIntensity = 0.0;
let statusIndicator;
const statusMessages = ['STABLE', 'FLUCTUATING', 'UNSTABLE', 'CRITICAL', 'CORRUPTED'];

// Ripple effect variables
let ripples = [];
const MAX_RIPPLES = 3;

// Scroll-based distortion variables
let scrollAccumulator = 0.0;
let scrollVelocity = 0.0;
let targetScroll = 0.0;

// Mouse tracking for title interaction
let lastMouseX = 0.5;
let lastMouseY = 0.5;
let mouseVelocity = 0;
let lastMouseTime = 0;

// Easter egg elements
let abyssMessage;
let abyssMessageShown = false;
let abyssTakeover = 0.0; // Progress of the abyss takeover (0.0 to 1.0)

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
    uniform float u_scrollDistortion; // Scroll-based distortion parameter
    uniform float u_abyssTakeover; // Abyss takeover progress (0.0 to 1.0)

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

    // Mathematical transformation functions
    vec2 applyScrollDistortion(vec2 coord, float scroll) {
        // Center coordinates around origin
        vec2 centered = coord - 0.5;

        // Rotation matrix based on scroll
        float angle = scroll * 0.1;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        centered = rotation * centered;

        // Sine wave distortion
        float waveFreq = 3.0 + scroll * 0.5;
        float waveAmp = 0.05 * sin(scroll * 0.3);
        centered.x += sin(centered.y * waveFreq + scroll) * waveAmp;
        centered.y += cos(centered.x * waveFreq + scroll * 1.3) * waveAmp;

        // Barrel distortion (fisheye/pincushion)
        float distortionStrength = 0.2 * sin(scroll * 0.2);
        float r = length(centered);
        float theta = atan(centered.y, centered.x);

        // Apply non-linear radial distortion
        float r_distorted = r * (1.0 + distortionStrength * r * r);
        centered = vec2(r_distorted * cos(theta), r_distorted * sin(theta));

        // Twist effect based on distance from center
        float twistAmount = scroll * 0.15;
        float twistAngle = r * twistAmount;
        mat2 twist = mat2(cos(twistAngle), -sin(twistAngle), sin(twistAngle), cos(twistAngle));
        centered = twist * centered;

        // Return to normal coordinates
        return centered + 0.5;
    }

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;

        // Apply mathematical scroll distortion to entire plane
        st = applyScrollDistortion(st, u_scrollDistortion);

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

        // Dynamic colors based on scroll distortion level
        float distortionLevel = clamp(abs(u_scrollDistortion) / 8.0, 0.0, 1.0);

        // Color gradient: Cyan (stable) -> Green -> Yellow -> Orange -> Red (emergency)
        vec3 stableColor = vec3(0.0, 1.0, 1.0); // Cyan
        vec3 fluctuatingColor = vec3(0.0, 1.0, 0.53); // Green
        vec3 warningColor = vec3(1.0, 0.67, 0.0); // Yellow
        vec3 criticalColor = vec3(1.0, 0.42, 0.21); // Orange
        vec3 emergencyColor = vec3(1.0, 0.165, 0.165); // Red

        vec3 gridColor;
        if (distortionLevel < 0.25) {
            gridColor = mix(stableColor, fluctuatingColor, distortionLevel * 4.0);
        } else if (distortionLevel < 0.5) {
            gridColor = mix(fluctuatingColor, warningColor, (distortionLevel - 0.25) * 4.0);
        } else if (distortionLevel < 0.75) {
            gridColor = mix(warningColor, criticalColor, (distortionLevel - 0.5) * 4.0);
        } else {
            gridColor = mix(criticalColor, emergencyColor, (distortionLevel - 0.75) * 4.0);
        }

        vec3 glitchColor = mix(gridColor, emergencyColor, colorShift);
        vec3 finalGridColor = mix(gridColor, glitchColor, colorShift);

        // Apply grid
        color += gridLine * finalGridColor * (0.15 + glitchZone * 0.6);

        // Horizontal tear lines with dynamic color
        float tearLine = step(0.995, noise(vec2(st.y * 2.0, u_time * 5.0)));
        color += tearLine * glitchZone * gridColor;

        // RGB split effect
        if (glitchZone > 0.5) {
            float offset = glitchZone * 0.02;
            float r = step(0.98, fract((st.x + offset) * gridSize));
            float b = step(0.98, fract((st.x - offset) * gridSize));
            color.r += r * 0.5;
            color.b += b * 0.5;
        }

        // ABYSS TAKEOVER: Red grid squares spreading from edges to center
        if (u_abyssTakeover > 0.0) {
            // Calculate which grid cell we're in
            vec2 gridCell = floor(st * gridSize);

            // Distance from center (in grid cell coordinates)
            vec2 centerCell = floor(vec2(0.5, 0.5) * gridSize);
            float distFromCenter = length(gridCell - centerCell);
            float maxDist = length(centerCell);

            // Normalize distance (0.0 at center, 1.0 at edges)
            float normalizedDist = distFromCenter / maxDist;

            // Add chaotic variation per cell using random function
            float cellRandom = random(gridCell * 0.1);

            // Cells closer to edges turn red first
            // Add randomness to make it chaotic (-0.3 to +0.3 variation)
            float cellThreshold = (1.0 - normalizedDist) + (cellRandom - 0.5) * 0.6;

            // Determine if this cell should be red based on takeover progress
            float redAmount = smoothstep(cellThreshold - 0.1, cellThreshold + 0.1, u_abyssTakeover);

            // Dark blood red color for abyss
            vec3 abyssRed = vec3(0.1, 0.0, 0.0); // Very dark red #1a0000

            // Fill the entire grid square (not just lines)
            vec2 cellPos = fract(st * gridSize);
            float squareMask = step(0.02, cellPos.x) * step(0.02, cellPos.y) *
                              step(cellPos.x, 0.98) * step(cellPos.y, 0.98);

            // Blend in the red square
            color = mix(color, abyssRed, redAmount * squareMask);

            // Keep grid lines visible on red squares
            if (redAmount > 0.5) {
                color += gridLine * vec3(0.3, 0.0, 0.0) * redAmount;
            }
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

    // Update scroll distortion uniform
    const scrollLocation = gl.getUniformLocation(program, 'u_scrollDistortion');
    gl.uniform1f(scrollLocation, scrollAccumulator);

    // Update abyss takeover uniform
    const abyssLocation = gl.getUniformLocation(program, 'u_abyssTakeover');
    gl.uniform1f(abyssLocation, abyssTakeover);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(renderWebGL);
}

// Update glitch intensity and status based on scroll distortion
function updateSystemStatus() {
    const dist = Math.sqrt(Math.pow(mouseX - 0.5, 2) + Math.pow(mouseY - 0.5, 2));
    const maxDist = Math.sqrt(0.5);
    const normalizedDist = 1 - (dist / maxDist);

    // Glitch intensity based on mouse movement
    glitchIntensity = normalizedDist * 2.0;

    // Calculate distortion level from scroll accumulator
    const distortionLevel = Math.abs(scrollAccumulator);

    // Update status indicator based on scroll distortion
    const bodyElement = document.body;

    if (distortionLevel < 0.5) {
        statusIndicator.querySelector('.status-value').textContent = 'STABLE';
        statusIndicator.classList.remove('glitching', 'warning', 'critical');
        bodyElement.setAttribute('data-state', 'stable');
    } else if (distortionLevel < 2.0) {
        statusIndicator.querySelector('.status-value').textContent = 'FLUCTUATING';
        statusIndicator.classList.add('glitching');
        statusIndicator.classList.remove('warning', 'critical');
        bodyElement.setAttribute('data-state', 'fluctuating');
    } else if (distortionLevel < 4.0) {
        statusIndicator.querySelector('.status-value').textContent = 'WARNING';
        statusIndicator.classList.add('glitching', 'warning');
        statusIndicator.classList.remove('critical');
        bodyElement.setAttribute('data-state', 'warning');
    } else if (distortionLevel < 8.0) {
        statusIndicator.querySelector('.status-value').textContent = 'CRITICAL';
        statusIndicator.classList.add('glitching', 'critical');
        statusIndicator.classList.remove('warning');
        bodyElement.setAttribute('data-state', 'critical');
    } else if (distortionLevel < 15.0) {
        statusIndicator.querySelector('.status-value').textContent = 'EMERGENCY';
        statusIndicator.classList.add('glitching', 'critical');
        bodyElement.setAttribute('data-state', 'emergency');
    } else {
        // ABYSS state for extreme distortion
        statusIndicator.querySelector('.status-value').textContent = 'ABYSS';
        statusIndicator.classList.add('glitching', 'critical');
        bodyElement.setAttribute('data-state', 'abyss');
    }

    // Easter egg: Abyss takeover - grid squares turn red from edges to center
    if (abyssMessage) {
        if (distortionLevel > 15.0) {
            // Calculate takeover progress based on how far beyond threshold we are
            // Maps distortionLevel 15.0-30.0 to abyssTakeover 0.0-1.0
            const targetTakeover = Math.min((distortionLevel - 15.0) / 15.0, 1.0);

            // Smoothly animate to target takeover value
            anime({
                targets: window,
                abyssTakeover: targetTakeover,
                duration: 300,
                easing: 'easeOutQuad',
                update: function(anim) {
                    abyssTakeover = window.abyssTakeover;
                }
            });

            // Show cryptic message when takeover is complete (only once)
            if (abyssTakeover >= 0.95 && !abyssMessageShown) {
                abyssMessageShown = true;
                setTimeout(() => {
                    if (abyssMessage) {
                        abyssMessage.classList.add('visible');
                    }
                }, 1500);
            } else if (abyssTakeover < 0.95) {
                abyssMessage.classList.remove('visible');
                abyssMessageShown = false;
            }
        } else {
            // Reset takeover when scrolling back up
            anime({
                targets: window,
                abyssTakeover: 0.0,
                duration: 500,
                easing: 'easeOutQuad',
                update: function(anim) {
                    abyssTakeover = window.abyssTakeover;
                }
            });
            abyssMessage.classList.remove('visible');
            abyssMessageShown = false;
        }
    }

    requestAnimationFrame(updateSystemStatus);
}

// ===== Anime.js Animations =====
document.addEventListener('DOMContentLoaded', function() {
    statusIndicator = document.querySelector('.status-indicator');
    abyssMessage = document.querySelector('.abyss-message');

    // Initialize window.abyssTakeover for anime.js
    window.abyssTakeover = 0.0;

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
    const newMouseX = e.clientX / window.innerWidth;
    const newMouseY = 1.0 - (e.clientY / window.innerHeight);

    // Calculate mouse velocity for title scaling
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastMouseTime) / 1000.0;
    const deltaX = newMouseX - lastMouseX;
    const deltaY = newMouseY - lastMouseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    mouseVelocity = deltaTime > 0 ? distance / deltaTime : 0;
    lastMouseTime = currentTime;
    lastMouseX = newMouseX;
    lastMouseY = newMouseY;

    mouseX = newMouseX;
    mouseY = newMouseY;

    // Parallax effect for content
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

    // Title reacts inversely to mouse position (moves away from cursor)
    const titleMoveX = -(e.clientX - window.innerWidth / 2) * 0.015;
    const titleMoveY = -(e.clientY - window.innerHeight / 2) * 0.015;

    // Scale title based on mouse velocity
    const velocityScale = Math.min(mouseVelocity * 0.5, 0.15);
    const titleScale = 1.0 + velocityScale;

    anime({
        targets: '.glitch',
        translateX: titleMoveX,
        translateY: titleMoveY,
        scale: titleScale,
        duration: 300,
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

// Double-click to reset everything to stable state
document.addEventListener('dblclick', (e) => {
    // Reset scroll accumulator
    scrollAccumulator = 0.0;
    targetScroll = 0.0;
    scrollVelocity = 0.0;

    // Smoothly animate back to neutral state
    anime({
        targets: { value: scrollAccumulator },
        value: 0,
        duration: 1500,
        easing: 'easeOutElastic(1, .6)',
        update: function(anim) {
            scrollAccumulator = anim.animations[0].currentValue;
        }
    });

    // Reset container transforms
    anime({
        targets: '.container',
        rotateZ: 0,
        rotateX: 0,
        rotateY: 0,
        translateZ: 0,
        duration: 1500,
        easing: 'easeOutElastic(1, .6)'
    });

    // Reset background grid
    anime({
        targets: '.background-grid',
        rotateZ: 0,
        scale: 1,
        duration: 1500,
        easing: 'easeOutElastic(1, .6)'
    });

    // Reset title distortions
    anime({
        targets: '.glitch',
        skewX: 0,
        scaleY: 1,
        duration: 1500,
        easing: 'easeOutElastic(1, .6)'
    });

    // Force status update to STABLE
    statusIndicator.querySelector('.status-value').textContent = 'STABLE';
    statusIndicator.classList.remove('glitching', 'warning', 'critical');
    document.body.setAttribute('data-state', 'stable');

    // Reset easter egg elements
    anime({
        targets: window,
        abyssTakeover: 0.0,
        duration: 1500,
        easing: 'easeOutElastic(1, .6)',
        update: function(anim) {
            abyssTakeover = window.abyssTakeover;
        }
    });

    if (abyssMessage) {
        abyssMessage.classList.remove('visible');
        abyssMessageShown = false;
    }

    console.log('%c> SYSTEM RESET\n> GRID RESTORED\n> STATUS: STABLE', 'color: #00ffff; font-family: monospace; font-size: 12px;');
});

// Scroll-based mathematical distortion
let lastScrollTime = 0;
document.addEventListener('wheel', (e) => {
    e.preventDefault();

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastScrollTime) / 1000.0;
    lastScrollTime = currentTime;

    // Accumulate scroll with velocity
    const scrollDelta = e.deltaY * 0.001;
    targetScroll += scrollDelta;

    // Add some velocity for momentum
    scrollVelocity = scrollDelta / (deltaTime + 0.001);

    // Animate scroll value smoothly with anime.js
    anime.remove(scrollAccumulator);
    anime({
        targets: { value: scrollAccumulator },
        value: targetScroll,
        duration: 800,
        easing: 'easeOutCubic',
        update: function(anim) {
            scrollAccumulator = anim.animations[0].currentValue;
        }
    });

    // Apply 3D transforms to main content based on scroll
    const rotation = (scrollAccumulator % (Math.PI * 2)) * (180 / Math.PI);
    const perspectiveZ = Math.sin(scrollAccumulator * 0.3) * 50;
    const skewValue = Math.sin(scrollAccumulator * 0.5) * 5;

    anime({
        targets: '.container',
        rotateZ: rotation * 0.1,
        rotateX: Math.sin(scrollAccumulator * 0.2) * 15,
        rotateY: Math.cos(scrollAccumulator * 0.15) * 15,
        translateZ: perspectiveZ,
        duration: 800,
        easing: 'easeOutCubic'
    });

    // Distort background grid with different math
    anime({
        targets: '.background-grid',
        rotateZ: -rotation * 0.15,
        scale: 1 + Math.sin(scrollAccumulator * 0.1) * 0.2,
        duration: 1000,
        easing: 'easeOutQuad'
    });

    // Skew and distort the main title
    const titleSkew = Math.sin(scrollAccumulator * 0.4) * 10;
    const titleScale = 1 + Math.sin(scrollAccumulator * 0.2) * 0.1;

    anime({
        targets: '.glitch',
        skewX: titleSkew,
        scaleY: titleScale,
        duration: 600,
        easing: 'easeOutElastic(1, .5)'
    });

}, { passive: false });

// Smooth decay of scroll velocity over time
function updateScrollPhysics() {
    // Apply friction to velocity
    scrollVelocity *= 0.95;

    // Update target scroll with residual velocity
    if (Math.abs(scrollVelocity) > 0.001) {
        targetScroll += scrollVelocity * 0.016; // Assuming ~60fps
        scrollAccumulator += (targetScroll - scrollAccumulator) * 0.1;
    }

    requestAnimationFrame(updateScrollPhysics);
}
updateScrollPhysics();

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
