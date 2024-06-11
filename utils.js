global.window = {};
global.window.location = {};
global.window.navigator = {
    userAgent: 'test'
};
global.window.setTimeout = setTimeout;


const { WebexPlugin } = require('@webex/webex-core');
const Webex = require(`webex`);
const { webexbotInstance } = require('./webexBot.js');


const sendAdaptiveCardToRoom = async (webexbotInstance, adaptiveCard) => {
  try {
    const response = await webexbotInstance.messages.create({
      roomId: "Y2lzY29zcGFyazovL3VzL1JPT00vMWY2NDhjMDAtMTEyNS0xMWVmLWJhNTMtMWZkNDFkYjgyODcy",
      text: 'Membership Details',  // Fallback text for clients that do not support Adaptive Cards
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: adaptiveCard
        }
      ]
    });
    console.log('Message sent:', response);
  } catch (error) {
    console.error('Error sending message to room:', error);
  }
};

const listMemberships = async (wbxuserInstance, spaceId) => {
  try {
    const memberships = await wbxuserInstance.memberships.listWithReadStatus({ roomId: spaceId });
    
    if (!memberships || !memberships.items) {
      console.error('No memberships found or incorrect response format:', memberships);
      return;
    }
    
    const detailedMemberships = await Promise.all(memberships.items.map(async (membership) => {
      const detailedMembership = await wbxuserInstance.memberships.get(membership.id);
      return {
        ...detailedMembership,
        lastSeenId: membership.lastSeenId || 'undefined', // Enrich with lastSeenId if available
        lastSeenDate: membership.lastSeenDate || 'undefined'
      };
    }));
    
    detailedMemberships.forEach((membership) => {
      console.log('Membership details:', {
        personDisplayName: membership.personDisplayName,
        personEmail: membership.personEmail,
        lastSeenDate: membership.lastSeenDate,
        created: membership.created // Log the creation date
      });
    });
    

    const adaptiveCard = {
      type: 'AdaptiveCard',
      body: [
        {
          type: 'TextBlock',
          text: 'Membership Details',
          weight: 'Bolder',
          size: 'Medium'
        },
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'stretch', // Allow the column to stretch to fit wider content
              items: [
                {
                  type: 'TextBlock',
                  text: 'Created',
                  weight: 'Bolder'
                },
                ...detailedMemberships.map(membership => ({
                  type: 'TextBlock',
                  text: membership.created || 'undefined',
                  wrap: false // Prevent text wrapping to keep values in a single line
                }))
              ]
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Last Seen Date',
                  weight: 'Bolder'
                },
                ...detailedMemberships.map(membership => ({
                  type: 'TextBlock',
                  text: membership.lastSeenDate || 'undefined',
                  wrap: false
                }))
              ]
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Display Name',
                  weight: 'Bolder'
                },
                ...detailedMemberships.map(membership => ({
                  type: 'TextBlock',
                  text: membership.personDisplayName,
                  wrap: false
                }))
              ]
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Email',
                  weight: 'Bolder'
                },
                ...detailedMemberships.map(membership => ({
                  type: 'TextBlock',
                  text: membership.personEmail,
                  wrap: false
                }))
              ]
            }
          ]
        }
      ],
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.2',
      // Set explicit width to allow the card to expand
      width: '100%' // or specify a specific width in pixels or other units
    };
    
        // Send the Adaptive Card to the Webex room
  await sendAdaptiveCardToRoom(webexbotInstance, adaptiveCard);
    
  } catch (error) {
    console.error('Error retrieving memberships:', error);
  }
};



const adaptiveCard = {
    "type": "AdaptiveCard",
    "body": [
      {
        "type": "TextBlock",
        "text": "Please enter your access token:"
      },
      {
        "type": "Input.Text",
        "id": "accessToken",
        "placeholder": "Access Token"
      }
    ],
    "actions": [
      {
        "type": "Action.Submit",
        "title": "Submit"
      }
    ],
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.3"
  }

  //  >>>>>

// Define the createCredentials function
function createCredentials(accessToken) {
    const wbxuserInstance = Webex.init({
      credentials: {
        access_token: accessToken
      }
    });
  
    return wbxuserInstance;
  }

// Function to set up event listeners
function setupListeners(wbxuserInstance) {
    if (!wbxuserInstance) {
      console.error('wbxuserInstance is not defined.');
      return;
    }
  
    wbxuserInstance.messages.listen()
    .then(() => {
        console.log('Listening to message events for user');
        
        wbxuserInstance.messages.on('created', (event) => {
            console.log('Messages created');
            console.log(`Got a message:created event:\n${JSON.stringify(event, null, 2)}`);
        });
    })
    .catch((error) => {
        console.error('Error listening to message events:', error);
    });



    // Listen for attachment actions
    wbxuserInstance.attachmentActions.listen()
      .then(() => {
        console.log('Listening to attachmentActions events for user');
        wbxuserInstance.attachmentActions.on('created', (event) => {
          console.log(`Got an attachmentActions:created event for user:\n${JSON.stringify(event, null, 2)}`);
        });
      })
      .catch((e) => console.error(`Unable to register for attachmentActions events for user: ${e}`));
  

  wbxuserInstance.memberships.listen()
  .then(() => {
    console.log('Listening to membership events for user');

    wbxuserInstance.memberships.on('created', (event) => {
      console.log("Messages created")
              console.log(`Got a membership:created event for user:\n${JSON.stringify(event, null, 2)}`);
            });

    wbxuserInstance.memberships.on('seen', async (event) => {
      console.log(`Got a membership:seen event for user:\n${JSON.stringify(event, null, 2)}`);

      // Fetch and log the details of all members in the space
      const spaceId = event.data.roomId;
      // const spaceId = "Y2lzY29zcGFyazovL3VzL1JPT00vMWY2NDhjMDAtMTEyNS0xMWVmLWJhNTMtMWZkNDFkYjgyODcy";
      await listMemberships(wbxuserInstance, spaceId); //@@@ webexbotInstance >> wbxuserInstance
    });
  })
  .catch((error) => {
    console.error('Error listening to membership events for user:', error);
  });

}

  
  // Cleanup function to stop listening on the new instance
  function cleanup() {
    if (global.wbxuserInstance) {
      global.wbxuserInstance.attachmentActions.stopListening();
      global.wbxuserInstance.attachmentActions.off('created');
      console.log('Stopped listening to attachmentActions events for user');
  
      global.wbxuserInstance.messages.stopListening();
      global.wbxuserInstance.messages.off('created');
      global.wbxuserInstance.messages.off('deleted');
      console.log('Stopped listening to messages events for user');
    }
  }
  
  // Set up SIGINT handler for cleanup
  process.on('SIGINT', () => {
    cleanup();
    process.exit();
  });
  
  module.exports = { adaptiveCard, createCredentials, setupListeners };