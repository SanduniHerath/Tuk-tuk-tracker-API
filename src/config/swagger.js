import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swaggerSetup = (app) => {
  //load the yaml file
  const swaggerDocument = yaml.load(
    fs.readFileSync(
      path.join(__dirname, '../../swagger.yaml'), 'utf8'
    )
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Tuk-Tuk Tracker API Docs',
  }));

  //raw json spec endpoint
  app.get('/api-docs.json', (req, res) => {
    res.json(swaggerDocument);
  });
};

export default swaggerSetup;