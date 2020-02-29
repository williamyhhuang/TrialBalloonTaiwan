FROM node:10.15.3

WORKDIR /webcraw
ADD package.json /webcraw/
RUN npm i && npm cache clean --force
RUN npm i pm2 -g
RUN pm2 update
COPY . /webcraw
ENV GOOGLE_APPLICATION_CREDENTIALS="./google_nlp/google.json"
EXPOSE 5000
CMD ["pm2-runtime", "process.yaml"]

# FROM node:10.15.3

# WORKDIR /web
# ADD package.json /web/
# RUN npm install
# COPY . /web
# EXPOSE 5000
# CMD node app.js