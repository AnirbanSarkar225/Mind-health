"""Design tokens — Modern Premium Healthcare SaaS (Light Theme)."""

class Palette:
    """
    Design tokens for Gita-NeuroSync.
    Minimal white/off-white background with soft blue and mint-green gradients.
    """

    # -- Light theme backgrounds --
    HERO_BG       = "#F8FAFC"       # main light background
    BG_PRIMARY    = "#F8FAFC"       # main app background
    BG_CARD       = "#FFFFFF"       # surface
    BG_SUBTLE     = "#F1F5F9"       # slightly darker than bg, for subtle contrast
    BG_INPUT      = "#FFFFFF"       # input background
    BG_DARK_SEC   = "#EAF1FF"       # soft blue sections
    OVERLAY_BG    = "rgba(0,0,0,0.4)"
    HERO_OVERLAY  = "rgba(0,0,0,0.05)"

    # -- Primary (soft blue) --
    PRIMARY       = "#5B8DEF"
    PRIMARY_DARK  = "#4A77D8"
    PRIMARY_LIGHT = "#EAF1FF"

    # -- Secondary (soft mint) --
    SECONDARY     = "#8FDCC4"
    SECONDARY_LIGHT = "#EAF9F4"

    # -- Accent --
    ACCENT        = "#5B8DEF"
    ACCENT_LIGHT  = "#EAF1FF"

    # -- Sage (healing green) --
    SAGE          = "#8FDCC4"
    SAGE_LIGHT    = "#EAF9F4"
    SAGE_BG       = "#EAF9F4"

    # -- High-Contrast Pastel Card Colors (reworked for light theme) --
    PASTEL_PINK   = "#FFE4E6"       # Acute Anxiety
    PASTEL_PEACH  = "#FFEDD5"       # Depressive Lethargy
    PASTEL_CORAL  = "#FECDD3"       # Stress & Agitation
    PASTEL_BLUE   = "#E0F2FE"       # Cognitive Fatigue
    PASTEL_AMBER  = "#FEF3C7"       # Pre-Sleep Hyperarousal
    PASTEL_LILAC  = "#F3E8FF"       # Racing Thoughts
    PASTEL_CYAN   = "#CFFAFE"       # Hyper-Sympathetic Surge
    PASTEL_MINT   = "#D1FAE5"       # Equilibrium & Flow
    PASTEL_CREAM  = "#FEF9C3"
    PASTEL_SAGE   = "#CCFBF1"

    # -- Neutrals --
    BORDER        = "#E6EAF0"       # subtle card/input border
    BORDER_LIGHT  = "#F1F5F9"       # highlight border
    SHADOW        = "rgba(0, 0, 0, 0.04)"
    SHADOW_MD     = "rgba(0, 0, 0, 0.08)"

    # -- Typography colors --
    TEXT_PRIMARY   = "#172033"
    TEXT_SECONDARY = "#6B7280"
    TEXT_MUTED     = "#9CA3AF"
    TEXT_DARK      = "#0F172A"      
    TEXT_ON_COLOR  = "#FFFFFF"
    TEXT_ON_LIGHT  = "#172033"

    # -- Semantic status badges --
    RED_SOFT       = "#F87171"
    BLUE_SOFT      = "#60A5FA"
    AMBER_SOFT     = "#FBBF24"
    GREEN_SOFT     = "#34D399"


# Module-level aliases for robust fallback
BG_CARD = Palette.BG_CARD
BG_PRIMARY = Palette.BG_PRIMARY
PRIMARY = Palette.PRIMARY
BORDER = Palette.BORDER
