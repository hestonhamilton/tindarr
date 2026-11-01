import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GHOST_SRC } from './ghost';

interface InviteModalProps {
  roomCode: string;
  halloween?: boolean;
  onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ roomCode, halloween = false, onClose }) => {
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
        <div className={`qr ${halloween ? 'qrGhost' : ''}`} data-testid='invite-qr'>
          {halloween
            // Dark on light with a light quiet zone so phone cameras read it on the dark card;
            // level H absorbs the excavated ghost logo
            ? <QRCodeSVG value={link} size={320} marginSize={4} level='H' fgColor='#251d32' bgColor='#fff3e8'
                imageSettings={{ src: GHOST_SRC, width: 320 * 0.22, height: 320 * 0.22, excavate: true }} />
            : <QRCodeSVG value={link} size={320} marginSize={2} />}
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
