import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import torch.onnx
import onnx  # Importante: Usaremos esta librería para "empaquetar"
import os

# ---------------------------------------------------------
# 1. CONFIGURACIÓN
# ---------------------------------------------------------
TEMP_FILENAME = "temp_model.onnx"   # Archivo temporal
FINAL_FILENAME = "mnist_unico.onnx" # El archivo que usaremos
BATCH_SIZE = 64
EPOCHS = 3

# ---------------------------------------------------------
# 2. MODELO Y ENTRENAMIENTO
# ---------------------------------------------------------
class NeuralNet(nn.Module):
    def __init__(self):
        super(NeuralNet, self).__init__()
        self.flatten = nn.Flatten()
        self.linear1 = nn.Linear(28*28, 128)
        self.relu = nn.ReLU()
        self.linear2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.flatten(x)
        x = self.linear1(x)
        x = self.relu(x)
        x = self.linear2(x)
        return x

print("🚀 Iniciando entrenamiento...")
transform = transforms.ToTensor()
train_dataset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
train_loader = DataLoader(dataset=train_dataset, batch_size=BATCH_SIZE, shuffle=True)

model = NeuralNet()
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

model.train()
for epoch in range(EPOCHS):
    running_loss = 0.0
    for imgs, lbls in train_loader:
        optimizer.zero_grad()
        loss = criterion(model(imgs), lbls)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
    print(f"   📅 Época {epoch+1} completada.")

# ---------------------------------------------------------
# 3. EXPORTACIÓN INTELIGENTE (LA SOLUCIÓN)
# ---------------------------------------------------------
print("💾 Exportando modelo temporal...")
model.eval()
dummy_input = torch.randn(1, 1, 28, 28)

# Paso A: Exportar desde PyTorch (puede que genere .data separado)
torch.onnx.export(
    model,
    dummy_input,
    TEMP_FILENAME,
    export_params=True,
    opset_version=17,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
)

print("🔨 Fusionando archivos en uno solo...")

# Paso B: Usar la librería ONNX para cargar y RE-GUARDAR forzando un solo archivo
# Esto elimina cualquier archivo .data externo y mete los pesos dentro del .onnx
original_model = onnx.load(TEMP_FILENAME, load_external_data=True)

onnx.save_model(
    original_model, 
    FINAL_FILENAME, 
    save_as_external_data=False  # <--- ESTA ES LA CLAVE MÁGICA
)

# Paso C: Limpieza de basura
# Borramos el archivo temporal y el .data si se generó
if os.path.exists(TEMP_FILENAME):
    os.remove(TEMP_FILENAME)
if os.path.exists(TEMP_FILENAME + ".data"):
    os.remove(TEMP_FILENAME + ".data")

print("-" * 30)
print(f"🎉 ¡ÉXITO TOTAL!")
print(f"✅ Se ha generado UN SOLO archivo: {FINAL_FILENAME}")
print(f"📦 Tamaño: {os.path.getsize(FINAL_FILENAME) / 1024:.2f} KB")
print("-" * 30)
print(f"👉 Copia '{FINAL_FILENAME}' a tu carpeta 'fr/src/assets/'")