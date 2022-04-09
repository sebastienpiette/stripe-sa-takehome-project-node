/**
 * Clientside helper functions
 */
document.addEventListener("DOMContentLoaded", async () => {
  /**
   * collect amounts 
   * Improvement needed: get the amount from a back-end DB
   */
  const amounts = document.getElementsByClassName("amount");
  let amount;
    // iterate through all "amount" elements and convert from cents to dollars
    for (var i = 0; i < amounts.length; i++) {
      amount = amounts[i].getAttribute('data-amount') / 100;  
      amounts[i].innerHTML = amount.toFixed(2);
    }

    if(amount) {
      //fetch the Publishable Key to create a stripe Object
      const { publishableKey } = await fetch("/publishable-key").then(r => r.json());
      const stripe = Stripe(publishableKey);  
      
      // Create a payment intent, fetch the the paymentIntent_clientSecret
      const { clientSecret } = await fetch ("/create-payment-intent", {
        method:"POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: amount * 100 })
      }).then(r => r.json());    


      //Create the Stripe Payment Element UI (using the previously fetched paymentIntent_clientSecret) with an appearance Theme and mount it to the container
      const appearance = {
        theme: 'flat',
      };
      const elements = stripe.elements({ appearance, clientSecret });
      const paymentElement = elements.create("payment");  
      paymentElement.mount("#payment-element");


      //Handle the submit payment button when clicking
      const submitBtn = document.getElementById("make-payment");
      submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        //setLoading(true);
        const paymentConfirmation = await stripe.confirmPayment({
          elements: elements,
          confirmParams: {
            //The payment completion page
            return_url: "http://localhost:3000/success",
            //the email filled in the form -> this will generate an email from Stripe (not in test mode)
            receipt_email: document.getElementById("email").value,
          },
        });
 
        const error = paymentConfirmation.error;

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === "card_error" || error.type === "validation_error") {
          alert(error.message);
        } else {
          alert("An unexpected error occured.");
        }
        //setLoading(false);
      });

    }  
          


    //Success page URL example : http://localhost:3000/success?payment_intent=pi_3KkiEeFVXkePIrzR1uZbBzA6&payment_intent_client_secret=pi_3KkiEeFVXkePIrzR1uZbBzA6_secret_O9tI5XtVtjjSwp0v5NMooVEdj&redirect_status=succeeded 
    //Fetches the payment intent status after payment submission and display a success page
    const piclientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    const payment_intent_id = new URLSearchParams(window.location.search).get(
      "payment_intent"
    ); 

    try {
      const { publishableKey } = await fetch("/publishable-key").then(r => r.json());
      const stripe = Stripe(publishableKey);  
      const { paymentIntent } = await stripe.retrievePaymentIntent(piclientSecret);


      /**
       * https://stripe.com/docs/api/payment_intents/object 
       * Test payment intent id : pi_3KlSK3FVXkePIrzR2bEYSHZY
       * const paymentIntent = await stripe.paymentIntents.retrieve('pi_3Kjdk6FVXkePIrzR03bd6CQ5');
       * Test charge id : ch_3KlPcaFVXkePIrzR1YKWv1u5
       * const charge = await stripe.charges.retrieve('ch_3KlUhSFVXkePIrzR2auREJp1');
       */


       // OPTIONNAL FEATURE : retrive Charge.Receipt_URL from PaymentIntent.Id
       const url = await fetch("/pi-charge-receipt-url/"+payment_intent_id).then(r => r.json()); 
      //const obj = await fetch("/charge-receipt-url",{id:chargeId}).then(r => r.json()); ??????? A TESTER SYNTAX

      
      /**  
      JUST FOR TESTING with Strip eAPI using AUTH  https://stripe.com/docs/api/authentication build a GET FETCH hiwth auth and header as testing 
      https://stripe.com/docs/api/charges   --> /v1/charges/:id   ch_3Klqo9FVXkePIrzR1U9hhJzK  (base url : https://api.stripe.com) 
      https://kigiri.github.io/fetch/
      var test = await fetch("https://api.stripe.com/v1/charges/ch_3Klqo9FVXkePIrzR1U9hhJzK", {
        headers: {
          Authorization: "Bearer [API_KEY]"
        }
      }).then( r => r.json())
      alert(JSON.stringify(test))
      */


      //Extract the values and create a string to display on the Success page
      //https://stripe.com/docs/api/payment_intents/object#payment_intent_object-client_secret
      var PaymentDetails = "<br> Stripe payment intent ID : " + paymentIntent.id
      + "<br> Amount: " +  paymentIntent.amount / 100 
      + "<br> Currency : " + paymentIntent.currency
      + "<br> Payment Status : " + paymentIntent.status
      + "<br> A Receipt Email has been sent to  : " + paymentIntent.receipt_email
      + "<br> <br> <a href="+url+">Go to Charge Receipt_url </a>";


      
      switch (paymentIntent.status) {
        case "succeeded":
          showMessageStatus("Payment succeeded!", "#payment-status");
          showMessageStatus(PaymentDetails, "#payment-details");
          alert("Payment succeeded!");
          break;
        case "processing":
          showMessageStatus("Your payment is processing.", "#payment-status");
          showMessageStatus(PaymentDetails, "#payment-details");
          alert("Your payment is processing.");
          break;
        case "requires_payment_method":
          showMessageStatus("Your payment was not successful, please try again.", "#payment-status");
          showMessageStatus(PaymentDetails, "#payment-details");
          alert("Your payment was not successful, please try again.");
          break;
        default:
          showMessageStatus("Something went wrong.", "#payment-status");
          showMessageStatus(PaymentDetails, "#payment-details");
          alert("Something went wrong.");
          break;
      }

      //For testing : finally display the Payment Intent full  details 
      let pi_objectdetails = JSON.stringify(paymentIntent, undefined, 4)
      document.getElementById("objectDetails").innerHTML = "<br><b>The Payment Intent Object Full Details</b><br>"+pi_objectdetails;
    } catch(e) {
      console.log(e); 
    } 
})   


//function that shows a messaage in the DOM element "Payment Status" (success page's main section) 
function showMessageStatus(messageText, messagecontainerId) {
  const messageContainer = document.querySelector(messagecontainerId);
  messageContainer.classList.remove("hidden");
  messageContainer.innerHTML = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageText.textContent = "";
  }, 4000);
  }


  // // Fetches the payment intent status after payment submission
  // async function checkStatus() {
  //   const clientSecret = new URLSearchParams(window.location.search).get(
  //     "payment_intent_client_secret"
  //   );

  
  //   if (!clientSecret) {
  //     return;
  //   }
  
  //   try {
  //     const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
  //     alert(paymentIntent);
  //     alert(error);
  //   } catch(e) {console.log(e); } 
  // }
  

 
