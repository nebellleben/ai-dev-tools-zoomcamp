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
    
    // Configure Monaco Editor for better syntax highlighting
    if (monaco) {
      // Set up additional language configurations if needed
      // JavaScript and Python are supported by default
      
      // Configure editor options for better syntax highlighting
      editor.updateOptions({
        // Enable syntax highlighting features
        colorDecorators: true,
        bracketPairColorization: {
          enabled: true,
        },
        // Improve syntax highlighting visibility
        renderLineHighlight: 'all',
        // Enable semantic highlighting
        semanticHighlighting: {
          enabled: true,
        },
      });
    }
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
          // Enhanced syntax highlighting options
          colorDecorators: true,
          bracketPairColorization: {
            enabled: true,
          },
          renderLineHighlight: 'all',
          semanticHighlighting: {
            enabled: true,
          },
          // Language-specific formatting
          formatOnPaste: true,
          formatOnType: true,
          // Improve code readability
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;

