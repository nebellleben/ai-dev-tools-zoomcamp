import { useState, useEffect } from 'react';
import { loadPyodide, executePython, isPyodideLoaded } from '../services/pyodideService';

const CodeExecutor = ({ code, language }) => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);

  // Preload Pyodide when Python is selected
  useEffect(() => {
    if (language === 'python' && !isPyodideLoaded()) {
      setIsLoadingPyodide(true);
      loadPyodide()
        .then(() => {
          setPyodideReady(true);
          setIsLoadingPyodide(false);
        })
        .catch((err) => {
          console.error('Failed to load Pyodide:', err);
          setIsLoadingPyodide(false);
        });
    } else if (language === 'python' && isPyodideLoaded()) {
      setPyodideReady(true);
    } else {
      setPyodideReady(false);
    }
  }, [language]);

  const executeJavaScript = () => {
    // Capture console.log output
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };
    
    console.error = (...args) => {
      logs.push('ERROR: ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    console.warn = (...args) => {
      logs.push('WARN: ' + args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    try {
      // Create a sandboxed execution context
      // Using Function constructor for better isolation
      const func = new Function(code);
      func();
      
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      return {
        output: logs.join('\n') || 'Code executed successfully (no output)',
        error: null,
      };
    } catch (execError) {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      return {
        output: null,
        error: execError.toString(),
      };
    }
  };

  const executeCode = async () => {
    setOutput('');
    setError('');
    setIsRunning(true);

    try {
      if (language === 'javascript') {
        const result = executeJavaScript();
        setOutput(result.output || '');
        setError(result.error || '');
      } else if (language === 'python') {
        if (!pyodideReady) {
          setError('Python runtime (Pyodide) is still loading. Please wait...');
          setIsRunning(false);
          return;
        }

        try {
          const result = await executePython(code);
          if (result.error) {
            setError(result.error);
          } else {
            setOutput(result.output || 'Code executed successfully (no output)');
          }
        } catch (execError) {
          setError(execError.toString());
        }
      } else {
        setError(`Language ${language} execution is not yet supported. Currently supported: JavaScript and Python (via WASM).`);
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusMessage = () => {
    if (language === 'javascript') {
      return '✓ JavaScript execution supported';
    } else if (language === 'python') {
      if (isLoadingPyodide) {
        return '⏳ Loading Python runtime (Pyodide/WASM)...';
      } else if (pyodideReady) {
        return '✓ Python execution supported (WASM)';
      } else {
        return '⚠ Python runtime not ready';
      }
    } else {
      return '⚠ Execution not supported for this language';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={executeCode}
          disabled={isRunning || (language === 'python' && !pyodideReady)}
          style={{
            padding: '8px 16px',
            backgroundColor: (isRunning || (language === 'python' && !pyodideReady)) ? '#555' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isRunning || (language === 'python' && !pyodideReady)) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {getStatusMessage()}
        </span>
      </div>
      {isLoadingPyodide && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#2d2d30', 
          borderRadius: '4px',
          marginBottom: '10px',
          color: '#4ec9b0',
          fontSize: '12px'
        }}>
          ⏳ Loading Python runtime (Pyodide) from CDN. This may take a few seconds on first load...
        </div>
      )}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#252526', 
        padding: '10px', 
        borderRadius: '4px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {error && (
          <div style={{ color: '#f48771', marginBottom: '10px' }}>
            <strong>Error:</strong><br />
            {error}
          </div>
        )}
        {output && (
          <div style={{ color: '#4ec9b0' }}>
            <strong>Output:</strong><br />
            {output}
          </div>
        )}
        {!output && !error && (
          <div style={{ color: '#888' }}>
            {language === 'python' && !pyodideReady && !isLoadingPyodide
              ? 'Python runtime not ready. Please wait...'
              : 'Click "Run Code" to execute your code'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutor;
