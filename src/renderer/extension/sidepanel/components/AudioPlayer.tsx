import React, { useRef, useEffect } from "react";
import AudioDraggable from "../../sidepanel/components/Audio";

interface AudioPlayerProps {
  audioUrl: string;
  audioText: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, audioText }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [audioUrl]);

  return (
    <>
      <AudioDraggable url={audioUrl} text={audioText} />
    </>
  );
};

export default AudioPlayer;
