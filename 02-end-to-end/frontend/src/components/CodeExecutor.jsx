import { useState } from 'react';

const CodeExecutor = ({ code, language }) => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = () => {
    setOutput('');
    setError('');
    setIsRunning(true);

    try {
      if (language === 'javascript') {
        // Capture console.log output
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        
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

        try {
          // Create a sandboxed execution context
          const func = new Function(code);
          func();
          
          // Restore console methods
          console.log = originalLog;
          console.error = originalError;
          
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');
        } catch (execError) {
          console.log = originalLog;
          console.error = originalError;
          setError(execError.toString());
        }
      } else {
        setError(`Language ${language} execution is not yet supported in the browser. Please use JavaScript for now.`);
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsRunning(false);
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
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={executeCode}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {language === 'javascript' ? '✓ JavaScript execution supported' : '⚠ Only JavaScript supported in browser'}
        </span>
      </div>
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
            Click "Run Code" to execute your code
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutor;

