import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Camera Access Hook
 * Provides live video stream + snapshot capture via getUserMedia API.
 * Works on Chrome, Edge, Safari, Brave, and Firefox.
 */
export default function useCamera() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  // Connect stream to video element once both are available
  // This effect runs after isStreaming becomes true and the <video> mounts
  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
      // Fallback: if metadata already loaded, play immediately
      if (video.readyState >= 1) {
        video.play().catch(() => {});
      }
    }
  }, [isStreaming]);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setError('Camera access is not supported in this browser.');
      return;
    }

    setError('');

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Set isStreaming first so React mounts the <video> element,
      // then the useEffect above will connect the stream to it
      setIsStreaming(true);
      setSnapshot(null);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
      setIsStreaming(false);
    }
  }, [isSupported, facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Take a snapshot
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure the video actually has frame data
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is still initializing. Please wait a moment and try again.');
      return null;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSnapshot(dataUrl);
    return dataUrl;
  }, [isStreaming, facingMode]);

  // Clear snapshot
  const clearSnapshot = useCallback(() => {
    setSnapshot(null);
  }, []);

  // Toggle camera facing mode
  const toggleFacingMode = useCallback(() => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isStreaming) {
      // Restart with new facing mode
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [facingMode, isStreaming, stopCamera, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    snapshot,
    error,
    isSupported,
    facingMode,
    startCamera,
    stopCamera,
    takeSnapshot,
    clearSnapshot,
    toggleFacingMode,
    clearError: () => setError(''),
  };
}
