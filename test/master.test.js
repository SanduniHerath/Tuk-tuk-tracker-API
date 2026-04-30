//test all master data management endpoints
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

//test provinces related endpoints
describe('MASTER — GET /api/v1/master/provinces', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and array of provinces for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    expect(res.body.count).to.be.a('number');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/master/provinces');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return provinces sorted alphabetically', async () => {
    const res = await request(app)
      .get('/api/v1/master/provinces')
      .set('Authorization', `Bearer ${adminToken}`);
    const names = res.body.data.map(p => p.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).to.deep.equal(sorted);
  });
});

describe('MASTER — GET /api/v1/master/provinces/:name', () => {
  let adminToken;
  let data;

  before(async () => {
    data = await seedTestData();
    adminToken = await getAdminToken();
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and province details for valid name', async () => {
    const res = await request(app)
      .get(`/api/v1/master/provinces/${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.name).to.equal(data.westernName);
    expect(res.body.data.code).to.be.a('string');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .get(`/api/v1/master/provinces/${data.westernName}`);
    expect(res.status).to.equal(401);
  });
});

describe('MASTER — PATCH /api/v1/master/provinces/:name', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 when hq_admin updates a province', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/provinces/${encodeURIComponent(data.centralName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'TCPX' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 when provincial_officer updates a province', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/provinces/${encodeURIComponent(data.centralName)}`)
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ code: 'TCPY' });
    expect(res.status).to.equal(200);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/provinces/${encodeURIComponent(data.centralName)}`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ code: 'TCPZ' });
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/provinces/${encodeURIComponent(data.centralName)}`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ code: 'TCPW' });
    expect(res.status).to.equal(403);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/provinces/${encodeURIComponent(data.centralName)}`)
      .send({ code: 'TCQ' });
    expect(res.status).to.equal(401);
  });
});

//test district related endpoints
describe('MASTER — GET /api/v1/master/districts', () => {
  let adminToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and all districts for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/master/districts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    expect(res.body.results).to.be.a('number');
    expect(res.body.data[0].province).to.be.an('object');
  });

  it('should filter by province name using ?province=', async () => {
    const res = await request(app)
      .get(`/api/v1/master/districts?province=${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(d => {
      expect(d.province.name).to.equal(data.westernName);
    });
  });

  it('should return 404 for non-existent province filter', async () => {
    const res = await request(app)
      .get('/api/v1/master/districts?province=FakeProvinceName')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/master/districts');
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/master/districts')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

describe('MASTER — GET /api/v1/master/districts/:name', () => {
  let adminToken;
  let data;

  before(async () => {
    data = await seedTestData();
    adminToken = await getAdminToken();
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and district details for valid name', async () => {
    const res = await request(app)
      .get(`/api/v1/master/districts/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.name).to.equal(data.colomboName);
    expect(res.body.data.province).to.be.an('object');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .get(`/api/v1/master/districts/${data.colomboName}`);
    expect(res.status).to.equal(401);
  });
});

describe('MASTER — PATCH /api/v1/master/districts/:name', () => {
  let adminToken, provinceToken, stationToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 when hq_admin updates a district', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/districts/${encodeURIComponent(data.kandyName)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'TKAX' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 for non-existent district name', async () => {
    const res = await request(app)
      .patch('/api/v1/master/districts/NoSuchDistrict')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'XYZ' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/districts/${encodeURIComponent(data.kandyName)}`)
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ code: 'TKAZ' });
    expect(res.status).to.equal(403);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/districts/${encodeURIComponent(data.kandyName)}`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ code: 'TKAW' });
    expect(res.status).to.equal(403);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/districts/${encodeURIComponent(data.kandyName)}`)
      .send({ code: 'X' });
    expect(res.status).to.equal(401);
  });
});

//test police stations related endpoints
describe('MASTER — GET /api/v1/master/stations', () => {
  let adminToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and all stations for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/master/stations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    expect(res.body.results).to.be.a('number');
    expect(res.body.data[0].district).to.be.an('object');
    expect(res.body.data[0].province).to.be.an('object');
  });

  it('should filter by district name', async () => {
    const res = await request(app)
      .get(`/api/v1/master/stations?district=${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(s => {
      expect(s.district.name).to.equal(data.colomboName);
    });
  });

  it('should filter by province name', async () => {
    const res = await request(app)
      .get(`/api/v1/master/stations?province=${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(s => {
      expect(s.province.name).to.equal(data.westernName);
    });
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/master/stations');
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/master/stations')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

describe('MASTER — GET /api/v1/master/stations/:code', () => {
  let adminToken;
  let data;

  before(async () => {
    data = await seedTestData();
    adminToken = await getAdminToken();
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and station details for valid code', async () => {
    const res = await request(app)
      .get(`/api/v1/master/stations/${data.colomboPS}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.policeStationCode).to.equal(data.colomboPS);
    expect(res.body.data.district).to.be.an('object');
    expect(res.body.data.province).to.be.an('object');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/api/v1/master/stations/${data.colomboPS}`);
    expect(res.status).to.equal(401);
  });
});

describe('MASTER — POST /api/v1/master/stations', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  const newStation = () => ({
    name: `Test New PS ${Date.now()}`,
    policeStationCode: `PS-NEW-${Date.now()}`,
    district: data.colomboName,
    province: data.westernName,
    address: '99 Test Road',
    contactNumber: '0112000099',
  });

  it('should return 201 when hq_admin creates a station', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newStation());
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.policeStationCode).to.be.a('string');
  });

  it('should return 201 when station_officer creates a station', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${stationToken}`)
      .send(newStation());
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .send(newStation());
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send(newStation());
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(newStation());
    expect(res.status).to.equal(403);
  });

  it('should return 404 when district does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newStation(), district: 'FakeDistrict' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when district does not belong to province', async () => {
    const res = await request(app)
      .post('/api/v1/master/stations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newStation(), district: data.colomboName, province: data.centralName });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

describe('MASTER — PATCH /api/v1/master/stations/:code', () => {
  let adminToken, stationToken, provinceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, stationToken, provinceToken] = await Promise.all([
      getAdminToken(), getStationToken(), getProvinceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 when hq_admin updates a station', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/stations/${data.gampahaPS}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ address: '2 Updated Road' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 when station_officer updates a station', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/stations/${data.gampahaPS}`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ address: '3 Updated Road' });
    expect(res.status).to.equal(200);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/stations/${data.gampahaPS}`)
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ address: 'Hack Road' });
    expect(res.status).to.equal(403);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/master/stations/${data.gampahaPS}`)
      .send({ address: 'No Auth' });
    expect(res.status).to.equal(401);
  });
});

describe('MASTER — DELETE /api/v1/master/stations/:code', () => {
  let adminToken, stationToken, provinceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, stationToken, provinceToken] = await Promise.all([
      getAdminToken(), getStationToken(), getProvinceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 204 when hq_admin deletes a station', async () => {
    const res = await request(app)
      .delete(`/api/v1/master/stations/${data.kandyPS}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(204);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .delete(`/api/v1/master/stations/${data.colomboPS}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/master/stations/${data.colomboPS}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/master/stations/${data.colomboPS}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(403);
  });
});
