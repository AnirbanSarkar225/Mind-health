import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Globe from "./ui/globe";
import { cn } from "../lib/utils";
import "./ScrollGlobe.css";

const defaultGlobeConfig = {
  positions: [
    { top: "20%", left: "42%", scale: 1.05 }, // 1. Hero: subtle right background
    { top: "35%", left: "45%", scale: 0.9 },  // 2. Science & Stats: right side
    { top: "48%", left: "-35%", scale: 0.95 }, // 3. AI Modules: left side
    { top: "62%", left: "45%", scale: 1.0 },  // 4. Conditions: right side
    { top: "76%", left: "-32%", scale: 0.95 }, // 5. Pipeline: left side
    { top: "88%", left: "0%", scale: 1.25 },  // 6. Auth / Get Started: center subtle
  ],
};

const parsePercent = (str) =>
  typeof str === "number" ? str : parseFloat(String(str).replace("%", ""));

export function ScrollGlobe({
  sections = [],
  globeConfig = defaultGlobeConfig,
  className = "",
  children,
}) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState(() => {
    const init = (globeConfig.positions || defaultGlobeConfig.positions)[0];
    return `translate3d(${parsePercent(init.left)}%, ${parsePercent(init.top)}%, 0) scale3d(${init.scale}, ${init.scale}, 1)`;
  });
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);

  // Pre-calculate positions for performance
  const calculatedPositions = useMemo(() => {
    return (globeConfig.positions || defaultGlobeConfig.positions).map((pos) => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale,
    }));
  }, [globeConfig]);

  // Smooth scroll tracking and section detection
  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

    setScrollProgress(progress);

    // Section detection by viewport center distance
    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    const registeredSectionElements =
      containerRef.current?.querySelectorAll("[data-scroll-section]");

    if (registeredSectionElements && registeredSectionElements.length > 0) {
      registeredSectionElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      });
    }

    const posIndex = Math.min(newActiveSection, calculatedPositions.length - 1);
    const currentPos = calculatedPositions[posIndex] || calculatedPositions[0];

    const transform = `translate3d(${currentPos.left}%, ${currentPos.top}%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollPosition, { passive: true });

    animationFrameId.current = requestAnimationFrame(() => {
      updateScrollPosition();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollPosition);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  const navItems = useMemo(() => {
    if (sections && sections.length > 0) {
      return sections;
    }
    return [
      { id: "hero", badge: "Home" },
      { id: "science", badge: "Science" },
      { id: "specialists", badge: "AI Modules" },
      { id: "conditions", badge: "Conditions" },
      { id: "pipeline", badge: "Pipeline" },
      { id: "auth-section", badge: "Get Started" },
    ];
  }, [sections]);

  const scrollToSection = (index) => {
    const el =
      containerRef.current?.querySelectorAll("[data-scroll-section]")[index] ||
      document.getElementById(navItems[index]?.id);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isLastSection = activeSection >= calculatedPositions.length - 1;

  return (
    <div ref={containerRef} className={cn("scroll-globe-container", className)}>
      {/* ── Top Scroll Progress Bar ────────────────────────── */}
      <div className="scroll-progress-track">
        <div
          className="scroll-progress-indicator"
          style={{
            transform: `scaleX(${scrollProgress})`,
          }}
        />
      </div>

      {/* ── Right-Side Floating Section Nav Indicator ──────── */}
      <nav className="scroll-section-nav" aria-label="Page Sections Navigation">
        <div className="scroll-section-nav-line" />
        {navItems.map((item, index) => (
          <div key={item.id || index} className="scroll-section-nav-item">
            <button
              type="button"
              onClick={() => scrollToSection(index)}
              className={`scroll-section-dot ${
                activeSection === index ? "active" : ""
              }`}
              aria-label={`Scroll to ${item.badge || `Section ${index + 1}`}`}
            />
            <div className="scroll-section-badge">
              <span>{item.badge || `Section ${index + 1}`}</span>
            </div>
          </div>
        ))}
      </nav>

      {/* ── Contained 3D Globe Ambient Background ──────────── */}
      <div className="scroll-globe-layer">
        <div
          className="scroll-globe-mover"
          style={{
            transform: globeTransform,
            opacity: isLastSection ? 0.3 : 0.6,
          }}
        >
          <Globe />
        </div>
      </div>

      {/* ── Page Content Layer ─────────────────────────────── */}
      <div className="scroll-globe-content-layer">{children}</div>
    </div>
  );
}

export default ScrollGlobe;
