import React, { useState } from 'react';
import { Plus, Play, Trash2, ArrowUp, ArrowDown, Share2, Music, Check, Disc } from 'lucide-react';
import { exportPlaylistToSpotify } from '../spotifyService';

export default function PlaylistsTab({
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onReorderPlaylist,
  onPlayTrack,
  isSpotifyMode,
  spotifyUser,
  showToast,
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    playlists.length > 0 ? playlists[0].id : null
  );
  const [isExporting, setIsExporting] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newId = onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setSelectedPlaylistId(newId);
  };

  const handleExport = async () => {
    if (!selectedPlaylist || selectedPlaylist.tracks.length === 0) return;
    setIsExporting(true);
    try {
      const trackUris = selectedPlaylist.tracks.map((t) => t.uri).filter(Boolean);
      
      if (trackUris.length === 0) {
        showToast('Cannot export: No Spotify tracks in this playlist (Sandbox tracks cannot be exported).', 'error');
        setIsExporting(false);
        return;
      }

      const res = await exportPlaylistToSpotify(selectedPlaylist.name, trackUris);
      showToast(`Successfully exported "${selectedPlaylist.name}" to your Spotify account!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Export failed: ${err.message || 'Check console details.'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={styles.container}>
      {/* Sidebar: Lists Playlists & Create Form */}
      <div style={styles.leftPane}>
        <form onSubmit={handleCreate} style={styles.createForm}>
          <input
            type="text"
            placeholder="New Playlist Name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            style={styles.createInput}
          />
          <button type="submit" style={styles.createBtn} title="Create Playlist">
            <Plus size={18} />
          </button>
        </form>

        <div style={styles.playlistList}>
          {playlists.length === 0 ? (
            <div style={styles.emptyState}>No playlists created yet.</div>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlaylistId(p.id)}
                style={
                  p.id === selectedPlaylistId
                    ? { ...styles.playlistItem, ...styles.playlistItemActive }
                    : styles.playlistItem
                }
              >
                <Disc
                  size={16}
                  style={
                    p.id === selectedPlaylistId
                      ? { color: 'var(--color-spotify)' }
                      : { color: 'var(--color-text-secondary)' }
                  }
                />
                <span style={styles.playlistItemText}>{p.name}</span>
                <span style={styles.playlistItemCount}>{p.tracks.length}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Show Tracks of Selected Playlist */}
      <div style={styles.rightPane} className="glass-panel">
        {selectedPlaylist ? (
          <div style={styles.detailContainer}>
            <div style={styles.playlistHeader}>
              <div style={styles.playlistArtPlaceholder} className="spotify-gradient">
                <Music size={40} style={{ color: '#000' }} />
              </div>
              <div style={styles.playlistMeta}>
                <span style={styles.metaLabel}>PLAYLIST</span>
                <h2 style={styles.playlistTitle}>{selectedPlaylist.name}</h2>
                <div style={styles.metaText}>
                  <span>{selectedPlaylist.tracks.length} tracks</span>
                  {selectedPlaylist.tracks.length > 0 && (
                    <span>
                      {' '}•{' '}
                      {formatDuration(
                        selectedPlaylist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.headerActions}>
                {isSpotifyMode && selectedPlaylist.tracks.length > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    style={styles.exportBtn}
                  >
                    <Share2 size={16} />
                    {isExporting ? 'Exporting...' : 'Export to Spotify'}
                  </button>
                )}
                <button
                  onClick={() => {
                    onDeletePlaylist(selectedPlaylist.id);
                    setSelectedPlaylistId(playlists.find((p) => p.id !== selectedPlaylist.id)?.id || null);
                  }}
                  style={styles.deletePlaylistBtn}
                  title="Delete Playlist"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>

            {selectedPlaylist.tracks.length === 0 ? (
              <div style={styles.tracksEmpty}>
                <Music size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
                <p>This playlist is empty.</p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Go to the Search tab to discover and add tracks!
                </p>
              </div>
            ) : (
              <div style={styles.tracksListContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={{ ...styles.th, width: '40px', textAlign: 'center' }}>#</th>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Album</th>
                      <th style={{ ...styles.th, width: '80px', textAlign: 'right' }}>Duration</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlaylist.tracks.map((track, index) => (
                      <tr key={`${track.id}-${index}`} style={styles.trackRow} className="track-row">
                        <td style={styles.tdIndex}>
                          <span className="index-number">{index + 1}</span>
                          <button
                            onClick={() => onPlayTrack(track, selectedPlaylist.tracks)}
                            style={styles.rowPlayBtn}
                            className="row-play-btn"
                          >
                            <Play size={14} fill="currentColor" />
                          </button>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.trackInfo}>
                            <img
                              src={track.albumArt}
                              alt={track.name}
                              style={styles.rowAlbumArt}
                            />
                            <div>
                              <div style={styles.rowTrackName} title={track.name}>
                                {track.name}
                              </div>
                              <div style={styles.rowArtistName} title={track.artist}>
                                {track.artist}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.rowAlbumName} title={track.album}>
                            {track.album}
                          </span>
                        </td>
                        <td style={styles.tdDuration}>
                          {formatDuration(track.duration)}
                        </td>
                        <td style={styles.tdActions}>
                          <div style={styles.actionButtonGroup}>
                            <button
                              onClick={() => onReorderPlaylist(selectedPlaylist.id, index, 'up')}
                              disabled={index === 0}
                              style={styles.reorderBtn}
                              title="Move Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => onReorderPlaylist(selectedPlaylist.id, index, 'down')}
                              disabled={index === selectedPlaylist.tracks.length - 1}
                              style={styles.reorderBtn}
                              title="Move Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                              style={styles.removeBtn}
                              title="Remove from Playlist"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.noPlaylistSelected}>
            <Music size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
            <h3>No Playlist Selected</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Create a new playlist on the left or select an existing one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - var(--player-height) - 130px)',
  },
  leftPane: {
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
  },
  createForm: {
    display: 'flex',
    gap: '8px',
  },
  createInput: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#fff',
    transition: 'all 0.2s ease',
  },
  createBtn: {
    background: 'var(--color-spotify)',
    color: '#000',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    flexShrink: 0,
  },
  playlistList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '24px 0',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
  },
  playlistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'left',
    color: 'var(--color-text-secondary)',
    transition: 'all 0.2s',
    '&:hover': {
      background: 'rgba(255,255,255,0.03)',
      color: '#fff',
    },
  },
  playlistItemActive: {
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontWeight: '600',
  },
  playlistItemText: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  playlistItemCount: {
    fontSize: '11px',
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '2px 6px',
    borderRadius: '10px',
    color: 'var(--color-text-secondary)',
  },
  rightPane: {
    flex: 1,
    borderRadius: '16px',
    overflow: 'hidden',
  },
  noPlaylistSelected: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px',
  },
  detailContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  playlistHeader: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid var(--color-border)',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  playlistArtPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: 'var(--color-text-secondary)',
  },
  playlistTitle: {
    fontSize: '28px',
    fontWeight: '800',
    lineHeight: '1.2',
    margin: '4px 0',
  },
  metaText: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  exportBtn: {
    background: 'var(--color-spotify)',
    color: '#000',
    fontWeight: '700',
    fontSize: '13px',
    padding: '10px 16px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(29, 185, 84, 0.2)',
  },
  deletePlaylistBtn: {
    background: 'rgba(255, 77, 77, 0.1)',
    color: '#ff4d4d',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    fontWeight: '600',
    fontSize: '13px',
    padding: '10px 16px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tracksEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
  },
  tracksListContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  th: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
  },
  trackRow: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '10px 12px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  tdIndex: {
    padding: '10px 12px',
    fontSize: '14px',
    verticalAlign: 'middle',
    color: 'var(--color-text-secondary)',
    position: 'relative',
    textAlign: 'center',
  },
  rowPlayBtn: {
    display: 'none',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#fff',
  },
  trackInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  rowAlbumArt: {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  rowTrackName: {
    fontWeight: '500',
    color: '#fff',
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowArtistName: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowAlbumName: {
    color: 'var(--color-text-secondary)',
    fontSize: '13px',
    display: 'block',
    maxWidth: '200px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdDuration: {
    padding: '10px 12px',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  tdActions: {
    padding: '10px 12px',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  actionButtonGroup: {
    display: 'inline-flex',
    gap: '4px',
  },
  reorderBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:disabled': {
      opacity: '0.3',
      cursor: 'not-allowed',
    },
  },
  removeBtn: {
    background: 'rgba(255, 77, 77, 0.05)',
    border: '1px solid rgba(255, 77, 77, 0.1)',
    color: '#ff4d4d',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// CSS Rules for Hover States
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .track-row:hover {
      background: rgba(255, 255, 255, 0.04) !important;
    }
    .track-row:hover .index-number {
      display: none !important;
    }
    .track-row:hover .row-play-btn {
      display: flex !important;
    }
    .playlist-item:hover {
      background: rgba(255, 255, 255, 0.03) !important;
      color: #fff !important;
    }
  `;
  document.head.appendChild(styleTag);
}
