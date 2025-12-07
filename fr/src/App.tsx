// Archivo: C:\modeloWeb\fr\src\App.tsx
import { useState, useRef, useEffect } from 'react';
import './App.css'; 

function App() {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null); // Guardamos el stream en el estado
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. ENCENDER CÁMARA
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream); // Guardamos la señal de la cámara
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara. Revisa los permisos en el navegador (icono del candado junto a la URL).");
    }
  };

  // 2. EFECTO: Conectar la cámara al video cuando el elemento ya existe
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error al reproducir video:", e));
    }
  }, [stream]); // Se ejecuta cada vez que 'stream' cambia

  // 3. TOMAR FOTO Y ENVIAR
  const captureAndPredict = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    setPrediction(null);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await sendToBackend(blob);
        }
      }, 'image/jpeg');
    }
  };

  const sendToBackend = async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', imageBlob, "captura.jpg");

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setPrediction(data.numero);
    } catch (error) {
      console.error("Error:", error);
      alert("Error conectando con el servidor Python. ¿Está corriendo?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'Arial', padding: '20px' }}>
      <h1>📸 Detector de Números en Vivo</h1>
      <p>Escribe un número grande y grueso en un papel y muéstralo a la cámara.</p>

      {/* ÁREA DE VIDEO */}
      <div style={{ 
        border: '4px solid #333', 
        borderRadius: '10px', 
        overflow: 'hidden', 
        backgroundColor: '#000',
        height: '350px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        {/* Si NO hay stream, mostramos el botón */}
        {!stream ? (
          <button 
            onClick={startCamera} 
            style={{ 
              fontSize: '20px', 
              padding: '15px 30px', 
              cursor: 'pointer',
              backgroundColor: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}>
            📹 Activar Cámara
          </button>
        ) : (
          /* Si HAY stream, mostramos el video */
          <video 
            ref={videoRef} 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        )}
      </div>

      {/* BOTÓN DE CAPTURA */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={captureAndPredict} 
          disabled={!stream || loading}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px', 
            backgroundColor: stream ? '#ff4757' : '#ccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '50px',
            cursor: stream ? 'pointer' : 'not-allowed',
            transition: 'background 0.3s'
          }}
        >
          {loading ? '🧠 Pensando...' : '📸 ¡DETECTAR!'}
        </button>
      </div>

      {/* RESULTADO */}
      {prediction !== null && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f1f2f6', borderRadius: '10px' }}>
          <h2>He detectado un:</h2>
          <span style={{ fontSize: '100px', fontWeight: 'bold', color: '#2ed573' }}>
            {prediction}
          </span>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;