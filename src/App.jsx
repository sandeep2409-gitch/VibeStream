import React, { useState, useEffect } from 'react';
import { Music, Search, Disc, Settings, AlertCircle, CheckCircle, Radio } from 'lucide-react';
import { handleAuthorizationRedirect, getSpotifyUserProfile, getAccessToken, logoutSpotify } from './spotifyService';
import SearchTab from './components/SearchTab';
import PlaylistsTab from './components/PlaylistsTab';
import SettingsTab from './components/SettingsTab';
import AudioPlayer from './components/AudioPlayer';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [clientId, setClientId] = useState(() => window.localStorage.getItem('spotify_client_id') || '');
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [isSpotifyMode, setIsSpotifyMode] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Playlists State
  const [playlists, setPlaylists] = useState(() => {
    const saved = window.localStorage.getItem('music_app_playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayerList, setActivePlayerList] = useState([]);
  const [volume, setVolume] = useState(() => {
    const saved = window.localStorage.getItem('music_app_volume');
    return saved ? parseFloat(saved) : 0.5;
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync playlists to localStorage
  useEffect(() => {
    window.localStorage.setItem('music_app_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Sync volume to localStorage
  useEffect(() => {
    window.localStorage.setItem('music_app_volume', volume.toString());
  }, [volume]);

  // Handle Spotify OAuth Callback and Token validation on Mount
  useEffect(() => {
    const initAuth = async () => {
      setLoadingAuth(true);
      // Check if we just redirected back with 'code' in query
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        showToast('Authenticating with Spotify...', 'success');
        const token = await handleAuthorizationRedirect();
        if (token) {
          showToast('Successfully connected to Spotify!', 'success');
        } else {
          showToast('Failed to exchange code for token.', 'error');
        }
      }

      // Check access token validity
      const token = await getAccessToken();
      if (token) {
        try {
          const profile = await getSpotifyUserProfile();
          if (profile) {
            setSpotifyUser(profile);
            setIsSpotifyMode(true);
            // Sync clientId from local storage
            setClientId(window.localStorage.getItem('spotify_client_id') || '');
          } else {
            setIsSpotifyMode(false);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setIsSpotifyMode(false);
        }
      } else {
        setIsSpotifyMode(false);
      }
      setLoadingAuth(false);
    };

    initAuth();
  }, []);

  // Playlist Actions
  const handleCreatePlaylist = (name) => {
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name,
      tracks: [],
    };
    setPlaylists([...playlists, newPlaylist]);
    showToast(`Created playlist "${name}"`);
    return newPlaylist.id;
  };

  const handleDeletePlaylist = (playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    setPlaylists(playlists.filter((p) => p.id !== playlistId));
    if (playlist) {
      showToast(`Deleted playlist "${playlist.name}"`, 'error');
    }
  };

  const handleAddTrackToPlaylist = (track, playlistId) => {
    setPlaylists(
      playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        // Prevent duplicate songs
        if (playlist.tracks.some((t) => t.id === track.id)) return playlist;
        showToast(`Added "${track.name}" to ${playlist.name}`);
        return {
          ...playlist,
          tracks: [...playlist.tracks, track],
        };
      })
    );
  };

  const handleRemoveTrackFromPlaylist = (playlistId, trackId) => {
    setPlaylists(
      playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        const track = playlist.tracks.find((t) => t.id === trackId);
        if (track) {
          showToast(`Removed "${track.name}" from ${playlist.name}`, 'error');
        }
        return {
          ...playlist,
          tracks: playlist.tracks.filter((t) => t.id !== trackId),
        };
      })
    );
  };

  const handleReorderPlaylist = (playlistId, index, direction) => {
    setPlaylists(
      playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        const newTracks = [...playlist.tracks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newTracks.length) return playlist;
        
        // Swap elements
        const temp = newTracks[index];
        newTracks[index] = newTracks[targetIndex];
        newTracks[targetIndex] = temp;
        
        return {
          ...playlist,
          tracks: newTracks,
        };
      })
    );
  };

  // Playback Control Callbacks
  const handlePlayTrack = (track, list = []) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setActivePlayerList(list.length > 0 ? list : [track]);
  };

  const handleNextTrack = () => {
    if (activePlayerList.length <= 1 || !currentTrack) return;
    const currentIndex = activePlayerList.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % activePlayerList.length;
    setCurrentTrack(activePlayerList[nextIndex]);
    setIsPlaying(true);
  };

  const handlePreviousTrack = () => {
    if (activePlayerList.length <= 1 || !currentTrack) return;
    const currentIndex = activePlayerList.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;
    
    // Wrap around correctly
    const prevIndex = (currentIndex - 1 + activePlayerList.length) % activePlayerList.length;
    setCurrentTrack(activePlayerList[prevIndex]);
    setIsPlaying(true);
  };

  const handleSaveClientId = (id) => {
    setClientId(id);
    window.localStorage.setItem('spotify_client_id', id);
  };

  const handleLogout = () => {
    logoutSpotify();
    setSpotifyUser(null);
    setIsSpotifyMode(false);
    showToast('Switched to Sandbox Mode', 'success');
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={styles.appContainer}>
      <div className="bg-radial-gradient"></div>

      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess),
          }}
          className="glass-panel"
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} style={{ color: '#ff4d4d' }} />
          ) : (
            <CheckCircle size={18} style={{ color: 'var(--color-spotify)' }} />
          )}
          <span style={styles.toastMessage}>{toast.message}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.logoContainer}>
          <div style={styles.logoIconBg} className="spotify-gradient">
            <Radio size={22} style={{ color: '#000' }} />
          </div>
          <span style={styles.logoText}>VibeStream</span>
        </div>

        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab('search')}
            style={
              activeTab === 'search'
                ? { ...styles.navLink, ...styles.navLinkActive }
                : styles.navLink
            }
          >
            <Search size={18} />
            <span>Search Songs</span>
          </button>
          
          <button
            onClick={() => setActiveTab('playlists')}
            style={
              activeTab === 'playlists'
                ? { ...styles.navLink, ...styles.navLinkActive }
                : styles.navLink
            }
          >
            <Disc size={18} />
            <span>Playlists</span>
            {playlists.length > 0 && (
              <span style={styles.playlistCountBadge}>{playlists.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={
              activeTab === 'settings'
                ? { ...styles.navLink, ...styles.navLinkActive }
                : styles.navLink
            }
          >
            <Settings size={18} />
            <span>Spotify Setup</span>
          </button>
        </nav>

        {/* Footer info showing state */}
        <div style={styles.sidebarFooter}>
          {loadingAuth ? (
            <div style={styles.statusLabel}>Checking status...</div>
          ) : isSpotifyMode && spotifyUser ? (
            <div style={styles.statusBox}>
              <div style={styles.statusDotActive}></div>
              <div style={styles.statusTextContainer}>
                <div style={styles.statusHeading}>Spotify Online</div>
                <div style={styles.statusSub}>{spotifyUser.display_name}</div>
              </div>
            </div>
          ) : (
            <div style={styles.statusBox}>
              <div style={styles.statusDotSandbox}></div>
              <div style={styles.statusTextContainer}>
                <div style={styles.statusHeading}>Local Sandbox</div>
                <div style={styles.statusSub}>Offline Mode</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content */}
      <main style={styles.mainContent}>
        <header style={styles.mainHeader}>
          <h1 style={styles.greetingTitle}>
            {activeTab === 'search' ? `${getGreeting()}` : activeTab === 'playlists' ? 'Your Music Library' : 'System Configuration'}
          </h1>
          <p style={styles.greetingSub}>
            {activeTab === 'search'
              ? 'Find tracks, play 30s previews and curate your next playlist.'
              : activeTab === 'playlists'
              ? 'Create custom collections and order your tracks.'
              : 'Switch between the offline Sandbox and Spotify Developer API.'}
          </p>
        </header>

        <div style={styles.tabContentContainer}>
          {activeTab === 'search' && (
            <SearchTab
              isSpotifyMode={isSpotifyMode}
              playlists={playlists}
              onAddTrackToPlaylist={handleAddTrackToPlaylist}
              onPlayTrack={handlePlayTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsTab
              playlists={playlists}
              onCreatePlaylist={handleCreatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
              onReorderPlaylist={handleReorderPlaylist}
              onPlayTrack={handlePlayTrack}
              isSpotifyMode={isSpotifyMode}
              spotifyUser={spotifyUser}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              spotifyUser={spotifyUser}
              onLogout={handleLogout}
              clientId={clientId}
              onSaveClientId={handleSaveClientId}
            />
          )}
        </div>
      </main>

      {/* Bottom Global Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={setIsPlaying}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    overflow: 'hidden',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    animation: 'slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    maxWidth: '400px',
  },
  toastSuccess: {
    borderLeft: '4px solid var(--color-spotify)',
  },
  toastError: {
    borderLeft: '4px solid #ff4d4d',
  },
  toastMessage: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    zIndex: 10,
    flexShrink: 0,
    borderRadius: '0 24px 24px 0',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logoIconBg: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #fff 0%, #a7a7a7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
  },
  playlistCountBadge: {
    marginLeft: 'auto',
    background: 'rgba(255, 255, 255, 0.08)',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  sidebarFooter: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: '20px',
    marginTop: 'auto',
  },
  statusLabel: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--color-spotify)',
    boxShadow: '0 0 8px var(--color-spotify)',
  },
  statusDotSandbox: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#a7a7a7',
  },
  statusTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusHeading: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
  },
  statusSub: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    maxWidth: '160px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mainContent: {
    flex: 1,
    height: '100%',
    overflowY: 'auto',
    padding: '30px 40px calc(var(--player-height) + 30px) 40px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 5,
  },
  mainHeader: {
    marginBottom: '28px',
  },
  greetingTitle: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '6px',
  },
  greetingSub: {
    fontSize: '15px',
    color: 'var(--color-text-secondary)',
    maxWidth: '600px',
  },
  tabContentContainer: {
    flex: 1,
  },
};

// Injection of animations for toast sliding in
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    @keyframes slide-in {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
