from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io

app = FastAPI()

# 1. CONFIGURACIÓN CORS (Vital para que Vite pueda hablar con Python)
# Permitimos que tu frontend en localhost:5173 envíe peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # El puerto por defecto de Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DEFINIR EL MODELO (Debe ser idéntico al del entrenamiento)
model = nn.Sequential(
    nn.Flatten(),
    nn.Linear(28*28, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)

# 3. CARGAR LOS PESOS
# map_location='cpu' evita errores si tu servidor no tiene GPU dedicada
model.load_state_dict(torch.load("mi_modelo_mnist.pth", map_location=torch.device('cpu')))
model.eval()

# Definir la transformación (igual que en entrenamiento)
transform = transforms.Compose([
    transforms.Resize((28, 28)),
    transforms.ToTensor()
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Leer la imagen subida
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert('L') # Convertir a escala de grises
    
    # Preprocesar
    img_tensor = transform(image).unsqueeze(0) # Añadir dimensión de batch
    
    # Predecir
    with torch.no_grad():
        output = model(img_tensor)
        prediction = torch.argmax(output, dim=1).item()
        
    return {"numero": prediction}

# Para correrlo usa: uvicorn main:app --reload