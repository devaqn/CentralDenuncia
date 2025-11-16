import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();


const pool = mysql.createPool({
  host: localhost,
  user: root,
  password: 123456,
  database:canalDenuncia,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;