import React, { useEffect, useState } from'react';
import { Doc } from './crdt/yjs';

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
}

export const ShowDiff: React.FC<ShowDiffProps> = ({ current, snapshot }) => {
  const Diff = require('diff');
  const [diff, setDiff] = useState([]);
  useEffect(() => {
    const snapshotStr = snapshot? snapshot.getText('text').toString() : '';
    setDiff(Diff.diffWords(snapshotStr || '', current || ''));
  }, [current, snapshot, Diff]);
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
            {part.value}
          </div>
        ))}
      </div>
      <button 
        onClick={() => {}}
        disabled={!snapshot}
      >
        Apply Snapshot
      </button>
    </div>
  );
};