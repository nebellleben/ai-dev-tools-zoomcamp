import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CodeEditor from './components/CodeEditor';
import CodeExecutor from './components/CodeExecutor';
import socketService from './services/socketService';
import { getDefaultCode } from './utils/defaultCode';
import './App.css';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
];

function App() {
  const [roomId, setRoomId] = useState('');
  const [code, setCode] = useState(getDefaultCode('javascript'));
  const [language, setLanguage] = useState('javascript');
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const codeRef = useRef(code);
  const previousLanguageRef = useRef(language);

  useEffect(() => {
    // Check if room ID exists in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomId = urlParams.get('room');
    
    if (urlRoomId) {
      setRoomId(urlRoomId);
      setIsHost(false);
      socketService.connect(urlRoomId);
    } else {
      // Create new room
      const newRoomId = uuidv4();
      setRoomId(newRoomId);
      setIsHost(true);
      socketService.connect(newRoomId);
      // Update URL without reload
      window.history.pushState({}, '', `?room=${newRoomId}`);
    }

    socketService.onUserJoined((data) => {
      setConnectedUsers(data.userCount || 1);
    });

    socketService.onUserLeft((data) => {
      setConnectedUsers(data.userCount || 1);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Keep codeRef in sync with code state
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
  }, []);

  const handleLanguageChange = useCallback((newLanguage) => {
    // If language actually changed and code is empty or is default code for previous language,
    // set default code for new language
    if (newLanguage !== previousLanguageRef.current) {
      const currentCode = codeRef.current;
      const previousDefault = getDefaultCode(previousLanguageRef.current);
      
      // If current code is empty or matches previous language's default, use new language's default
      if (!currentCode.trim() || currentCode === previousDefault) {
        const newDefaultCode = getDefaultCode(newLanguage);
        setCode(newDefaultCode);
        codeRef.current = newDefaultCode;
        socketService.emitCodeUpdate(newDefaultCode, newLanguage);
      } else {
        // Just update language, keep existing code
        socketService.emitCodeUpdate(codeRef.current, newLanguage);
      }
      
      previousLanguageRef.current = newLanguage;
    }
    
    setLanguage(newLanguage);
  }, []);

  const copyRoomLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Room link copied to clipboard!');
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Code Interview Platform</h1>
        </div>
        <div className="header-right">
          <div className="room-info">
            <span className="room-id">Room: {roomId.substring(0, 8)}...</span>
            <span className="user-count">👥 {connectedUsers} user{connectedUsers !== 1 ? 's' : ''}</span>
          </div>
          {isHost && (
            <button onClick={copyRoomLink} className="share-button">
              📋 Share Link
            </button>
          )}
        </div>
      </header>

      <div className="main-container">
        <div className="editor-panel">
          <div className="editor-header">
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="editor-content">
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>

        <div className="executor-panel">
          <CodeExecutor code={code} language={language} />
        </div>
      </div>
    </div>
  );
}

export default App;
