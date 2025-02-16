import React from "react";
import { Network } from "./network/network";
import { set } from "ace-builds-internal/config";

interface HeaderProps {
  network: React.MutableRefObject<Network>;
  delay: number;
  setDelay: (newDelay: number) => void;
  isCommunicating: boolean;
  setIsCommunicating: (isCommunicating: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  network,
  delay,
  setDelay,
  isCommunicating,
  setIsCommunicating,
}) => {

    // 处理滑块变化
  const handleDelayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(event.target.value, 10);
    setDelay(newDelay);
    network.current.setDelay(newDelay); // 更新网络延迟
  };

  const handleStartStop = () => {
    setIsCommunicating(!isCommunicating);
  }

  return (
  <div style={{ padding: '10px', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <label htmlFor="delay-slider">Network Delay: {delay}ms</label>
      <input
        id="delay-slider"
        type="range"
        min="0"
        max="5000"
        value={delay}
        onChange={handleDelayChange}
        style={{ width: '200px', marginLeft: '10px' }}
      />
      <span style={{ marginLeft: '20px', marginRight: '10px' }}>communicate:</span>
      <button onClick={handleStartStop}>{isCommunicating ? 'Stop' : 'Start'}</button>
  </div>
  );
}