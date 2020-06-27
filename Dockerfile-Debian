FROM node:lts
LABEL name "sample-express-api"

# Change working directory
WORKDIR "/app"

# Update packages and install dependency packages for services
RUN apt-get update \
    && apt-get dist-upgrade -y \
    && apt-get clean \
    && echo 'Finished installing dependencies'

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm production packages 
RUN npm install --production

COPY . .

ENV NODE_ENV production
ENV PORT 8000

EXPOSE 8000

USER node

CMD [ "node",  "index.js" ]