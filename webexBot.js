global.window = {};
global.window.location = {};
global.window.navigator = {
    userAgent: 'test'
};
global.window.setTimeout = setTimeout;

require('dotenv').config();

// webexBot.js
const Webex = require('webex');


// Check if the WEBEX_ACCESS_TOKEN environment variable is set
if (!process.env.WEBEX_ACCESS_TOKEN) {
  console.error('Error: WEBEX_ACCESS_TOKEN environment variable is not set.');
  process.exit(1); // Exit the process with an error code
}

// Log the value of WEBEX_ACCESS_TOKEN
console.log('WEBEX_ACCESS_TOKEN:', process.env.WEBEX_ACCESS_TOKEN);


// Initialize the Webex instance with your access token
const webexbotInstance = Webex.init({
  credentials: {
    access_token: process.env.WEBEX_ACCESS_TOKEN
  }
});

// Error handling for Webex SDK initialization
webexbotInstance.on('error', (err) => {
  console.error('Error initializing Webex SDK:', err);
});



// Export the initialized instance
module.exports = { webexbotInstance };