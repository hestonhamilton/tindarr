import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface InviteModalProps {
  roomCode: string;
  onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ roomCode, onClose }) => {
  const link = `${window.location.origin}/room/${roomCode}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div className='overlay' onClick={onClose}>
      <div className='invite' onClick={(e) => e.stopPropagation()}>
        <h2>Scan to join</h2>
        <div className='qr'>
          <QRCodeSVG value={link} size={240} marginSize={2} />
        </div>
        <p className='roomCode'>{roomCode}</p>
        <p style={{ wordBreak: 'break-all', opacity: 0.8 }}>{link}</p>
        <div className='actions'>
          {navigator.share && (
            <button onClick={() => navigator.share({ title: 'Join my Tindarr room', url: link })}>Share</button>
          )}
          {navigator.clipboard && <button onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>}
          <button onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
