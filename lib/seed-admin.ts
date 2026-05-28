import { db } from './db';
import { users } from './schema';

async function seedAdmin() {
  try {
    await db.insert(users).values({
      username: 'admin',
      password: 'admin1234',
      name: 'Admin',
      role: 'admin',
    });
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
