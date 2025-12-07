import { pipeline } from '@xenova/transformers';

// Definimos que el clasificador puede ser nulo o una función
let clasificador: any = null;
// Escuchamos mensajes. TypeScript necesita saber que 'self' es un Worker
self.addEventListener('message', async (event: MessageEvent) => {
    const textoUsuario = event.data;

    try {
        if (!clasificador) {
            self.postMessage({ status: 'loading' });
            
            // Especificamos la tarea 'sentiment-analysis'
            clasificador = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        const resultado = await clasificador(textoUsuario);

        self.postMessage({ status: 'complete', output: resultado });

    } catch (error: any) {
        self.postMessage({ status: 'error', error: error.message });
    }
});