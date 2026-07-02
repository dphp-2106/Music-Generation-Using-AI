/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Music, 
  Zap, 
  Settings, 
  Sliders, 
  Loader2, 
  Info,
  Waves,
  Keyboard,
  Mic2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MidiWriter from 'midi-writer-js';

// Types
interface Note {
  note: string;
  time: string;
  duration: string;
  velocity?: number;
}

interface MusicMetadata {
  genre: string;
  mood: string;
  analysis: string;
}

interface Composition {
  notes: Note[];
  tempo: number;
  metadata: MusicMetadata;
}

const GENRES = ['Classical', 'Jazz', 'Electronic', 'Lo-fi', 'Ambient', 'Cinematic'];
const INSTRUMENTS = ['Piano', 'Synth Pad', 'Strings', 'Kalimba', 'Marimba'];
const MOODS = ['Happy', 'Sad', 'Epic', 'Relaxing', 'Suspenseful', 'Energetic'];

export default function App() {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [composition, setComposition] = useState<Composition | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Configuration
  const [config, setConfig] = useState({
    genre: 'Classical',
    instrument: 'Piano',
    tempo: 120,
    mood: 'Epic',
    creativity: 7,
    length: 4, // measures
  });

  // Refs
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const visualizerRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize synth
  useEffect(() => {
    // Create synth based on instrument
    updateSynth();
    
    return () => {
      synthRef.current?.dispose();
      partRef.current?.dispose();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [config.instrument]);

  const updateSynth = () => {
    if (synthRef.current) synthRef.current.dispose();

    let synth: Tone.PolySynth;
    
    switch (config.instrument) {
      case 'Synth Pad':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fatsawtooth' },
          envelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 2 }
        }).toDestination();
        break;
      case 'Strings':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.4, decay: 0.1, sustain: 1, release: 1.5 }
        }).toDestination();
        break;
      case 'Kalimba':
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 }
        }).toDestination();
        break;
      default:
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
    }
    
    synthRef.current = synth;
  };

  // Visualizer loop
  useEffect(() => {
    const canvas = visualizerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const meter = new Tone.Meter();
    Tone.getDestination().connect(meter);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Draw background pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      for (let i = 0; i < width; i += 20) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
      }
      for (let i = 0; i < height; i += 20) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
      ctx.stroke();

      const level = meter.getValue();
      const db = Array.isArray(level) ? level[0] : level;
      const normalizedLevel = Math.max(0, (db + 60) / 60);

      // Draw wave
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00f2ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';

      const time = Date.now() / 500;
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * 0.02 + time) * 20 * normalizedLevel;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setIsPlaying(false);
    Tone.Transport.stop();
    if (partRef.current) partRef.current.dispose();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to generate music');

      const data: Composition = await response.json();
      setComposition(data);
      
      // Setup Tone.js transport and part
      Tone.Transport.bpm.value = data.tempo;
      
      const part = new Tone.Part((time, noteValue) => {
        synthRef.current?.triggerAttackRelease(
          noteValue.note, 
          noteValue.duration, 
          time, 
          noteValue.velocity || 0.8
        );
      }, data.notes.map(n => ({ time: n.time, note: n.note, duration: n.duration, velocity: n.velocity })));

      part.loop = true;
      part.loopEnd = `${data.notes.length / 4}:0:0`; // Approximate loop end
      partRef.current = part;

    } catch (err) {
      console.error(err);
      setError('Cybernetic link failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = async () => {
    if (!composition) return;

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      await Tone.start();
      partRef.current?.start(0);
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const stopPlay = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const downloadMidi = () => {
    if (!composition) return;

    const track = new MidiWriter.Track();
    track.setTempo(composition.tempo);
    track.addTrackName(`${composition.metadata.genre} - ${composition.metadata.mood}`);

    composition.notes.forEach(n => {
      // Very loose conversion from Tone time to MidiWriter duration
      // For a real app, this would be more precise
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [n.note.replace('rest', '') || 'C4'],
        duration: n.duration.replace('n', '') as any, // '4', '8', etc
        velocity: Math.floor((n.velocity || 0.8) * 100),
      }));
    });

    const write = new MidiWriter.Writer(track);
    const blob = new Blob([write.buildFile()], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `melodymind_${Date.now()}.mid`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-hidden flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-700/50 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Music className="w-5 h-5 text-slate-900" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">MelodyMind <span className="text-cyan-400">AI</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-cyan-400 rounded-xl border border-slate-700/50">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Composer</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors">
            <Keyboard className="w-4 h-4" />
            <span className="text-sm font-medium">My Tracks</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-700/50">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Model: Gemini-Flash</span>
              <span className="text-cyan-500">Active</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-cyan-500 h-full" 
                animate={{ width: isGenerating ? "85%" : "100%" }}
                transition={{ duration: 2, repeat: isGenerating ? Infinity : 0 }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
        {/* Header */}
        <header className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <h2 className="text-3xl font-light text-white mb-1">Neural Composer</h2>
            <p className="text-slate-400 text-sm italic">Generating melodic sequences using deep learning patterns.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 group"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              {isGenerating ? "Processing..." : "Generate Music"}
            </button>
          </div>
        </header>

        {/* Composition Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-10">
          {/* Parameter Controls */}
          <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Sliders className="w-3 h-3" />
              Composition Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-300 flex justify-between">
                  Genre <span className="text-slate-500 font-mono text-[10px]">WEIGHT_01</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => setConfig(prev => ({ ...prev, genre: g }))}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                        config.genre === g 
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300 flex justify-between">
                  Mood <span className="text-slate-500 font-mono text-[10px]">WEIGHT_04</span>
                </label>
                <select 
                  value={config.mood}
                  onChange={(e) => setConfig(prev => ({ ...prev, mood: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                >
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="space-y-4 col-span-1 md:col-span-2 mt-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-300">AI Creativity Slider (Temperature)</label>
                  <span className="text-xs font-mono text-cyan-400">{config.creativity / 10}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={config.creativity}
                  onChange={(e) => setConfig(prev => ({ ...prev, creativity: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>STRUCTURED</span>
                  <span>EXPERIMENTAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Engine Output</h3>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Tempo</span>
                <span className="px-3 py-1 bg-slate-800 rounded text-cyan-400 font-mono text-xs border border-slate-700">{config.tempo} BPM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Instrument</span>
                <select 
                  value={config.instrument}
                  onChange={(e) => setConfig(prev => ({ ...prev, instrument: e.target.value }))}
                  className="bg-slate-800 rounded text-white font-mono text-[10px] border border-slate-700 px-2 py-1 outline-none"
                >
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Precision</span>
                <span className="px-3 py-1 bg-slate-800 rounded text-slate-500 font-mono text-[10px] border border-slate-700">64-bit FP</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-700/50">
              <button className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-xs border border-slate-700 hover:bg-slate-700 hover:text-slate-200 transition-all flex items-center justify-center gap-2 group">
                <Settings className="w-3 h-3 group-hover:rotate-45 transition-transform" />
                Advanced Parameters
              </button>
            </div>
          </div>
        </div>

        {/* Playback & Visualization */}
        <div className="mt-auto relative z-10">
          <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <button 
                onClick={togglePlay}
                disabled={!composition}
                className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-20 flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              
              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                        {isGenerating ? "RECONSTRUCTING_WAVEFORM..." : (composition ? `${composition.metadata.genre.toUpperCase()}_SEQUENCE_01.MID` : "IDLE_STATE")}
                      </span>
                      {composition && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                          "{composition.metadata.analysis}"
                        </p>
                      )}
                   </div>
                   <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                      <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                   </div>
                </div>

                {/* Waveform Visualization */}
                <div className="h-16 relative bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                   <canvas 
                    ref={visualizerRef} 
                    width={800} 
                    height={64} 
                    className="w-full h-full opacity-60"
                   />
                   {isGenerating && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                         <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                               <motion.div 
                                  key={i}
                                  className="w-1 h-4 bg-cyan-500 rounded-full"
                                  animate={{ scaleY: [1, 2, 1] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                               />
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-shrink-0">
                <button 
                  onClick={downloadMidi}
                  disabled={!composition}
                  className="flex flex-col items-center gap-1.5 group disabled:opacity-20"
                >
                  <div className="w-12 h-12 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-500/5 transition-all">
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">MIDI</span>
                </button>
                <button 
                  disabled={!composition}
                  className="flex flex-col items-center gap-1.5 group disabled:opacity-20"
                >
                  <div className="w-12 h-12 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:border-purple-400 group-hover:bg-purple-500/5 transition-all">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">SHARE</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Handling */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/10 border border-red-500 text-red-500 rounded-xl text-sm font-medium z-50 shadow-2xl backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>

  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3 hover:bg-white/10 transition-colors cursor-default group">
      <div className="p-2 bg-white/5 rounded-lg w-fit group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
      </div>
      <h3 className="text-xs uppercase tracking-widest font-bold text-gray-300">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}
