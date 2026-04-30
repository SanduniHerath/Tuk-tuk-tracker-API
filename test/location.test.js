//test all the enpoints of location by using this test file
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

//test submit a location ping endpoint
describe('LOCATIONS — POST /api/v1/locations/ping', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  const validPing = (vehicleId) => ({
    vehicleId,
    latitude: 6.9271,
    longitude: 79.8612,
    speed: 45,
    heading: 90,
    accuracy: 5,
  });

  it('should return 201 when hq_admin submits a ping with vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.latitude).to.equal(6.9271);
    expect(res.body.data.longitude).to.equal(79.8612);
    expect(res.body.data.vehicle).to.be.a('string');
  });

  it('should return 201 when gps_device submits a ping (uses bound vehicle)', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9300, longitude: 79.8650, speed: 30 });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('object');
    expect(res.body.data.latitude).to.equal(6.9300);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${getInvalidToken()}`)
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${getExpiredToken()}`)
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${stationToken}`)
      .send(validPing(data.vehicleId1));
    expect(res.status).to.equal(403);
  });

  it('should return 400 when hq_admin omits vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/locations/ping')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612 });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

//test get latest location of a tuktuk endpoint
describe('LOCATIONS — GET /api/v1/locations/latest', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and paginated latest locations for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    expect(res.body.total).to.be.a('number');
    expect(res.body.page).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
    expect(res.body.results).to.be.a('number');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/locations/latest');
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });

  it('should paginate with ?page=1&limit=2', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.length).to.be.at.most(2);
    expect(res.body.page).to.equal(1);
    expect(res.body.limit).to.equal(2);
  });

  it('should return correct pagination metadata on page 2', async () => {
    const res = await request(app)
      .get('/api/v1/locations/latest?page=2&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.page).to.equal(2);
    expect(res.body.pages).to.be.a('number');
  });
});

//test get the latest location of a tuk tuk by district endpoint
describe('LOCATIONS — GET /api/v1/locations/district/:districtName', () => {
  let adminToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and latest pings for that district', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/district/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    expect(res.body.count).to.be.a('number');
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/district/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 404 for non-existent district name', async () => {
    const res = await request(app)
      .get('/api/v1/locations/district/FakeDistrictXYZ')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/district/${data.colomboName}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/district/${data.colomboName}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

//test get the latest location of a tuk tuk by regno endpoint
describe('LOCATIONS — GET /api/v1/locations/:regNo/latest', () => {
  let adminToken, provinceToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and latest ping for valid regNo', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/latest`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('object');
    expect(res.body.data.latitude).to.be.a('number');
    expect(res.body.data.longitude).to.be.a('number');
    expect(res.body.data.vehicle).to.be.an('object');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/latest`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 404 for non-existent regNo', async () => {
    const res = await request(app)
      .get('/api/v1/locations/GHOST-99-9999/latest')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/api/v1/locations/${data.regV1}/latest`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/latest`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/latest`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

//test get a location history of a tuk tuk by regno endpoint
describe('LOCATIONS — GET /api/v1/locations/:regNo/history', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and history array for valid regNo', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    expect(res.body.total).to.be.a('number');
    expect(res.body.page).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
    expect(res.body.results).to.be.a('number');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/api/v1/locations/${data.regV1}/history`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 404 for non-existent regNo', async () => {
    const res = await request(app)
      .get('/api/v1/locations/GHOST-00-0000/history')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

 //test time window
  it('should accept ?from= date filter and return results', async () => {
    const from = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); //5 hours ago
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?from=${from}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
    res.body.data.forEach(p => {
      expect(new Date(p.timestamp).getTime()).to.be.gte(new Date(from).getTime());
    });
  });

  it('should accept ?to= date filter', async () => {
    const to = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();//1 hour ago
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?to=${to}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
  });

  it('should accept ?from= and ?to= together', async () => {
    const from = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    const to   = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
    res.body.data.forEach(p => {
      const ts = new Date(p.timestamp).getTime();
      expect(ts).to.be.gte(new Date(from).getTime());
      expect(ts).to.be.lte(new Date(to).getTime());
    });
  });

  it('should return 400 for invalid ?from= date', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?from=not-a-date`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 for invalid ?to= date', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?to=not-a-date`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  //test pagination
  it('should paginate with ?page=1&limit=3', async () => {
    const res = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?page=1&limit=3`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.length).to.be.at.most(3);
    expect(res.body.page).to.equal(1);
    expect(res.body.limit).to.equal(3);
  });

  it('should return different results on page 2', async () => {
    const p1 = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?page=1&limit=3`)
      .set('Authorization', `Bearer ${adminToken}`);
    const p2 = await request(app)
      .get(`/api/v1/locations/${data.regV1}/history?page=2&limit=3`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(p2.status).to.equal(200);
    if (p1.body.data.length > 0 && p2.body.data.length > 0) {
      expect(p1.body.data[0]._id).to.not.equal(p2.body.data[0]._id);
    }
  });
});
