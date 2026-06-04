import React, { useState } from 'react';
import { ExternalLink, Lock, CheckCircle, LogOut, Info, Settings } from 'lucide-react';
import { redirectToSpotifyAuthorize, logoutSpotify } from '../spotifyService';

export default function SettingsTab({ spotifyUser, onLogout, clientId, onSaveClientId }) {
  const [tempClientId, setTempClientId] = useState(clientId || '');
  const [error, setError] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!tempClientId.trim()) {
      setError('Please enter a valid Client ID.');
      return;
    }
    setError('');
    onSaveClientId(tempClientId.trim());
    try {
      await redirectToSpotifyAuthorize(tempClientId.trim());
    } catch (err) {
      setError('Failed to initiate login. Check console.');
    }
  };

  const handleDisconnect = () => {
    logoutSpotify();
    onLogout();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Settings size={28} style={{ color: 'var(--color-spotify)' }} />
        <h2 style={styles.title}>Spotify Web API Connection</h2>
      </div>

      {spotifyUser ? (
        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <img
              src={spotifyUser.images?.[0]?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
              alt={spotifyUser.display_name}
              style={styles.avatar}
            />
            <div>
              <div style={styles.connectedBadge}>
                <CheckCircle size={14} style={{ marginRight: 4 }} /> Connected
              </div>
              <h3 style={styles.profileName}>{spotifyUser.display_name}</h3>
              <p style={styles.profileEmail}>{spotifyUser.email}</p>
            </div>
          </div>

          <div style={styles.profileDetails}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Product Plan:</span>
              <span style={styles.detailValue}>{spotifyUser.product}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Spotify ID:</span>
              <span style={styles.detailValue}>{spotifyUser.id}</span>
            </div>
          </div>

          <button onClick={handleDisconnect} style={styles.disconnectBtn}>
            <LogOut size={16} /> Disconnect Spotify Account
          </button>
        </div>
      ) : (
        <div style={styles.connectFormContainer}>
          <p style={styles.introText}>
            By default, this application operates in <strong>Sandbox Mode</strong> using local royalty-free tracks.
            To search Spotify's entire library and export playlists directly to your account, connect using a Spotify Client ID.
          </p>

          <form onSubmit={handleConnect} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Lock size={14} style={{ marginRight: 6 }} /> Spotify Client ID
              </label>
              <input
                type="text"
                placeholder="Paste your 32-character Client ID here"
                value={tempClientId}
                onChange={(e) => setTempClientId(e.target.value)}
                style={styles.input}
              />
              {error && <span style={styles.errorText}>{error}</span>}
            </div>

            <button type="submit" style={styles.connectBtnActive}>
              Connect Spotify Account
            </button>
          </form>

          <div style={styles.instructions}>
            <h4 style={styles.instructionsTitle}>
              <Info size={16} style={{ marginRight: 6, color: 'var(--color-spotify)' }} /> How to get a Spotify Client ID:
            </h4>
            <ol style={styles.list}>
              <li>
                Go to the{' '}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Spotify Developer Dashboard <ExternalLink size={12} style={{ display: 'inline' }} />
                </a>{' '}
                and log in.
              </li>
              <li>Click <strong>Create app</strong>.</li>
              <li>
                Name your app (e.g., <em>30Days Challenge Playlist</em>) and add a description.
              </li>
              <li>
                In the <strong>Redirect URIs</strong> field, add EXACTLY:{' '}
                <code>{REDIRECT_URI}</code> (include the trailing slash!).
              </li>
              <li>Accept the terms and click <strong>Save</strong>.</li>
              <li>
                In your app's dashboard, go to <strong>Settings</strong> to find your <strong>Client ID</strong>.
              </li>
              <li>Copy and paste it into the field above!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '24px 0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  introText: {
    color: 'var(--color-text-secondary)',
    lineHeight: '1.6',
    marginBottom: '24px',
    fontSize: '15px',
  },
  profileCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--color-spotify)',
  },
  connectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(29, 185, 84, 0.15)',
    color: 'var(--color-spotify)',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  profileName: {
    fontSize: '20px',
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  },
  profileDetails: {
    borderTop: '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  detailLabel: {
    color: 'var(--color-text-secondary)',
  },
  detailValue: {
    fontWeight: '500',
  },
  connectFormContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#fff',
    transition: 'all 0.2s ease',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: '12px',
    marginTop: '4px',
  },
  connectBtnActive: {
    background: 'var(--color-spotify)',
    color: '#000',
    fontWeight: '700',
    fontSize: '14px',
    padding: '12px 24px',
    borderRadius: '24px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(29, 185, 84, 0.2)',
  },
  connectBtnActiveHover: {
    background: 'var(--color-spotify-hover)',
  },
  disconnectBtn: {
    background: 'rgba(255, 77, 77, 0.1)',
    color: '#ff4d4d',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    padding: '12px 20px',
    borderRadius: '24px',
    fontWeight: '600',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  instructions: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
  },
  instructionsTitle: {
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  list: {
    paddingLeft: '20px',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    lineHeight: '1.5',
  },
  link: {
    color: 'var(--color-spotify)',
    textDecoration: 'none',
  },
};
