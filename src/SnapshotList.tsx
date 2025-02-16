import React from "react";

const listStyle = {
  listStyleType: 'none',  // 去掉默认的列表样式
  padding: 0,             // 去掉内边距
  margin: '5px 0',        // 添加上下间距
};

const itemStyle = {
  padding: '10px',        // 添加内边距
  backgroundColor: '#f0f0f0',  // 设置背景色
  border: '1px solid #ccc', // 添加边框
  borderRadius: '5px',     // 圆角边框
  cursor: 'pointer',       // 鼠标悬停改变为手型
  transition: 'background 0.3s', // 添加过渡效果
};

export const SnapshotList = () => {
  return (
    <div className="snapshot-list" style={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '12%',
        height: '90%',
        border: '1px solid black',
        }}>
      <ul style={listStyle}>
        <li style={itemStyle} onClick={() => console.log('Snapshot 1')}>Snapshot 1</li>
        <li style={itemStyle}>Snapshot 2</li>
        <li style={itemStyle}>Snapshot 3</li>
      </ul>
    </div>
  );
};