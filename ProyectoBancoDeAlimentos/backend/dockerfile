FROM node:20-alpine
WORKDIR /app


ENV DEV_MODE=true
EXPOSE 3001

COPY . ./
RUN npm install

CMD ["npm", "run", "dev"]