import { T } from '../theme';

export function LoginScreen({ onLogin, error }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: T.card, border: '1px solid ' + T.border,
        borderRadius: 12, padding: '40px 44px', maxWidth: 380, width: '90%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, margin: '0 auto 20px',
          background: 'linear-gradient(135deg,#B4830E,#C85A17)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff',
        }}>Δ</div>

        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 6 }}>
          BOM Changeover Tool
        </div>
        <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 32 }}>
          Sign in with your @standardbots.com Google account
        </div>

        <button
          onClick={onLogin}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '11px 16px', borderRadius: 7, cursor: 'pointer',
            border: '1px solid ' + T.border, background: '#fff',
            fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'inherit',
          }}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 6,
            background: '#fef2f2', border: '1px solid #fca5a5',
            fontSize: 11, color: T.red, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
