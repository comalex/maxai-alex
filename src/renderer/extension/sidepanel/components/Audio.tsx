import React, {
  useState,
  type FC,
} from 'react';
import { api } from '../../sidepanel/api';
import { useGlobal } from '../../sidepanel/hooks/useGlobal';

import VoiceDescriptionModal from './VoiceDescriptionModal';

interface AudioDraggableProps {
  url: string;
  text: string;
}

const AudioDraggable: FC<AudioDraggableProps> = ({ url, text }) => {
  const {
    userId: user_id,
    selectedModel,
    jwtToken,
    account,
    userUUID,
    autoPlayState
  } = useGlobal();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDragStart = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const downloadedFilePath =
      await window.electron.ipcRenderer.invokeDownloadFile(url);
    console.log("downloadedFilePath", downloadedFilePath)
    window.electron.ipcRenderer.startDrag(downloadedFilePath);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDragEnd = async () => {
    await api.storeUserAction(jwtToken, {
      influencer_id: selectedModel.uuid,
      user_id: user_id,
      user_uuid: userUUID,
      account_id: account.name,
      type: "drag-drop"
    });
    setIsModalOpen(true);
  };

  return (
    <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <audio
        style={{ maxWidth: "100%" }}
        autoPlay={autoPlayState}
        controls
        src={url}
      />
      <VoiceDescriptionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        text={text}
      />
    </div>
  );
};

export default AudioDraggable;
