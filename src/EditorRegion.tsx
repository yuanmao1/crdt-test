import React, { useState, useRef, useEffect, use } from "react";
import ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import { Doc } from './crdt/yjs';
import { Network, Channel, ReceiveCb} from './network/network';

// 计算线性位置索引
function getLinearIndex(editor: ace.Editor, row: number, column: number): number {
  const session = editor.getSession();
  let index = 0;
  
  for (let i = 0; i < row; i++) {
    const line = session.getLine(i);
    index += (line?.length || 0) + 1; // +1 for newline
  }
  
  return index + column;
}

interface EditorRegionProps {
  network: React.MutableRefObject<Network>;
  isCommunicating: boolean;
  addSnapshot: (doc: Doc) => void;
  setCurrent: (str: string) => void;
  currentSnapshot: Doc | null;
}

const buttonContainerStyle = { 
  width: '100%', 
  height: '5%', 
  display: 'flex', 
  flexDirection: 'row' as 'row', 
  justifyContent: 'flex-end', 
  alignItems: 'center', 
  padding: '5px'
};

const buttonStyle = {
  width: '15%',
  height: '100%',
  marginRight: '20px',
}

export const EditorRegion: React.FC<EditorRegionProps> = ({
    network,
    isCommunicating,
    addSnapshot,
    setCurrent,
    currentSnapshot,
}) => {
    const upperEditorRef = useRef<ace.Editor | null>(null);
    const downerEditorRef = useRef<ace.Editor | null>(null);
    const leftDoc = useRef(new Doc('client1'));
    const rightDoc = useRef(new Doc('client2'));
    const isRemoteApplying = useRef(false);
    const isCommunicatingRef = useRef(isCommunicating);
    const currentSnapshotRef = useRef(currentSnapshot);

    // Synchronize isCommunicating prop change with the ref
    useEffect(() => {
      isCommunicatingRef.current = isCommunicating;
    }, [isCommunicating]);

    useEffect(() => {
      currentSnapshotRef.current = currentSnapshot;
    }, [currentSnapshot]);

    // 初始化编辑器和网络通信
    useEffect(() => {
      // 初始化Ace编辑器
      const initEditor = (elementId: string) => {
        const editor = ace.edit(elementId);
        editor.setTheme('ace/theme/monokai');
        editor.session.setMode('ace/mode/text');
        editor.session.setUseWrapMode(true);
        return editor;
      };

      const upperEditor = initEditor('upper-editor');
      const downerEditor = initEditor('downer-editor');
      
      upperEditorRef.current = upperEditor;
      downerEditorRef.current = downerEditor;

      // 创建网络通道
      const leftChannel = network.current.createChannel('client1');
      const rightChannel = network.current.createChannel('client2');

      // 同步处理函数
      const createSyncHandler = (
        localDoc: React.MutableRefObject<Doc>,
        remoteDoc: React.MutableRefObject<Doc>,
        editor: ace.Editor,
        channel: Channel,
      ) => {
        // 本地变化处理
        const handleLocalChange = (delta: any) => {
          if (isRemoteApplying.current) return;
          // console.log(localDoc.current.clientId, 'local change');
          // console.log(delta)
          try {
            const text = localDoc.current.getText("text");
            // const session = editor.getSession();

            if (delta.action === 'insert') {
              const pos = delta.start;
              const content = delta.lines.join('\n');
              const index = getLinearIndex(editor, pos.row, pos.column);
              
              // 插入每个字符
              for (let i = 0; i < content.length; i++) {
                text.insert(index + i, content[i]);
              }
            } 
            else if (delta.action === 'remove') {
              const start = getLinearIndex(editor, delta.start.row, delta.start.column);
              const end = start + delta.lines.join('\n').length;
              
              // 逆序删除避免索引变化
              for (let i = end - 1; i >= start; i--) {
                text.delete(i);
              }
            }
            // 发送更新到对端
            // const missing = localDoc.current.getMissing(remoteDoc.current.getVersion());
            // console.log("isCommunicatingRef.current: ", isCommunicatingRef.current);
            if (isCommunicatingRef.current) {
              channel.broadcast("need update");
              // console.log(channel.name, 'update sent');
            }
          } catch (error) {
            console.error('Local change error:', error);
          }
          setCurrent(editor.getValue());
        };

        // 远程变化处理
        const handleRemoteUpdate = (message: string) => {
          try {
            if (message === "need update") {
              isRemoteApplying.current = true;
              localDoc.current.merge(remoteDoc.current)
              const newContent = localDoc.current.getText("text").toString();
              editor.setValue(newContent);
              // console.log(channel.name, 'update received');
            } else {
              if (message === "apply") {
                localDoc.current.replace(currentSnapshotRef.current!);
                const newContent = localDoc.current.getText("text").toString();
                editor.setValue(newContent);
              }
            }
          } catch (error) {
            console.error('Remote update error:', error);
          } finally {
            isRemoteApplying.current = false;
          }
          return {};
        };

        return { handleLocalChange, handleRemoteUpdate };
      };

      // 创建同步处理器
      const leftSync = createSyncHandler(
        leftDoc,
        rightDoc,
        upperEditor,
        leftChannel,
      );
      
      const rightSync = createSyncHandler(
        rightDoc,
        leftDoc,
        downerEditor,
        rightChannel,
      );

      // 绑定事件监听
      upperEditor.session.on('change', leftSync.handleLocalChange);
      downerEditor.session.on('change', rightSync.handleLocalChange);

      leftChannel.receive(leftSync.handleRemoteUpdate as ReceiveCb);
      rightChannel.receive(rightSync.handleRemoteUpdate as ReceiveCb);

      return () => {
        // 清理资源
        upperEditor.destroy();
        downerEditor.destroy();
        network.current.removeChannel('client1');
        network.current.removeChannel('client2');
      };
    }, []);
    return (
        <div className="editor-region" style={{ 
            display: 'flex',
            flexDirection: 'column',
            width: '40%',
            height: '90%',
            border: '1px solid black',
            overflow: 'hidden',
          }}>
            <div 
                id="upper-editor" style={{ width: '100%', height: '47.5%', border: '1px solid black' }}>
            </div>
            <div style={buttonContainerStyle}>
              <button onClick={() => {addSnapshot(leftDoc.current); console.log(leftDoc.current.getText("text").toString())}} style={buttonStyle}> saveClient1 </button>
              <button onClick={() => {addSnapshot(rightDoc.current)}} style={buttonStyle}> saveClient2 </button>
            </div>
            <div
                id="downer-editor" style={{ width: '100%', height: '47.5%', border: '1px solid black' }}>
            </div>
        </div>
    )
}