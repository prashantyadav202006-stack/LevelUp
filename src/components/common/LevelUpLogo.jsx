export default function LevelUpLogo({ size = 40, className = '', glow = true }) {
  return (
    <div
      className={`levelup-brand-logo-wrap ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: '#0c0d14',
        boxShadow: glow ? '0 4px 16px rgba(168, 85, 247, 0.35)' : 'none',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
      }}
    >
      <img
        src="/logo.png"
        alt="LevelUp Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

export function LevelUpLogoSVG({ size = 36, color = '#a855f7', className = '' }) {
  return (
    <div
      className={`levelup-svg-logo-wrap ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: '#0c0d14',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)',
      }}
    >
      <svg
        width={size * 0.85}
        height={size * 0.85}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bottom baseline */}
        <line
          x1="18"
          y1="82"
          x2="82"
          y2="82"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Trend zig-zag line */}
        <path
          d="M20 68 L36 51 L48 65 L70 38"
          stroke={color}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow head */}
        <path
          d="M55 35 L76 34 L77 55"
          stroke={color}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
