import React, {
  useState,
  type FC,
  useEffect,
} from 'react';
import { api } from '../../sidepanel/api';
import { useGlobal } from '../../sidepanel/hooks/useGlobal';

import VoiceDescriptionModal from './VoiceDescriptionModal';

interface AudioDraggableProps {
  url: string;
  text: string;
}

const DraggableFile = () => {
  const [isDragging, setIsDragging] = useState(false);
  const filePath = "file:///var/folders/gj/nvz3tqq50cs984w9pfgpkh2w0000gn/T/20240621101839_old_QQEFZV5FGFAS0I9CCTP55NVK7RSLR65E.mp3"

  const handleDragStart = (event) => {
    console.log('Drag start event triggered.');
    event.preventDefault();
    window.electron.ipcRenderer.startDrag('drag-and-drop.md');
    // event.dataTransfer.setData('text/uri-list', `file://${filePath}`);
    // console.log(`File path set in dataTransfer: ${filePath}`);
  };

  const handleDragEnd = () => {
    console.log('Drag end event triggered.');
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        border: isDragging ? '2px solid green' : '2px dashed gray',
        padding: '10px',
        cursor: 'grab',
        marginTop: '20px',
        width: '300px',
        textAlign: 'center',
      }}
    >
      {filePath ? (
        <>
          <p>Drag this file:</p>
          <strong draggable>{filePath}</strong>
        </>
      ) : (
        <p>No file selected</p>
      )}
    </div>
  );
};


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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", JSON.stringify([url]));
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
