import { createAdminUser } from '../utils/createAdminUser';

// Replace these with your desired admin credentials
const adminEmail = 'admin@example.com';
const adminPassword = 'your-secure-password';

createAdminUser(adminEmail, adminPassword)
  .then(() => {
    console.log('Admin user created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }); 