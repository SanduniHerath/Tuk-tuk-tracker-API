//test all the tuktuks management endpoints
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

//get all tuk tuks endpoint
describe('TUKTUKS — GET /api/v1/tuktuks', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and all vehicles for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    expect(res.body.results).to.be.a('number');
    expect(res.body.data.length).to.be.greaterThan(0);
  });

  //role based testing
  it('should only return Western Province vehicles for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    //all returned tuktuks belongs to western province
    res.body.data.forEach(v => {
      expect(v.province.name).to.equal(data.westernName);
    });
  });

  it('should only return Colombo district vehicles for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => {
      expect(v.district.name).to.equal(data.colomboName);
    });
  });

  //auth tests
  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/tuktuks');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  //filtering test part
  it('should return only active vehicles when ?status=active', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?status=active')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => expect(v.status).to.equal('active'));
  });

  it('should return only flagged vehicles when ?status=flagged', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?status=flagged')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => expect(v.status).to.equal('flagged'));
  });

  it('should return only inactive vehicles when ?status=inactive', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?status=inactive')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => expect(v.status).to.equal('inactive'));
  });

  it('should filter by district name', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks?district=${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => expect(v.district.name).to.equal(data.colomboName));
  });

  it('should filter by province name', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks?province=${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => expect(v.province.name).to.equal(data.westernName));
  });

  it('should return 404 when filtering by non-existent district', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?district=NonExistentDistrictXYZ')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  //sorting test part
  it('should sort ascending by registrationNumber with ?sort=registrationNumber', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?sort=registrationNumber')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    const regs = res.body.data.map(v => v.registrationNumber);
    const sorted = [...regs].sort();
    expect(regs).to.deep.equal(sorted);
  });

  it('should sort descending with ?sort=-registrationNumber', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?sort=-registrationNumber')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    const regs = res.body.data.map(v => v.registrationNumber);
    const sortedDesc = [...regs].sort().reverse();
    expect(regs).to.deep.equal(sortedDesc);
  });

  //pagination test part
  it('should paginate with ?page=1&limit=2', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.length).to.be.at.most(2);
    expect(res.body.results).to.be.a('number');
  });

  it('should return second page with ?page=2&limit=2', async () => {
    const page1 = await request(app)
      .get('/api/v1/tuktuks?page=1&limit=2&sort=registrationNumber')
      .set('Authorization', `Bearer ${adminToken}`);
    const page2 = await request(app)
      .get('/api/v1/tuktuks?page=2&limit=2&sort=registrationNumber')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(page2.status).to.equal(200);
    if (page1.body.data.length > 0 && page2.body.data.length > 0) {
      expect(page1.body.data[0].registrationNumber).to.not.equal(
        page2.body.data[0].registrationNumber
      );
    }
  });
});

//test get tuktuk by regno endpoint
describe('TUKTUKS — GET /api/v1/tuktuks/:regNo', () => {
  let adminToken, provinceToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and vehicle details for valid regNo', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.registrationNumber).to.equal(data.regV1);
    expect(res.body.data.district).to.be.an('object');
    expect(res.body.data.province).to.be.an('object');
    expect(res.body.data.driver).to.be.an('object');
  });

  it('should return 200 for provincial_officer accessing their province vehicle', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 for non-existent regNo', async () => {
    const res = await request(app)
      .get('/api/v1/tuktuks/GHOST-99-9999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/api/v1/tuktuks/${data.regV1}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

//test create a new tuk tuk endpoint
describe('TUKTUKS — POST /api/v1/tuktuks', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  const newVehicle = (data) => ({
    registrationNumber: `TEST-NEW-${Date.now()}`,
    driver: data.driverNic1,
    district: data.colomboName,
    province: data.westernName,
    color: 'Yellow',
    year: 2023,
  });

  it('should return 201 when hq_admin creates a tuktuk', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newVehicle(data));
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.registrationNumber).to.be.a('string');
    expect(res.body.data.district).to.be.an('object');
    expect(res.body.data.province).to.be.an('object');
  });

  it('should return 201 when provincial_officer creates a tuktuk', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send(newVehicle(data));
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .send(newVehicle(data));
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${getInvalidToken()}`)
      .send(newVehicle(data));
    expect(res.status).to.equal(401);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${stationToken}`)
      .send(newVehicle(data));
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(newVehicle(data));
    expect(res.status).to.equal(403);
  });

  it('should return 404 when driver NIC does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newVehicle(data), driver: '999999999X' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include('Driver');
  });

  it('should return 404 when district name does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newVehicle(data), district: 'NoSuchDistrict' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 400 when district does not belong to given province', async () => {
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newVehicle(data), district: data.colomboName, province: data.centralName });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include('District does not belong');
  });

  it('should return 409/500 for duplicate registrationNumber', async () => {
    const body = newVehicle(data);
    await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    const res = await request(app)
      .post('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

//test update an existing tuk tuk by regno endpoint
describe('TUKTUKS — PATCH /api/v1/tuktuks/:regNo', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 when hq_admin updates a tuktuk', async () => {
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'flagged', color: 'Orange' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.color).to.equal('Orange');
  });

  it('should return 200 when provincial_officer updates a tuktuk', async () => {
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ color: 'Purple' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 when station_officer updates a tuktuk', async () => {
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ color: 'Silver' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 when regNo does not exist', async () => {
    const res = await request(app)
      .patch('/api/v1/tuktuks/GHOST-00-0000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ color: 'Gold' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${data.regV1}`)
      .send({ color: 'Brown' });
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${data.regV1}`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ color: 'Pink' });
    expect(res.status).to.equal(403);
  });
});

//test delete a tuk tuk by regno endpoint
describe('TUKTUKS — DELETE /api/v1/tuktuks/:regNo', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 204 when hq_admin deletes a tuktuk', async () => {
    const res = await request(app)
      .delete(`/api/v1/tuktuks/${data.regV5}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(204);
  });

  it('should return 404 after deleting the same tuktuk again', async () => {
    const res = await request(app)
      .delete(`/api/v1/tuktuks/${data.regV5}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).delete(`/api/v1/tuktuks/${data.regV4}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/tuktuks/${data.regV4}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/tuktuks/${data.regV4}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .delete(`/api/v1/tuktuks/${data.regV4}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});
