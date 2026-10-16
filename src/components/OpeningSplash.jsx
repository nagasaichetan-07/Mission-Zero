import React, { useState, useEffect } from 'react';

export const OpeningSplash = ({ onFinish, isReplay = false }) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // Stage 1: Kinetic circles draw in
    const t1 = setTimeout(() => setAnimationStep(1), 100);
    // Stage 2: Logo badge elastic drop & bounce
    const t2 = setTimeout(() => setAnimationStep(2), 500);
    // Stage 3: Light sheen sweep & typography reveal
    const t3 = setTimeout(() => setAnimationStep(3), 1100);
    // Stage 4: Tagline fade in
    const t4 = setTimeout(() => setAnimationStep(4), 1600);
    // Stage 5: Cinematic exit zoom & dissolve
    const t5 = setTimeout(() => setAnimationStep(5), 2400);
    // Finish animation and unmount
    const t6 = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${animationStep >= 5 ? 'splash-exit' : ''}`}>
      {/* Ambient background glow */}
      <div className="splash-glow-backdrop" />

      {/* Kinetic Orbital Rings */}
      <div className={`splash-kinetic-rings ${animationStep >= 1 ? 'active' : ''}`}>
        <div className="orbital-ring ring-1" />
        <div className="orbital-ring ring-2" />
        <div className="orbital-ring ring-3" />
      </div>

      <div className="splash-center-stage">
        {/* Logo Container with Elastic Drop */}
        <div className={`splash-logo-wrapper ${animationStep >= 2 ? 'drop-in' : ''}`}>
          <div className="splash-badge-frame">
            <img
              src="/logo.png"
              alt="mission:zero logo"
              className="splash-logo-image"
              onError={(e) => {
                // Fallback to public relative path if needed
                e.target.src = './logo.png';
              }}
            />
            {/* Diagonal Metallic Sheen Sweep */}
            <div className={`metallic-sheen ${animationStep >= 3 ? 'sweep' : ''}`} />
          </div>
        </div>

        {/* Brand Typography Lockup */}
        <div className={`splash-typography ${animationStep >= 3 ? 'reveal' : ''}`}>
          <h1 className="splash-title">
            MISSION<span className="splash-colon">:</span>ZERO
          </h1>
          <p className={`splash-tagline ${animationStep >= 4 ? 'visible' : ''}`}>
            Zero Backlogs <span className="splash-dot">•</span> Absolute Mastery
          </p>
        </div>
      </div>

      {/* Skip Button */}
      <button
        type="button"
        className="splash-skip-btn"
        onClick={onFinish}
        aria-label="Skip opening animation"
      >
        Skip ➔
      </button>
    </div>
  );
};
