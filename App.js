const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Replace with your Gmail credentials
const EMAIL_ADDRESS = 'krishnathanki44@gmail.com';
const CLIENT_ID = "200778782199-qkj20pvq0s9kuveor4k9dv5smjpaohrj.apps.googleusercontent.com";
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = '1//0gm0XliBTT6wtCgYIARAAGBASNwF-L9Irj8423Ynl1v7Jr6KYtUWstX3TbHsHaGvV9YKZ6qvKauLX5TfA2kL2nMUN_0Ral9GlMQY';
    
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// Create a new OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set the access token
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Create a Gmail API client
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Get all unread messages
async function getUnreadMessages() {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
  });

  return res.data.messages || [];
}

// Check if a message has been replied to
async function hasBeenRepliedTo(messageId) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  const headers = res.data.payload.headers;

  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name === 'In-Reply-To') {
      return true;
    }
  }

  return false;
}

// Send an auto-reply to a message
async function sendAutoReply(messageId, fromEmail) {
  const mailOptions = {
    from: EMAIL_ADDRESS,
    to: fromEmail,
    subject: 'Auto-Reply',
    text: 'Thank you for your email!',
  };

  const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL_ADDRESS,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: oAuth2Client.getAccessToken(),
    },
  });

  await transport.sendMail(mailOptions);

  // Add a label to the message
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    resource: {
      addLabelIds: ['Label_1'],
    },
  });
}

// Handle the OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  res.redirect('/');
});

app.get('/',async (req,res)=>{
    // Get all unread messages
const messages = await getUnreadMessages();

for (const message of messages) {
// Check if the message has been replied to
if (!(await hasBeenRepliedTo(message.id))) {
// Get the sender email address
const res = await gmail.users.messages.get({
userId: 'me',
id: message.id,
format: 'full',
});
const headers = res.data.payload.headers;
let fromEmail;

for (let i = 0; i < headers.length; i++) {
  if (headers[i].name === 'From') {
    fromEmail = headers[i].value;
    break;
  }
}
// Send an auto-reply
await sendAutoReply(message.id, fromEmail);
}

res.send('Auto-replies sent!');
}
})

// Start the server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});