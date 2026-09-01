import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function Globe({ className = "" }) {
  const canvasRef = useRef(null);
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 2, 2),
      width: (width || 520) * 2,
      height: (width || 520) * 2,
      phi: 0,
      theta: 0.25,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.94, 0.96, 0.99], // Clean soft clinic blue/white
      markerColor: [0.3, 0.45, 1.0], // Primary Blue #4C72FF
      glowColor: [0.78, 0.88, 0.98], // Soft ambient glow
      markers: [
        { location: [28.6139, 77.209], size: 0.045 },
        { location: [12.9716, 77.5946], size: 0.04 },
        { location: [37.7749, -122.4194], size: 0.04 },
        { location: [40.7128, -74.006], size: 0.045 },
        { location: [51.5074, -0.1278], size: 0.04 },
        { location: [35.6762, 139.6503], size: 0.04 },
        { location: [1.3521, 103.8198], size: 0.035 },
        { location: [-33.8688, 151.2093], size: 0.035 },
      ],
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phi += 0.003;
        }
        state.phi = phi + pointerInteractionMovement.current;
        state.width = (width || 520) * 2;
        state.height = (width || 520) * 2;
      },
    });

    if (canvas) {
      canvas.style.opacity = "1";
    }

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={`globe-canvas-wrapper ${className}`}
      style={{
        width: "100%",
        maxWidth: 520,
        aspectRatio: "1/1",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.005;
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 0.8s ease",
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}

export default Globe;
