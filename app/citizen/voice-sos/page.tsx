'use client';

import { Frame } from '@/components/Frame';
import { useState, useEffect, useRef } from 'react';
import { Mic, Square, CheckCircle2, Loader2, MapPin, AlertCircle, WifiOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import { queueOfflineSOS } from '@/lib/offline-db';

const CrisisMap = dynamic(() => import('@/components/CrisisMap'), { ssr: false });

// Types for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export default function VoiceSOS() {
  // UI State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  
  // Data State
  const [bars, setBars] = useState<number[]>(Array(20).fill(10));
  const [transcription, setTranscription] = useState<string>('');
  const [entities, setEntities] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Refs for logic
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    // Capture GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 19.076, lng: 72.8777 }),
      { enableHighAccuracy: true }
    );

    // Bars animation
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setBars(Array(20).fill(0).map(() => Math.floor(Math.random() * 80) + 10));
      }, 100);
    } else {
      setBars(Array(20).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setIsRecording(true);
    setTranscription('');
    setEntities(null);
    setOfflineQueued(false);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // 1. Try Online Speech Recognition first
    if (SpeechRecognition && !isOfflineMode) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscription(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'network') {
          console.warn('Network error detected. Switching to Offline MediaRecorder.');
          setIsOfflineMode(true);
          recognition.stop();
          startOfflineMediaRecorder(); // Fallback to raw audio
        } else {
          console.error('Speech Recognition Error:', event.error);
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        if (!isOfflineMode) setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // 2. Direct Offline Mode (or if Speech API not supported)
      startOfflineMediaRecorder();
    }
  };

  const startOfflineMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Save to IndexedDB
        await queueOfflineSOS({
          type: 'VOICE',
          audioBlob,
          text: transcription, // might have some partial transcription if network failed midway
          lat: coords?.lat || 19.076,
          lng: coords?.lng || 72.8777,
          timestamp: Date.now()
        });
        setOfflineQueued(true);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsOfflineMode(true);
    } catch (err) {
      console.error('Failed to start MediaRecorder', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && !isOfflineMode) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const processTranscription = async () => {
    if (!transcription.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/extract-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription })
      });
      const result = await res.json();
      if (result.success) {
        setEntities(result.data);
      }
    } catch (err) {
      setIsOfflineMode(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalSubmit = async () => {
    if (!entities || !coords) return;
    setIsProcessing(true);
    try {
      const payload = {
        userId: 'citizen-voice-001',
        type: entities.emergencyType || 'RESCUE',
        lat: coords.lat,
        lng: coords.lng,
        isVoice: true,
        factors: {
          peopleCount: entities.peopleCount,
          medicalIssues: entities.medicalIssues,
          urgencyScore: entities.urgencyScore,
          transcription
        }
      };
      const res = await fetch('/api/sos/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) setSubmitted(true);
    } catch {
      setIsOfflineMode(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (submitted || offlineQueued) {
    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <Frame title={offlineQueued ? "OFFLINE SOS QUEUED" : "SOS TRANSMITTED"}>
          <div className="flex flex-col gap-6 py-4">
            <div className={`p-4 font-bold uppercase text-center border-2 ${
              offlineQueued ? 'bg-status-high text-white border-status-high' : 'bg-status-low text-white border-status-low'
            }`}>
              {offlineQueued 
                ? 'Offline Mode Active: Audio and GPS saved locally. Will sync when connection returns.' 
                : 'AI Analysis Complete • Rescue Team Notified'}
            </div>
            
            {!offlineQueued && (
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-xl uppercase">Safe Route Found</h3>
                <p className="text-muted-foreground font-mono text-sm">Proceed to Sector 4 Relief Camp.</p>
                <div className="h-[300px] border border-border">
                   <CrisisMap 
                     center={[coords?.lng || 72.8777, coords?.lat || 19.076]} 
                     zoom={14} 
                     routeFrom={[coords?.lng || 72.8777, coords?.lat || 19.076]}
                     routeTo={[72.862, 19.082]}
                   />
                </div>
              </div>
            )}

            <button onClick={() => window.location.reload()} className="brutalist-button w-full">
              {offlineQueued ? 'SEND ANOTHER (OFFLINE)' : 'RETURN TO HUB'}
            </button>
          </div>
        </Frame>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
      {/* Offline Banner */}
      {isOfflineMode && (
        <div className="bg-status-high/10 border border-status-high p-3 flex items-center gap-3 text-status-high font-bold text-xs uppercase tracking-widest">
          <WifiOff size={16} />
          <span>Offline Mode Active: Local Storage & Sync Protocol Engaged</span>
        </div>
      )}

      <div className="flex justify-between items-end border-b border-border pb-4">
        <h2 className="text-3xl font-bold uppercase tracking-wider">Hybrid Voice SOS</h2>
        <div className="flex items-center gap-2 font-mono text-xs uppercase bg-muted p-2 border border-border">
          <MapPin size={12} className={coords ? 'text-status-low' : 'text-muted-foreground'} />
          {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locking GPS...'}
        </div>
      </div>

      <Frame title="Intelligent Audio Capture" className="min-h-[250px]">
        <div className="flex flex-col gap-6 p-4">
          {/* Animated Vertical Bars */}
          <div className="flex items-end gap-1 h-16 w-full justify-center border-b border-border pb-2 overflow-hidden">
            {bars.map((height, i) => (
              <div 
                key={i} 
                className={`w-4 transition-all duration-75 ease-linear ${isRecording ? 'bg-status-critical' : 'bg-muted-foreground/30'}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Transcription Area / Manual Input */}
          <div className="flex flex-col gap-2">
            <div className="font-bold text-[10px] uppercase text-muted-foreground">Captured Intel (Live / Manual)</div>
            <textarea 
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder={isOfflineMode ? "Recording raw audio... you can also type details here." : "Waiting for speech..."}
              className="brutalist-border p-4 bg-background min-h-[120px] font-mono text-sm w-full resize-none outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <>
                <button 
                  onClick={startRecording}
                  className="flex-grow brutalist-button flex items-center justify-center gap-2 py-4"
                >
                  <Mic size={20} />
                  Record Voice
                </button>
                {transcription.trim().length > 0 && (
                  <button 
                    onClick={processTranscription}
                    className="brutalist-button bg-primary text-white px-8 border-primary"
                  >
                    Submit Audio & Transcript
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={stopRecording}
                className="flex-grow brutalist-button bg-status-critical border-status-critical text-white flex items-center justify-center gap-2 py-4"
              >
                <Square size={20} fill="currentColor" />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </Frame>

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8 gap-4 font-mono text-muted-foreground">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="uppercase tracking-widest text-[10px]">Processing via Intelligence API...</span>
        </div>
      )}

      {entities && !isProcessing && (
        <Frame title="Extracted Signal Data">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border border-border bg-muted">
                <div className="text-[10px] uppercase text-muted-foreground">Type</div>
                <div className="font-bold uppercase text-sm">{entities.emergencyType}</div>
              </div>
              <div className="p-3 border border-border bg-muted">
                <div className="text-[10px] uppercase text-muted-foreground">People</div>
                <div className="font-bold text-sm">{entities.peopleCount}</div>
              </div>
              <div className="p-3 border border-border bg-muted col-span-2">
                <div className="text-[10px] uppercase text-muted-foreground">Medical Details</div>
                <div className="font-bold uppercase text-xs">
                  {entities.medicalIssues?.length > 0 ? entities.medicalIssues.join(', ') : 'No medical risks identified'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={finalSubmit}
              className="brutalist-button w-full bg-status-critical border-status-critical py-4"
            >
              TRANSMIT STRUCTURED SIGNAL
            </button>
          </div>
        </Frame>
      )}
    </div>
  );
}
