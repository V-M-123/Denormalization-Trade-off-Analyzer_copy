/**
 * Permanent Custom Magnetic Dual-Ring & Dot Cursor
 */

export function initCursor() {
  document.body.classList.add('cursor-mode-magnetic');
  initMagneticCursor();
}

function initMagneticCursor() {
  const container = document.createElement('div');
  container.id = 'magnetic-cursor-container';
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;';

  const ring = document.createElement('div');
  ring.style.cssText = `
    pointer-events: none !important;
    position: absolute;
    top: -100px;
    left: -100px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid rgba(34, 211, 238, 0.7);
    background: rgba(6, 182, 212, 0.05);
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.25);
    transition: width 0.18s ease-out, height 0.18s ease-out, background 0.18s ease-out, border-color 0.18s ease-out, box-shadow 0.18s ease-out;
  `;

  const dot = document.createElement('div');
  dot.style.cssText = `
    pointer-events: none !important;
    position: absolute;
    top: -100px;
    left: -100px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22d3ee;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 8px #22d3ee;
  `;

  container.appendChild(ring);
  container.appendChild(dot);
  document.body.appendChild(container);

  let targetX = -100;
  let targetY = -100;
  let ringX = -100;
  let ringY = -100;
  let animId = null;

  const onMouseMove = (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    dot.style.left = `${targetX}px`;
    dot.style.top = `${targetY}px`;

    const target = e.target;
    if (
      target &&
      (target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[role="button"]') ||
        target.closest('.interactive'))
    ) {
      ring.style.width = '48px';
      ring.style.height = '48px';
      ring.style.borderColor = 'rgba(52, 211, 153, 0.9)';
      ring.style.background = 'rgba(16, 185, 129, 0.12)';
      ring.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.4)';
    } else {
      ring.style.width = '32px';
      ring.style.height = '32px';
      ring.style.borderColor = 'rgba(34, 211, 238, 0.7)';
      ring.style.background = 'rgba(6, 182, 212, 0.05)';
      ring.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.25)';
    }
  };

  const onMouseDown = () => {
    ring.style.width = '24px';
    ring.style.height = '24px';
  };

  const onMouseUp = () => {
    ring.style.width = '32px';
    ring.style.height = '32px';
  };

  const renderLoop = () => {
    const ease = 0.18;
    ringX += (targetX - ringX) * ease;
    ringY += (targetY - ringY) * ease;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    animId = requestAnimationFrame(renderLoop);
  };

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousedown', onMouseDown, { passive: true });
  window.addEventListener('mouseup', onMouseUp, { passive: true });
  animId = requestAnimationFrame(renderLoop);

  return () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    if (animId) cancelAnimationFrame(animId);
    if (container.parentNode) container.parentNode.removeChild(container);
  };
}
