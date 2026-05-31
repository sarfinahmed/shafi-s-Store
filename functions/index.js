const functions = require('firebase-functions');
const axios = require('axios');

const BOT_TOKEN = '8677363890:AAFeLJhBx91a17DVfdcnj43r3iS_1PyCu5o';
const CHAT_ID = '6891891678';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

exports.notifyOnNewOrder = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Customize these fields based on your actual data structure
    const user = data.userEmail || data.userId || 'Unknown';
    const product = data.productTitle || data.productId || 'Unknown';
    const amount = data.price || 0;

    const message = `✅ New Order Received!\nUser: ${user}\nProduct: ${product}\nAmount: ${amount}`;

    try {
      await axios.post(TELEGRAM_API_URL, {
        chat_id: CHAT_ID,
        text: message
      });
      console.log('Order notification sent successfully.');
    } catch (error) {
      console.error('Error sending order notification:', error.response ? error.response.data : error.message);
    }
  });

exports.notifyOnNewDeposit = functions.firestore
  .document('deposits/{depositId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Customize these fields based on your actual data structure
    const user = data.userEmail || data.userId || 'Unknown';
    const amount = data.amount || 0;
    const transactionId = data.trxId || data.transactionId || 'Unknown';

    const message = `💰 New Deposit!\nUser: ${user}\nAmount: ${amount}\nTransaction ID: ${transactionId}`;

    try {
      await axios.post(TELEGRAM_API_URL, {
        chat_id: CHAT_ID,
        text: message
      });
      console.log('Deposit notification sent successfully.');
    } catch (error) {
      console.error('Error sending deposit notification:', error.response ? error.response.data : error.message);
    }
  });
