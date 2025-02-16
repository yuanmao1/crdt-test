import React, { useEffect, useRef, useState } from 'react';
import { Network } from './network/network';
import { Header } from './Header';
import { EditorRegion } from './EditorRegion';

function App() {
  const network = useRef(new Network());
  const [delay, setDelay] = useState(300); // 延迟状态
  return (
    <div className="App" style={{ 
      display: 'flex',
      height: '100vh',
      width: '100vw',
      flexDirection: 'column',
    }}>
      <Header network = {network} delay = {delay} setDelay = {setDelay} />
      <div className="container" style={{ 
        display: 'flex',
        height: 'calc(100vh - 50px)',
        width: '100vw',
        flexDirection: 'row',
      }}>
        <EditorRegion network = {network} />
      </div>
    </div>
  );
}
export default App;