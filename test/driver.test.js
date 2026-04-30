//test all driver endpoints using this test file
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

//test get all drivers endpoint
describe('DRIVERS — GET /api/v1/drivers', () => {
  let adminToken, provinceToken, stationToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and array of drivers for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array').with.length.greaterThan(0);
    expect(res.body.results).to.be.a('number');
    //check populated fields
    expect(res.body.data[0].district).to.be.an('object');
    expect(res.body.data[0].province).to.be.an('object');
  });

  it('should return 200 and drivers for provincial_officer', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 200 and drivers for station_officer', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/drivers');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/v1/drivers')
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  //test filtering part
  it('should filter by district name', async () => {
    const res = await request(app)
      .get(`/api/v1/drivers?district=${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(d => {
      expect(d.district.name).to.equal(data.colomboName);
    });
  });

  it('should filter by province name', async () => {
    const res = await request(app)
      .get(`/api/v1/drivers?province=${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(d => {
      expect(d.province.name).to.equal(data.westernName);
    });
  });

  it('should return 404 when filtering by non-existent district', async () => {
    const res = await request(app)
      .get('/api/v1/drivers?district=NoSuchDistrict')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  //test sorting part
  it('should sort ascending by fullName with ?sort=fullName', async () => {
    const res = await request(app)
      .get('/api/v1/drivers?sort=fullName')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    const names = res.body.data.map(d => d.fullName);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).to.deep.equal(sorted);
  });

  it('should sort descending with ?sort=-fullName', async () => {
    const res = await request(app)
      .get('/api/v1/drivers?sort=-fullName')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    const names = res.body.data.map(d => d.fullName);
    const sortedDesc = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).to.deep.equal(sortedDesc);
  });

  //test pagination part
  it('should paginate with ?page=1&limit=2', async () => {
    const res = await request(app)
      .get('/api/v1/drivers?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.length).to.be.at.most(2);
  });

  it('should return second page with ?page=2&limit=2', async () => {
    const p1 = await request(app)
      .get('/api/v1/drivers?page=1&limit=2&sort=nic')
      .set('Authorization', `Bearer ${adminToken}`);
    const p2 = await request(app)
      .get('/api/v1/drivers?page=2&limit=2&sort=nic')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(p2.status).to.equal(200);
    if (p1.body.data.length > 0 && p2.body.data.length > 0) {
      expect(p1.body.data[0].nic).to.not.equal(p2.body.data[0].nic);
    }
  });
});

//test get driver by nic endpoint
describe('DRIVERS — GET /api/v1/drivers/:nic', () => {
  let adminToken, provinceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken] = await Promise.all([
      getAdminToken(), getProvinceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and driver details for valid NIC', async () => {
    const res = await request(app)
      .get(`/api/v1/drivers/${data.driverNic1}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.nic).to.equal(data.driverNic1);
    expect(res.body.data.district).to.be.an('object');
    expect(res.body.data.province).to.be.an('object');
    expect(res.body.data.fullName).to.be.a('string');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/drivers/${data.driverNic1}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 for non-existent NIC', async () => {
    const res = await request(app)
      .get('/api/v1/drivers/999999999X')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get(`/api/v1/drivers/${data.driverNic1}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/drivers/${data.driverNic1}`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });
});

//test create a new driver endpoint
describe('DRIVERS — POST /api/v1/drivers', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  const newDriver = () => ({
    fullName: 'New Test Driver',
    nic: `9${Date.now().toString().slice(-8)}V`,
    licenseNo: `TL-NEW-${Date.now()}`,
    contactNumber: '0771234567',
    district: data.colomboName,
    province: data.westernName,
  });

  it('should return 201 when hq_admin creates a driver', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newDriver());
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.nic).to.be.a('string');
    expect(res.body.data.fullName).to.be.a('string');
  });

  it('should return 201 when station_officer creates a driver', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${stationToken}`)
      .send(newDriver());
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).post('/api/v1/drivers').send(newDriver());
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${getInvalidToken()}`)
      .send(newDriver());
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${provinceToken}`)
      .send(newDriver());
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(newDriver());
    expect(res.status).to.equal(403);
  });

  it('should return 404 when district name does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newDriver(), district: 'NoSuchDistrict' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 409/500 for duplicate NIC', async () => {
    const body = newDriver();
    await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    const res = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...body, licenseNo: `TL-DUP-${Date.now()}` });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});

//test update exisiting drivers enpoint
describe('DRIVERS — PATCH /api/v1/drivers/:nic', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 when hq_admin updates a driver', async () => {
    const res = await request(app)
      .patch(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ contactNumber: '0779999999' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.contactNumber).to.equal('0779999999');
  });

  it('should return 200 when station_officer updates a driver', async () => {
    const res = await request(app)
      .patch(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ contactNumber: '0778888888' });
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('should return 404 for non-existent NIC', async () => {
    const res = await request(app)
      .patch('/api/v1/drivers/000000000X')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ contactNumber: '0770000000' });
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .patch(`/api/v1/drivers/${data.driverNic2}`)
      .send({ contactNumber: '0770000000' });
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .patch(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${provinceToken}`)
      .send({ contactNumber: '0770000000' });
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .patch(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ contactNumber: '0770000000' });
    expect(res.status).to.equal(403);
  });
});

//test delete a driver permanently endpoint
describe('DRIVERS — DELETE /api/v1/drivers/:nic', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 204 when hq_admin deletes a driver', async () => {
    const res = await request(app)
      .delete(`/api/v1/drivers/${data.driverNic3}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(204);
  });

  it('should return 404 when driver does not exist', async () => {
    const res = await request(app)
      .delete('/api/v1/drivers/999000000X')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).delete(`/api/v1/drivers/${data.driverNic2}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for provincial_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for station_officer', async () => {
    const res = await request(app)
      .delete(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(403);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .delete(`/api/v1/drivers/${data.driverNic2}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});
