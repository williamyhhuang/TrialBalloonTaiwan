FROM node:10.15.3

WORKDIR /tbt
ADD package.json /tbt/
RUN npm i && npm cache clean --force
RUN npm i pm2 -g
RUN pm2 update
COPY . /tbt
EXPOSE 3000
CMD ["pm2-runtime", "process.yaml"]