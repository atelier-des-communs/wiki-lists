FROM node:14.4.0-stretch
RUN mkdir /app
WORKDIR /app
COPY . /app
RUN npm install
RUN node ./bin/bundler/prod.js --json
CMD ["npm","run","server"]
