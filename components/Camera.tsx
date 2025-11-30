import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CameraProps {
  isActive: boolean;
  showPreview: boolean;
  onCameraReady: () => void;
  onError: (msg: string) => void;
}

export interface CameraHandle {
  captureFrame: () => string | null;
}

const Camera = forwardRef<CameraHandle, CameraProps>(({ isActive, showPreview, onCameraReady, onError }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      if (!videoRef.current || !canvasRef.current) return null;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to video size (or downscale for performance)
      // Downscaling to width 640 is usually sufficient for object detection and saves bandwidth
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // specific quality 0.7 to reduce size
      return canvas.toDataURL('image/jpeg', 0.7);
    }
  }));

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            onCameraReady();
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        onError("No se pudo acceder a la cámara. Verifique los permisos.");
      }
    };

    if (isActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, onCameraReady, onError]);

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-black ${showPreview ? 'block' : 'hidden'}`}>
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        className="w-full h-full object-cover"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="hidden" />
      {!isActive && showPreview && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Cámara Desactivada
        </div>
      )}
    </div>
  );
});

export default Camera;