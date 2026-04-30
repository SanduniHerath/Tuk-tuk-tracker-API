//this is the test/setup.js
import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

//force google dns
dns.setServers(['8.8.8.8', '8.8.4.4']);

//never run tests against actual db
const MONGO_URI_TEST = process.env.MONGO_URI_TEST;

if (!MONGO_URI_TEST) {
  console.error(
    '\n FATAL: MONGO_URI_TEST is not set in your .env file.\n' +
    '   Add: MONGO_URI_TEST=mongodb+srv://...tuktuk_tracker_test\n' +
    '   Tests WILL NOT run against the production database.\n'
  );
  process.exit(1);
}

//refuse to connect if the URI points to the actual db name
const prodURI = process.env.MONGO_URI || '';
if (MONGO_URI_TEST === prodURI) {
  console.error(
    '\n FATAL: MONGO_URI_TEST is the same as MONGO_URI (actual).\n' +
    '   Use a SEPARATE test database cluster/database.\n'
  );
  process.exit(1);
}

before(async () => {
  console.log('--- setup.js before() running ---');
  mongoose.set('strictQuery', false);

  const MONGO_URI_TEST = process.env.MONGO_URI_TEST;
  console.log('Connecting to Test DB...');
  await mongoose.connect(MONGO_URI_TEST);
  console.log(`Test DB connected: ${mongoose.connection.name}`);
});

after(async () => {
  console.log('--- setup.js after() running ---');
  await mongoose.disconnect();
  console.log('Test DB disconnected cleanly.');
});

