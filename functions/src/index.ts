import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import Axios from 'axios';

const sendGridApiKey = functions.config().sendgrid.apikey;
const recaptchaApiKey = functions.config().recaptcha.apikey;

interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
}

interface SendGridError {
  type: 'sendgrid';
  body: Object;
  status: number;
}

export const subscribeEmail = functions.https.onRequest(async (request: Request, response: Response): Promise<void> => {
  const timeStart = Date.now();
  logInfo({ requestBody: request.body });

  const validationError = await validateRequestForSubscription(request.body);
  if (validationError) {
    response.status(400).json(validationError);
    return;
  }

  await saveEmailToDatabase(request.body.email);
  response.json({ timeMs: Date.now() - timeStart });
});

async function saveEmailToDatabase(email: string): Promise<void | SendGridError> {
  const response = await Axios.put(
    'https://api.sendgrid.com/v3/marketing/contacts',
    { contacts: [{ email }] },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sendGridApiKey}`,
      },
    },
  );

  logInfo({ status: response.status, data: response.data });
  if (response.status !== 202) {
    return {
      type: 'sendgrid',
      body: response.data,
      status: response.status,
    };
  }
}

async function validateRequestForSubscription(body: {
  email: string;
  recaptchaToken: string;
}): Promise<ValidationError | false> {
  if (!body.email || !isEmailValid(body.email)) {
    const error: ValidationError = {
      type: 'validation',
      field: 'email',
      message: `Field "email" has to be a valid email.`,
    };
    logError(error);
    return error;
  }
  return validateRecaptcha(body.recaptchaToken);
}

async function validateRecaptcha(token: string): Promise<ValidationError | false> {
  const error: ValidationError = {
    type: 'validation',
    field: 'recaptchaToken',
    message: 'Google Recaptcha check failed. Try again',
  };
  if (!token) {
    return error;
  }
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaApiKey}&response=${token}`;
  logInfo({ url });
  const response = await Axios.post(url);

  logInfo({ status: response.status, data: response.data });
  if (response.status === 200 && response.data.success && response.data.action === 'subscribeEmail') {
    return false;
  }
  return error;
}

function logInfo(json: Object): void {
  functions.logger.info(json, { structuredData: true });
}

function logError(json: Object): void {
  functions.logger.error(json, { structuredData: true });
}

function isEmailValid(email: string): boolean {
  const regex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return regex.test(email);
}
