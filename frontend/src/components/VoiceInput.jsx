import { useCallback } from 'react';
import useSpeechRecognition, { LANGUAGE_LABELS } from '../hooks/useSpeechRecognition';
import { FiMic, FiMicOff, FiAlertCircle } from 'react-icons/fi';
import './VoiceInput.css';

/**
 * VoiceInput — Multilingual speech-to-text input widget
 * 
 * Props:
 *   onTranscript(text: string) — called with final transcript text to append
 *   disabled?: boolean          — disables the component
 *   compact?: boolean           — smaller layout for inline use
 */
export default function VoiceInput({ onTranscript, disabled = false, compact = false }) {
  const {
    isListening,
    language,
    interimText,
    error,
    isSupported,
    start,
    stop,
    setLanguage,
    clearError,
  } = useSpeechRecognition();

  const handleToggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start((text) => {
        if (onTranscript) {
          onTranscript(text);
        }
      });
    }
  }, [isListening, start, stop, onTranscript]);

  if (!isSupported) {
    return (
      <div className={`voice-input voice-input--unsupported ${compact ? 'voice-input--compact' : ''}`}>
        <FiAlertCircle size={16} />
        <span>
          Voice input is not available in this browser.{' '}
          <strong>Use Chrome, Edge, or Safari</strong> for multilingual speech recognition.
        </span>
      </div>
    );
  }

  return (
    <div className={`voice-input ${compact ? 'voice-input--compact' : ''} ${disabled ? 'voice-input--disabled' : ''}`}>
      {/* Language selector pills */}
      <div className="voice-input__languages">
        <span className="voice-input__label">Voice Language:</span>
        <div className="voice-input__pills">
          {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`voice-input__pill ${language === key ? 'voice-input__pill--active' : ''}`}
              onClick={() => setLanguage(key)}
              disabled={disabled}
              title={`Switch to ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mic button + status */}
      <div className="voice-input__controls">
        <button
          type="button"
          className={`voice-input__mic-btn ${isListening ? 'voice-input__mic-btn--active' : ''}`}
          onClick={handleToggle}
          disabled={disabled}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <>
              <span className="voice-input__pulse" />
              <FiMic size={compact ? 18 : 22} />
            </>
          ) : (
            <FiMic size={compact ? 18 : 22} />
          )}
        </button>

        <div className="voice-input__status">
          {isListening ? (
            <span className="voice-input__listening">
              <span className="voice-input__dot" />
              Listening in {LANGUAGE_LABELS[language]}…
            </span>
          ) : (
            <span className="voice-input__idle">
              Tap mic to speak in {LANGUAGE_LABELS[language]}
            </span>
          )}
        </div>

        {isListening && (
          <button
            type="button"
            className="voice-input__stop-btn"
            onClick={stop}
            title="Stop"
          >
            <FiMicOff size={16} /> Stop
          </button>
        )}
      </div>

      {/* Interim transcript preview */}
      {interimText && (
        <div className="voice-input__interim">
          <span className="voice-input__interim-label">Hearing:</span>
          <span className="voice-input__interim-text">{interimText}</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="voice-input__error">
          <FiAlertCircle size={14} />
          <span>{error}</span>
          <button type="button" className="voice-input__dismiss" onClick={clearError}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
