# based on https://github.com/microsoft/playwright/blob/master/utils/docker/Dockerfile.bionic
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.37.1-jammy

COPY package.json /opt/pw/package.json
COPY index.js /opt/pw/index.js
COPY utils/playwright.js /opt/pw/utils/playwright.js
COPY utils/logging.js /opt/pw/utils/logging.js
COPY utils/excel-reader.js /opt/pw/utils/excel-reader.js
COPY utils/date-time.js /opt/pw/utils/date-time.js
COPY utils/socket.js /opt/pw/utils/socket.js
COPY utils/constants.js /opt/pw/utils/constants.js
COPY utils/automations/logbook.js /opt/pw/utils/automations/logbook.js

WORKDIR /opt/pw
RUN npm install -D playwright@1.37.1 cors@2.8.5 express@4.18.2 dotenv@16.3.1 https://cdn.sheetjs.com/xlsx-0.20.0/xlsx-0.20.0.tgz socket.io@4.7.2 utf-8-validate@5.0.10 bufferutil@4.0.7

#ENV DEBUG=pw:api
# Don't redownload browser image in future, because we already do it above
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_TIMEOUT=60000
ENV CORS_ORIGIN=*

EXPOSE 8000

CMD [ "node", "/opt/pw/index.js" ]
