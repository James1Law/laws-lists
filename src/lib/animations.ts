import confetti from 'canvas-confetti';

// Birthday theme - confetti burst
export const triggerBirthdayAnimation = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 1000,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { y: 0.7 }
  });
  fire(0.2, {
    spread: 60,
    origin: { y: 0.7 }
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    origin: { y: 0.7 }
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    origin: { y: 0.7 }
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    origin: { y: 0.7 }
  });
};

// Smaller confetti burst for item bought or added
export const triggerItemAnimation = (elementRect: { left: number; top: number; width: number; height: number }) => {
  const x = (elementRect.left + elementRect.width / 2) / window.innerWidth;
  const y = (elementRect.top + elementRect.height / 2) / window.innerHeight;
  
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { x, y },
    zIndex: 1000,
    disableForReducedMotion: true,
    gravity: 1.2,
    decay: 0.9,
  });
};

// Christmas theme - snowfall
export const createSnowfall = () => {
  const snowflakesContainer = document.createElement('div');
  snowflakesContainer.className = 'snowflakes-container';
  snowflakesContainer.style.position = 'fixed';
  snowflakesContainer.style.top = '0';
  snowflakesContainer.style.left = '0';
  snowflakesContainer.style.width = '100%';
  snowflakesContainer.style.height = '100%';
  snowflakesContainer.style.pointerEvents = 'none';
  snowflakesContainer.style.zIndex = '50';
  snowflakesContainer.style.overflow = 'hidden';
  document.body.appendChild(snowflakesContainer);

  // Create snowflakes
  const snowflakesCount = window.innerWidth < 768 ? 30 : 50; // Less on mobile
  
  for (let i = 0; i < snowflakesCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = '❄';
    snowflake.style.position = 'absolute';
    snowflake.style.color = 'white';
    // Slightly larger snowflakes for better visibility
    snowflake.style.fontSize = `${Math.random() * 16 + 10}px`;
    // Brighter snowflakes for dark background
    snowflake.style.opacity = `${Math.random() * 0.4 + 0.6}`;
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animation = `snowfall ${Math.random() * 5 + 5}s linear infinite`;
    snowflake.style.animationDelay = `${Math.random() * 5}s`;
    snowflake.style.transform = 'translateY(-100%)';
    // Add a text shadow for better visibility
    snowflake.style.textShadow = '0 0 5px rgba(255,255,255,0.3)';
    snowflakesContainer.appendChild(snowflake);
  }

  // Apply CSS animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes snowfall {
      0% {
        transform: translateY(-100%) rotate(0deg);
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    document.body.removeChild(snowflakesContainer);
    document.head.removeChild(style);
  };
};

// Stop snowfall
export const removeSnowfall = () => {
  const container = document.querySelector('.snowflakes-container');
  const style = document.querySelector('style');
  if (container) {
    document.body.removeChild(container);
  }
  if (style && style.innerHTML.includes('snowfall')) {
    document.head.removeChild(style);
  }
}; 