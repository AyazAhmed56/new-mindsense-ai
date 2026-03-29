import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Mic, Smile, Frown, AlertCircle } from 'lucide-react';

type CognitiveState = 'fatigue' | 'confused' | 'focus';
type MoodType = 'happy' | 'sad' | 'stressed' | 'neutral' | 'excited' | 'tired';

interface MultiModalMoodDetectorProps {
  onMoodDetected: (mood: {
    typing: CognitiveState;
    visual: MoodType | null;
    audio: MoodType | null;
    combined: CognitiveState;
    confidence: number;
  }) => void;
  enabled: boolean;
}

// Face emotion detection using MediaPipe or basic canvas analysis
export function MultiModalMoodDetector({ onMoodDetected, enabled }: MultiModalMoodDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [visualMood, setVisualMood] = useState<MoodType | null>(null);
  const [audioMood, setAudioMood] = useState<MoodType | null>(null);
  const [typingMood] = useState<CognitiveState>('focus');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Camera-based emotion detection
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 320, height: 240 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        analyzeVideoFrames();
      }
    } catch (err) {
      console.log('Camera access denied or unavailable');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Simple video frame analysis (basic emotion indicators)
  const analyzeVideoFrames = useCallback(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Simple heuristics based on pixel analysis
    let brightnessSum = 0;
    let redSum = 0;
    let pixelCount = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      brightnessSum += brightness;
      redSum += r;
    }
    
    const avgBrightness = brightnessSum / pixelCount;
    const avgRed = redSum / pixelCount;
    const redRatio = avgRed / avgBrightness;
    
    // Basic emotion inference
    let detectedMood: MoodType = 'neutral';
    if (redRatio > 1.15 && avgBrightness > 100) {
      detectedMood = 'excited';
    } else if (avgBrightness < 80) {
      detectedMood = 'tired';
    } else if (redRatio < 0.95) {
      detectedMood = 'sad';
    } else if (redRatio > 1.1) {
      detectedMood = 'stressed';
    } else if (avgBrightness > 120) {
      detectedMood = 'happy';
    }
    
    setVisualMood(detectedMood);
    
    // Continue analysis
    requestAnimationFrame(analyzeVideoFrames);
  }, [cameraActive]);

  // Voice-based emotion detection
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setMicActive(true);
      analyzeAudio();
    } catch (err) {
      console.log('Microphone access denied');
    }
  }, []);

  const stopMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    setMicActive(false);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!micActive || !analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate audio features
    let sum = 0;
    let lowFreqSum = 0;
    let highFreqSum = 0;
    const midPoint = Math.floor(dataArray.length / 2);
    
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
      if (i < midPoint) {
        lowFreqSum += dataArray[i];
      } else {
        highFreqSum += dataArray[i];
      }
    }
    
    const avg = sum / dataArray.length;
    const lowFreqAvg = lowFreqSum / midPoint;
    const highFreqAvg = highFreqSum / (dataArray.length - midPoint);
    const freqRatio = highFreqAvg / (lowFreqAvg + 1);
    
    // Infer emotion from audio characteristics
    let detectedAudioMood: MoodType = 'neutral';
    if (avg < 10) {
      detectedAudioMood = 'tired';
    } else if (freqRatio > 1.5 && avg > 50) {
      detectedAudioMood = 'excited';
    } else if (freqRatio < 0.8) {
      detectedAudioMood = 'sad';
    } else if (avg > 80) {
      detectedAudioMood = 'stressed';
    } else if (avg > 40 && freqRatio > 1 && freqRatio < 1.3) {
      detectedAudioMood = 'happy';
    }
    
    setAudioMood(detectedAudioMood);
    
    // Continue analysis (throttled)
    setTimeout(() => requestAnimationFrame(analyzeAudio), 500);
  }, [micActive]);

  // Combined mood calculation
  useEffect(() => {
    if (!enabled) return;
    
    // Map moods to cognitive states
    const moodToCognitive = (mood: MoodType | null): CognitiveState => {
      if (!mood) return 'focus';
      switch (mood) {
        case 'tired': return 'fatigue';
        case 'sad': return 'fatigue';
        case 'stressed': return 'confused';
        case 'neutral': return 'focus';
        case 'happy': return 'focus';
        case 'excited': return 'focus';
        default: return 'focus';
      }
    };
    
    // Combine all modalities with weights
    const visualCognitive = moodToCognitive(visualMood);
    const audioCognitive = moodToCognitive(audioMood);
    
    // Majority vote with preference for visual > audio > typing
    const votes = [visualCognitive, audioCognitive, typingMood];
    const counts = { fatigue: 0, confused: 0, focus: 0 };
    votes.forEach(v => counts[v]++);
    
    const combined = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as CognitiveState;
    const confidence = 0.6 + (counts[combined] / 3) * 0.3;
    
    onMoodDetected({
      typing: typingMood,
      visual: visualMood,
      audio: audioMood,
      combined,
      confidence
    });
  }, [visualMood, audioMood, typingMood, enabled, onMoodDetected]);

  if (!enabled) return null;

  return (
    <div className="multi-modal-detector">
      <style>{`
        .mmd-panel {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1.5px solid #86efac;
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .mmd-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #14532d;
          margin-bottom: 0.75rem;
        }
        .mmd-controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .mmd-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          border-radius: 99px;
          border: 1.5px solid transparent;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mmd-btn.camera {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #86efac;
        }
        .mmd-btn.camera.active {
          background: #16a34a;
          color: white;
          animation: mmdPulse 2s infinite;
        }
        .mmd-btn.mic {
          background: #eff6ff;
          color: #2563eb;
          border-color: #93c5fd;
        }
        .mmd-btn.mic.active {
          background: #2563eb;
          color: white;
          animation: mmdPulse 2s infinite;
        }
        .mmd-preview {
          margin-top: 0.75rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .mmd-video-container {
          position: relative;
          width: 160px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f4f6;
        }
        .mmd-video-container video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mmd-badges {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .mmd-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.7rem;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .mmd-badge.visual { background: #fce7f3; color: #be185d; }
        .mmd-badge.audio { background: #eff6ff; color: #1d4ed8; }
        .mmd-badge.combined { background: #dcfce7; color: #15803d; }
        
        @keyframes mmdPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      
      <div className="mmd-panel">
        <div className="mmd-header">
          <Smile size={18} />
          Multi-Modal Mood Detection
        </div>
        
        <div className="mmd-controls">
          <button 
            className={`mmd-btn camera ${cameraActive ? 'active' : ''}`}
            onClick={cameraActive ? stopCamera : startCamera}
          >
            <Camera size={14} />
            {cameraActive ? 'Camera On' : 'Start Camera'}
          </button>
          <button 
            className={`mmd-btn mic ${micActive ? 'active' : ''}`}
            onClick={micActive ? stopMic : startMic}
          >
            <Mic size={14} />
            {micActive ? 'Mic On' : 'Start Voice'}
          </button>
        </div>
        
        {(cameraActive || visualMood || audioMood) && (
          <div className="mmd-preview">
            {cameraActive && (
              <div className="mmd-video-container">
                <video ref={videoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}
            <div className="mmd-badges">
              {visualMood && (
                <div className="mmd-badge visual">
                  <Frown size={12} />
                  Visual: {visualMood}
                </div>
              )}
              {audioMood && (
                <div className="mmd-badge audio">
                  <Mic size={12} />
                  Voice: {audioMood}
                </div>
              )}
              {(visualMood || audioMood) && (
                <div className="mmd-badge combined">
                  <AlertCircle size={12} />
                  Combined: {typingMood} + {(visualMood || audioMood) && 'detected'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiModalMoodDetector;
