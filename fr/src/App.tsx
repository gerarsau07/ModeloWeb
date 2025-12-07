import { useState, useRef, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
import './App.css';

// Importamos el modelo directamente. Vite nos dará la URL final.
import modelUrl from './assets/mnist_unico.onnx?url';

function App() {
  // Estados de la aplicación
  const [prediction, setPrediction] = useState<number | null>(null);
  const [inferenceTime, setInferenceTime] = useState<number>(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("Cargando modelo...");

  // Referencias al DOM (Video y Canvas oculto)
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // ----------------------------------------------------------------
  // 1. INICIALIZACIÓN DEL MODELO
  // ----------------------------------------------------------------
  useEffect(() => {
    const initModel = async () => {
      try {
        // Creamos la sesión de inferencia con WebGPU, WebGL o WASM
        const session = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['webgpu', 'webgl', 'wasm'],
          graphOptimizationLevel: 'all'
        });

        sessionRef.current = session;
        const backend = (session as any).handler?.backendName || "CPU";
        setModelStatus(`✅ Modelo listo (Motor: ${backend})`);

      } catch (e: any) {
        console.error("Error cargando modelo:", e);
        setModelStatus(`❌ Error: ${e.message}`);
      }
    };
    initModel();
  }, []);

  // ----------------------------------------------------------------
  // 2. CONTROL DE LA CÁMARA
  // ----------------------------------------------------------------
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Usa la cámara trasera en móviles
      });
      setStream(mediaStream);
    } catch (err) {
      alert("No se pudo acceder a la cámara");
    }
  };

  // Conectar el stream al elemento <video> cuando esté listo
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream]);

  // ----------------------------------------------------------------
  // 3. PROCESO DE INFERENCIA (La "Magia")
  // ----------------------------------------------------------------
  const runInference = async () => {
    if (!videoRef.current || !canvasRef.current || !sessionRef.current) return;

    // A. Capturar imagen en un canvas pequeño (28x28 píxeles)
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvasRef.current.width = 28;
    canvasRef.current.height = 28;
    ctx.drawImage(videoRef.current, 0, 0, 28, 28);

    // B. Obtener los datos de los píxeles (RGBA)
    const imageData = ctx.getImageData(0, 0, 28, 28);
    const data = imageData.data; // Array plano [R, G, B, A, R, G, B, A...]
    const input = new Float32Array(28 * 28); // Array para el modelo (solo 1 canal)

    // C. Pre-procesamiento: Convertir a escala de grises y normalizar
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Promedio simple para gris
      const gray = (r + g + b) / 3;

      // Invertir y normalizar (0.0 a 1.0)
      // MNIST usa fondo negro (0) y trazo blanco (1), pero la cámara ve al revés.
      input[i / 4] = (255 - gray) / 255.0;
    }

    // D. Crear el Tensor de entrada [1, 1, 28, 28]
    const tensor = new ort.Tensor('float32', input, [1, 1, 28, 28]);

    // E. Ejecutar el modelo
    try {
      const start = performance.now();

      // Preparamos los inputs (el nombre 'input' viene del export en Python)
      const feeds = { [sessionRef.current.inputNames[0]]: tensor };

      // ¡Predecir!
      const results = await sessionRef.current.run(feeds);

      const end = performance.now();
      setInferenceTime(end - start);

      // F. Leer resultados (Probabilidades)
      const output = results[sessionRef.current.outputNames[0]].data as Float32Array;

      // Encontrar el índice con mayor valor (ArgMax)
      const maxVal = Math.max(...output);
      const predictedNumber = output.indexOf(maxVal);

      setPrediction(predictedNumber);

    } catch (e) {
      console.error("Error en inferencia:", e);
    }
  };

  return (
    <div className="container">
      <h1>🧠 Detector de Números</h1>

      <div className={`status ${modelStatus.includes('Error') ? 'error' : 'success'}`}>
        {modelStatus}
      </div>

      <div className="camera-box">
        {!stream ? (
          <button className="btn-primary" onClick={startCamera}>
            📸 Activar Cámara
          </button>
        ) : (
          <video ref={videoRef} muted playsInline />
        )}
      </div>

      <button
        className="btn-action"
        onClick={runInference}
        disabled={!stream || !sessionRef.current}
      >
        🔮 DETECTAR
      </button>

      {prediction !== null && (
        <div className="result-card">
          <h2>Es un: <span className="number">{prediction}</span></h2>
          <p>Tiempo: {inferenceTime.toFixed(2)} ms</p>
        </div>
      )}

      {/* Canvas invisible para procesar la imagen */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;