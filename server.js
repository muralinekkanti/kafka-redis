'use strict';
//const express = require("express");
const redis = require("redis");
const fs = require('fs');
const dotenv = require('dotenv');
const { Kafka, logLevel } = require("kafkajs");
const { split } = require("split");
dotenv.config();


const redis_connection_string = process.env.REDIS_CONNECTION_STRING; 
//console.log("connection string:"+redis_connection_string);
const ca_cert_file = process.env.CA_CERT_File_PATH; // "file full path"
const environment = process.env.NODE_ENV || "dev"; 

// client ID of who is producing the messages
const clientId = process.env.CLIENT_ID; 
//console.log("client id:"+clientId);
const topicName = process.env.TOPIC_NAME; // topic to consume
 
//console.log("Topic name:"+topicName);
//const brokersList = process.env.BROKERS;

const brokers = process.env.BROKERS.split(",");
console.log("The Kafka broker collection:"+brokers);
const sasl_mechanism = process.env.SASL_MECHANISM || "Plain";
const userName = process.env.USER_NAME;
const password = process.env.PASSWORD;
const fromBeginning = process.env.MESSAGES_FROM_BEGINING || true;

let redisClient;
const connectionString = redis_connection_string;;
const caCert = fs.readFileSync(ca_cert_file) ;

(async () => {    
    redisClient=redis.createClient({
      url: connectionString,   
      socket: {
        tls: true,
        ca: caCert
      }
     }); 

  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  redisClient.on('reconnecting', msg => console.log('Redis reconnecting...', msg));
  redisClient.on('close', () => console.log('Redis closed...'));
  redisClient.on('connect', () => console.log('Redis connected...'));

  await redisClient.connect();
})();


const kafka = new Kafka({	
	logLevel: logLevel.ERROR, 
	clientId: clientId,
    brokers: brokers,
    ssl: true,
	sasl: {
      mechanism: sasl_mechanism, 
	  username: userName,
	  password: password
	},
})

const consumer = kafka.consumer({
	groupId: clientId, //GroupID will be used to not to pass the same message even this code run simultaneously 
	minBytes: 5,
	maxBytes: 1e6,
	maxWaitTimeInMs: 3000, //waiting for 3 seconds
})

const consume = async () => {
	await consumer.connect()
    console.log("The topic kafka client listening to : "+topicName);
	await consumer.subscribe({ topics: [topicName], fromBeginning: fromBeginning })
	await consumer.run({
		
		eachMessage: ({ message }) => {
			
            redisClient.hSet(message.key, message.value);
			console.log(`received message Key: ${message.key} value:  ${message.value}`);
		},
	})
}
console.log("Starting...");
consume().catch((err) => {
	console.error("error in consumer: ", err)
})
console.log("Started...");