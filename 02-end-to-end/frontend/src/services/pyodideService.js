// Service for managing Pyodide (Python WASM) execution
// Pyodide is the library that compiles Python to WebAssembly for browser execution
// Reference: https://pyodide.org/
// Pyodide is the standard library used by AI tools for compiling Python to WASM

let pyodideInstance = null;
let isLoading = false;
let loadPromise = null;

/**
 * Load Pyodide from CDN
 * Pyodide is a Python distribution for the browser and Node.js based on WebAssembly
 * It compiles Python to WASM, allowing secure execution in the browser without server-side execution
 */
export const loadPyodide = async () => {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      // Load Pyodide dynamically from CDN
      // This is the recommended approach as Pyodide is a large package
      // Using jsdelivr CDN for reliable delivery
      const pyodideModule = await import('pyodide');
      const { loadPyodide } = pyodideModule;
      
      // Initialize Pyodide with CDN index URL
      // Pyodide needs to download Python runtime files from CDN
      pyodideInstance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/',
      });

      return pyodideInstance;
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      isLoading = false;
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
};

/**
 * Execute Python code using Pyodide
 * @param {string} code - Python code to execute
 * @returns {Promise<{output: string, error: string}>}
 */
export const executePython = async (code) => {
  if (!pyodideInstance) {
    await loadPyodide();
  }

  const output = [];
  const errors = [];

  try {
    // Capture stdout
    pyodideInstance.setStdout({
      batched: (text) => {
        output.push(text);
      },
    });

    // Capture stderr
    pyodideInstance.setStderr({
      batched: (text) => {
        errors.push(text);
      },
    });

    // Execute Python code
    const result = await pyodideInstance.runPythonAsync(code);

    // If there's a return value, add it to output
    if (result !== undefined) {
      output.push(String(result));
    }

    return {
      output: output.join('') || null,
      error: errors.join('') || null,
    };
  } catch (error) {
    return {
      output: null,
      error: error.toString(),
    };
  } finally {
    // Reset stdout/stderr
    pyodideInstance.setStdout({ batched: () => {} });
    pyodideInstance.setStderr({ batched: () => {} });
  }
};

/**
 * Check if Pyodide is loaded
 */
export const isPyodideLoaded = () => {
  return pyodideInstance !== null;
};

