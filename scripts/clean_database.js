import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../server/models/Order.js';
import OrderCounter from '../server/models/OrderCounter.js';
import Table from '../server/models/Table.js';
import SettingAuditLog from '../server/models/SettingAuditLog.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_pos';

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected.');

  console.log('🧹 Purging Orders...');
  const orderRes = await Order.deleteMany({});
  console.log(`Deleted ${orderRes.deletedCount} orders.`);

  console.log('🧹 Purging OrderCounter sequences...');
  const counterRes = await OrderCounter.deleteMany({});
  console.log(`Deleted ${counterRes.deletedCount} counter records.`);

  console.log('🧹 Resetting all Tables to FREE...');
  const tableRes = await Table.updateMany({}, {
    $set: {
      status: 'FREE',
      currentOrderId: null,
      currentOrderNumber: null,
      currentTotal: 0,
      itemCount: 0,
      openedAt: null
    }
  });
  console.log(`Reset ${tableRes.modifiedCount} tables.`);

  console.log('🧹 Purging audit logs...');
  const auditRes = await SettingAuditLog.deleteMany({});
  console.log(`Deleted ${auditRes.deletedCount} audit logs.`);

  console.log('🎉 Database cleaned successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
