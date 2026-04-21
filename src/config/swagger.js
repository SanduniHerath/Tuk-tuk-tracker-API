import swaggerJsdoc from 'swagger-jsdoc'; //logic that reads my code comments to build the docs
import swaggerUi from 'swagger-ui-express';


//setup swagger configuration 
const options = {
  definition: {
    openapi: '3.0.0', //version
    info: {
      title: 'Tuk-Tuk Tracker API',
      version: '1.0.0',//dev version
      description: 'Official API documentation for the Real-Time Three-Wheeler Tracking and Movement Logging System (Sri Lanka Police)',
    },
    servers: [
      {
        url: '/api/v1',//base path for development
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { //use jwt token input directly in the browser ui
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },

  //tells swagger to map all the models and routes to make the docs
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

//generate the spec object
const specs = swaggerJsdoc(options);

//connects swagger to the server
const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: "Tuk-Tuk Tracker Documentation"
  }));
};

export default swaggerSetup;
