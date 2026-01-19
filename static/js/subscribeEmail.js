// Add Google Recaptcha v3
const RECAPTCHA_PUBLIC_KEY = "6LcCmv0fAAAAAJIKAhoF2JfeYJYMhKPfCa1J0UVV";
addScript(
  `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_PUBLIC_KEY}`,
);

// Blog subscribe form
const subscribeEmailEls = {
  button: undefined,
  input: undefined,
  validation: undefined,
};
onInit(() => {
  subscribeEmailEls.button = document.querySelector("#subscribe-email-button");
  subscribeEmailEls.input = document.querySelector("#subscribe-email-input");
  subscribeEmailEls.validation = document.querySelector(
    "#subscribe-email-validation",
  );
  subscribeEmailEls.button.addEventListener("click", subscribeEmail);
  subscribeEmailEls.input.addEventListener(
    "keyup",
    (e) => e.keyCode === 13 && subscribeEmail(),
  );
});

function subscribeEmail() {
  grecaptcha.ready(async () => {
    const recaptchaToken = await grecaptcha.execute(RECAPTCHA_PUBLIC_KEY, {
      action: "subscribeEmail",
    });
    const email = document.querySelector("#subscribe-email-input").value.trim();
    const isValid = isEmailValid(email);
    displayErrorMessage(isValid ? undefined : "Please enter a valid email");
    if (!isValid) {
      return;
    }
    updateButtonLoadingState("loading");
    try {
      gtag("event", "blog-subscription", {
        event_category: "engagement",
        event_label: "Email subscription",
      });
      const response = await fetch(
        "https://antonshubin.com/api/subscribe-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, recaptchaToken }),
        },
      );
      const json = await response.json();
      if (response.status === 200) {
        updateButtonLoadingState("success");
      } else {
        updateButtonLoadingState("error");
        displayErrorMessage(json.message);
        console.error(json);
      }
    } catch (error) {
      console.error(error);
      displayErrorMessage(error.message);
    }
  });
}

function isEmailValid(email) {
  const regex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return regex.test(email);
}

function displayErrorMessage(message = "") {
  if (!message) {
    subscribeEmailEls.validation.style.display = "none";
    return;
  }
  subscribeEmailEls.validation.innerText = message;
  subscribeEmailEls.validation.style.display = "block";
}

function updateButtonLoadingState(state) {
  switch (state) {
    case "loading": {
      subscribeEmailEls.button.classList.add("loading--running");
      break;
    }
    case "success": {
      subscribeEmailEls.button.classList.remove("loading--running");
      subscribeEmailEls.button.classList.add("loading--success");
      break;
    }
    case "error": {
      subscribeEmailEls.button.classList.remove("loading--running");
      subscribeEmailEls.button.classList.add("loading--error");
      break;
    }
    default: {
      console.error(
        `Function "updateButtonLoadingState(state)" was invoked with incorrect argument "${state}".`,
      );
    }
  }
}
