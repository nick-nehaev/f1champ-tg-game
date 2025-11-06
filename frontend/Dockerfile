FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Устанавливаем зависимости
RUN npm install

# Копируем код
COPY frontend ./frontend
COPY shared ./shared

WORKDIR /app/frontend

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
