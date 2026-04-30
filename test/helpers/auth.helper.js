//this is my test/helpers/auth.helper.js file
//this provides JWT tokens for every role used in tests
import request from 'supertest';
import app from '../../app.js';


//these credentials are created by seed.helper.js
const CREDENTIALS = {
  admin:    { username: 'test_hq_admin',          password: 'Test@1234' },
  province: { username: 'test_province_officer',  password: 'Test@1234' },
  station:  { username: 'test_station_officer',   password: 'Test@1234' },
  device:   { username: 'test_gps_device',        password: 'Test@1234' },
};

//this is an internal helper which is called to POST /api/v1/auth/login and return the token string
const login = async ({ username, password }) => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password });

  if (!res.body.token) {
    throw new Error(
      `Auth helper login failed for "${username}". ` +
      `Status: ${res.status}, body: ${JSON.stringify(res.body)}`
    );
  }
  return res.body.token;
};

//return a bearer token for hq_admin
export const getAdminToken = () => login(CREDENTIALS.admin);

export const getProvinceToken = () => login(CREDENTIALS.province);

export const getStationToken = () => login(CREDENTIALS.station);

export const getDeviceToken = () => login(CREDENTIALS.device);

//generate an invlaid token to test 401 bad token test case
export const getInvalidToken = () =>
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_PAYLOAD.BADSIGNATURE';

//generate an expired token to test expired token test case
export const getExpiredToken = () =>
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpZCI6IjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.' +
  'EXPIRED_SIGNATURE_DOES_NOT_MATCH';
