'use strict';

const { Kafka, logLevel } = require("kafkajs");
const dotenv = require('dotenv');
dotenv.config();

// client ID of who is producing the messages
const clientId = process.env.CLIENT_ID; 
const topicName = process.env.TOPIC_NAME; // topic to consume
const environment = process.env.NODE_ENV || "dev"; 
//const brokersList = process.env.BROKERS;
const brokers = process.env.BROKERS.split(",");
const sasl_mechanism = process.env.SASL_MECHANISM || "Plain";
const userName = process.env.USER_NAME;
const password = process.env.PASSWORD;
const fromBeginning = process.env.MESSAGES_FROM_BEGINING || true;

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
	await consumer.subscribe({ topics: [topicName], fromBeginning: fromBeginning })
	await consumer.run({
		
		eachMessage: ({ message }) => {
			
			console.log(`received message Key: ${message.key} value:  ${message.value}`);
		},
	})
}

module.exports = consume
