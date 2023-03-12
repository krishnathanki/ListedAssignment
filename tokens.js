const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const readline = require('readline');
const express = require('express')
const fs = require('fs')

const app = express();

const CLIENT_ID = "200778782199-qkj20pvq0s9kuveor4k9dv5smjpaohrj.apps.googleusercontent.com";
const CLIENT_SECRET = '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';

const oauth2Client = new OAuth2Client(
  CLIENT_ID, 
  CLIENT_SECRET,
  "http://localhost:3000/oauth2callback",
);

// Set up the initial authorization URL
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly']
});

// Print the authorization URL to the console
console.log(`Authorize this app by visiting this URL: ${authorizeUrl}`);

// After authorizing the app, copy the authorization code and paste it into the command line prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.get('/oauth2callback', async (req, res) => {
    console.log(res)
rl.question('Enter the authorization code from the URL: ', (code) => {
  // Exchange the authorization code for an access token and refresh token
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error getting token:', err);
      return;
    }

    // Store the tokens in the credentials.json file
    fs.writeFile('credentials.json', JSON.stringify(tokens), (err) => {
      if (err) {
        console.error('Error writing tokens to file:', err);
        return;
      }
      console.log('Tokens stored in file: credentials.json');
    });

    // Use the access token to make API requests
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({version: 'v1', auth: oauth2Client});

    gmail.users.messages.list({userId: 'me', q: 'is:unread'}, (err, res) => {
      if (err) {
        console.error('Error retrieving messages:', err);
        return;
      }
      console.log('Unread messages:', res.data.messages);
    });
  });
})

})

app.listen(3000);