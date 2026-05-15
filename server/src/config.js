const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'shangwen_ordering',
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
    maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 5 * 1024 * 1024),
  },
}

module.exports = {
  config,
}
