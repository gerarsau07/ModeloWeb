# Archivo: C:\modeloWeb\bk\train.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

# Configuración
BATCH_SIZE = 64
EPOCHS = 1  # 1 época es suficiente para probar rápido
MODEL_PATH = "mi_modelo_mnist.pth"

# Transformación
transform = transforms.Compose([transforms.ToTensor()])

# Datos (Se descargarán en bk/data)
print("📂 Descargando datos...")
train_dataset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
train_loader = DataLoader(dataset=train_dataset, batch_size=BATCH_SIZE, shuffle=True)

# Modelo
model = nn.Sequential(
    nn.Flatten(),
    nn.Linear(28*28, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)

# Entrenamiento
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

print("🚀 Entrenando...")
for epoch in range(EPOCHS):
    for images, labels in train_loader:
        optimizer.zero_grad()
        output = model(images)
        loss = criterion(output, labels)
        loss.backward()
        optimizer.step()

# Guardar
torch.save(model.state_dict(), MODEL_PATH)
print(f"✅ Modelo guardado en: {os.path.abspath(MODEL_PATH)}")