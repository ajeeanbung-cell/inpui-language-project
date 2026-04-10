import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  transcript: string;
  isTranscribing: boolean;
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  setTranscript: (text: string) => void;
}

export type UseAudioRecorderReturn = AudioRecorderState & AudioRecorderControls;

// Extend Window type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: (new () => SpeechRecognitionInstance) | undefined;
    webkitSpeechRecognition: (new () => SpeechRecognitionInstance) | undefined;
  }
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResultEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useAudioRecorder(lang = "en-US"): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    const currentAudioUrl = audioUrl;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        for (const t of stream.getTracks()) t.stop();
        streamRef.current = null;
      };

      recorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      // Start speech recognition if supported
      const SpeechRecognitionAPI =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        let finalText = "";

        recognition.onstart = () => setIsTranscribing(true);
        recognition.onend = () => setIsTranscribing(false);

        recognition.onresult = (event: SpeechRecognitionResultEvent) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += `${result[0].transcript} `;
            } else {
              interim += result[0].transcript;
            }
          }
          setTranscript(finalText + interim);
        };

        recognition.onerror = () => setIsTranscribing(false);

        try {
          recognition.start();
        } catch {
          // speech recognition may not be available, silently skip
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError(
            "Microphone access denied. Please allow microphone access in your browser.",
          );
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone.");
        } else {
          setError(`Recording error: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while starting the recording.");
      }
    }
  }, [lang]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      setIsTranscribing(false);
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setTranscript("");
    chunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    transcript,
    isTranscribing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    setTranscript,
  };
}

/**
 * Format seconds to mm:ss display
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
