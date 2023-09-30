import 'dotenv/config';
import fs from 'fs';
import { Form } from 'multiparty';
import express from 'express';
import cors from 'cors';
import { getBrowser, getBrowserPage } from './utils/playwright.js';
import { log } from './utils/logging.js';
import { readExcelFromFile } from './utils/excel-reader.js';
import { fillLogBook } from './utils/automations/logbook.js';

const app = express();
const requestQueues = [];
const pages = [];
const maxPages = process.env.MAX_PAGES || 1;
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

          log('start fill logbook');
          await fillLogBook(file?.path, email, password);
          log('done fill logbook');
          res.send('Logbook filled');
        }
        processQueue();
      });
    } catch (error) {
      res.status(500).send('Error');
      processQueue();
    }
  }
};

app.post('/tools/enrichment-automation/fill-logbook', async (req, res) => {
  requestQueues.push({ req, res });
  processQueue();
});
