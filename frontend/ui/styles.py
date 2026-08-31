"""Global CSS — Premium Light SaaS Healthcare Theme."""

import streamlit as st
from frontend.config.palette import Palette as P

def inject_css(is_authenticated: bool = False) -> None:
    auth_sidebar_css = """
        section[data-testid="stSidebar"],
        [data-testid="collapsedControl"] {
            display: none !important;
        }
    """ if not is_authenticated else f"""
        section[data-testid="stSidebar"] {{
            background-color: {P.BG_SUBTLE} !important;
            border-right: 1px solid {P.BORDER} !important;
        }}
    """

    st.markdown(f"""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* -- Reset and Global Surface -- */
        html, body, .stApp {{
            background-color: {P.BG_PRIMARY} !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: {P.TEXT_PRIMARY} !important;
        }}

        {auth_sidebar_css}

        section[data-testid="stSidebar"] .block-container {{
            padding-top: 2rem !important;
            padding-left: 1.2rem !important;
            padding-right: 1.2rem !important;
        }}

        /* Main Block Container Padding */
        .block-container {{
            padding-top: 1rem !important;
            padding-bottom: 3.5rem !important;
            max-width: 1280px !important;
            margin: 0 auto !important;
        }}

        /* ============================================================
           SIDEBAR BRANDING & WIDGETS
           ============================================================ */
        .sidebar-brand {{
            padding-bottom: 16px;
            margin-bottom: 20px;
            border-bottom: 1px solid {P.BORDER};
        }}
        .sidebar-brand h2 {{
            color: {P.TEXT_PRIMARY} !important;
            font-size: 1.35rem;
            font-weight: 800;
            margin: 0 0 2px 0;
            letter-spacing: -0.5px;
        }}
        .sidebar-brand p {{
            color: {P.TEXT_SECONDARY} !important;
            font-size: 0.78rem;
            margin: 0;
        }}
        .sidebar-user-pill {{
            background: {P.BG_CARD};
            border: 1px solid {P.BORDER};
            padding: 8px 14px;
            border-radius: 12px;
            font-size: 0.82rem;
            color: {P.TEXT_SECONDARY};
            margin-bottom: 20px;
            box-shadow: {P.SHADOW};
        }}

        /* Sidebar Radio Navigation */
        section[data-testid="stSidebar"] .stRadio label {{
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            padding: 8px 0 !important;
            color: {P.TEXT_SECONDARY} !important;
            transition: color 0.2s ease;
        }}
        section[data-testid="stSidebar"] .stRadio label:hover {{
            color: {P.PRIMARY} !important;
        }}

        /* ============================================================
           FORMS & INPUTS (SaaS Rounded Aesthetics)
           ============================================================ */
        div[data-testid="stForm"] {{
            background: {P.BG_CARD} !important;
            border: 1px solid {P.BORDER} !important;
            border-radius: 24px !important;
            padding: 32px !important;
            box-shadow: {P.SHADOW_MD} !important;
        }}

        input[type="text"],
        input[type="password"],
        input[type="email"],
        input[type="number"],
        textarea,
        .stTextInput > div > div > input,
        .stTextArea > div > div > textarea {{
            background-color: {P.BG_PRIMARY} !important;
            color: {P.TEXT_PRIMARY} !important;
            border: 1px solid {P.BORDER} !important;
            border-radius: 16px !important;
            padding: 12px 16px !important;
            font-size: 0.95rem !important;
            transition: all 0.2s ease;
        }}

        input:focus, textarea:focus,
        .stTextInput > div > div > input:focus,
        .stTextArea > div > div > textarea:focus {{
            border-color: {P.PRIMARY} !important;
            box-shadow: 0 0 0 4px rgba(91, 141, 239, 0.1) !important;
            outline: none !important;
        }}

        input::placeholder, textarea::placeholder {{
            color: {P.TEXT_MUTED} !important;
        }}

        label, div[data-testid="stWidgetLabel"] p {{
            color: {P.TEXT_PRIMARY} !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
        }}

        .stSelectbox > div > div,
        .stMultiSelect > div > div {{
            background-color: {P.BG_PRIMARY} !important;
            border: 1px solid {P.BORDER} !important;
            border-radius: 16px !important;
            color: {P.TEXT_PRIMARY} !important;
        }}

        .stButton > button[kind="primary"],
        .stFormSubmitButton > button {{
            background: {P.PRIMARY} !important;
            color: #FFFFFF !important;
            border: none !important;
            border-radius: 50px !important;
            font-weight: 600 !important;
            padding: 12px 28px !important;
            font-size: 1rem !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 12px rgba(91, 141, 239, 0.25) !important;
        }}
        .stButton > button[kind="primary"]:hover,
        .stFormSubmitButton > button:hover {{
            background: {P.PRIMARY_DARK} !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(91, 141, 239, 0.35) !important;
        }}
        .stButton > button[kind="secondary"] {{
            background: transparent !important;
            color: {P.TEXT_PRIMARY} !important;
            border: 1px solid {P.BORDER} !important;
            border-radius: 50px !important;
            font-weight: 600 !important;
            padding: 12px 28px !important;
            transition: all 0.3s ease !important;
        }}
        .stButton > button[kind="secondary"]:hover {{
            border-color: {P.PRIMARY} !important;
            color: {P.PRIMARY} !important;
            background: {P.BG_DARK_SEC} !important;
        }}

        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {{
            display: flex !important;
            justify-content: center !important;
            gap: 16px !important;
            border-bottom: 2px solid {P.BORDER} !important;
            margin-bottom: 24px !important;
        }}
        .stTabs [data-baseweb="tab"] {{
            padding: 12px 24px !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            color: {P.TEXT_SECONDARY} !important;
            background: transparent !important;
            border: none !important;
            border-radius: 12px 12px 0 0 !important;
        }}
        .stTabs [aria-selected="true"] {{
            color: {P.PRIMARY} !important;
            border-bottom: 3px solid {P.PRIMARY} !important;
        }}

        /* ============================================================
           DASHBOARD REMEDY CARD
           ============================================================ */
        .remedy-card {{
            background: {P.BG_CARD};
            border: 1px solid {P.BORDER};
            border-top: 6px solid {P.SECONDARY};
            border-radius: 24px;
            padding: 32px;
            margin-top: 16px;
            box-shadow: {P.SHADOW_MD};
        }}
        .remedy-card h3 {{
            color: {P.TEXT_PRIMARY} !important;
            margin-top: 0;
            font-size: 1.4rem;
            font-weight: 700;
        }}
        .sanskrit-block {{
            background: {P.SAGE_BG};
            border: 1px solid {P.SAGE};
            padding: 20px 24px;
            border-radius: 16px;
            font-size: 1.25rem;
            line-height: 2.1;
            color: {P.TEXT_PRIMARY} !important;
            font-family: 'Noto Sans Devanagari', serif;
            margin: 20px 0;
            text-align: center;
        }}
        .transliteration {{
            color: {P.TEXT_SECONDARY} !important;
            font-style: italic;
            font-size: 0.95rem;
            margin-bottom: 16px;
            text-align: center;
        }}
        .translation {{
            color: {P.TEXT_PRIMARY} !important;
            font-size: 1.05rem;
            line-height: 1.8;
            border-left: 4px solid {P.PRIMARY};
            padding-left: 20px;
            margin: 20px 0;
            background: {P.BG_PRIMARY};
            padding: 16px 20px;
            border-radius: 0 16px 16px 0;
        }}
        .grounding-step {{
            background: {P.BG_PRIMARY};
            border: 1px solid {P.BORDER};
            border-radius: 12px;
            padding: 14px 18px;
            margin: 8px 0;
            color: {P.TEXT_PRIMARY} !important;
            font-size: 0.95rem;
            line-height: 1.5;
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .grounding-step::before {{
            content: "•";
            color: {P.PRIMARY};
            font-size: 1.5rem;
        }}

        div[data-testid="stMetric"] {{
            background: {P.BG_CARD} !important;
            border: 1px solid {P.BORDER} !important;
            border-radius: 20px !important;
            padding: 16px 20px !important;
            box-shadow: {P.SHADOW} !important;
        }}

        .section-label {{
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: {P.PRIMARY} !important;
            font-weight: 700;
            margin-bottom: 12px;
        }}
        
        /* General Streamlit tweaks for cleaner look */
        div[data-testid="stVerticalBlock"] > div {{
            gap: 1.5rem;
        }}

        @media (max-width: 768px) {{
            div[data-testid="stHorizontalBlock"] {{
                flex-direction: column !important;
            }}
            div[data-testid="stHorizontalBlock"] > div {{
                width: 100% !important;
                flex: none !important;
            }}
        }}
    </style>
    """, unsafe_allow_html=True)
