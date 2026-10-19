# LevelUp Fitness & Performance - React Authentication Portal

A cutting-edge, high-energy athlete sign-in and sign-up web application built in **React (JavaScript)** with **Vite**, inspired directly by athletic performance visuals and neon violet/purple aesthetics.

## Architecture & Technology Stack

- **Framework**: React 19 + Vite 8
- **Language**: JavaScript (ES Modules, JSX)
- **Styling**: Vanilla CSS Design System with CSS Custom Properties, Glassmorphism, and responsive breakpoints
- **Audio**: Web Audio API Synthetic SFX Engine

## Key Features

- **Reference-Inspired Aesthetic**: Dark background (`#07040a`) with atmospheric neon violet (`#a855f7`, `#c084fc`, `#d946ef`) speed trails matching the reference athletes image.
- **Centered Glassmorphic Auth Card**: Perfectly centered in the viewport with mouse-reactive 3D perspective tilt (`rotateX`, `rotateY`) and cursor glare illumination.
- **Dual Mode Switching**: Fluid sliding pill tab indicator toggling between **Sign In** and **Join LevelUp** (Sign Up).
- **Live Password Strength Meter**: Dynamic 4-tier security evaluation (*Rookie* -> *Standard* -> *Pro Athlete* -> ***ELITE BEAST ⚡***) with animated neon progress bars.
- **Controlled React Forms**: Validated inputs with show/hide password toggle, accessible labels, and inline error feedback.
- **Synthetic Web Audio SFX**: Generates sound effects (clicks, tab switches, success chimes) on demand without external audio files, with a toggleable mute switch in the navbar.
- **HTML5 Speed-Streaks Canvas**: Renders real-time particles and diagonal light streaks in sync with the sprinting athlete visual.
- **1-Click "Demo Athlete" Quick-Fill**: Instantly loads sample credentials (`athlete@levelup.com` / `ElitePower2026!`) with an athlete dashboard welcome modal.
- **Interactive Modals**:
  - *Forgot Athlete Code Modal*: Instant email recovery key workflow.
  - *Welcome Dashboard Modal*: Post-login stats preview (Readiness Score, Workout Day, XP Points).

## Component Hierarchy

```
src/
├── main.jsx                     # React entry point
├── App.jsx                      # Main application orchestrator & state manager
├── index.css                    # Complete design system & responsive styling
├── assets/
│   └── hero-athletes.png        # Reference visual asset
├── components/
│   ├── BackgroundScene.jsx      # Layered athlete visual with radial gradients & vignette
│   ├── SpeedCanvas.jsx          # Real-time particle and light streak canvas
│   ├── Navbar.jsx               # Brand logo, SFX toggle, and Demo Athlete button
│   ├── AuthCard.jsx             # Centered glassmorphic card with 3D tilt
│   ├── SignInForm.jsx           # Sign-in inputs, remember-me, and submit action
│   ├── SignUpForm.jsx           # Sign-up inputs, strength meter, and goal selector
│   ├── SocialAuthGroup.jsx      # Google and Apple quick-auth buttons
│   ├── ForgotPasswordModal.jsx  # Reset password dialog
│   ├── WelcomeModal.jsx         # Post-auth athlete command dashboard preview
│   └── ToastContainer.jsx       # Floating notification alerts
└── utils/
    └── soundEngine.js           # Web Audio API sound generator
```

## Running the App

The Vite dev server is running at:
**[http://127.0.0.1:3000](http://127.0.0.1:3000)**

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Create optimized production build
npm run build
```
