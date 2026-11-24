import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

/**
 * GeometricKiteGraphic - Decorative neobrutalist kite illustration
 */
function GeometricKiteGraphic({ rotation = 15, size = 120 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: 'drop-shadow(5px 5px 0px var(--border))',
      }}
      aria-hidden="true"
    >
      <polygon
        points="50,6 88,44 50,82 12,44"
        fill="#FFDE59"
        stroke="#171717"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line x1="50" y1="6" x2="50" y2="82" stroke="#171717" strokeWidth="3" />
      <line x1="12" y1="44" x2="88" y2="44" stroke="#171717" strokeWidth="3" />
      <path
        d="M50 82 Q38 92 46 98"
        fill="none"
        stroke="#FFDE59"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <polygon points="40,88 52,90 44,93" fill="#FF8066" stroke="#171717" strokeWidth="2" />
      <polygon points="50,96 38,97 45,100" fill="#B8E0D2" stroke="#171717" strokeWidth="2" />
    </svg>
  );
}

/**
 * NotFound Page - 404 error page with neobrutalist decorative shapes
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="page-container"
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 'var(--space-2xl) var(--space-md)',
      }}
    >
      {/* Decorative colored geometric blocks in background */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 'var(--space-xl)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: 50,
            height: 50,
            backgroundColor: 'var(--mint)',
            border: '3px solid var(--border)',
            boxShadow: 'var(--shadow)',
            transform: 'rotate(-10deg)',
          }}
        />
        <GeometricKiteGraphic size={110} rotation={8} />
        <div
          style={{
            width: 44,
            height: 44,
            backgroundColor: 'var(--coral)',
            border: '3px solid var(--border)',
            boxShadow: 'var(--shadow)',
            transform: 'rotate(12deg)',
          }}
        />
      </div>

      {/* Large 404 Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(5rem, 15vw, 8.5rem)',
          fontWeight: 800,
          lineHeight: 0.9,
          margin: 0,
          color: 'var(--text)',
          textShadow: '6px 6px 0px var(--primary), 8px 8px 0px var(--border)',
          letterSpacing: '-2px',
        }}
      >
        404
      </h1>

      {/* Neobrutalist Title Badge */}
      <div
        style={{
          backgroundColor: 'var(--primary)',
          border: '3px solid var(--border)',
          boxShadow: 'var(--shadow)',
          padding: '8px 24px',
          margin: 'var(--space-lg) 0 var(--space-md) 0',
          display: 'inline-block',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            margin: 0,
            color: 'var(--text)',
          }}
        >
          Oops! Page not found
        </h2>
      </div>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          maxWidth: 480,
          margin: '0 auto var(--space-xl) auto',
          lineHeight: 1.5,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Return to Dashboard CTA */}
      <Button
        variant="primary"
        size="lg"
        icon={<Home size={20} />}
        onClick={() => navigate('/dashboard')}
        style={{ minWidth: 220 }}
      >
        Back to Dashboard
      </Button>

      {/* Bottom Geometric Accents */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 'var(--space-2xl)',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            width: 70,
            height: 14,
            backgroundColor: 'var(--primary)',
            border: '2px solid var(--border)',
            boxShadow: '2px 2px 0px var(--border)',
          }}
        />
        <div
          style={{
            width: 110,
            height: 14,
            backgroundColor: 'var(--mint)',
            border: '2px solid var(--border)',
            boxShadow: '2px 2px 0px var(--border)',
          }}
        />
        <div
          style={{
            width: 60,
            height: 14,
            backgroundColor: 'var(--coral)',
            border: '2px solid var(--border)',
            boxShadow: '2px 2px 0px var(--border)',
          }}
        />
      </div>
    </div>
  );
}

export { NotFound };
