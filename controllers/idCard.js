/**
 * GET /
 * ID Card page.
 */
var ejs = require("ejs");
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const axios = require('axios');
const pdf = require('html-pdf');
var QRCode = require('qrcode');
const api_url = process.env.DATA_URL;

exports.viewMemberCard = async (req, res) => {
  let frontImg = 'p1.jpg';
  let backImg = 'p2.jpg';
  await viewId(req, res, frontImg, backImg);
}

exports.viewGenzCard = async (req, res) => {
  let frontImg = 'p3.jpg';
  let backImg = 'p4.jpg';
  await viewId(req, res, frontImg, backImg);
}

// exactly similar to generate method
const viewId = async (req, res, frontImg, backImg) => {
  let user_id = req.params.user_id;
  let api_data = await axios.get(api_url+user_id).then(resp => {
      return resp.data;
  });

  // console.log('the api data ',api_data);
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
      location: 'Mumbai',
      name: `${api_data.first_name} ${api_data.last_name}` || 'Test User',
      user_id: user_id,
      page1: process.env.BASE_URL+`/images/${frontImg}`,
      page2: process.env.BASE_URL+`/images/${backImg}`,
      qr_code: '',
      profile_photo: api_data.photo,
      mobile: api_data.phone_number,
      address: api_data.address || '444 Ratan Apartments, Bank road, Mumbai Maharashtra',
      category: api_data.artist_category || 'Test Artist',
      doa: api_data.membership_start_date || '---',
      valid_upto: api_data.membership_end_date || '---',
    };
    
  QRCode.toDataURL(qrData, qrOptions, function (err, url) { 
    if (err) throw err; 
    parameters.qr_code = url; 
    res.render('idcard', parameters);
  }) 

};

// Generate ID card for normal users
exports.generateMemberCard = async (req, res) => {
  let frontImg = 'p1.jpg';
  let backImg = 'p2.jpg';
  generateIdCard(req, res, frontImg, backImg);
}

// Generate ID for Genz users
exports.generateGenZCard = async (req, res) => {
  let frontImg = 'p3.jpg';
  let backImg = 'p4.jpg';
  generateIdCard(req, res, frontImg, backImg);
}

const generateIdCard = async (req, res, frontImg, backImg) => {
  let user_id = req.params.user_id;
  // console.log(`the user id is ${user_id}`);
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
    location: 'Mumbai',
    name: `${api_data.first_name} ${api_data.last_name}` || 'Test User',
    user_id: user_id,
    page1: process.env.BASE_URL+`/images/${frontImg}`,
    page2: process.env.BASE_URL+`/images/${backImg}`,
    // page1: `https://cdn.glitch.global/3b71fbc5-9ef0-4c02-a6c9-447b493717e7/p1.jpg?v=1702962510492`,
    // page2: `https://cdn.glitch.global/3b71fbc5-9ef0-4c02-a6c9-447b493717e7/p2.jpg?v=1702962403702`,
    // qr_code: `http://localhost/php-qrcode/examples/qrcode-${user_id}.jpg`,
    qr_code: '',
    profile_photo: api_data.photo,
    mobile: api_data.phone_number,
    address: api_data.address || '444 Ratan Apartments, Bank road, Mumbai Maharashtra',
    category: api_data.artist_category || 'Test Artist',
    doa: api_data.membership_start_date || '---',
    valid_upto: api_data.membership_end_date || '---',
  };

  QRCode.toDataURL(qrData, qrOptions, function (err, url) { 
    if (err) throw err; 
    parameters.qr_code = url; 
    // generate pdf and force download
    generateFeedbackPdf(res, parameters, user_id);
  });
  
};

// generate pdf and force download
const generateFeedbackPdf = async (res, pdfData, user_id) => {
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
    let filename = `aifawa-${user_id}.pdf`;
    let pdf_path = `${localPath}/public/assets/${filename}`;
    // let pdf_path = `pdffff-${user_id}.pdf`;

    // await pdf.create(ejsData, options).toFile(pdf_path, function(err, res) {
    //   if (err) return console.log(err);
    //   // console.log(res); // { filename: '/app/businesscard.pdf' }
    // });

    await pdf.create(ejsData, options).toStream(function(err, stream){
      res.attachment(filename);
      stream.pipe(res);
      stream.on("end", ()=>{ res.end(); });
    });

    return pdf_path;
  } catch (err) {
    // throw new Error(err);
    console.error('Error generating PDF:', err);
  }
};

//to zip then download all the files inside public/assets 
exports.downloadAll = async (req, res) => {
  try {
    // Create a new Archivers instance
    const archive = archiver('zip');

    // Define the base directory for assets
    const assetsDir = path.join(__dirname, '..', 'public', 'assets');

    // Add all files in the assets directory to the archive
    await archive.directory(assetsDir, false);

    // Set the response headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=assets.zip');

    // Pipe the archive to the response stream and send it
    archive.pipe(res);
    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating ZIP file');
  }
}