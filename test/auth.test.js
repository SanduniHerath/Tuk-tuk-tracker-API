//all authentication endpoints are tested in this test file
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

//test login endpoint
describe('AUTH — POST /api/v1/auth/login', () => {
  before(async () => { await seedTestData(); });
  after(async ()  => { await clearTestData(); });

  it('should return 200 + token for valid hq_admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_hq_admin', password: 'Test@1234' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.token).to.be.a('string').with.length.greaterThan(20);
    expect(res.body.role).to.equal('hq_admin');
  });

  it('should return 200 + token for provincial_officer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_province_officer', password: 'Test@1234' });
    expect(res.status).to.equal(200);
    expect(res.body.role).to.equal('provincial_officer');
  });

  it('should return 200 + token for station_officer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_station_officer', password: 'Test@1234' });
    expect(res.status).to.equal(200);
    expect(res.body.role).to.equal('station_officer');
  });

  it('should return 200 + token for gps_device', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_gps_device', password: 'Test@1234' });
    expect(res.status).to.equal(200);
    expect(res.body.role).to.equal('gps_device');
  });

  it('should return 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Test@1234' });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_hq_admin' });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when both fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_hq_admin', password: 'wrongpassword' });
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 for non-existent username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'ghost_user_xyz', password: 'Test@1234' });
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should never expose password in the response body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'test_hq_admin', password: 'Test@1234' });
    expect(res.body).to.not.have.property('password');
  });
});

//test current user endpoint
describe('AUTH — GET /api/v1/auth/current-user', () => {
  let adminToken, provinceToken, stationToken, deviceToken;

  before(async () => {
    await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and current user for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.username).to.equal('test_hq_admin');
    expect(res.body.data.role).to.equal('hq_admin');
    expect(res.body.data).to.not.have.property('password');
  });

  it('should return 200 and correct role for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.role).to.equal('provincial_officer');
  });

  it('should return 200 and correct role for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.role).to.equal('station_officer');
  });

  it('should return 200 and correct role for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.role).to.equal('gps_device');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/current-user');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/current-user')
      .set('Authorization', 'Token abc123');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });
});

//test new user register endpoint
describe('AUTH — POST /api/v1/auth/register', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  const newUser = () => ({
    username: `test_reg_${Date.now()}`,
    password: 'Register@123',
    fullname: 'Registered User',
    role: 'station_officer',
  });

  it('should return 201 when hq_admin creates a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser());
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.role).to.equal('station_officer');
    expect(res.body.data).to.not.have.property('password');
  });

  it('should return 201 with valid province name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newUser(), role: 'provincial_officer', province: data.westernName });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(newUser());
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${getInvalidToken()}`)
      .send(newUser());
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send(newUser());
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${stationToken}`)
      .send(newUser());
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(newUser());
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 404 when province name does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newUser(), province: 'DoesNotExistProvince' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });
});

//test get all users endpoint - hq-admin only
describe('AUTH — GET /api/v1/auth/getUsers', () => {
  let adminToken, provinceToken, stationToken, deviceToken;

  before(async () => {
    await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and array of users for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/auth/getUsers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    res.body.data.forEach(u => expect(u).to.not.have.property('password'));
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/getUsers');
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/auth/getUsers')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/auth/getUsers')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/auth/getUsers')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

//test update user details by name - hq_admin only
describe('AUTH — PATCH /api/v1/auth/update/:username', () => {
  let adminToken, provinceToken;

  before(async () => {
    await seedTestData();
    [adminToken, provinceToken] = await Promise.all([
      getAdminToken(), getProvinceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and updated user for valid request', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/update/test_station_officer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullname: 'Updated Name' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 when username does not exist', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/update/no_such_user_ever')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullname: 'Ghost' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/update/test_station_officer')
      .send({ fullname: 'Hacker' });
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/update/test_station_officer')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ fullname: 'Unauthorized' });
    expect(res.status).to.equal(403);
  });
});

//test delete user by name - hq_admin only
describe('AUTH — DELETE /api/v1/auth/delete/:username', () => {
  let adminToken, provinceToken;

  before(async () => {
    await seedTestData();
    [adminToken, provinceToken] = await Promise.all([
      getAdminToken(), getProvinceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 204 when hq_admin deletes existing user', async () => {
    
    await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'test_to_delete', password: 'Delete@123', fullname: 'Del Me', role: 'station_officer' });

    const res = await request(app)
      .delete('/api/v1/auth/delete/test_to_delete')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(204);
  });

  it('should return 404 for non-existent username', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/delete/nobody_here_xyz')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).delete('/api/v1/auth/delete/test_station_officer');
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/delete/test_station_officer')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(403);
  });
});
