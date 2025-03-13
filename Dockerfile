#FROM node:lts-alpine
FROM public.ecr.aws/docker/library/node:18.20-alpine
LABEL name="sample-express-api"

# Change working directory
WORKDIR "/app"

# Update packages
RUN apk update

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm production packages \
RUN npm install --production

# Install pm2
RUN npm install pm2 -g

COPY . .

ENV NODE_ENV="production"
ENV PORT=8000

EXPOSE 8000

USER node

# CMD ["pm2-runtime", "start", "ecosystem.config.js"]
CMD ["pm2", "start", "index.js", "--no-daemon", "--kill-timeout", "60000", "-i", "4", "--max-memory-restart", "4096M", "--node-args='--max-old-space-size=4096'"]