import { useState, useEffect, useCallback } from 'react';
import './index.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { AUDIO_ITEMS } from './data/audioData';
import type { AudioItem } from './types/audio';
import { audioPlayer } from './audio/player';
import { useTimer } from './hooks/useTimer';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import SortableItem from './components/SortableItem';

const TIMER_OPTIONS = [1, 15, 30, 60, 120];

const App = () => {
  const { t, i18n } = useTranslation();

  const [selected, setSelected] = useState<AudioItem[]>([]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px drag distance before picking up the item
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press for 250ms to pick up (most reliable on Android)
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const onEnd = useCallback(() => {
    console.log('App: Timer ended, stopping playback');
    audioPlayer.reset();
    setIsPlaying(false);
    setActiveTimer(null);
    setCustomMinutes(0);
  }, []);

  const timer = useTimer(onEnd);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleItem = (item: AudioItem): void => {
    if (item.premium && !isPremium) {
      alert(t('unlock'));
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
    
    // If we're playing, we want to immediately skip to the new first sound 
    // or stop if the list is now empty.
    if (isPlaying) {
      const newSelected = selected.filter(i => i.id !== id);
      audioPlayer.reset();
      audioPlayer.setQueue(newSelected);
      if (newSelected.length > 0) {
        audioPlayer.play();
      } else {
        timer.stop();
        setIsPlaying(false);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = selected.findIndex((i) => i.id === active.id);
    const newIndex = selected.findIndex((i) => i.id === over.id);
    const newSelected = arrayMove(selected, oldIndex, newIndex);

    setSelected(newSelected);

    if (isPlaying) {
      audioPlayer.reset();
      audioPlayer.setQueue(newSelected);
      audioPlayer.play();
    }
  };

  // Sync Queue while playing (for toggleItem adding)
  useEffect(() => {
    if (isPlaying) {
      audioPlayer.setQueue(selected);
    }
  }, [selected, isPlaying]);

  const togglePlayback = (): void => {
    if (selected.length === 0) return;

    if (isPlaying) {
      console.log('App: Pausing playback');
      audioPlayer.stop();
      timer.stop();
      setIsPlaying(false);
    } else {
      console.log('App: Resuming or starting playback');
      
      // If we have a paused timer, resume it. 
      // Otherwise start a fresh session.
      if (timer.seconds > 0) {
        audioPlayer.play();
        timer.resume();
      } else {
        audioPlayer.reset();
        audioPlayer.setQueue(selected);
        audioPlayer.play();

        const minutes = activeTimer ?? customMinutes;
        if (minutes > 0) {
          timer.start(minutes);
        }
      }

      setIsPlaying(true);
    }
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
            // If playing, immediately switch to the new timer
            if (isPlaying) {
              timer.start(value);
            } else {
              timer.reset(); // Clear any paused state if we pick a new setting
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
          // If playing, immediately switch to the new timer
          if (isPlaying && val > 0) {
            timer.start(val);
          } else if (!isPlaying) {
            timer.reset();
          }
        }}
      />

      <h2>{t('selected')}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={selected.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="list">
            {selected.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                title={t(item.title)}
                onRemove={removeFromQueue}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <h2>{t('soundsAndMusic')}</h2>

      <div className="list">
        {AUDIO_ITEMS.filter(item => !selected.find(s => s.id === item.id)).map((item) => (
          <div key={item.id} className="list-item">
            <button 
              className="button" 
              onClick={() => toggleItem(item)}
              style={item.id === 'mur_purr' ? { background: 'transparent', padding: 0, border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center' } : undefined}
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
        <button className="button" onClick={() => setIsPremium(true)}>
          {t('unlock')}
        </button>
      )}

      {i18n.language !== 'en' && (
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '30px', textAlign: 'center', fontStyle: 'italic' }}>
          {t('translationNote')}
        </p>
      )}
    </div>
  );
};

export default App;