const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');

async function seedDatabase() {
  const uri = 'mongodb+srv://ahmedharby138:HV67NtvnQwISaVpt@university-attendance.667xlvt.mongodb.net/university-attendance?retryWrites=true&w=majority&appName=university-attendance'; // Update with your MongoDB connection string
  const client = new MongoClient(uri);
  const dbName = 'university-attendance'; // Replace with your database name
  const collectionName = 'users'; // Replace with your collection name

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Prepare common password hash
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Admin user
    const admin = {
      _id: new ObjectId(), // Automatically generate a unique ObjectId
      name: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Instructor user
    const instructor = {
      _id: new ObjectId(), // Automatically generate a unique ObjectId
      name: 'Instructor User',
      email: 'instructor@gmail.com',
      password: hashedPassword,
      role: 'instructor',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate 100 students with Arabic names
    const students = [];
    for (let i = 1; i <= 100; i++) {
      students.push({
        _id: new ObjectId(), // Automatically generate a unique ObjectId
        name: `طالب ${i}`, // Arabic name for "Student" followed by the number
        email: `student${i}@example.com`,
        password: hashedPassword,
        role: 'student',
        studentId: `${10000 + i}`, // Generate unique student IDs starting from 10001
        department: 'Computer Science',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert data into collection
    await collection.insertMany([admin, instructor, ...students]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedDatabase();