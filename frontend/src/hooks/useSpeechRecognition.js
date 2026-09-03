import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Multilingual Speech Recognition Hook
 * Supports: English (en-IN), Hindi (hi-IN), Bengali (bn-IN), Hinglish (hi-IN)
 * 
 * Uses the Web Speech API — works on Chrome, Edge, Safari, and Brave.
 * Brave users may need to disable Shields for speech recognition to work.
 */

const LANGUAGE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  hl: 'hi-IN', // Hinglish → Hindi recognizer (naturally handles code-mixed speech)
};

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  hl: 'Hinglish',
};

export { LANGUAGE_MAP, LANGUAGE_LABELS };

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(null);
  const shouldRestartRef = useRef(false);

  // Check browser support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  // Create recognition instance
  const createRecognition = useCallback(
    (lang) => {
      if (!SpeechRecognition) return null;

      const recognition = new SpeechRecognition();
      recognition.lang = LANGUAGE_MAP[lang] || 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setInterimText(interim);

        if (finalTranscript && onTranscriptRef.current) {
          onTranscriptRef.current(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          // Silent — auto-restart will handle this
          return;
        }
        if (event.error === 'not-allowed') {
          setError(
            'Microphone access denied. Please allow microphone permissions in your browser settings.'
          );
        } else if (event.error === 'network') {
          const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
          setError(
            isBrave
              ? 'Brave browser blocks the speech recognition service for privacy. Please open this page in Chrome or Edge to use voice input.'
              : 'Speech recognition network error. Please check your internet connection and try again.'
          );
        } else if (event.error === 'service-not-allowed') {
          setError(
            'Speech recognition service is blocked by this browser. Please use Chrome or Edge for voice input.'
          );
        } else if (event.error !== 'aborted') {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
        shouldRestartRef.current = false;
      };

      recognition.onend = () => {
        setInterimText('');
        if (shouldRestartRef.current) {
          // Auto-restart for continuous listening
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            shouldRestartRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      return recognition;
    },
    [SpeechRecognition]
  );

  // Start listening
  const start = useCallback(
    (transcriptCallback) => {
      if (!isSupported) {
        setError(
          'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
        );
        return;
      }

      // Stop existing
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      setError('');
      onTranscriptRef.current = transcriptCallback;

      const recognition = createRecognition(language);
      if (!recognition) return;

      recognitionRef.current = recognition;
      shouldRestartRef.current = true;

      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        setError(`Could not start microphone: ${e.message}`);
        setIsListening(false);
        shouldRestartRef.current = false;
      }
    },
    [isSupported, language, createRecognition]
  );

  // Stop listening
  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  // Switch language (restarts recognition if currently listening)
  const switchLanguage = useCallback(
    (newLang) => {
      setLanguage(newLang);
      if (isListening && onTranscriptRef.current) {
        // Restart with new language
        stop();
        setTimeout(() => {
          const recognition = createRecognition(newLang);
          if (!recognition) return;
          recognitionRef.current = recognition;
          shouldRestartRef.current = true;
          onTranscriptRef.current &&
            (recognition.onresult = (event) => {
              let finalTranscript = '';
              let interim = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                  finalTranscript += result[0].transcript;
                } else {
                  interim += result[0].transcript;
                }
              }
              setInterimText(interim);
              if (finalTranscript && onTranscriptRef.current) {
                onTranscriptRef.current(finalTranscript);
              }
            });
          recognition.onerror = recognitionRef.current?.onerror;
          recognition.onend = () => {
            setInterimText('');
            if (shouldRestartRef.current) {
              try { recognition.start(); } catch { setIsListening(false); shouldRestartRef.current = false; }
            } else {
              setIsListening(false);
            }
          };
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            setIsListening(false);
          }
        }, 100);
      }
    },
    [isListening, stop, createRecognition]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    language,
    interimText,
    error,
    isSupported,
    start,
    stop,
    setLanguage: switchLanguage,
    clearError: () => setError(''),
  };
}
