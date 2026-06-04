import React, { useState, useEffect } from 'react';
import { Search, Play, Plus, ChevronDown, Check, Music } from 'lucide-react';
import { searchSpotifyTracks } from '../spotifyService';
import { mockTracks } from '../mockDatabase';

export default function SearchTab({
  isSpotifyMode,
  playlists,
  onAddTrackToPlaylist,
  onPlayTrack,
  currentTrack,
  isPlaying,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Load default/featured tracks when search is empty
  useEffect(() => {
    if (!query) {
      if (isSpotifyMode) {
        setResults([]); // Can leave empty or query a default category like "Top Hits"
      } else {
        setResults(mockTracks); // Show all local tracks by default in sandbox mode
      }
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleSearch(query);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, isSpotifyMode]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    setError('');
    try {
      if (isSpotifyMode) {
        const tracks = await searchSpotifyTracks(searchQuery);
        setResults(tracks);
      } else {
        // Local search filter
        const filtered = mockTracks.filter(
          (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.genre.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filtered);
      }
    } catch (err) {
      console.error(err);
      setError('Search failed. Please verify your connection or client setup.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleDropdown = (trackId, e) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === trackId ? null : trackId);
  };

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const closeAllDropdowns = () => setActiveDropdownId(null);
    window.addEventListener('click', closeAllDropdowns);
    return () => window.removeEventListener('click', closeAllDropdowns);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.searchBarContainer}>
        <Search size={20} style={styles.searchIcon} />
        <input
          type="text"
          placeholder={
            isSpotifyMode
              ? "Search Spotify's library..."
              : "Search locally (e.g. Synthwave, Lofi, Rain...)"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
        />
        {!isSpotifyMode && (
          <span style={styles.sandboxBadge}>Sandbox Mode</span>
        )}
      </div>

      {error && <div style={styles.errorContainer}>{error}</div>}

      {loading ? (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner}></div>
        </div>
      ) : results.length === 0 ? (
        <div style={styles.noResults}>
          <Music size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
          <p>No tracks found. Try searching for something else.</p>
        </div>
      ) : (
        <div style={styles.resultsGrid}>
          {results.map((track) => {
            const isCurrent = currentTrack && currentTrack.id === track.id;
            return (
              <div
                key={track.id}
                className="glass-card"
                style={isCurrent ? { ...styles.card, ...styles.activeCard } : styles.card}
              >
                <div style={styles.artContainer}>
                  <img src={track.albumArt} alt={track.name} style={styles.albumArt} />
                  <button
                    onClick={() => onPlayTrack(track, results)}
                    style={styles.playOverlay}
                    className="play-overlay"
                  >
                    <Play size={28} fill="currentColor" />
                  </button>
                </div>

                <div style={styles.infoContainer}>
                  <h3 style={styles.trackName} title={track.name}>
                    {track.name}
                  </h3>
                  <p style={styles.trackArtist} title={track.artist}>
                    {track.artist}
                  </p>
                  <div style={styles.footerRow}>
                    <span style={styles.genreBadge}>{track.genre || 'Track'}</span>
                    <span style={styles.duration}>{formatDuration(track.duration)}</span>
                  </div>
                </div>

                <div style={styles.actionContainer}>
                  <button
                    onClick={(e) => toggleDropdown(track.id, e)}
                    style={styles.addBtn}
                    title="Add to Playlist"
                  >
                    <Plus size={16} /> Add <ChevronDown size={12} />
                  </button>

                  {activeDropdownId === track.id && (
                    <div style={styles.dropdown} className="glass-panel">
                      {playlists.length === 0 ? (
                        <div style={styles.dropdownItemMuted}>
                          Create a playlist first!
                        </div>
                      ) : (
                        playlists.map((playlist) => {
                          const hasTrack = playlist.tracks.some((t) => t.id === track.id);
                          return (
                            <button
                              key={playlist.id}
                              onClick={() => onAddTrackToPlaylist(track, playlist.id)}
                              style={styles.dropdownItem}
                              disabled={hasTrack}
                            >
                              <span style={styles.dropdownText}>{playlist.name}</span>
                              {hasTrack && <Check size={14} style={{ color: 'var(--color-spotify)' }} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 0',
  },
  searchBarContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--color-text-secondary)',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: '30px',
    padding: '14px 120px 14px 48px',
    fontSize: '15px',
    color: '#fff',
    transition: 'all 0.2s ease',
  },
  sandboxBadge: {
    position: 'absolute',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--color-text-secondary)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid var(--color-border)',
  },
  errorContainer: {
    background: 'rgba(255, 77, 77, 0.1)',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    color: '#ff4d4d',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 0',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(29, 185, 84, 0.1)',
    borderTop: '3px solid var(--color-spotify)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  noResults: {
    textAlign: 'center',
    padding: '80px 0',
    color: 'var(--color-text-secondary)',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    paddingBottom: '40px',
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '14px',
    height: '100%',
  },
  activeCard: {
    borderColor: 'var(--color-spotify)',
    boxShadow: '0 0 15px rgba(29, 185, 84, 0.15)',
  },
  artContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
    background: '#14141a',
  },
  albumArt: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    opacity: '0',
    borderRadius: '8px',
    transition: 'opacity 0.2s ease',
  },
  infoContainer: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
    minHeight: '68px',
  },
  trackName: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trackArtist: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  genreBadge: {
    fontSize: '10px',
    background: 'rgba(255,255,255,0.06)',
    padding: '3px 6px',
    borderRadius: '4px',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
  },
  duration: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  actionContainer: {
    position: 'relative',
    marginTop: 'auto',
  },
  addBtn: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid var(--color-border)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '18px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  dropdown: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '0',
    right: '0',
    zIndex: '10',
    borderRadius: '8px',
    padding: '4px',
    maxHeight: '160px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: 'var(--color-text-primary)',
    textAlign: 'left',
    transition: 'background 0.2s',
    '&:hover': {
      background: 'rgba(255,255,255,0.08)',
    },
  },
  dropdownText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginRight: '8px',
  },
  dropdownItemMuted: {
    padding: '8px 12px',
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
};

// CSS Rule Injection for spinners and play button hover triggers
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .glass-card:hover .play-overlay {
      opacity: 1 !important;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .add-btn:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: var(--color-border-hover) !important;
    }
  `;
  document.head.appendChild(styleTag);
}
