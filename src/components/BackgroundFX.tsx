import React from 'react';

// Full-screen animated background with multiple layers. Render once at app root.
export const BackgroundFX: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep gradient ocean */}
      <div className="absolute inset-0 bg-gradient-atmospheric-anim opacity-90" />

      {/* Moving volumetric blobs */}
      <div className="absolute inset-0 mix-blend-screen">
        <div className="bgfx-blob bgfx-blob-1" />
        <div className="bgfx-blob bgfx-blob-2" />
        <div className="bgfx-blob bgfx-blob-3" />
      </div>

      {/* Starfield / particle drift */}
      <div className="absolute inset-0">
        {Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="bgfx-star" style={{ animationDelay: `${(i % 20) * 0.35}s`, left: `${(i*37)%100}%`, top: `${(i*19)%100}%` }} />
        ))}
      </div>

      {/* Slow diagonal light sweep */}
      <div className="absolute -inset-[20%] bgfx-sweep" />
    </div>
  );
};

export default BackgroundFX;







