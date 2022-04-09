const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();
var app = express();

//get the api keys from .env file 
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY;
const stripe = require('stripe')(stripeSecretKey);

//body parsers
var bodyParser = require('body-parser') //to help parse the body : npm install body-parser --save
app.use(bodyParser.urlencoded({ extended: false }));

//Specific condition for /webhook endpoint which needs req.rawBody parser. 
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));


/**
 * Home route
 */
app.get('/', function(req, res) {
  console.log("fetch / -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  res.render('index');
});


/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  console.log("fetch /checkout -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  // Just hardcoding amounts here to avoid using a database
  //console.log("fetch /checkout -> req.body : ", JSON.stringify(req.body));
  const item = req.query.item;  
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }
  res.render('checkout', {
    title: title,
    amount: amount,
    error: error,
  });
});


/**
 * Route Endpoint to fetch the Stripe Publishable key route
 */
app.get("/publishable-key", (req, res) => {
  console.log("fetch /publishable-key -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  res.json({publishableKey: stripePublicKey});
})


/**
 * Route Endpoint to create Stripe Payment Intents
 * this endpoint needs a body parser see : https://stackoverflow.com/questions/9177049/express-js-req-body-undefined   
 */
app.post("/create-payment-intent", async (req, res) => {

/**
 * parse application/x-www-form-urlencoded
 * app.use(bodyParser.urlencoded({ extended: false }))
 * parse application/json
 * app.use(bodyParser.json())
 */
 console.log("fetch /create-payment-intent -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
 try{
  // Create a PaymentIntent with the order amount and currency SGD
  const paymentIntent = await stripe.paymentIntents.create({
    amount : req.body.amount,  
    currency:"sgd", //singapore (will enable payments methods compatible with SGD)
    automatic_payment_methods: {
      enabled: true,
    },
    // payment_method_types: ['card'],  //optionnal
  })
  //Respond with the paymentIntent_clientSecret
  res.json({ clientSecret: paymentIntent.client_secret});  
  } catch (error) {console.log(error)}
 });


/**
 * Success route
 * http://localhost:3000/success?payment_intent=pi_3KlSK3FVXkePIrzR2bEYSHZY&payment_intent_client_secret=pi_3KlSK3FVXkePIrzR2bEYSHZY_secret_Po0yqhnuQHsmZEtDahx0fxGey&redirect_status=succeeded
 */
app.get('/success', async function(req, res) {
  console.log("fetch /success -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  //all Success details will be collected directly from the client to Stripe back end and rendered through client -side custom.js script
  //to collectg charge details (like recepti url --> need to create a servier side endpoint and call the stripe api)
  res.render('success', {
  });
})


 /**
 * WEBHOOK listener endpoint
 * https://stripe.com/docs/webhooks/quickstart
 * Common error : Webhook Error: No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe? https://github.com/stripe/stripe-node#webhook-signing
 * We need to use req.rawBody
 * https://stackoverflow.com/questions/53899365/stripe-error-no-signatures-found-matching-the-expected-signature-for-payload
 * https://github.com/stripe/stripe-node/issues/356
 * https://errorsfixing.com/fixed-stripe-webhook-error-no-signatures-found-matching-the-expected-signature-for-payload/
 * https://flaviocopes.com/express-get-raw-body/ 
 *  */
app.post('/webhook', async (request, response) => {
  try {
 
    let event;
    //get the Stripe Webhook Secret https://dashboard.stripe.com/test/webhooks 
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // using https://48a2-218-212-160-157.ngrok.io/webhook
    const sig = request.headers['stripe-signature']; //signature
    event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret); 

    // Handle the incoming event
    switch (event.type) {
      case 'payment_intent.payment_failed':{
        const paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.payment_failed
        console.log("WEBHOOK received on Server-side -> " + JSON.stringify(event.type))
        response.send();
        }
    break;
      case 'payment_intent.processing':{
        const paymentIntent = event.data.object;
        console.log("WEBHOOK received on Server-side -> "+ JSON.stringify(event.type))
        response.send();
        }
    break;
      case 'payment_intent.succeeded':{
        const paymentIntent = event.data.object;
        console.log("WEBHOOK received on Server-side -> "+ JSON.stringify(event.type))
        response.send();
        }
    break;
      case 'payment_intent.created':{
        const paymentIntent = event.data.object;
        console.log("WEBHOOK received on Server-side -> "+ JSON.stringify(event.type))
        response.send();
        }
    break;
    case 'charge.succeeded':{
      const chargeEvent = event.data.object; 
      //console.log("WEBHOOK successful Charge Server-Side -> : " + JSON.stringify(chargeEvent));
      const charge = await stripe.charges.retrieve(chargeEvent.id);
      console.log("WEBHOOK received on Server-Side -> " + JSON.stringify(event.type) + " Charge -> "+ charge.id)
      response.json({charge_id : chargeEvent.id});
      response.send();
    }
    default:
      console.log(`WEBHOOK Unhandled event type -> ${event.type}`);
  }
  } catch (err) {
    response.status(400).send(`WEBHOOK Error: ${err.message}`);
    return;
  }
  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


/**
* Retrieve a the last charge.receipt_url  based on the  Payment Intent id 
*ex : http://localhost:3000/pi-charge-receipt-url/pi_3KlSK3FVXkePIrzR2bEYSHZY  
*/
app.get('/pi-charge-receipt-url/:id', async function (req, res) {  
  console.log("fetch /pi-charge-receipt-url/:id -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  const pi = await stripe.paymentIntents.retrieve(req.params.id);
  const url = pi.charges.data[0].receipt_url;
  res.send(JSON.stringify(url));  //returns : "https://pay.stripe.com/receipts/acct_1HRKRQFVXkePIrzR/ch_3KlPcaFVXkePIrzR1YKWv1u5/rcpt_LSKI8blicDrvZzRDssUK7GTt8QIYSmE"
})


/**
 * Retrieve a charge.receipt_url  based on the charge id 
 * ex : http://localhost:3000/charge-receipt-url?id=ch_3KlPcaFVXkePIrzR1YKWv1u5
 */
app.get('/charge-receipt-url', async function (req, res) {  
  console.log("fetch /charge-receipt-url/:id -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  const charge = await stripe.charges.retrieve(req.query.id);
  res.send(JSON.stringify(charge.receipt_url));  //returns : "https://pay.stripe.com/receipts/acct_1HRKRQFVXkePIrzR/ch_3KlPcaFVXkePIrzR1YKWv1u5/rcpt_LSKI8blicDrvZzRDssUK7GTt8QIYSmE"
})


/**
 * Retrieve a charge based on the charge id 
 * ex : http://localhost:3000/charge?id=ch_3KlPcaFVXkePIrzR1YKWv1u5
 */
 app.get('/charge', async function (req, res) {  
  console.log("fetch /charge -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  const charge = await stripe.charges.retrieve(req.query.id);
  res.send(JSON.stringify(charge.id));  //returns : "ch_3KlPcaFVXkePIrzR1YKWv1u5"
})


/**
 * Retrieve a payment intent object based on the pi id
 * ex : http://localhost:3000/payment-intent?id=pi_3Kjdk6FVXkePIrzR03bd6CQ5
 */
 app.get('/payment-intent', async function (req, res) {  
  console.log("fetch /payment-intent -> req.body : ", JSON.stringify(req.body) + " ->req.params : " + JSON.stringify(req.params) + " ->req.query :" + JSON.stringify(req.params));
  const pi = await stripe.paymentIntents.retrieve(req.query.id);
  res.send(JSON.stringify(pi));   
})


/**
 * Start server
 */
const port = process.env.port || 3000;
app.listen(port, () => {
  console.log("Welcome to Sebastien Piette's Stripe SA Take Home Project. For any questions, please send an email to sebastien.piette@gmail.com");
  console.log("Make sure to visit the Google Doc : https://docs.google.com/document/d/1c0kRtgcGJufGLvgEmw5zgN9N0VI4U-rEDmve_gJY_eo/edit#heading=h.wrtjpb9n6apn for more details \r"); 
  console.log("Getting served on port :"+port+"....");
});
