import React, { useEffect, useRef, useState } from 'react';
import { Doc } from './crdt/yjs';
import { Network } from './network/network';
import { Header } from './Header';
import { EditorRegion } from './EditorRegion';
import { SnapshotList } from './SnapshotList';
import { ShowDiff } from './ShowDiff';
import { set } from 'ace-builds-internal/config';

export type Snapshot = {
  content: Doc;
  handleClick: () => void;
  time: string;
}

function App() {
  const network = useRef(new Network());
  const [delay, setDelay] = useState(300); // 延迟状态
  const [isCommunicating, setIsCommunicating] = useState(true); // 通信状态
  const [current, setCurrent] = useState(''); // 当前编辑器内容
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]); // 快照列表
  const [currentSnapshot, setCurrentSnapshot] = useState<Doc | null>(null); // 当前快照内容

  const addSnapshot = (doc: Doc) => {
    const docCopy = doc.clone();
    setSnapshots(prev => [{ content: docCopy, handleClick: () => setCurrentSnapshot(docCopy), time: new Date().toLocaleString() }, ...prev]);
  }

  return (
    <div className="App" style={{ 
      display: 'flex',
      height: '100vh',
      width: '100vw',
      flexDirection: 'column',
    }}>
      <Header network = {network} delay = {delay} setDelay = {setDelay}  setIsCommunicating={setIsCommunicating}
        isCommunicating={isCommunicating} />
      <div className="container" style={{ 
        display: 'flex',
        height: 'calc(100vh - 50px)',
        width: '100vw',
        flexDirection: 'row',
      }}>
        <EditorRegion network={network} 
          isCommunicating={isCommunicating}
          addSnapshot={addSnapshot}
          setCurrent={setCurrent}
          currentSnapshot={currentSnapshot} />
        <SnapshotList Snapshots={snapshots} />
        <ShowDiff  current={current} snapshot={currentSnapshot} network={network} />
      </div>
    </div>
  );
}
export default App;