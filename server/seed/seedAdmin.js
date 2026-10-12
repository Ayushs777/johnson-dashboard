const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Installation = require('../models/Installation');
const ServiceRecord = require('../models/ServiceRecord');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('Database connection failed. Seeding aborted.');
      process.exit(1);
    }

    console.log('Seeding Johnson Lifts & Escalators Database...');

    // 1. Seed Users (Admin, Manager, Employee, Viewer)
    const adminUser = await User.findOne({ userId: 'admin' });
    let adminObj;

    if (!adminUser) {
      adminObj = await User.create({
        userId: 'admin',
        name: 'System Administrator',
        email: 'admin@johnsonlifts.com',
        password: 'admin123',
        role: 'Admin',
        status: 'Active',
      });
      console.log('Admin account created: User ID: admin | Password: admin123');
    } else {
      adminObj = adminUser;
      console.log('Admin account already exists.');
    }

    // Seed additional demo users if not present
    // Removed dummy users (manager01, ayush, viewer01)

    // Removed dummy Customers
    
    // Removed dummy Installations
    
    // Removed dummy Service Records
    
    // Removed dummy Complaints
    
    // Removed dummy Notifications

    console.log('Database seeding completed successfully!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during database seed:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
