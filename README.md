# Sebastien Piette v1.0.0 - Applicant for the role of SA at Stripe APAC 
7 April 2022 : This is an improved version of the original Demo App from Stripe (https://github.com/mattmitchell6/sa-takehome-project-node) used as an assignment for the candidate to the role of SA at Stripe. 
The new improvement are including following added features : 
- Integration with Stripe UI Elements 
- Integration with Stripe Payments 
- Integration with Stripe Webhooks listeners 

For more informations, please refer to the Google Doc with all the details regarding the assignemnt : https://docs.google.com/document/d/1c0kRtgcGJufGLvgEmw5zgN9N0VI4U-rEDmve_gJY_eo/edit?usp=sharing 

Contact : sebastien.piette@gmail.com 


# Take home project
This is a simple e-commerce application that a customer can use to purchase a book, but it's missing the payments functionality —  your goal is to integrate Stripe to get this application running!

## Candidate instructions
You'll receive these in email.

## Application overview
This demo is written in Javascript (Node.js) with the [Express framework](https://expressjs.com/). You'll need to retrieve a set of testmode API keys from the Stripe dashboard (you can create a free test account [here](https://dashboard.stripe.com/register)) to run this locally.

We're using the [Bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction/) CSS framework. It's the most popular CSS framework in the world and is pretty easy to get started with — feel free to modify styles/layout if you like. 

To simplify this project, we're also not using any database here, either. Instead `app.js` includes a simple switch statement to read the GET params for `item`. 

To get started, clone the repository and run `npm install` to install dependencies:

```
git clone https://github.com/mattmitchell6/sa-takehome-project-node && cd sa-takehome-project-node
npm install
```

Rename `sample.env` to `.env` and populate with your Stripe account's test API keys

Then run the application locally:

```
npm start
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the index page.
