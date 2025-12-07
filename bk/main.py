# Archivo: C:\modeloWeb\bk\main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image, ImageOps
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELO ---
model = nn.Sequential(
    nn.Flatten(),
    nn.Linear(28*28, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)

if os.path.exists("mi_modelo_mnist.pth"):
    model.load_state_dict(torch.load("mi_modelo_mnist.pth", map_location='cpu'))
    model.eval()
else:
    print("⚠️ EJECUTA train.py PRIMERO")

# --- TRANSFORMACIÓN FINAL ---
transform = transforms.Compose([
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Leer imagen
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert('L') # Escala de grises
    
    # 2. INTELIGENCIA DE PRE-PROCESAMIENTO (CRÍTICO PARA WEBCAM)
    # MNIST es fondo negro y letra blanca. Las webcams son al revés.
    # Invertimos los colores:
    image = ImageOps.invert(image)
    
    # 3. Aumentar contraste (Limpiar "ruido" de la cámara)
    # Todo lo que no sea muy blanco, lo volvemos negro puro
    image = image.point(lambda x: 0 if x < 128 else 255)

    # 4. Predicción normal
    img_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        output = model(img_tensor)
        prediction = torch.argmax(output, dim=1).item()
        
    return {"numero": prediction}