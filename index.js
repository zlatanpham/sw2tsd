require('shelljs/global');
const fetch = require('isomorphic-unfetch');
const prettier = require('prettier');
const sw2dts = require('sw2dts');
const fs = require('fs');

const animateProgress = require('./helpers/progress');
const logWrite = (message) => process.stdout.write(message);
const errorWrite = (error) => process.stderr.write(error);

const sleep = (delay) =>
  new Promise((ressolve) => {
    setTimeout(() => {
      ressolve();
    }, delay);
  });

// Fetch definitions for a given schema
async function fetchDefinitionsForSchema(filePath, endpoint) {
  const clearAnimateProgress = animateProgress(
    `Fetching data from ${endpoint}`,
    3,
  );

  const response = await fetch(endpoint);

  if (response.status < 400) {
    const definitions = await response.json();
    const convertDefinitions = await sw2dts.convert(definitions, {
      widthQuery: true,
    });

    // Make the directory if it doesn't exist, especially for first run
    // eslint-disable-next-line
    mkdir('-p', filePath.split('/').slice(0, -1).join('/'));

    await sleep(2000);
    clearAnimateProgress();
    logWrite('\n');

    fs.writeFile(
      filePath,
      prettier.format(convertDefinitions, { parser: 'babel' }),
      (error) => {
        if (error) {
          errorWrite(
            `Failed to write type definitions for: ${endpoint}\n${error}`,
          );
          throw error;
        } else {
          logWrite(`Successfully wrote definitions in ${filePath} ✅`);
        }
      },
    );
  } else {
    const errMsg = `Failed to fetch type definitions for: ${endpoint}`;
    errorWrite(errMsg);
    throw errMsg;
  }
}

module.exports = fetchDefinitionsForSchema;
