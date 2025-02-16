import React, { useEffect, useRef, useState } from 'react';
import { Network } from './network/network';
import { Header } from './Header';
import { EditorRegion } from './EditorRegion';
import { SnapshotList } from './SnapshotList';
import { ShowDiff } from './ShowDiff';

function App() {
  const network = useRef(new Network());
  const [delay, setDelay] = useState(300); // 延迟状态
  const [isCommunicating, setIsCommunicating] = useState(true); // 通信状态
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
        <EditorRegion network = {network} isCommunicating={isCommunicating} />
        <SnapshotList />
        <ShowDiff />
      </div>
    </div>
  );
}
export default App;