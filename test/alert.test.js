//this test file checks all /api/v1/alerts endpoints
import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import {
  getAdminToken, getProvinceToken, getStationToken,
  getDeviceToken, getInvalidToken, getExpiredToken
} from './helpers/auth.helper.js';
import { seedTestData, clearTestData } from './helpers/seed.helper.js';

describe('ALERTS — GET /api/v1/alerts/suspicious', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and suspicious vehicles for hq_admin', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.totalSuspiciousVehicles).to.be.a('number');
    expect(res.body.data).to.be.an('array');
    expect(res.body.anomalySummary).to.be.an('object');
    expect(res.body.filters).to.be.an('object');
  });

  it('should return correct anomalySummary keys', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    const summary = res.body.anomalySummary;
    expect(summary).to.have.property('NIGHT_MOVEMENT');
    expect(summary).to.have.property('SPEEDING');
    expect(summary).to.have.property('BOUNDARY_CROSS');
    expect(summary).to.have.property('STATIONARY');
    expect(summary).to.have.property('ERRATIC');
  });

  it('should include severityScore in each result', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    res.body.data.forEach(v => {
      expect(v.severityScore).to.be.a('number');
      expect(v.anomalyTypes).to.be.an('array');
    });
  });

  it('should return 200 for provincial_officer (scoped to their province)', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.filters.scope).to.equal('provincial_officer');
  });

  it('should return 200 for station_officer (scoped to their district)', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.filters.scope).to.equal('station_officer');
  });

  //auth test
  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/alerts/suspicious');
    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
    expect(res.body.success).to.equal(false);
  });

  //atert type filter
  it('should return only SPEEDING anomalies when ?type=SPEEDING', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=SPEEDING')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.filters.type).to.equal('SPEEDING');
    res.body.data.forEach(v => {
      expect(v.latestAnomalyType).to.equal('SPEEDING');
    });
  });

  it('should return only NIGHT_MOVEMENT anomalies when ?type=NIGHT_MOVEMENT', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=NIGHT_MOVEMENT')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.filters.type).to.equal('NIGHT_MOVEMENT');
    res.body.data.forEach(v => {
      expect(v.latestAnomalyType).to.equal('NIGHT_MOVEMENT');
    });
  });

  it('should return only BOUNDARY_CROSS anomalies when ?type=BOUNDARY_CROSS', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=BOUNDARY_CROSS')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.filters.type).to.equal('BOUNDARY_CROSS');
  });

  it('should return only STATIONARY anomalies when ?type=STATIONARY', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=STATIONARY')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.filters.type).to.equal('STATIONARY');
  });

  it('should return only ERRATIC anomalies when ?type=ERRATIC', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=ERRATIC')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.filters.type).to.equal('ERRATIC');
  });

  it('should return 400 for invalid ?type= value', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious?type=INVALID_TYPE')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include('Invalid anomaly type');
  });

  
  it('should accept ?since= filter and return alerts after that time', async () => {
    const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious?since=${since}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.filters.since).to.equal(since);
  });

  it('should return fewer results with recent ?since= than with old ?since=', async () => {
    const recent = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const old    = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    const resRecent = await request(app)
      .get(`/api/v1/alerts/suspicious?since=${recent}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const resOld = await request(app)
      .get(`/api/v1/alerts/suspicious?since=${old}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resRecent.status).to.equal(200);
    expect(resOld.status).to.equal(200);
    expect(resOld.body.totalSuspiciousVehicles).to.be.gte(
      resRecent.body.totalSuspiciousVehicles
    );
  });

  //role test
  it('hq_admin should see all provinces suspicious vehicles', async () => {
    const adminRes = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${adminToken}`);
    const provinceRes = await request(app)
      .get('/api/v1/alerts/suspicious')
      .set('Authorization', `Bearer ${provinceToken}`);

    expect(adminRes.status).to.equal(200);
    expect(provinceRes.status).to.equal(200);
    expect(adminRes.body.totalSuspiciousVehicles).to.be.gte(
      provinceRes.body.totalSuspiciousVehicles
    );
  });
});

//get suspicious vihicles by district name endpoint
describe('ALERTS — GET /api/v1/alerts/suspicious/district/:districtName', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and suspicious pings for valid district', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    expect(res.body.count).to.be.a('number');
   //all return pings must be anomolous
    res.body.data.forEach(p => {
      expect(p.isAnomaly).to.equal(true);
    });
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${encodeURIComponent(data.colomboName)}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 404 for non-existent district', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/suspicious/district/FakeDistrict')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${data.colomboName}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${data.colomboName}`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/district/${data.colomboName}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});

//get suspicious vehicles by province name endpoint
describe('ALERTS — GET /api/v1/alerts/suspicious/province/:provinceName', () => {
  let adminToken, provinceToken, stationToken, deviceToken;
  let data;

  before(async () => {
    data = await seedTestData();
    [adminToken, provinceToken, stationToken, deviceToken] = await Promise.all([
      getAdminToken(), getProvinceToken(), getStationToken(), getDeviceToken()
    ]);
  });
  after(async () => { await clearTestData(); });

  it('should return 200 and suspicious vehicles for valid province', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    expect(res.body.count).to.be.a('number');
  });

  it('should return 200 for provincial_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${provinceToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return 200 for station_officer', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${encodeURIComponent(data.westernName)}`)
      .set('Authorization', `Bearer ${stationToken}`);
    expect(res.status).to.equal(200);
  });

  it('should return empty data for province with no anomalies (not 404)', async () => {
    
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${encodeURIComponent(data.centralName)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.be.an('array');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${data.westernName}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${data.westernName}`)
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 401 with expired token', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${data.westernName}`)
      .set('Authorization', `Bearer ${getExpiredToken()}`);
    expect(res.status).to.equal(401);
  });

  it('should return 403 for gps_device', async () => {
    const res = await request(app)
      .get(`/api/v1/alerts/suspicious/province/${data.westernName}`)
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(res.status).to.equal(403);
  });
});
