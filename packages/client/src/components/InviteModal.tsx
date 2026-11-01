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
          <QRCodeSVG value={link} size={320} marginSize={2} />
        </div>
        <p className='roomCode'>{roomCode}</p>
        <p className='inviteUrl'>{link}</p>
        <div className='actions'>
          {navigator.share && (
            <button aria-label='Share invite' onClick={() => navigator.share({ title: 'Join my Tindarr room', url: link })}>Share</button>
          )}
          {navigator.clipboard && <button aria-label='Copy invite link' onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>}
          <button aria-label='Close invite' onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
