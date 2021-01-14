const express = require("express");
const { resolve } = require("path");
const axios = require("axios");

const { getAccessToken } = require("./oauth");
const { PAYPAL_API_URL, MERCHANT_URL } = require("./config");

const app = express();

const port = 8080

app.use(express.static(resolve(__dirname, "../client")));
app.use(express.json());

/**
 * Page route handlers.
 */
app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../client/index.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(resolve(__dirname, "../client/success.html"));
});

app.get("/cancel", (req, res) => {
  res.sendFile(resolve(__dirname, "../client/cancel.html"));
});

/**
 * API handlers.
 */
app.get("/api/orders", async (req, res) => {
  const { access_token } = await getAccessToken();

  /**
   * Example order,
   * these details would usually get pulled from the users cart session
   */
  const order = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: "1.00",
        },
      },
    ],
    application_context: {
      return_url: `${MERCHANT_URL}/success.html`,
      cancel_url: `${MERCHANT_URL}/cancel.html`,
    },
  };

  /**
   * For more details on /v2/checkout/orders,
   * see https://developer.paypal.com/docs/api/orders/v2/#orders_create
   */
  const { data } = await axios({
    url: `${PAYPAL_API_URL}/v2/checkout/orders`,
    method: "post",
    headers: {
      'Content-Type': 'application/json',
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    data: order,
  });

  res.json(data);
});

app.post("/api/orders/:orderId/confirm-payment-source", async (req, res) => {
  const { orderId } = req.params;
  const { access_token } = await getAccessToken();

  /**
   * For more details on /v2/checkout/orders/<orderId>/confirm-payment-source,
   * TODO: link
   */
  const { data } = await axios({
    url: `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/confirm-payment-source`,
    method: "post",
    headers: {
      'Content-Type': 'application/json',
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    data: req.body,
  });

  const redirectUrl = data.links.find((link) => link.rel === "payer-action")
    .href;

  res.json({
    redirectUrl,
  });
});

/**
 * Webhook handlers.
 */
app.post("/webhook", async (req, res) => {
  const { access_token } = await getAccessToken();

  const { id, event_type, resource } = req.body;
  const orderId = resource.id;

  /* verify the webhook signature */

  /* ** skip ** validation while endpoint gets looked at
  {
    "name": "VALIDATION_ERROR",
    "message": "Invalid request - see details",
    "debug_id": "924631cb4acbe",
    "details": [{
        "field": "webhookId",
        "value": "WH-64G99887NT8468436-37R34875Y77436504",
        "location": "body",
        "issue": "must match \"^[a-zA-Z0-9]+$\""
    }],
    "links": []
  }
  */

  /*
  try {
    const { data } = await axios({
      url: `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      method: "post",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_time: req.headers["paypal-transmission-time"],
        cert_url: req.headers["paypal-cert-url"],
        auth_algo: req.headers["paypal-auth-algo"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        webhook_id: id,
        webhook_event: req.body,
      },
    });

    const { verification_status } = data;

    if (verification_status !== "SUCCESS") {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`);
    return res.sendStatus(400);
  }
  */

  /* capture the order if approved */
  if (event_type === "CHECKOUT.ORDER.APPROVED") {
    try {
      const { data } =  await axios({
        url: `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
        method: "post",
        headers: {
          'Content-Type': 'application/json',
          Accept: "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      });

      console.log("💰 Payment captured! orderId: %s", data.id);
    } catch (err) {
      console.log("❌ Payment failed.");
      console.error(err);
      return res.sendStatus(400);
    }
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
