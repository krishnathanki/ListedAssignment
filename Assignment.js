const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();

const port = 3000;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.labels', 'https://www.googleapis.com/auth/gmail.compose'];

const oAuth2Client = new google.auth.OAuth2(
   '200778782199-qkj20pvq0s9kuveor4k9dv5smjpaohrj.apps.googleusercontent.com',
   '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',
   'http://localhost:3000/oauth2callback'
);

const accessToken = oAuth2Client.getAccessToken();


const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'krishnathanki44@gmail.com',
    clientId: "200778782199-qkj20pvq0s9kuveor4k9dv5smjpaohrj.apps.googleusercontent.com",
    clientSecret: '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',
    refreshToken: '1//0gm0XliBTT6wtCgYIARAAGBASNwF-L9Irj8423Ynl1v7Jr6KYtUWstX3TbHsHaGvV9YKZ6qvKauLX5TfA2kL2nMUN_0Ral9GlMQY',
    accessToken: 'ya29.a0AVvZVsphdkfL5XETQftoknxPC98RLQwzgsxMud3cXRCQ6wN1bxOt8TzC22Et8gweFePotxSmDOhNCSQTGs_cteAnymEiF1orEz9vBiekMCgIqGvmentLqwZVwtgCleTE-1iQE6cjUXRkiSLvQ4N_CfXSkYm9aCgYKAX0SAQ4SFQGbdwaIAonkTgh8NofpkZAilTvMzQ0163'
  }
});

app.get('/', async (req, res) => {
  try {
    const result = await gmail.users.messages.list({ userId: 'me', q: 'is:unread' });
    const messages = result.data.messages;

    for (let message of messages) {
      const messageInfo = await gmail.users.messages.get({ userId: 'me', id: message.id });
      const payload = messageInfo.data.payload;
      const headers = payload.headers;

      let found = false;

      for (let header of headers) {
        if (header.name === 'From' && !header.value.includes('*@*.com')) {
          found = true;
        }
        if (header.name === 'Subject' && header.value.startsWith('RE: ')) {
          found = false;
        }
      }

      if (found) {
        const mailOptions = {
          from: 'krishnathanki44@gmail.com',
          to: headers.find((header) => header.name === 'From').value,
          subject: 'Auto-reply',
          text: 'Thank you for your email. I am currently out of the office and will reply as soon as possible.'
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });

        const messageLabels = { addLabelIds: ['ASSIGNMENT'], removeLabelIds: ['INBOX'] };
        await gmail.users.messages.modify({ userId: 'me', id: message.id, resource: messageLabels });
      }
    }

    res.send('Auto-reply sent successfully!');
  } catch (error) {
    console.log(error);
    res.send('An error occurred while sending the auto-reply');
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});