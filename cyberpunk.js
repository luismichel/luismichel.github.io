// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {

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
        // Random starting position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Animate each particle
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

    // Random glitch pulses on the main title
    setInterval(() => {
        if (Math.random() > 0.7) {
            anime({
                targets: '.glitch',
                translateX: [
                    { value: -5, duration: 50 },
                    { value: 5, duration: 50 },
                    { value: -3, duration: 50 },
                    { value: 3, duration: 50 },
                    { value: 0, duration: 50 }
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

    // Create matrix columns
    for (let i = 0; i < 20; i++) {
        const column = document.createElement('div');
        column.style.position = 'absolute';
        column.style.left = (i * 5) + '%';
        column.style.top = '-100px';
        column.style.fontSize = '14px';
        column.style.color = 'rgba(0, 255, 255, 0.5)';
        column.style.textShadow = '0 0 5px #00ffff';
        column.style.whiteSpace = 'pre';
        column.style.fontFamily = 'monospace';

        // Generate random characters
        let text = '';
        for (let j = 0; j < 30; j++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length)) + '\n';
        }
        column.textContent = text;

        matrixContainer.appendChild(column);

        // Animate the column
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

// Add typing effect to bio text
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Cyberpunk glitch on random elements occasionally
setInterval(() => {
    const elements = document.querySelectorAll('.glitch-text, .subtitle');
    const randomElement = elements[Math.floor(Math.random() * elements.length)];

    if (randomElement && Math.random() > 0.5) {
        anime({
            targets: randomElement,
            opacity: [1, 0.3, 1, 0.5, 1],
            duration: 200,
            easing: 'linear'
        });
    }
}, 5000);

// Add mouse move parallax effect
document.addEventListener('mousemove', (e) => {
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

// Cyberpunk loading sequence
window.addEventListener('load', () => {
    // Create a boot sequence effect
    const bootMessages = [
        '> INITIALIZING NEURAL INTERFACE...',
        '> CONNECTING TO CYBERSPACE...',
        '> DECRYPTING BIOMETRIC DATA...',
        '> ACCESS GRANTED'
    ];

    console.log('%c' + bootMessages.join('\n'), 'color: #00ffff; font-family: monospace; font-size: 12px;');
});
