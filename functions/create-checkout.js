/*
 * This function creates a Stripe Checkout session and returns the session ID
 * for use with Stripe.js (specifically the redirectToCheckout method).
 *  
 * @see https://stripe.com/docs/payments/checkout/one-time
 */

  /*
  * This env var is set by Netlify and inserts the live site URL. If you want
  * to use a different URL, you can hard-code it here or check out the
  * other environment variables Netlify exposes:
  * https://docs.netlify.com/configure-builds/environment-variables/
  */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  maxNetworkRetries: 2,
});

/*
 * Product data can be loaded from anywhere. In this case, we’re loading it from
 * a local JSON file, but this could also come from an async call to your
 * inventory management service, a database query, or some other API call.
 * 
 * The important thing is that the product info is loaded from somewhere trusted
 * so you know the pricing information is accurate.
 */
const inventory = require('./data/products.json');

exports.handler = async (event) => {
  const { sku, nights, dates, checkin, checkout, calendar } = JSON.parse(event.body);
  const product = inventory.find((p) => p.sku === sku);
  const validatedQuantity = 1;
  // change app fee % to 0.05 for transfers, 0.02 for direct
  const appFeePercent = 0.02;

  const roomTotal = (parseInt(product.amount) * parseInt(nights));
  const taxPercent = product.tax/100;
  const taxTotal = (roomTotal + product.clean_fee) * taxPercent;
  const appFeeTotal = (roomTotal + product.clean_fee) * appFeePercent;
  const totalRequestPrice = roomTotal + product.clean_fee + taxTotal + appFeeTotal;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    success_url: `${process.env.URL}/success.html`,
    cancel_url: process.env.URL,
    submit_type: 'book',
    line_items: [
      {
        name: product.name,
        description: dates,
        currency: 'usd',
        amount: totalRequestPrice,
        images: [product.image],
        quantity: validatedQuantity
      },
    ],
    payment_intent_data: {
      application_fee_amount: appFeeTotal,
      // comment out the below 3 lines for direct charge
      //on_behalf_of: process.env.STRIPE_ACCOUNT_ID,
      //transfer_data: {
      //  destination: process.env.STRIPE_ACCOUNT_ID,
      //}
    },
    
    // We are using the metadata to track which items were purchased.
    // We can access this meatadata in our webhook handler to then handle the fulfillment process.
    metadata: {
          sku: product.sku,
          name: product.name,
          room_total: roomTotal,
          tax_total: taxTotal,
          app_fee_total: appFeeTotal,
          unit_amount: totalRequestPrice,
          dates: dates,
          checkin: checkin,
          checkout: checkout,
          calendar: calendar
    }
  },
  // comment out below 3 lines for transfer charge 
  {
    stripeAccount: process.env.STRIPE_ACCOUNT_ID,
  }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeAccount: process.env.STRIPE_ACCOUNT_ID
    })
  }
}