const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from Backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/missionschool';

async function syncRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const adminEmails = String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const teacherEmails = String(process.env.TEACHER_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    console.log('Admin emails from .env:', adminEmails);
    console.log('Teacher emails from .env:', teacherEmails);

    // Update Admins
    if (adminEmails.length > 0) {
      const res = await User.updateMany(
        { email: { $in: adminEmails }, role: { $ne: 'admin' } },
        { $set: { role: 'admin' } }
      );
      console.log(`Updated ${res.modifiedCount} users to admin role.`);
    }

    // Update Teachers (those not in admin list)
    if (teacherEmails.length > 0) {
      const res = await User.updateMany(
        { 
          email: { $in: teacherEmails, $nin: adminEmails }, 
          role: { $ne: 'teacher' } 
        },
        { $set: { role: 'teacher' } }
      );
      console.log(`Updated ${res.modifiedCount} users to teacher role.`);
    }

    console.log('Sync completed.');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

syncRoles();
