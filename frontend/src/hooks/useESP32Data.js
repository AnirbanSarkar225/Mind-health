import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useESP32Data — React hook for real-time ESP32 EEG data via WebSocket.
 *
 * Connects to the backend WebSocket server, receives live ESP32 brainwave
 * data, and provides connection status, latest reading, and history buffer.
 *
 * Falls back to polling GET /api/esp32/latest if WebSocket fails.
 */
export default function useESP32Data({ maxHistory = 120, autoClassify = false } = {}) {
  const [latestData, setLatestData] = useState(null);
  const [classification, setClassification] = useState(null);
  const [history, setHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'disconnected' | 'reconnecting'
  const [isLive, setIsLive] = useState(false);
  const [clientCount, setClientCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const liveWatchdogRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 20;
  const mountedRef = useRef(true);

  const resetWatchdog = useCallback(() => {
    setIsLive(true);
    if (liveWatchdogRef.current) clearTimeout(liveWatchdogRef.current);
    liveWatchdogRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsLive(false);
      }
    }, 3500); // 3.5 seconds without an ESP32 packet = stream standby
  }, []);

  const addToHistory = useCallback((reading) => {
    setHistory((prev) => {
      const next = [...prev, reading];
      if (next.length > maxHistory) next.shift();
      return next;
    });
  }, [maxHistory]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Determine WebSocket URL based on current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setConnectionStatus('reconnecting');

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        console.log('[ESP32 WS] Connected to backend telemetry gateway');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'esp32_data') {
            const reading = {
              ...msg.data.signals,
              timestamp: msg.data.timestamp || msg.timestamp,
              classification: msg.data.classification || null,
            };
            setLatestData(reading);
            resetWatchdog();
            addToHistory(reading);

            if (msg.data.classification) {
              setClassification(msg.data.classification);
            }
          } else if (msg.type === 'classification_update') {
            setClassification(msg.data);
          } else if (msg.type === 'client_count') {
            setClientCount(msg.data.count || 0);
          }
        } catch (err) {
          console.warn('[ESP32 WS] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setConnectionStatus('disconnected');
        setIsLive(false);
        if (liveWatchdogRef.current) clearTimeout(liveWatchdogRef.current);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          console.log(`[ESP32 WS] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts.current})...`);
          setConnectionStatus('reconnecting');
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        console.warn('[ESP32 WS] Connection error');
        if (liveWatchdogRef.current) clearTimeout(liveWatchdogRef.current);
        setIsLive(false);
        ws.close();
      };
    } catch (err) {
      console.warn('[ESP32 WS] Failed to create WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  }, [addToHistory, resetWatchdog]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connect]);

  // Fetch initial history on mount via REST, only set latestData if ESP32 is actively connected
  useEffect(() => {
    Promise.all([
      fetch('/api/esp32/status').then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/esp32/history?limit=50').then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([statusData, historyData]) => {
      if (!mountedRef.current) return;
      if (historyData?.readings && historyData.readings.length > 0) {
        setHistory(historyData.readings);
        if (statusData?.connected) {
          setLatestData(historyData.readings[historyData.readings.length - 1]);
          resetWatchdog();
        }
      }
    });
  }, [resetWatchdog]);

  // Manual disconnect/reconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      reconnectAttempts.current = maxReconnectAttempts; // prevent auto-reconnect
      wsRef.current.close();
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  return {
    latestData,
    classification,
    history,
    connectionStatus,
    isLive,
    clientCount,
    disconnect,
    reconnect,
  };
}
