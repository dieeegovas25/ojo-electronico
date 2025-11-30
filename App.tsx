import React, { useState, useRef, useEffect, useCallback } from 'react';
import Camera, { CameraHandle } from './components/Camera';
import StatusBadge from './components/StatusBadge';
import { analyzeImage } from './services/geminiService';
import { speakText, stopSpeaking } from './utils/tts';
import { AppState } from './types';
import { MicrophoneIcon, StopIcon, VideoCameraIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [lastDescription, setLastDescription] = useState<string>("Pulse 'INICIAR' para comenzar la asistencia.");
  const [showPreview, setShowPreview] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraRef = useRef<CameraHandle>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopSpeaking();
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    };
  }, []);

  const handleAnalysisLoop = useCallback(async () => {
    if (!isActive || !isMountedRef.current) return;

    try {
      setStatus(AppState.ANALYZING);
      
      // 1. Capture Frame
      const base64Image = cameraRef.current?.captureFrame();
      
      if (!base64Image) {
        console.warn("Cámara no lista, reintentando...");
        if (isActive) loopTimeoutRef.current = window.setTimeout(handleAnalysisLoop, 1000);
        return;
      }

      // 2. Send to Gemini
      const result = await analyzeImage(base64Image);
      
      if (!isActive) return; // Check if stopped during await

      // 3. Update State & Speak
      setLastDescription(result.description);
      setStatus(AppState.SPEAKING);

      speakText(result.description, () => {
        // Callback when speech finishes
        if (isActive && isMountedRef.current) {
          setStatus(AppState.IDLE);
          // Requirement: Process a frame every 2-3 seconds. 
          // 2500ms delay matches the specification to avoid overloading the user or processor.
          loopTimeoutRef.current = window.setTimeout(handleAnalysisLoop, 2500); 
        }
      });

    } catch (err) {
      console.error("Loop Error:", err);
      if (isActive && isMountedRef.current) {
        setStatus(AppState.ERROR);
        // Silent retry or user notification depending on severity
        // Here we pause briefly and retry
        loopTimeoutRef.current = window.setTimeout(handleAnalysisLoop, 3000);
      }
    }
  }, [isActive]);

  // Effect to trigger loop when active state changes
  useEffect(() => {
    if (isActive) {
      setStatus(AppState.IDLE);
      // Start the loop after a brief delay to ensure camera is warmed up
      loopTimeoutRef.current = window.setTimeout(handleAnalysisLoop, 1000);
    } else {
      stopSpeaking();
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      setStatus(AppState.IDLE);
    }
  }, [isActive, handleAnalysisLoop]);

  const toggleActive = () => {
    if (!isActive) {
      speakText("Iniciando asistencia visual");
      setIsActive(true);
      setErrorMsg(null);
    } else {
      speakText("Asistencia detenida");
      setIsActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-sans">
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-6 pt-2 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-black text-yellow-400 tracking-wider uppercase">
          Ojo Electrónico
        </h1>
        <button 
          onClick={() => setShowPreview(!showPreview)}
          className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors focus:ring-4 focus:ring-yellow-400"
          aria-label={showPreview ? "Ocultar vista de cámara" : "Mostrar vista de cámara"}
        >
          {showPreview ? 
            <VideoCameraIcon className="h-6 w-6 text-yellow-400" /> : 
            <VideoCameraSlashIcon className="h-6 w-6 text-gray-400" />
          }
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-grow flex flex-col gap-6">
        
        {/* Status Indicator */}
        <StatusBadge status={status} />

        {/* Camera View - Optional as per spec */}
        <div className={`transition-all duration-500 overflow-hidden rounded-xl border-2 border-slate-700 ${showPreview ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 border-0'}`}>
          <Camera 
            ref={cameraRef}
            isActive={isActive} 
            showPreview={showPreview}
            onCameraReady={() => console.log("Camera Ready")}
            onError={(msg) => setErrorMsg(msg)}
          />
        </div>

        {/* Text Description Box (Accessibility Friendly - High Contrast) */}
        <div 
          className="bg-slate-800 p-6 rounded-xl shadow-xl border-l-8 border-yellow-400 min-h-[160px] flex flex-col justify-center"
          aria-live="assertive"
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-bold">Entorno Detectado</h2>
          <p className="text-2xl leading-normal font-medium text-white">
            {lastDescription}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-900/80 border-2 border-red-500 text-white p-4 rounded-xl text-center font-bold" role="alert">
            {errorMsg}
          </div>
        )}

      </main>

      {/* Sticky Bottom Control - "Botón grande y claro" */}
      <footer className="w-full max-w-md mt-6 pb-6 sticky bottom-0 bg-slate-900/90 backdrop-blur-sm pt-4">
        <button
          onClick={toggleActive}
          className={`
            w-full py-8 rounded-2xl shadow-2xl text-3xl font-black tracking-widest uppercase flex items-center justify-center gap-4 transition-all transform active:scale-95
            ${isActive 
              ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-900' 
              : 'bg-yellow-400 hover:bg-yellow-300 text-slate-900 ring-4 ring-yellow-600'
            }
          `}
          aria-label={isActive ? "Detener Asistencia" : "Iniciar Asistencia"}
        >
          {isActive ? (
            <>
              <StopIcon className="h-10 w-10" />
              DETENER
            </>
          ) : (
            <>
              <MicrophoneIcon className="h-10 w-10" />
              INICIAR
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default App;