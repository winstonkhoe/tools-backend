import 'dotenv/config';
import { Form } from 'multiparty';
import express from 'express';
import cors from 'cors';
import { log } from './utils/logging.js';
import { fillLogBook } from './utils/automations/logbook.js';
import { responseError, responseSuccess } from './utils/response.js';

const app = express();
const requestQueues = [];
const port = process.env.PORT || 8000;
const form = new Form();
const corsOptions = {
  origin: process.env.CORS_ORIGIN, //replace this with your frontend domain
  optionsSuccessStatus: 200
};

const initializeApp = async () => {
  app.use(cors(corsOptions));
  app.use(express.static('public'));
};

await initializeApp();

app.listen(port, async () => {
  console.log(`app listening on port ${port}`);
});

const processQueue = async () => {
  if (requestQueues.length > 0) {
    const { req, res } = requestQueues.shift();
    try {
      form.parse(req, async function (err, fields, files) {
        if (!err) {
          const { email: emailRaw, password: passwordRaw } = fields;
          const { file: fileRaw } = files;
          const email = emailRaw?.[0];
          const password = passwordRaw?.[0];
          const file = fileRaw[0];

          try {
            log('start fill logbook');
            await fillLogBook(file?.path, email, password);
            log('done fill logbook');
            responseSuccess(res, 'Logbook filled')
          } catch (error) {
            log(`error fill logbook: ${error}`);
            responseError(res, 500, 'Binus Enrichment Web is having trouble')
          } finally {
            processQueue();
          }
        }
      });
    } catch (error) {
      responseError(res, 400, 'Bad Request')
      processQueue();
    }
  }
};

app.post('/tools/enrichment-automation/fill-logbook', async (req, res) => {
  requestQueues.push({ req, res });
  processQueue();
});
