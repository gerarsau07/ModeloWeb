// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import './App.css';

// Definimos cómo se ve la respuesta de la IA
interface ResultadoIA {
  label: string;
  score: number;
}

function App() {
  const [input, setInput] = useState<string>('');
  // El resultado puede ser null o del tipo ResultadoIA
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [estado, setEstado] = useState<'idle' | 'loading' | 'analyzing' | 'ready'>('idle');
  
  // Referencia al Worker. Le decimos a TS que esto guardará un Worker
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!worker.current) {
      // Importamos el archivo .ts directamente
      worker.current = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
      });

      worker.current.onmessage = (event: MessageEvent) => {
        const { status, output } = event.data;
        
        if (status === 'loading') {
          setEstado('loading');
        } else if (status === 'complete') {
          // El output es un array, tomamos el primero
          setResultado(output[0]); 
          setEstado('ready');
        }
      };
    }
  }, []);

  const analizarTexto = () => {
    if(!input) return;
    setEstado('analyzing');
    worker.current?.postMessage(input);
  };

  return (
    <div className="container">
      <h1>🤖 IA con TypeScript</h1>
      <p>Escribe algo en inglés:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="I love TypeScript..."
          rows={4}
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
        />
        
        <button 
          onClick={analizarTexto} 
          disabled={estado === 'loading' || estado === 'analyzing'}
        >
          {estado === 'loading' ? 'Descargando Modelo...' : 
           estado === 'analyzing' ? 'Analizando...' : 'Analizar Sentimiento'}
        </button>
      </div>

      {resultado && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Resultado:</h3>
          <p><strong>Sentimiento:</strong> {resultado.label}</p>
          <p><strong>Confianza:</strong> {(resultado.score * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  )
}

export default App;