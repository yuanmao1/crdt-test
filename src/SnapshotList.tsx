import React, { useState} from "react";
import { Snapshot } from "./App";
const listStyle = {
  listStyleType: 'none',  // 去掉默认的列表样式
  padding: 0,             // 去掉内边距
  margin: '5px 0',        // 添加上下间距
};

const itemStyle = {
  padding: '10px',        // 添加内边距
  backgroundColor: '#f0f0f0',  // 设置背景色
  border: '2px solid #ccc', // 添加边框
  borderRadius: '5px',     // 圆角边框
  cursor: 'pointer',       // 鼠标悬停改变为手型
  transition: 'background 0.3s', // 添加过渡效果
};

interface SnapshotListProps {
  Snapshots: Snapshot[];
}


export const SnapshotList : React.FC<SnapshotListProps> = ({
  Snapshots
}) => {
  return (
    <div className="snapshot-list" style={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '12%',
        height: '90%',
        border: '1px solid black',
        overflow: 'auto',
        }}>
      <ul style={listStyle}>
        {Snapshots.map((snapshot, index) => (
          <li key={index} style={itemStyle} onClick={snapshot.handleClick}> {snapshot.time} </li>
        ))}
      </ul>
    </div>
  );
};