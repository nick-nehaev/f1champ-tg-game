FROM node:18-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Устанавливаем зависимости
RUN npm install

# Копируем код
COPY backend ./backend
COPY shared ./shared

WORKDIR /app/backend

CMD ["npm", "run", "dev"]
