import { useState, useEffect, useCallback } from 'react';
import './index.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { AUDIO_ITEMS } from './data/audioData';
import type { AudioItem } from './types/audio';
import { audioPlayer } from './audio/player';
import { useTimer } from './hooks/useTimer';
import { useDragSort } from './hooks/useDragSort';

const TIMER_OPTIONS = [1, 15, 30, 60, 120];

// Defined outside the component: no closures, no hooks, no stale refs.
function playSequential(
  index: number,
  queue: AudioItem[],
  onIndexChange: (i: number) => void
): void {
  if (queue.length === 0) return;
  const safeIndex = index % queue.length;
  audioPlayer.playSingle(queue[safeIndex], () => {
    const nextIndex = (safeIndex + 1) % queue.length;
    onIndexChange(nextIndex);
    playSequential(nextIndex, queue, onIndexChange);
  });
}

const App = () => {
  const { t, i18n } = useTranslation();

  const [selected, setSelected] = useState<AudioItem[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playMode, setPlayMode] = useState<'all' | 'one'>('all');
  const [queueIndex, setQueueIndex] = useState<number>(0);
  
  // Track forces re-renders for volume changes when they happen directly on player
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const onEnd = useCallback(() => {

    audioPlayer.reset();
    setIsPlaying(false);
    setActiveTimer(null);
    setCustomMinutes(0);
  }, []);

  const timer = useTimer(onEnd);

  // FADING LOGIC
  useEffect(() => {
    if (!isPlaying) return;
    if (timer.totalSeconds <= 0) return;

    // Threshold calculation: 5 mins if default, 60 seconds if < 5 mins
    const threshold = timer.totalSeconds > 300 ? 300 : 60;

    if (timer.seconds <= threshold && timer.seconds > 0) {
      // Linear fade out
      const calculatedVolume = timer.seconds / threshold;
      audioPlayer.setGlobalVolume(calculatedVolume);
    } else if (timer.seconds > threshold) {
      audioPlayer.setGlobalVolume(1.0);
    }
  }, [timer.seconds, timer.totalSeconds, isPlaying]);

  // Sync state with lock-screen commands
  useEffect(() => {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    window.addEventListener('app_play', handlePlay);
    window.addEventListener('app_pause', handlePause);
    return () => {
      window.removeEventListener('app_play', handlePlay);
      window.removeEventListener('app_pause', handlePause);
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleItem = (item: AudioItem): void => {
    if (item.premium && !isPremium) {
      setIsModalOpen(true);
      return;
    }

    setSelected((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      return exists
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item];
    });
  };

  const removeFromQueue = (id: string): void => {
    setSelected((prev) => prev.filter((i) => i.id !== id));
  };

  // Sync Mix while playing/adding/removing (only in 'all' mode)
  useEffect(() => {
    if (isPlaying && playMode === 'all') {
      audioPlayer.syncTracks(selected);
      // Auto-pause if we removed the last track — defer setState out of the effect body
      if (selected.length === 0) {
        audioPlayer.stop();
        setTimeout(() => {
          setIsPlaying(false);
          timer.stop();
        }, 0);
      }
    }
  }, [selected, isPlaying, playMode, timer]);

  const playCurrentInQueue = useCallback((index: number, queue: AudioItem[]) => {
    playSequential(index, queue, setQueueIndex);
  }, []);

  const togglePlayback = (): void => {
    if (selected.length === 0) return;

    if (isPlaying) {

      audioPlayer.stop();
      timer.stop();
      setIsPlaying(false);
    } else {


      if (playMode === 'one') {
        // Sequential mode: play from current queue position
        playCurrentInQueue(queueIndex, selected);
      } else {
        // All-at-once mode
        if (timer.seconds > 0) {
          audioPlayer.play();
          timer.resume();
        } else {
          audioPlayer.reset();
          audioPlayer.syncTracks(selected);
          audioPlayer.play();

          const minutes = activeTimer ?? customMinutes;
          if (minutes > 0) {
            timer.start(minutes);
          }
        }
      }

      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (id: string, volumeString: string) => {
    const vol = parseFloat(volumeString);
    audioPlayer.setTrackVolume(id, vol);
    setVolumes(prev => ({ ...prev, [id]: vol }));
  };

  const drag = useDragSort<AudioItem>(selected, (newSelected) => {
    setSelected(newSelected);
    // Whenever order is changed while playing in 'Play queue' mode, the top sound should start to play.
    if (isPlaying && playMode === 'one' && newSelected.length > 0) {
      setQueueIndex(0);
      playSequential(0, newSelected, setQueueIndex);
    }
  });

  const onQueuePointerDown = (idx: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't start drag if clicking slider or button
    if (target.tagName === 'INPUT' || target.closest('button')) return;
    drag.onPointerDown(idx)(e);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
          <h1 style={{ margin: 0 }}>SleepJorney</h1>
          <img 
            src="/cat.png" 
            alt="Orange Cat" 
            style={{ 
              width: '108px', 
              height: '66px', 
              borderRadius: '36px', 
              objectFit: 'cover'
            }}
          />
        </div>
        <div>
          <button 
            className="button" 
            style={{ opacity: i18n.language === 'en' ? 1 : 0.5, padding: '4px 8px' }} 
            onClick={() => i18n.changeLanguage('en')}
          >
            EN
          </button>
          <button 
            className="button" 
            style={{ opacity: i18n.language === 'es' ? 1 : 0.5, padding: '4px 8px' }} 
            onClick={() => i18n.changeLanguage('es')}
          >
            ES
          </button>
        </div>
      </div>

      <div className="timer-header">
        <h2>{t('timer')}</h2>
        {timer.seconds > 0 && (
          <span className="timer-countdown">{formatTime(timer.seconds)}</span>
        )}
        <button
          className={`button ${isPlaying ? 'stop' : 'primary'}`}
          onClick={togglePlayback}
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
        >
          {isPlaying ? t('stop') : t('play')}
        </button>
      </div>

      {TIMER_OPTIONS.map((value) => (
        <button
          key={value}
          className={`button ${activeTimer === value ? 'active' : ''}`}
          onClick={() => {
            setActiveTimer(value);
            setCustomMinutes(0);
            if (isPlaying) {
              timer.start(value);
            } else {
              timer.reset();
            }
          }}
        >
          {value}
        </button>
      ))}

      <input
        type="number"
        placeholder={t('custom')}
        max={720}
        value={customMinutes || ''}
        onChange={(e) => {
          let val = Number(e.target.value);
          if (val > 720) val = 720;
          setCustomMinutes(val);
          setActiveTimer(null);
          if (isPlaying && val > 0) {
            timer.start(val);
          } else if (!isPlaying) {
            timer.reset();
          }
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t('selected')}</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            className="button"
            style={{ opacity: playMode === 'all' ? 1 : 0.5, padding: '4px 8px' }}
            onClick={() => {
              setPlayMode('all');
              setQueueIndex(0);
              if (isPlaying) {
                audioPlayer.reset();
                audioPlayer.syncTracks(selected);
                audioPlayer.play();
              }
            }}
          >
            {t('playAll')}
          </button>
          <button
            className="button"
            style={{ opacity: playMode === 'one' ? 1 : 0.5, padding: '4px 8px' }}
            onClick={() => {
              setPlayMode('one');
              setQueueIndex(0);
              if (isPlaying) {
                playCurrentInQueue(0, selected);
              }
            }}
          >
            {t('playOne')}
          </button>
        </div>
      </div>

      <div className="list">
        {selected.length === 0 && <p style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem'}}>Empty. Select sounds below!</p>}
        {selected.map((item, idx) => (
          <div 
            key={item.id} 
            ref={drag.setItemRef(idx)}
            className="list-item" 
            onPointerDown={onQueuePointerDown(idx)}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
            style={{ 
              flexDirection: 'column', 
              alignItems: 'stretch',
              padding: '8px 12px',
              cursor: 'grab',
              opacity: drag.dragIndex === idx ? 0.4 : 1,
              borderTop: drag.hoverIndex === idx && drag.dragIndex !== null && drag.dragIndex !== idx 
                ? '2px solid #3b82f6' 
                : '2px solid transparent',
              transition: drag.dragIndex === null ? 'opacity 0.2s' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="drag-handle">
                ⋮⋮
              </div>
              <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {item.id === 'mur_purr' ? (
                  <img src="/cat.png" alt="Cat" style={{ width: '45px', height: '30px', borderRadius: '15px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '10px' }} />
                ) : null}
                {t(item.title)}
              </span>
              <button className="remove-btn" onClick={() => removeFromQueue(item.id)}>×</button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes[item.id] ?? audioPlayer.getTrackVolume(item.id, item.type)}
              onChange={(e) => handleVolumeChange(item.id, e.target.value)}
              style={{ marginTop: '4px', width: '100%' }}
            />
          </div>
        ))}
      </div>

      {drag.dragIndex !== null && drag.pointerPos && (
        <div 
          className="list-item drag-overlay"
          style={{
            position: 'fixed',
            left: `${drag.pointerPos.x - drag.dragOffset.x}px`,
            top: `${drag.pointerPos.y - drag.dragOffset.y}px`,
            width: `${drag.itemRefs.current[drag.dragIndex]?.offsetWidth || 0}px`,
            flexDirection: 'column',
            alignItems: 'stretch',
            padding: '8px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="drag-handle">
              ⋮⋮
            </div>
            <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {selected[drag.dragIndex].id === 'mur_purr' ? (
                <img src="/cat.png" alt="Cat" style={{ width: '45px', height: '30px', borderRadius: '15px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '10px' }} />
              ) : null}
              {t(selected[drag.dragIndex].title)}
            </span>
            <button className="remove-btn">×</button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            readOnly
            value={volumes[selected[drag.dragIndex].id] ?? audioPlayer.getTrackVolume(selected[drag.dragIndex].id, selected[drag.dragIndex].type)}
            style={{ marginTop: '4px', width: '100%', pointerEvents: 'none' }}
          />
        </div>
      )}

      <h2>{t('soundsAndMusic')}</h2>

      <div className="list">
        {AUDIO_ITEMS.filter(item => !selected.find(s => s.id === item.id)).map((item) => (
          <div key={item.id} className="list-item">
            <button 
              className="button" 
              onClick={() => toggleItem(item)}
              style={item.id === 'mur_purr' ? { background: 'transparent', border: 'none', boxShadow: 'none', padding: '4px 12px', display: 'flex', alignItems: 'center' } : undefined}
            >
              {item.id === 'mur_purr' ? (
                <img 
                  src="/cat.png" 
                  alt="Orange Cat" 
                  style={{ height: '48px', width: 'auto', borderRadius: '6px', margin: '-6px 0 -6px -4px' }} 
                />
              ) : (
                t(item.title)
              )}
              {item.premium && !isPremium ? ' 🔒' : ''}
            </button>
          </div>
        ))}
      </div>

      <br />

      <button
        className={`button ${isPlaying ? 'stop' : 'primary'}`}
        onClick={togglePlayback}
      >
        {isPlaying ? t('stop') : t('play')}
      </button>

      <br /><br />

      {!isPremium && (
        <button className="button" onClick={() => setIsModalOpen(true)}>
          {t('unlock')}
        </button>
      )}

      {i18n.language !== 'en' && (
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '30px', textAlign: 'center', fontStyle: 'italic' }}>
          {t('translationNote')}
        </p>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="premium-crown">👑</div>
            <h2>{t('unlock')}</h2>
            <p>Get full access to all premium sounds and music forever.</p>
            <div className="premium-price">$2.99</div>
            <ul className="premium-features">
              <li>✨ All locked sounds unlocked</li>
              <li>🎵 Exclusive music tracks</li>
              <li>🚀 One-time lifetime access</li>
            </ul>
            <button 
              className="button premium-buy" 
              onClick={() => {
                setIsPremium(true);
                setIsModalOpen(false);
              }}
            >
              Unlock Now
            </button>
            <button className="button-text" onClick={() => setIsModalOpen(false)}>
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;