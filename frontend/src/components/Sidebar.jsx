import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiActivity,
  FiClipboard,
  FiClock,
  FiUser,
  FiLogOut,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { FaBrain } from "react-icons/fa6";
import "./Sidebar.css";

// Register GSAP Plugins safely
if (typeof window !== "undefined") {
  try {
    gsap.registerPlugin(CustomEase);
  } catch (e) {
    console.warn("CustomEase plugin registration notice:", e);
  }
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: FiHome, shape: "1" },
  { to: "/hardware", label: "Hardware & Analysis", icon: FiActivity, shape: "2" },
  { to: "/assessment", label: "Self-Assessment", icon: FiClipboard, shape: "3" },
  { to: "/history", label: "Session History", icon: FiClock, shape: "4" },
  { to: "/account", label: "My Account", icon: FiUser, shape: "5" },
];

export default function Sidebar() {
  const containerRef = useRef(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsMobileOpen(false);
    logout();
    navigate("/");
  };

  const closeMobile = () => setIsMobileOpen(false);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  // GSAP Animations Setup
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Create custom ease safely
    try {
      if (!gsap.parseEase("main")) {
        CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
        gsap.defaults({ ease: "main", duration: 0.6 });
      }
    } catch {
      gsap.defaults({ ease: "power2.out", duration: 0.6 });
    }

    const ctx = gsap.context(() => {
      // 1. Initial Staggered Entrance Animation
      const brandEl = currentContainer.querySelector(".sidebar-brand-header");
      const userCardEl = currentContainer.querySelector(".sidebar-user-card");
      const sectionLabelEl = currentContainer.querySelector(".sidebar-section-label");
      const menuItems = currentContainer.querySelectorAll(".sidebar-menu-item");
      const footerEl = currentContainer.querySelector(".sidebar-footer-section");

      const animTargets = [brandEl, userCardEl, sectionLabelEl, ...menuItems, footerEl].filter(Boolean);
      gsap.fromTo(
        animTargets,
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
      );

      // 2. Interactive Ambient Shape Hover & Icon Float
      const shapesContainer = currentContainer.querySelector(".ambient-background-shapes");

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer
          ? shapesContainer.querySelector(`.bg-shape-${shapeIndex}`)
          : null;
        const iconEl = item.querySelector(".nav-link-icon");
        const arrowEl = item.querySelector(".nav-link-arrow");

        const onEnter = () => {
          // Shape animation
          if (shape && shapesContainer) {
            shapesContainer.querySelectorAll(".bg-shape").forEach((s) => s.classList.remove("active"));
            shape.classList.add("active");
            const shapeEls = shape.querySelectorAll(".shape-element");

            gsap.fromTo(
              shapeEls,
              { scale: 0.5, opacity: 0, rotation: -12 },
              {
                scale: 1,
                opacity: 1,
                rotation: 0,
                duration: 0.5,
                stagger: 0.07,
                ease: "back.out(1.8)",
                overwrite: "auto",
              }
            );
          }

          // Link Icon & Arrow animation
          if (iconEl) {
            gsap.to(iconEl, { scale: 1.18, rotate: 6, duration: 0.25, ease: "power2.out" });
          }
          if (arrowEl) {
            gsap.to(arrowEl, { x: 3, opacity: 1, duration: 0.25, ease: "power2.out" });
          }
        };

        const onLeave = () => {
          // Shape fade out
          if (shape) {
            const shapeEls = shape.querySelectorAll(".shape-element");
            gsap.to(shapeEls, {
              scale: 0.8,
              opacity: 0,
              duration: 0.25,
              ease: "power2.in",
              onComplete: () => shape.classList.remove("active"),
              overwrite: "auto",
            });
          }

          // Reset Icon & Arrow
          if (iconEl) {
            gsap.to(iconEl, { scale: 1, rotate: 0, duration: 0.25, ease: "power2.out" });
          }
          if (arrowEl) {
            gsap.to(arrowEl, { x: 0, opacity: 0, duration: 0.25, ease: "power2.out" });
          }
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);

        item._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, currentContainer);

    return () => {
      ctx.revert();
      if (currentContainer) {
        const items = currentContainer.querySelectorAll(".sidebar-menu-item");
        items.forEach((item) => item._cleanup && item._cleanup());
      }
    };
  }, []);

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";
  const isVerified = user?.email === "itzsoumyajit@gmail.com" || user?.is_verified;

  return (
    <>
      {/* ── Mobile Top Bar ───────────────────────────────── */}
      <div className="mobile-topbar">
        <div className="mobile-brand" onClick={() => navigate("/")}>
          <div className="mobile-brand-logo">
            <FaBrain size={18} />
          </div>
          <div className="mobile-brand-title">
            <h3>Gita-NeuroSync</h3>
          </div>
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={toggleMobile}
          aria-label="Toggle Menu"
        >
          {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && <div className="mobile-backdrop" onClick={closeMobile}></div>}

      {/* ── Main Left Sidebar ────────────────────────────── */}
      <aside
        ref={containerRef}
        className={`sidebar-container ${isMobileOpen ? "mobile-open" : ""}`}
      >
        {/* ── Ambient Background GSAP Reactive Shapes ────── */}
        <div className="sidebar-ambient-bg">
          <div className="ambient-background-shapes">
            {/* Shape 1: Floating Orbs */}
            <svg className="bg-shape bg-shape-1" viewBox="0 0 270 400" fill="none">
              <circle className="shape-element" cx="60" cy="110" r="38" fill="rgba(76,114,255,0.18)" />
              <circle className="shape-element" cx="210" cy="80" r="50" fill="rgba(143,220,196,0.18)" />
              <circle className="shape-element" cx="130" cy="250" r="65" fill="rgba(236,72,153,0.14)" />
            </svg>

            {/* Shape 2: Neural Waves */}
            <svg className="bg-shape bg-shape-2" viewBox="0 0 270 400" fill="none">
              <path
                className="shape-element"
                d="M0 160 Q70 70, 140 160 T 270 160"
                stroke="rgba(76,114,255,0.22)"
                strokeWidth="42"
                fill="none"
              />
              <path
                className="shape-element"
                d="M0 240 Q70 150, 140 240 T 270 240"
                stroke="rgba(143,220,196,0.2)"
                strokeWidth="30"
                fill="none"
              />
            </svg>

            {/* Shape 3: Dot Matrix */}
            <svg className="bg-shape bg-shape-3" viewBox="0 0 270 400" fill="none">
              <circle className="shape-element" cx="40" cy="60" r="8" fill="rgba(76,114,255,0.3)" />
              <circle className="shape-element" cx="120" cy="60" r="8" fill="rgba(143,220,196,0.3)" />
              <circle className="shape-element" cx="200" cy="60" r="8" fill="rgba(236,72,153,0.3)" />
              <circle className="shape-element" cx="80" cy="140" r="11" fill="rgba(143,220,196,0.25)" />
              <circle className="shape-element" cx="160" cy="140" r="11" fill="rgba(76,114,255,0.25)" />
              <circle className="shape-element" cx="40" cy="220" r="9" fill="rgba(236,72,153,0.3)" />
              <circle className="shape-element" cx="120" cy="220" r="9" fill="rgba(76,114,255,0.3)" />
              <circle className="shape-element" cx="200" cy="220" r="9" fill="rgba(143,220,196,0.3)" />
            </svg>

            {/* Shape 4: Organic Blobs */}
            <svg className="bg-shape bg-shape-4" viewBox="0 0 270 400" fill="none">
              <path
                className="shape-element"
                d="M80 80 Q130 30, 180 80 Q230 130, 180 180 Q130 230, 80 180 Q30 130, 80 80"
                fill="rgba(76,114,255,0.16)"
              />
              <path
                className="shape-element"
                d="M170 170 Q220 120, 260 170 Q290 220, 250 270 Q200 310, 160 260 Q120 210, 170 170"
                fill="rgba(143,220,196,0.15)"
              />
            </svg>

            {/* Shape 5: Kinetic Rays */}
            <svg className="bg-shape bg-shape-5" viewBox="0 0 270 400" fill="none">
              <line
                className="shape-element"
                x1="0"
                y1="80"
                x2="220"
                y2="340"
                stroke="rgba(76,114,255,0.18)"
                strokeWidth="28"
              />
              <line
                className="shape-element"
                x1="80"
                y1="0"
                x2="270"
                y2="240"
                stroke="rgba(143,220,196,0.16)"
                strokeWidth="22"
              />
            </svg>
          </div>
        </div>

        {/* ── Brand Header (Clean Title, No Subtitle Lines) ─ */}
        <div className="sidebar-brand-header" onClick={() => navigate("/")}>
          <div className="sidebar-brand-logo">
            <FaBrain size={22} />
          </div>
          <div className="sidebar-brand-title">
            <h3>Gita-NeuroSync</h3>
          </div>
        </div>

        {/* ── User Status Card ───────────────────────────── */}
        <div
          className="sidebar-user-card"
          onClick={() => navigate("/account")}
          title="View Account Profile"
        >
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">
              <span>{user?.username || "User"}</span>
              {isVerified && (
                <MdVerified color="#1d9bf0" size={15} title="Verified User" />
              )}
            </div>
            <div className="sidebar-user-status">
              <span className="status-indicator-dot"></span>
              <span>Active Session</span>
            </div>
          </div>
        </div>

        {/* ── Navigation Section ─────────────────────────── */}
        <div className="sidebar-section-label">
          <span>NAVIGATION</span>
        </div>

        <nav className="sidebar-navigation">
          <ul className="sidebar-menu-list">
            {NAV_ITEMS.map(({ to, label, icon: Icon, shape }) => (
              <li key={to} className="sidebar-menu-item" data-shape={shape}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <div className="nav-link-left">
                    <div className="nav-link-icon">
                      <Icon size={18} />
                    </div>
                    <span className="nav-link-label">{label}</span>
                  </div>
                  <div className="nav-link-arrow">
                    <FiChevronRight size={15} />
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Footer Sign Out ────────────────────────────── */}
        <div className="sidebar-footer-section">
          <button
            type="button"
            className="sidebar-signout-button"
            onClick={handleLogout}
          >
            <FiLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
