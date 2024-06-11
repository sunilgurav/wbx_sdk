global.window = {};
global.window.location = {};
global.window.navigator = {
    userAgent: 'test'
};
global.window.setTimeout = setTimeout;

require('dotenv').config();

const { adaptiveCard, createCredentials, setupListeners } = require('./utils.js');

const { webexbotInstance } = require('./webexBot.js');

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const Webex = require(`webex`);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
// Initialize Socket.IO
const io = socketIO(server);

global.wbxuserInstance = null;


webexbotInstance.messages.listen()
.then(() => {
console.log('listening to message events for Bot');

webexbotInstance.messages.on('created', (event) => {
    console.log(`Got a message:created event:\n${JSON.stringify(event, null, 2)}`);

    const messageText = event.data.text;
    if (messageText.includes("init")) {
    console.log("Message contains 'init'");

    let roomId = event.data.roomId

    const messagePayload = {
        "roomId": roomId,
        "markdown": "Please enter your access token", 
        "attachments": [
        {
            "contentType": "application/vnd.microsoft.card.adaptive",
            "content": adaptiveCard
        }
        ]
    };
// Get access token from the user.
webexbotInstance.messages.create(messagePayload)
    .then((message) => {
    console.log('Message sent successfully:', message);
    })
    .catch((error) => {
    console.error('Error sending message:', error);
    });
}

});

    webexbotInstance.messages.on('deleted', (event) => console.log(`Got a message:deleted event:\n${JSON.stringify(event, null, 2)}`));
  })
  .catch((e) => console.error(`Unable to register for message events: ${e}`));


// Listen for attachment action events
webexbotInstance.attachmentActions.listen()
.then(() => {
  console.log('Listening to attachmentActions events for Bot');
  webexbotInstance.attachmentActions.on('created', (event) => {
    console.log(`Got an attachmentActions:created event:\n${JSON.stringify(event, null, 2)}`);
    const roomid = event.data.roomId;
    const acc_tok = event.data.inputs.accessToken;
    //  Initiate a UserWebexInstance and make the Bot wait until "init" command issued. 
    global.wbxuserInstance = createCredentials(acc_tok);
    setupListeners(global.wbxuserInstance);
    
  });
})
.catch((e) => {
  console.error(`Unable to register for attachmentAction events: ${e}`);
});

// Export the initialized instance
module.exports = { webexbotInstance };

console.log('Setting up SIGINT handler');
      
process.on('SIGINT', async () => {
  try {
    console.log('SIGINT received, starting cleanup');

    if (webexbotInstance.attachmentActions) {
      console.log('Stopping attachmentActions listening');
      await webexbotInstance.attachmentActions.stopListening();
      webexbotInstance.attachmentActions.off('created');
      console.log('Stopped listening to attachmentActions events');
    } else {
      console.warn('attachmentActions not defined');
    }

    if (webexbotInstance.messages) {
      console.log('Stopping messages listening');
      await webexbotInstance.messages.stopListening();
      webexbotInstance.messages.off('created');
      webexbotInstance.messages.off('deleted');
    } else {
      console.warn('messages not defined');
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    console.log('Exiting process');
    process.exit();
  }
});


module.exports = { wbxuserInstance: global.wbxuserInstance };

    // Express route for handling WebSocket messages
app.get('/messages', (req, res) => {
    // Logic for handling WebSocket messages in your Express app
    res.send('WebSocket messages route');
  });
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });


 