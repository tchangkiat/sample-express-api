FROM node:18.17.1-alpine3.18

# Install necessary system libraries using apt-get
RUN apk update && apk add --no-cache \
    python3 \
    g++ \
    make \
    pkgconf \
    cairo-dev \
    pango-dev \
    pixman-dev \
    libpng-dev \
    curl \
    shadow

# Remove /etc/timezone, create /app directory, and install pm2 globally
RUN rm -rf /etc/timezone && \
    mkdir /app && \
    npm install pm2 -g && \
    mkdir -p /app/Server

COPY . /app/

RUN useradd -m app && \
    chown -R app:app /app && \
    chmod -R 760 /app
    
RUN apk del curl \
    shadow
    
USER app

### Install modules for PM2
RUN pm2 install pm2-prom-module

WORKDIR "/app"

RUN npm install

CMD ["pm2", "start", "index.js", "--no-daemon", "--kill-timeout", "60000", "-i", "4", "--max-memory-restart", "4096M", "--node-args='--max-old-space-size=4096'"]