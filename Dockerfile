#FROM node:lts-alpine
FROM public.ecr.aws/docker/library/node:lts-alpine
LABEL name "sample-express-api"

# Change working directory
WORKDIR "/app"

# Update packages
RUN apk update

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