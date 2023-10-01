import fs from 'fs'
import { read, stream, utils, set_fs, readFile } from "xlsx";
import { Readable } from 'stream';
import { normalizeDate } from './date-time.js';

const initialize = () => {
  stream.set_readable(Readable);
  set_fs(fs)
};

const readExcelFromFile = (fileBuffer) => {
  initialize();
  let data = [];
  const file = read(fileBuffer, {
    cellDates: true
  });
  const sheets = file.SheetNames;

  for (let i = 0; i < sheets.length; i++) {
    const temp = utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
      blankrows: false,
      header: 1
    });
    temp.forEach((res) => {
      data.push(res);
    });
  }

  const header = [...data.shift()];
  const dataObjects = data.map((dataEntry) => {
    return dataEntry.reduce((acc, d, index) => {
      return {
        ...acc,
        [header[index]]: d
      };
    });
  });

  dataObjects.forEach((dataEntry) => {
    normalizeDate(dataEntry[header[1]]);
  });

  return { data: dataObjects, header: header };
};

export { readExcelFromFile };
