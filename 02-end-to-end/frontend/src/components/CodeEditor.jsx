import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import socketService from '../services/socketService';

const CodeEditor = ({ code, language, onCodeChange, onLanguageChange, readOnly = false }) => {
  const editorRef = useRef(null);
  const isLocalChange = useRef(false);
  const languageRef = useRef(language);

  // Update ref when language changes
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const handleCodeUpdate = ({ code: newCode, language: newLanguage }) => {
      if (!isLocalChange.current) {
        onCodeChange(newCode);
        if (newLanguage !== languageRef.current) {
          onLanguageChange(newLanguage);
        }
      }
      isLocalChange.current = false;
    };

    socketService.onCodeUpdate(handleCodeUpdate);

    return () => {
      socketService.off('code-update', handleCodeUpdate);
    };
  }, [onCodeChange, onLanguageChange]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    isLocalChange.current = true;
    onCodeChange(value || '');
    socketService.emitCodeUpdate(value || '', language);
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;

