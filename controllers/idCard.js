/**
 * GET /
 * ID Card page.
 */
var ejs = require("ejs");
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const axios = require('axios');
const api_url = process.env.DATA_URL;
// const puppeteer = require('puppeteer');
// const path = require("path");
const pdf = require('html-pdf');
var QRCode = require('qrcode')

exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};


exports.generate = async (req, res) => {

  let user_id = req.params.user_id;
  let api_data = await axios.get(api_url+user_id).then(resp => {
      // console.log(resp.data);
      return resp.data;
  });

  let qrData = process.env.PROFILE_URL+user_id;
  let qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/jpeg',
    quality: 0.3,
    margin: 1,
    color: {
      dark:"#000000",
      light:"#FFFFFF"
    }
  };
  let parameters = {
    date: moment().add(7,'days').format('DD-MM-YYYY'),
    time: `10:00AM - 12:00PM`,
    location: 'Nagpur',
    name: `${api_data.first_name} ${api_data.last_name}` || 'Test User',
    user_id: user_id,
    page1: process.env.BASE_URL+`/images/p1.jpg`,
    page2: process.env.BASE_URL+`/images/p2.jpg`,
    // page1: `http://localhost/php-qrcode/examples/assets/p1.jpg`,
    // page2: `http://localhost/php-qrcode/examples/assets/p2.jpg`,
    // qr_code: `http://localhost/php-qrcode/examples/qrcode-${user_id}.jpg`,
    qr_code: '',
    profile_photo: api_data.photo,
    mobile: api_data.phone_number,
    address: api_data.address ||'444 Ratan Apartments, Bank road, nagpur maharashtra',
    category: api_data.category || 'Test Singer',
    doa: '23/11/2023',
    valid_upto: '22/11/2024',
  };

  QRCode.toDataURL(qrData, qrOptions, function (err, url) { 
    if (err) throw err; 
    parameters.qr_code = url; 

    res.render('idcard', parameters);
    generateFeedbackPdf(parameters, user_id);
  }) 
  

};

const generateFeedbackPdf = async (pdfData, user_id) => {
  let err, userData;
  try {
    let localPath = __dirname + `/..`;
    let html = fs.readFileSync(`${localPath}/views/idcard.ejs`).toString();
    // let html = fs.readFileSync(`idcard.ejs`).toString();
    const ejsData = ejs.render(html, pdfData);
    // console.log(`The HTML is ${html}`);
    var options = {
      // Export options
      "width": "1016px",
      "height" : "638px",
      // Page options
      "border": "0",             // default is 0, units: mm, cm, in, px
    };
    let pdf_path = `${localPath}/public/assets/aifawa-${user_id}.pdf`;
    // let pdf_path = `pdffff-${user_id}.pdf`;
    await pdf.create(ejsData, options).toFile(pdf_path, function(err, res) {
      if (err) return console.log(err);
      console.log(res); // { filename: '/app/businesscard.pdf' }
    });
    return pdf_path;
  } catch (err) {
    throw new Error(err);
  }
};