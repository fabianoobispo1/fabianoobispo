FROM node:20-slim
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY vps-terminal-server.js .
EXPOSE 3002
CMD ["node", "vps-terminal-server.js"]
