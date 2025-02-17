import React, { useEffect, useState } from'react';
import { Doc } from './crdt/yjs';
import { Network } from './network/network';

const contentStyle = {
  display: 'block',
  wordBreak: 'break-word' as 'break-word',
  backgroundColor: 'lightgray',
  padding: '10px',
  borderRadius: '5px',
  width: '50vw',
  height: '80%',
  prewrap: 'pre-wrap',
  whiteSpace: 'pre-wrap',
  overflow: 'auto',
};
interface ChangePart {
  added?: boolean;
  removed?: boolean;
  value: string;
}

interface ShowDiffProps {
    current: string;
    snapshot: Doc | null;
    network: React.MutableRefObject<Network>;
}

export const ShowDiff: React.FC<ShowDiffProps> = ({ current, snapshot, network }) => {
  const [diff, setDiff] = useState([]);
  const networkChannel = network.current.createChannel('diff');

  useEffect(() => {
    const Diff = require('diff');
    const snapshotStr = snapshot? snapshot.getText('text').toString() : '';
    // console.log(snapshotStr);
    setDiff(Diff.diffWords(snapshotStr, current));
  }, [current, snapshot]);
  return (
    <div className="diff-viewer">
      <div className="diff-content" style={contentStyle}>
        {diff.map((part: ChangePart, index: number) => (
          <div
            key={index}
            style={{
              color: part.added ? 'green' : 
                     part.removed ? 'red' : 'grey',
            }}
          >
            {part.added ? '+ ' : part.removed ? '- ' : ''}
            {part.value}
          </div>
        ))}
      </div>
      <button 
        onClick={() => {
          networkChannel.send('client1', 'apply');
        }}
        disabled={!snapshot}
      >
        Apply Snapshot
      </button>
    </div>
  );
};