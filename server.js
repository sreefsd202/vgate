
// server.js - Main Entry Point
const app = require('./index');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Campus Gate Pass System Server Started');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 API Endpoints:');
  console.log('  Student: POST /register, POST /login, POST /form-fill/:id');
  console.log('  Tutor: POST /tutor/register, POST /tutor/login');
  console.log('  Security: POST /api/security/approve, POST /api/security/reject');
  console.log('  Gate Pass: POST /generate-qr/:id, POST /verify-students');
  console.log('  Admin: GET /admin/students, GET /admin/tutors, etc.');
  console.log('');
  console.log('🧪 Test SMS: POST /send-test-sms');
  console.log('='.repeat(60) + '\n');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
//[file content end]