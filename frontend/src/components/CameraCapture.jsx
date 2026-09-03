import useCamera from '../hooks/useCamera';
import { FiCamera, FiCameraOff, FiRefreshCw, FiCheck, FiAlertCircle, FiRepeat } from 'react-icons/fi';
import './CameraCapture.css';

/**
 * CameraCapture — Live camera feed + mood snapshot capture
 *
 * Props:
 *   onSnapshot(dataUrl: string) — called when user confirms a snapshot
 *   compact?: boolean            — smaller layout for inline use
 *   disabled?: boolean           — disables the component
 */
export default function CameraCapture({ onSnapshot, compact = false, disabled = false }) {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    snapshot,
    error,
    isSupported,
    startCamera,
    stopCamera,
    takeSnapshot,
    clearSnapshot,
    toggleFacingMode,
    clearError,
  } = useCamera();

  const handleCapture = () => {
    const dataUrl = takeSnapshot();
    // Don't auto-submit; user must confirm
    if (dataUrl) {
      // snapshot state is set inside the hook
    }
  };

  const handleConfirm = () => {
    if (snapshot && onSnapshot) {
      onSnapshot(snapshot);
    }
    stopCamera();
  };

  const handleRetake = () => {
    clearSnapshot();
  };

  if (!isSupported) {
    return (
      <div className={`camera-capture camera-capture--unsupported ${compact ? 'camera-capture--compact' : ''}`}>
        <FiAlertCircle size={16} />
        <span>Camera access is not available in this browser or device.</span>
      </div>
    );
  }

  return (
    <div className={`camera-capture ${compact ? 'camera-capture--compact' : ''} ${disabled ? 'camera-capture--disabled' : ''}`}>
      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="camera-capture__header">
        <span className="camera-capture__title">
          <FiCamera size={14} /> Mood Snapshot
        </span>
        <span className="camera-capture__subtitle">
          Capture your current expression (optional)
        </span>
      </div>

      {/* Main viewport */}
      <div className="camera-capture__viewport">
        {snapshot ? (
          /* Snapshot preview */
          <div className="camera-capture__preview-wrap">
            <img
              src={snapshot}
              alt="Mood snapshot"
              className="camera-capture__preview-img"
            />
            <div className="camera-capture__preview-actions">
              <button
                type="button"
                className="camera-capture__action-btn camera-capture__action-btn--secondary"
                onClick={handleRetake}
              >
                <FiRefreshCw size={15} /> Retake
              </button>
              <button
                type="button"
                className="camera-capture__action-btn camera-capture__action-btn--primary"
                onClick={handleConfirm}
              >
                <FiCheck size={15} /> Use This
              </button>
            </div>
          </div>
        ) : isStreaming ? (
          /* Live video feed */
          <div className="camera-capture__live-wrap">
            <video
              ref={videoRef}
              className="camera-capture__video"
              autoPlay
              playsInline
              muted
            />
            <div className="camera-capture__live-badge">
              <span className="camera-capture__live-dot" />
              LIVE
            </div>
            <div className="camera-capture__stream-actions">
              <button
                type="button"
                className="camera-capture__action-btn camera-capture__action-btn--capture"
                onClick={handleCapture}
                title="Take Snapshot"
              >
                <FiCamera size={18} />
              </button>
              <button
                type="button"
                className="camera-capture__action-btn camera-capture__action-btn--small"
                onClick={toggleFacingMode}
                title="Switch Camera"
              >
                <FiRepeat size={15} />
              </button>
              <button
                type="button"
                className="camera-capture__action-btn camera-capture__action-btn--small camera-capture__action-btn--danger"
                onClick={stopCamera}
                title="Stop Camera"
              >
                <FiCameraOff size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Idle state — click to start */
          <button
            type="button"
            className="camera-capture__start-btn"
            onClick={startCamera}
            disabled={disabled}
          >
            <div className="camera-capture__start-icon">
              <FiCamera size={compact ? 24 : 32} />
            </div>
            <span className="camera-capture__start-text">
              Click to enable camera
            </span>
            <span className="camera-capture__start-hint">
              Optional mood context for your assessment
            </span>
          </button>
        )}
      </div>

      {/* Confirmed snapshot indicator */}
      {!isStreaming && !snapshot && onSnapshot && (
        <div className="camera-capture__confirmed-hint">
          Your snapshot will be saved with this session
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="camera-capture__error">
          <FiAlertCircle size={14} />
          <span>{error}</span>
          <button type="button" className="camera-capture__dismiss" onClick={clearError}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
