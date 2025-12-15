import { useRef, useState } from 'react';

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = (canvas, duration = 12000) => {
    if (!canvas) return;
    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRecording(false);
    };

    recorder.start();
    setRecording(true);
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, duration);
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  return { recording, downloadUrl, start, stop };
}
