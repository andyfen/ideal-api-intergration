const loadingEl = document.getElementById("loading");

fetch("/api/orders")
  .then((res) => res.json())
  .then((order) => {
    const idealForm = document.getElementById("ideal-form");

    idealForm.addEventListener("submit", (e) => {
      e.preventDefault();

      loadingEl.classList.remove("hidden");

      // Confirm the order
      fetch(`/api/orders/${order.id}/confirm-payment-source`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_source: {
            ideal: {
              country_code: "NL", // iDeal payment method only available in the Netherlands
              name: `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`,
              bic: document.getElementById("bic").value,
            },
          },
        }),
      })
        .then((res) => res.json())
        .then(({ redirectUrl }) => {
          window.location.href = redirectUrl;
        })
        .catch(console.error);
    });
  })
  .catch(console.error);
