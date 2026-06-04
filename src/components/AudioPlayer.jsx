import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle, Repeat } from 'lucide-react';

export default function AudioPlayer({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPreviousTrack,
  volume,
  onVolumeChange,
}) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && currentTrack?.audioUrl) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback error (e.g. user interaction required):', err);
        onTogglePlay(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, onTogglePlay]);

  // Handle track source change
  useEffect(() => {
    setCurrentTime(0);
    setDuration(currentTrack?.duration || 0);

    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying && currentTrack?.audioUrl) {
        audioRef.current.play().catch((err) => {
          console.warn('Playback failed on track change:', err);
          onTogglePlay(false);
        });
      }
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      onNextTrack();
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  const hasAudioUrl = !!currentTrack.audioUrl;

  return (
    <div style={styles.container} className="glass-panel">
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        loop={isLooping}
      />

      {/* Left: Song Info */}
      <div style={styles.songInfo}>
        <img src={currentTrack.albumArt} alt={currentTrack.name} style={styles.albumArt} />
        <div style={styles.textContainer}>
          <div style={styles.trackName} title={currentTrack.name}>
            {currentTrack.name}
          </div>
          <div style={styles.artistName} title={currentTrack.artist}>
            {currentTrack.artist}
          </div>
        </div>

        {/* CSS Active Visualizer */}
        {isPlaying && hasAudioUrl && (
          <div style={styles.visualizer}>
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
          </div>
        )}
      </div>

      {/* Middle: Controls & Scrubber */}
      <div style={styles.playbackControls}>
        <div style={styles.controlButtons}>
          <button
            onClick={() => setIsLooping(!isLooping)}
            style={isLooping ? { ...styles.controlBtn, color: 'var(--color-spotify)' } : styles.controlBtn}
            title="Loop"
          >
            <Repeat size={16} />
          </button>
          
          <button onClick={onPreviousTrack} style={styles.controlBtn} title="Previous">
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={() => onTogglePlay(!isPlaying)}
            style={styles.playBtn}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={!hasAudioUrl}
          >
            {isPlaying && hasAudioUrl ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button onClick={onNextTrack} style={styles.controlBtn} title="Next">
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>

        <div style={styles.scrubberContainer}>
          <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!hasAudioUrl}
            style={styles.progressBar}
            className="progress-bar-slider"
          />
          <span style={styles.timeLabel}>{formatTime(duration)}</span>
        </div>

        {!hasAudioUrl && (
          <div style={styles.warningText}>
            <AlertCircle size={12} style={{ marginRight: 4 }} />
            Spotify restriction: Previews unavailable for this track.
          </div>
        )}
      </div>

      {/* Right: Volume */}
      <div style={styles.volumeControls}>
        <button onClick={toggleMute} style={styles.volumeIconBtn}>
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={styles.volumeSlider}
          className="volume-slider-range"
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'var(--player-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: '100',
    borderTop: '1px solid var(--color-border)',
  },
  songInfo: {
    display: 'flex',
    alignItems: 'center',
    width: '30%',
    minWidth: '180px',
  },
  albumArt: {
    width: '56px',
    height: '56px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginRight: '14px',
    border: '1px solid var(--color-border)',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    marginRight: '16px',
  },
  trackName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '2px',
  },
  artistName: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  visualizer: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '28px',
    paddingBottom: '4px',
  },
  playbackControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '40%',
    maxWidth: '500px',
  },
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '8px',
  },
  controlBtn: {
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#fff',
    },
  },
  playBtn: {
    background: '#fff',
    color: '#000',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
    '&:disabled': {
      background: 'rgba(255,255,255,0.3)',
      cursor: 'not-allowed',
    },
  },
  scrubberContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '8px',
  },
  timeLabel: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    minWidth: '30px',
    textAlign: 'center',
  },
  progressBar: {
    flex: '1',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  },
  warningText: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '4px',
  },
  volumeControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '30%',
    minWidth: '120px',
    gap: '8px',
  },
  volumeIconBtn: {
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      color: '#fff',
    },
  },
  volumeSlider: {
    width: '90px',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  },
};

// CSS Slider styling injection for premium look
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .progress-bar-slider, .volume-slider-range {
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.1);
      transition: background 0.1s;
    }
    .progress-bar-slider:hover, .volume-slider-range:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .progress-bar-slider::-webkit-slider-thumb, .volume-slider-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-spotify);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.1s;
    }
    .progress-bar-slider:hover::-webkit-slider-thumb, .volume-slider-range:hover::-webkit-slider-thumb {
      opacity: 1;
    }
  `;
  document.head.appendChild(styleTag);
}
