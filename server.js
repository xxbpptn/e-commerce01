import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import sql from 'mssql'; // ลบบรรทัดนี้
import mysql from 'mysql2/promise'; // เพิ่มบรรทัดนี้
import multer from 'multer';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3000;

// เปลี่ยน config สำหรับ MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', // ใช้ environment variable หรือ 'localhost' เป็น default
  user: process.env.DB_USER || 'root',      // ใช้ environment variable หรือ 'root' เป็น default
  password: process.env.DB_PASSWORD || 'password', // ใช้ environment variable หรือ 'password' เป็น default
  database: process.env.DB_NAME || 'myDatabase',   // ใช้ environment variable หรือ 'myDatabase' เป็น default
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.'));
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const isValid = validExtensions.includes(extension);
    const fileExtension = isValid ? extension : '';
    cb(null, `${Date.now()}_${Math.floor(Math.random() * 90000) + 10000}${fileExtension}`);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Authentication endpoint
app.post('/auth', async (req, res) => {
  let connection;
  try {
    const user = req.body;
    connection = await mysql.createConnection(dbConfig); // สร้าง connection
    const [rows] = await connection.execute('SELECT * FROM account WHERE userName = ?', [user.username]);

    if (rows.length > 0) {
      const userFromQuery = rows[0];
      if (user.password === userFromQuery.userPassword) {
        const token = jwt.sign(
          { id: userFromQuery.id, username: userFromQuery.userName },
          "1234",
          { expiresIn: '12h' }
        );
        res.json({ message: 'Authenticate', token });
      } else {
        res.json({ message: 'Invalid credentials' });
      }
    } else {
      res.json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) connection.end(); // ปิด connection
  }
});

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).json(req.file.filename);
});

// Fetch all products endpoint
app.get('/product', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM product');
    res.json(rows);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) connection.end();
  }
});

// Fetch a single product by ID endpoint
app.get('/product/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM product WHERE id = ?', [id]);

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Fetch product by ID error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) connection.end();
  }
});

// Add new product endpoint
app.post('/products', async (req, res) => {
  let connection;
  try {
    const newProduct = {
      name: req.body.name,
      image: req.body.image,
      price: req.body.price,
      description: req.body.description,
      type: req.body.type,
    };

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO product (productName, productPrice, productDescription, picture, type) VALUES (?, ?, ?, ?, ?)',
      [newProduct.name, newProduct.price, newProduct.description, newProduct.image, newProduct.type]
    );
    
    res.send('Product added successfully!');
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) connection.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});