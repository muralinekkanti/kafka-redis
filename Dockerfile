# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi8/nodejs-16:latest

# Copy package.json, and optionally package-lock.json if it exists
COPY package.json package-lock.json* ./

# Install app dependencies
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Copy the dependencies into a Slim Node docker image
FROM registry.access.redhat.com/ubi8/nodejs-16-minimal:latest

# Install app dependencies
COPY --from=0 /opt/app-root/src/node_modules /opt/app-root/src/node_modules
COPY . /opt/app-root/src

ENV NODE_ENV=development
ENV CA_CERT_File_PATH="keyno-redis-cert.ca"
# ENV REDIS_CONNECTION_STRING="xxxxx" supply through openshift or k8s deployment
# ENV CLIENT_ID= "Kafka-Redis-App-1"
# ENV TOPIC_NAME= "bank-a-topic-prod-1" 
# ENV BROKERS="broker-0-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093,broker-1-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093,broker-4-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093,broker-5-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093,broker-3-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093,broker-2-hjpjsc2m0mhkwb6c.kafka.svc04.us-south.eventstreams.cloud.ibm.com:9093"
ENV SASL_MECHANISM = "Plain"
# ENV USER_NAME="token"
# PASSWORD= "xxxxxx" supply through the openshift or k8s deployment
ENV MESSAGES_FROM_BEGINING = true

CMD ["npm", "start"]
