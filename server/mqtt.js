var mosca = require("mosca");
const mongoose = require("mongoose");
var settings = {
  port: 1883
};

//here we start mosca
var connect = function runMqttServer() {
url = "mongodb://localhost:27017/patient_tracking";
mongoose.connect(
  url,
  (err, db) => {
    var server = new mosca.Server(settings);
    server.on("ready", setup);

    // fired when the mqtt server is ready
    function setup() {
      console.log("Mosca server is up and running");
      server.authenticate = authenticate;
      server.authorizePublish = authorizePublish;
      server.authorizeSubscribe = authorizeSubscribe;
    }

    // fired whena  client is connected
    server.on("clientConnected", function(client) {
      console.log("client connected", client.id);
    });

    // fired when a message is received
    server.on("published", function(packet, client) {
      if (packet.topic.split("/")[0] != "$SYS") {
        db.collection(packet.topic.split("/")[2]).insertOne(
          JSON.parse(packet.payload.toString("utf-8")),
          function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
          }
        );
        console.log(packet.payload.toString("utf-8"));
        console.log("Published : ", packet.payload.toString("utf-8"));
      }
    });

    // fired when a client subscribes to a topic
    server.on("subscribed", function(topic, client) {
      console.log("subscribed : ", topic);
    });

    // fired when a client subscribes to a topic
    server.on("unsubscribed", function(topic, client) {
      console.log("unsubscribed : ", topic);
    });
    // fired when a client is disconnecting
    server.on("clientDisconnecting", function(client) {
      console.log("clientDisconnecting : ", client.id);
    });

    // fired when a client is disconnected
    server.on("clientDisconnected", function(client) {
      console.log("clientDisconnected : ", client.id);
    });

    // Accepts the connection if the username and password are valid
    var authenticate = function(client, username, password, callback) {
      var authorized = username === "akash" && password.toString() === "akash";
      if (authorized) client.user = username;
      callback(null, authorized);
    };

    // In this case the client authorized as alice can publish to /users/alice taking
    // the username from the topic and verifing it is the same of the authorized user
    var authorizePublish = function(client, topic, payload, callback) {
      callback(null, client.user == topic.split("/")[1]);
    };

    // In this case the client authorized as alice can subscribe to /users/alice taking
    // the username from the topic and verifing it is the same of the authorized user
    var authorizeSubscribe = function(client, topic, callback) {
      callback(null, client.user == topic.split("/")[1]);
    };
  }
);
}

exports.connect = connect;