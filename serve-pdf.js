const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Specify the PDF file path
  const pdfFilePath = path.join(__dirname, '../public/pdf/output.pdf');

  // Serve the PDF file
  fs.readFile(pdfFilePath, (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read the PDF file.' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(data);
  });
};