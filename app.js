/**
 * Module dependencies.
 */
const path = require('path');
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
// const errorHandler = require('errorhandler');


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
*/
dotenv.config({ path: '.env' });



const idCardController = require('./controllers/idCard');
/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

// Function to serve all static files
// inside public directory.
app.use(express.static('public'));
app.use('/images', express.static('images'));

app.get('/', (req, res) => {
  console.log('Loaded Homepage');
  res.render('home', { title: 'Home' });
});
app.get('/test', (req,res)=>{
  console.log('Loaded Test Page');
  res.end('Yello!! This is a Test Page.');
})

// app.get('/idcard/browse', idCardController.browse);
app.get('/idcard/download', idCardController.downloadAll);
app.get('/idcard/:user_id', idCardController.generate);
app.get('/idcard/view/:user_id', idCardController.viewId);

/**
 * Error Handler.
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  res.status(404).send('Page Not Found');
});

if (process.env.NODE_ENV === 'development') {
  // only use in development
  // app.use(errorHandler());
} else {
  app.use((err, req, res) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  const { BASE_URL } = process.env;
  const colonIndex = BASE_URL.lastIndexOf(':');
  const port = parseInt(BASE_URL.slice(colonIndex + 1), 10);

  if (!BASE_URL.startsWith('http://localhost')) {
    console.log(`The BASE_URL env variable is set to ${BASE_URL}. If you directly test the application through http://localhost:${app.get('port')} instead of the BASE_URL, it may cause a CSRF mismatch or an Oauth authentication failur. To avoid the issues, change the BASE_URL or configure your proxy to match it.\n`);
  } else if (app.get('port') !== port) {
    console.warn(`WARNING: The BASE_URL environment variable and the App have a port mismatch. If you plan to view the app in your browser using the localhost address, you may need to adjust one of the ports to make them match. BASE_URL: ${BASE_URL}\n`);
  }

  console.log(`App is running on http://localhost:${app.get('port')} in ${app.get('env')} mode.`);
  console.log('Press CTRL-C to stop.');
});

module.exports = app;
