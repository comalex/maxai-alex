const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/updates/:env/latest-mac.yml', (req, res) => {
  // console.log("call", req)
  const { env } = req.params; // production або staging

  if (env !== 'production' && env !== 'staging') {
    return res.status(400).send('Invalid environment');
  }

  const filePath = path.join(__dirname, 'updates', env, 'latest-mac.yml');
  res.sendFile(filePath);
});

app.get('/updates/:env/latest.yml', (req, res) => {
  const { env } = req.params; // production або staging

  if (env !== 'production' && env !== 'staging') {
    return res.status(400).send('Invalid environment');
  }

  const filePath = path.join(__dirname, 'updates', env, 'latest.yml');
  res.sendFile(filePath);
});

app.get('/updates/:env/:file', (req, res) => {
  const { env } = req.params; // production або staging
  const fileName = req.params.file;

  if (env !== 'production' && env !== 'staging') {
    return res.status(400).send('Invalid environment');
  }

  const filePath = path.join(__dirname, 'updates', env, fileName);
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Update server running on http://localhost:${PORT}`);
});
