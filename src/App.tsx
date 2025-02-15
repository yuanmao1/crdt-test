import React, { useEffect, useRef } from 'react';
import ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import { Doc } from './crdt/yjs';
import { Network, Channel, ReceiveCb} from './network/network';

function App() {
  const leftEditorRef = useRef<ace.Editor | null>(null);
  const rightEditorRef = useRef<ace.Editor | null>(null);
  const network = useRef(new Network());
  const leftDoc = useRef(new Doc('client1'));
  const rightDoc = useRef(new Doc('client2'));
  const isRemoteApplying = useRef(false);

  // 初始化编辑器和网络通信
  useEffect(() => {
    // 初始化Ace编辑器
    const initEditor = (elementId: string) => {
      const editor = ace.edit(elementId);
      editor.setTheme('ace/theme/chrome');
      editor.session.setMode('ace/mode/text');
      editor.session.setUseWrapMode(true);
      return editor;
    };

    const leftEditor = initEditor('left-editor');
    const rightEditor = initEditor('right-editor');
    
    leftEditorRef.current = leftEditor;
    rightEditorRef.current = rightEditor;

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
        console.log(localDoc.current.clientId, 'local change');
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
            const end = getLinearIndex(editor, delta.end.row, delta.end.column);
            
            // 逆序删除避免索引变化
            for (let i = end - 1; i >= start; i--) {
              text.delete(i);
            }
          }

          // 发送更新到对端
          // const missing = localDoc.current.getMissing(remoteDoc.current.getVersion());
          remoteDoc.current.merge(localDoc.current);
          channel.broadcast("need update");
          console.log(channel.name, 'update sent');
        } catch (error) {
          console.error('Local change error:', error);
        }
      };

      // 远程变化处理
      const handleRemoteUpdate = (message: string) => {
        try {
          isRemoteApplying.current = true;
          const newContent = localDoc.current.getText("text").toString();
          editor.setValue(newContent);
          console.log(channel.name, 'update received');
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
      leftEditor,
      leftChannel,
    );
    
    const rightSync = createSyncHandler(
      rightDoc,
      leftDoc,
      rightEditor,
      rightChannel,
    );

    // 绑定事件监听
    leftEditor.session.on('change', leftSync.handleLocalChange);
    rightEditor.session.on('change', rightSync.handleLocalChange);

    leftChannel.receive(leftSync.handleRemoteUpdate as ReceiveCb);
    rightChannel.receive(rightSync.handleRemoteUpdate as ReceiveCb);

    return () => {
      // 清理资源
      leftEditor.destroy();
      rightEditor.destroy();
      network.current.removeChannel('client1');
      network.current.removeChannel('client2');
    };
  }, []);

  return (
    <div className="App" style={{ 
      display: 'flex',
      height: '100vh',
      width: '100vw'
    }}>
      <div 
        id="left-editor" 
        style={{ flex: 1, borderRight: '1px solid #ccc' }}
      />
      <div 
        id="right-editor" 
        style={{ flex: 1 }}
      />
    </div>
  );
}

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

export default App;