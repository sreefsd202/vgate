// // index.js - PART 1: Setup, Config, and Authentication Routes
// const express = require("express");
// const app = express();
// const QRCode = require('qrcode');
// const cors = require('cors');
// const multer = require('multer');
// const bcrypt = require('bcryptjs');
// require('dotenv').config();

// // Models
// const Student = require('./models/student');
// const Tutor = require('./models/tutor');
// const GatePass = require('./models/GatePass');

// // Services
// const connectDB = require('./connection');
// const notificationService = require('./services/notificationService');

// // Routes
// const securityRoutes = require('./routes/securityRoutes');

// // ========== MIDDLEWARE SETUP ==========
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Security headers
// app.use((req, res, next) => {
//   res.set('X-Content-Type-Options', 'nosniff');
//   res.set('X-Frame-Options', 'DENY');
//   res.set('X-XSS-Protection', '1; mode=block');
//   next();
// });

// // ========== MULTER SETUP ==========
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPEG and PNG images are allowed'));
//     }
//   }
// });

// // ========== DATABASE CONNECTION ==========
// connectDB().then(success => {
//   if (success) {
//     console.log('✅ Database initialization complete');
//   } else {
//     console.error('❌ Database connection failed');
//     process.exit(1);
//   }
// }).catch(err => {
//   console.error('❌ Fatal error:', err);
//   process.exit(1);
// });

// // ========== FAST2SMS CONFIG CHECK ==========
// console.log('\n📱 SMS Configuration:');
// if (process.env.FAST2SMS_API_KEY) {
//   console.log('✅ Fast2SMS API Key configured');
//   console.log('🚀 SMS notifications are ready');
// } else {
//   console.log('⚠️  Fast2SMS API Key missing - SMS will be simulated');
//   console.log('📖 Get your API key from: https://www.fast2sms.com/dashboard/dev-api');
//   console.log('💡 Add FAST2SMS_API_KEY to your .env file');
// }
// console.log('');

// // ========== STATIC FILES ==========
// app.use(express.static('public'));

// // ========== SECURITY ROUTES ==========
// app.use('/api/security', securityRoutes);

// // ========== VALIDATION HELPERS ==========
// const validateStudentRegistration = (data) => {
//   const errors = [];
//   if (!data.admNo || isNaN(data.admNo) || Number(data.admNo) <= 0) {
//     errors.push('Valid admission number required');
//   }
//   if (!data.name || data.name.trim().length < 2) {
//     errors.push('Name must be at least 2 characters');
//   }
//   if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
//     errors.push('Valid email address required');
//   }
//   if (!data.phone || data.phone.toString().length !== 10 || isNaN(data.phone)) {
//     errors.push('Valid 10-digit phone number required');
//   }
//   if (!data.parent_No || data.parent_No.toString().length !== 10 || isNaN(data.parent_No)) {
//     errors.push('Valid 10-digit parent phone number required');
//   }
//   if (!data.password || data.password.length < 6) {
//     errors.push('Password must be at least 6 characters');
//   }
//   if (!data.dept || data.dept.trim().length === 0) {
//     errors.push('Department is required');
//   }
//   if (!data.sem || isNaN(data.sem) || Number(data.sem) < 1 || Number(data.sem) > 8) {
//     errors.push('Semester must be between 1 and 8');
//   }
//   if (!data.tutorName || data.tutorName.trim().length === 0) {
//     errors.push('Tutor name is required');
//   }
//   return errors;
// };

// const validateTutorRegistration = (data) => {
//   const errors = [];
//   if (!data.empId || data.empId.trim().length === 0) {
//     errors.push('Employee ID is required');
//   }
//   if (!data.name || data.name.trim().length < 2) {
//     errors.push('Name must be at least 2 characters');
//   }
//   if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
//     errors.push('Valid email address required');
//   }
//   if (!data.phone || data.phone.toString().length !== 10 || isNaN(data.phone)) {
//     errors.push('Valid 10-digit phone number required');
//   }
//   if (!data.dept || data.dept.trim().length === 0) {
//     errors.push('Department is required');
//   }
//   if (!data.password || data.password.length < 6) {
//     errors.push('Password must be at least 6 characters');
//   }
//   return errors;
// };

// const sanitizeString = (str) => {
//   if (!str) return '';
//   return String(str)
//     .trim()
//     .replace(/[<>]/g, '')
//     .substring(0, 255);
// };

// // ========== STUDENT AUTHENTICATION ==========

// // Student registration
// app.post('/register', upload.single('image'), async (req, res) => {
//   try {
//     const { admNo, name, dept, sem, tutorName, phone, email, password, parent_No } = req.body;

//     if (!admNo || !name || !dept || !sem || !tutorName || !phone || !email || !password || !parent_No) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'All fields are required' 
//       });
//     }

//     const validationErrors = validateStudentRegistration(req.body);
//     if (validationErrors.length > 0) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Validation failed', 
//         errors: validationErrors 
//       });
//     }

//     const existingStudent = await Student.findOne({
//       $or: [
//         { admNo: Number(admNo) },
//         { email: email.toLowerCase() }
//       ]
//     });

//     if (existingStudent) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Student with this admission number or email already exists' 
//       });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     const student = new Student({
//       admNo: Number(admNo),
//       name: sanitizeString(name),
//       dept: sanitizeString(dept),
//       sem: Number(sem),
//       tutorName: sanitizeString(tutorName),
//       phone: Number(phone),
//       email: email.toLowerCase().trim(),
//       parent_No: Number(parent_No),
//       password: hashedPassword,
//       image: req.file ? req.file.buffer : undefined
//     });

//     await student.save();

//     res.status(201).json({
//       success: true,
//       message: '✅ Registration successful',
//       studentId: student._id,
//       student: {
//         _id: student._id,
//         name: student.name,
//         admNo: student.admNo,
//         dept: student.dept,
//         email: student.email
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     if (error.code === 11000) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Student with this admission number or email already exists' 
//       });
//     }
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Validation error', 
//         error: error.message 
//       });
//     }
//     res.status(500).json({ 
//       success: false,
//       message: 'Registration failed', 
//       error: error.message 
//     });
//   }
// });

// // Student login
// app.post('/login', async (req, res) => {
//   try {
//     const { admNo, password } = req.body;

//     if (!admNo || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Admission number and password required' 
//       });
//     }

//     const student = await Student.findOne({ admNo: Number(admNo) }).select('+password');

//     if (!student || !(await bcrypt.compare(password, student.password))) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid credentials' 
//       });
//     }

//     res.json({
//       success: true,
//       message: '✅ Login successful',
//       student: {
//         _id: student._id,
//         name: student.name,
//         admNo: student.admNo,
//         dept: student.dept,
//         email: student.email,
//         parent_No: student.parent_No
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error during login' 
//     });
//   }
// });

// // Get student by ID
// app.get('/student/:id', async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id).select('-password');
//     if (!student) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Student not found' 
//       });
//     }
//     res.json({
//       success: true,
//       student
//     });
//   } catch (error) {
//     console.error('Error fetching student:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Error fetching student', 
//       error: error.message 
//     });
//   }
// });

// // Get student image
// app.get('/student/image/:id', async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student || !student.image) {
//       return res.status(404).send('Image not found');
//     }
//     res.set('Content-Type', 'image/jpeg');
//     res.send(student.image);
//   } catch (err) {
//     console.error('Error fetching student image:', err);
//     res.status(500).send('Server error');
//   }
// });

// // ========== TUTOR AUTHENTICATION ==========

// // Tutor registration
// app.post('/tutor/register', upload.single('image'), async (req, res) => {
//   try {
//     const { empId, name, dept, email, password, phone } = req.body;

//     const validationErrors = validateTutorRegistration(req.body);
//     if (validationErrors.length > 0) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Validation failed', 
//         errors: validationErrors 
//       });
//     }

//     const existingTutor = await Tutor.findOne({
//       $or: [
//         { empId: empId },
//         { email: email.toLowerCase() }
//       ]
//     });

//     if (existingTutor) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Tutor with this employee ID or email already exists' 
//       });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     const tutor = new Tutor({
//       empId: sanitizeString(empId),
//       name: sanitizeString(name),
//       dept: sanitizeString(dept),
//       email: email.toLowerCase().trim(),
//       phone: Number(phone),
//       password: hashedPassword,
//       image: req.file ? req.file.buffer : undefined,
//       verified: false,
//       status: 'pending'
//     });

//     await tutor.save();

//     res.status(201).json({
//       success: true,
//       message: '✅ Tutor registered successfully. Awaiting admin verification'
//     });
//   } catch (error) {
//     console.error('Tutor registration error:', error);
//     if (error.code === 11000) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Tutor with this ID or email already exists' 
//       });
//     }
//     res.status(500).json({ 
//       success: false,
//       message: 'Tutor registration failed', 
//       error: error.message 
//     });
//   }
// });

// // Tutor login
// app.post('/tutor/login', async (req, res) => {
//   try {
//     const { empId, password } = req.body;

//     if (!empId || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Employee ID and password required' 
//       });
//     }

//     const tutor = await Tutor.findOne({ empId: empId }).select('+password');

//     if (!tutor || !(await bcrypt.compare(password, tutor.password))) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid credentials' 
//       });
//     }

//     if (!tutor.verified) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Your account is pending admin approval. Please wait for approval.' 
//       });
//     }

//     res.json({
//       success: true,
//       message: '✅ Login successful',
//       tutor: {
//         _id: tutor._id,
//         name: tutor.name,
//         empId: tutor.empId,
//         dept: tutor.dept,
//         email: tutor.email
//       }
//     });
//   } catch (error) {
//     console.error('Tutor login error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error during login' 
//     });
//   }
// });

// // Get tutor by ID
// app.get('/tutor/:id', async (req, res) => {
//   try {
//     const tutor = await Tutor.findById(req.params.id).select('-password');
//     if (!tutor) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Tutor not found' 
//       });
//     }
//     res.json({
//       success: true,
//       tutor
//     });
//   } catch (error) {
//     console.error('Error fetching tutor:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Error fetching tutor', 
//       error: error.message 
//     });
//   }
// });

// // Get tutor image
// app.get('/tutor/image/:id', async (req, res) => {
//   try {
//     const tutor = await Tutor.findById(req.params.id);
//     if (!tutor || !tutor.image) {
//       return res.status(404).send('Image not found');
//     }
//     res.set('Content-Type', 'image/jpeg');
//     res.send(tutor.image);
//   } catch (err) {
//     console.error('Error fetching tutor image:', err);
//     res.status(500).send('Server error');
//   }
// });

// // ========== ADMIN AUTHENTICATION ==========

// // Admin login
// app.post('/admin/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Username and password required' 
//       });
//     }

//     // Simple admin login (in production, use JWT)
//     if (username === 'admin' && password === '12345') {
//       return res.json({
//         success: true,
//         message: '✅ Admin login successful',
//         admin: { username: 'admin' }
//       });
//     }

//     res.status(401).json({ 
//       success: false,
//       message: 'Invalid admin credentials' 
//     });
//   } catch (error) {
//     console.error('Admin login error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error during admin login' 
//     });
//   }
// });

// module.exports = app;


// // index.js - PART 2: Gate Pass Workflow Routes
// // STEP 1: Student submits form
// // STEP 2: Tutor approves
// // STEP 3: Student generates QR code
// // STEP 4: Security scans and verifies (sends SMS to parent & tutor)

// const express = require('express');
// const app = express();
// const QRCode = require('qrcode');
// const multer = require('multer');
// require('dotenv').config();

// const Student = require('./models/student');
// const Tutor = require('./models/tutor');
// const GatePass = require('./models/GatePass');
// const notificationService = require('./services/notificationService');

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }
// });

// // ========== STEP 1: STUDENT SUBMITS GATE PASS FORM ==========

// /**
//  * POST /form-fill/:studentId
//  * Student submits gate pass request form
//  * Status: 'pending' (waiting for tutor approval)
//  */
// app.post('/form-fill/:id', async (req, res) => {
//   const { id } = req.params;
//   const { purpose, date, returnTime, groupMembers } = req.body;

//   try {
//     // Validate required fields
//     if (!purpose || !date || !returnTime) {
//       return res.status(400).json({
//         success: false,
//         message: 'Purpose, date, and return time are required'
//       });
//     }

//     // Check if date is not in the past
//     if (new Date(date) < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Date cannot be in the past'
//       });
//     }

//     // Find main student
//     const mainStudent = await Student.findById(id);
//     if (!mainStudent) {
//       return res.status(404).json({
//         success: false,
//         message: 'Student not found'
//       });
//     }

//     // Create new gate pass (status: pending)
//     const gatePass = new GatePass({
//       studentId: mainStudent._id,
//       purpose: purpose.trim(),
//       date: new Date(date),
//       returnTime: returnTime.trim(),
//       groupMembers: (groupMembers || []).map(m => ({
//         name: m.name?.trim(),
//         admNo: Number(m.admNo || m.admissionNo),
//         dept: m.dept?.trim()
//       })),
//       status: 'pending'
//     });

//     await gatePass.save();

//     // Update main student
//     mainStudent.groupId = gatePass._id;
//     mainStudent.purpose = purpose.trim();
//     mainStudent.date = new Date(date);
//     mainStudent.returnTime = returnTime.trim();
//     mainStudent.passStatus = 'pending';
//     await mainStudent.save();

//     // Update group members
//     if (groupMembers && groupMembers.length > 0) {
//       for (const member of groupMembers) {
//         const admNo = member.admNo || member.admissionNo;
//         if (admNo) {
//           const existing = await Student.findOne({ admNo: Number(admNo) });
//           if (existing) {
//             existing.groupId = gatePass._id;
//             existing.purpose = purpose.trim();
//             existing.date = new Date(date);
//             existing.returnTime = returnTime.trim();
//             existing.passStatus = 'pending';
//             await existing.save();
//           }
//         }
//       }
//     }

//     // Send notification to tutor
//     const tutor = await Tutor.findOne({ name: mainStudent.tutorName });
//     if (tutor && tutor.phone) {
//       try {
//         await notificationService.sendFormSubmissionNotification(
//           tutor.phone,
//           tutor.name,
//           mainStudent.name,
//           mainStudent.admNo,
//           purpose,
//           date
//         );
//         console.log(`✅ Form submission SMS sent to tutor (${tutor.phone})`);
//       } catch (err) {
//         console.warn('⚠️  Failed to send form submission SMS to tutor:', err.message);
//       }
//     }

//     return res.status(201).json({
//       success: true,
//       message: '✅ Gate pass form submitted successfully. Awaiting tutor approval.',
//       gatePass,
//       student: mainStudent
//     });
//   } catch (err) {
//     console.error('Form fill error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Form fill failed',
//       error: err.message
//     });
//   }
// });

// // ========== STEP 2: TUTOR APPROVES GATE PASS ==========

// /**
//  * POST /tutor/gatepass/:id/approve
//  * Tutor approves or rejects gate pass request
//  * Status changes to: 'approved' or 'rejected'
//  * Sends SMS to student's parent
//  */
// app.post('/tutor/gatepass/:id/approve', async (req, res) => {
//   try {
//     const { status, tutorId, reason } = req.body;

//     if (!status || !['approved', 'rejected'].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid status (approved/rejected) is required'
//       });
//     }

//     const updatedPass = await GatePass.findByIdAndUpdate(
//       req.params.id,
//       {
//         status,
//         approvedBy: status === 'approved' ? tutorId : null,
//         approvedAt: status === 'approved' ? new Date() : null,
//         rejectionReason: status === 'rejected' ? reason : null
//       },
//       { new: true }
//     ).populate('studentId', 'name admNo dept parent_No');

//     if (!updatedPass) {
//       return res.status(404).json({
//         success: false,
//         message: 'Gate pass not found'
//       });
//     }

//     // Update all students in group
//     await Student.updateMany(
//       { groupId: req.params.id },
//       {
//         passStatus: status,
//         purpose: status === 'approved' ? updatedPass.purpose : null,
//         date: status === 'approved' ? updatedPass.date : null,
//         returnTime: status === 'approved' ? updatedPass.returnTime : null
//       }
//     );

//     // Update main student
//     if (updatedPass.studentId && updatedPass.studentId._id) {
//       await Student.findByIdAndUpdate(
//         updatedPass.studentId._id,
//         {
//           passStatus: status,
//           purpose: status === 'approved' ? updatedPass.purpose : null,
//           date: status === 'approved' ? updatedPass.date : null,
//           returnTime: status === 'approved' ? updatedPass.returnTime : null
//         }
//       );
//     }

//     // Send SMS notification to parent
//     if (updatedPass.studentId && updatedPass.studentId.parent_No) {
//       try {
//         if (status === 'approved') {
//           await notificationService.sendApprovalNotification(
//             updatedPass.studentId.parent_No,
//             updatedPass.studentId.name,
//             updatedPass.studentId.admNo,
//             updatedPass.purpose,
//             updatedPass.date
//           );
//           console.log(`✅ Approval SMS sent to parent (${updatedPass.studentId.parent_No})`);
//         } else {
//           await notificationService.sendRejectionNotification(
//             updatedPass.studentId.parent_No,
//             updatedPass.studentId.name,
//             updatedPass.studentId.admNo,
//             reason
//           );
//           console.log(`✅ Rejection SMS sent to parent (${updatedPass.studentId.parent_No})`);
//         }
//       } catch (err) {
//         console.warn('⚠️  Failed to send SMS to parent:', err.message);
//       }
//     }

//     res.json({
//       success: true,
//       message: `✅ Gate pass ${status} successfully. SMS sent to parent.`,
//       gatePass: updatedPass
//     });
//   } catch (error) {
//     console.error('Error updating gate pass:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating gate pass',
//       error: error.message
//     });
//   }
// });

// // ========== STEP 3: STUDENT GENERATES QR CODE ==========

// /**
//  * POST /generate-qr/:studentId
//  * Student generates QR code after tutor approves
//  * QR code contains link to verification page
//  */
// app.post("/generate-qr/:studentId", async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const student = await Student.findById(studentId);

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found"
//       });
//     }

//     // Get gate pass to verify it's approved
//     let gatePass = null;
//     if (student.groupId) {
//       gatePass = await GatePass.findById(student.groupId);
//     }

//     if (!gatePass || gatePass.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: "Gate pass must be approved before generating QR code"
//       });
//     }

//     // Generate QR code URL (verification page)
//     const verifyUrl = `${req.protocol}://${req.get('host')}/gatepass/${studentId}`;
//     const qrImage = await QRCode.toDataURL(verifyUrl);

//     res.json({
//       success: true,
//       message: "✅ QR code generated successfully",
//       qrImage,
//       studentData: {
//         name: student.name,
//         admNo: student.admNo,
//         dept: student.dept,
//         purpose: gatePass.purpose,
//         date: gatePass.date,
//         returnTime: gatePass.returnTime
//       }
//     });
//   } catch (err) {
//     console.error('QR generation error:', err);
//     res.status(500).json({
//       success: false,
//       message: "QR generation failed",
//       error: err.message
//     });
//   }
// });

// // ========== STEP 4: SECURITY SCANS QR & VERIFIES ==========

// /**
//  * POST /verify-students
//  * Security scans QR code and verifies students
//  * Sends SMS to parent and tutor with departure information
//  * Status changes to: 'verified'
//  */
// app.post('/verify-students', async (req, res) => {
//   const { studentIds } = req.body;

//   try {
//     if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid student IDs array required'
//       });
//     }

//     // Mark students as verified and update gate pass status
//     const verifiedTime = new Date().toLocaleTimeString('en-IN');

//     await Student.updateMany(
//       { _id: { $in: studentIds } },
//       { verified: true }
//     );

//     // Update gate passes to verified
//     await GatePass.updateMany(
//       { studentId: { $in: studentIds }, status: 'approved' },
//       {
//         status: 'verified',
//         verified: true,
//         verifiedAt: new Date(),
//         verifiedBy: 'Security Officer'
//       }
//     );

//     // Fetch updated student details
//     const students = await Student.find({ _id: { $in: studentIds } });
//     const notificationResults = [];

//     // Send SMS notifications for each verified student
//     for (const student of students) {
//       const notificationLog = {
//         studentName: student.name,
//         admNo: student.admNo,
//         notifications: []
//       };

//       // Get tutor info
//       let tutor = null;
//       if (student.tutorName) {
//         tutor = await Tutor.findOne({ name: student.tutorName });
//       }

//       // Get gate pass info
//       let gatePass = null;
//       if (student.groupId) {
//         gatePass = await GatePass.findById(student.groupId);
//       }
//       if (!gatePass) {
//         gatePass = await GatePass.findOne({ studentId: student._id });
//       }

//       const purpose = gatePass?.purpose || 'Not specified';
//       const returnTime = gatePass?.returnTime || 'Not specified';

//       // SEND SMS TO PARENT
//       if (student.parent_No) {
//         try {
//           await notificationService.sendVerifiedDepartureNotification(
//             student.parent_No,
//             student.name,
//             student.admNo,
//             student.dept,
//             purpose,
//             returnTime,
//             verifiedTime
//           );
//           notificationLog.notifications.push({
//             type: 'parent_sms',
//             recipient: 'Parent',
//             phone: student.parent_No,
//             status: 'success',
//             message: `Parent informed: ${student.name} left campus at ${verifiedTime}`
//           });
//           console.log(`✅ Departure SMS sent to parent (${student.parent_No}) for ${student.name}`);
//         } catch (err) {
//           notificationLog.notifications.push({
//             type: 'parent_sms',
//             recipient: 'Parent',
//             phone: student.parent_No,
//             status: 'failed',
//             error: err.message
//           });
//           console.error(`❌ Failed to send SMS to parent for ${student.name}:`, err.message);
//         }
//       } else {
//         notificationLog.notifications.push({
//           type: 'parent_sms',
//           recipient: 'Parent',
//           status: 'skipped',
//           reason: 'No parent phone number'
//         });
//       }

//       // SEND SMS TO TUTOR
//       if (tutor && tutor.phone) {
//         try {
//           await notificationService.sendVerifiedDepartureNotification(
//             tutor.phone,
//             student.name,
//             student.admNo,
//             student.dept,
//             purpose,
//             returnTime,
//             verifiedTime
//           );
//           notificationLog.notifications.push({
//             type: 'tutor_sms',
//             recipient: 'Tutor',
//             phone: tutor.phone,
//             status: 'success',
//             message: `Tutor informed: ${student.name} left campus at ${verifiedTime}`
//           });
//           console.log(`✅ Departure SMS sent to tutor (${tutor.phone}) for ${student.name}`);
//         } catch (err) {
//           notificationLog.notifications.push({
//             type: 'tutor_sms',
//             recipient: 'Tutor',
//             phone: tutor.phone,
//             status: 'failed',
//             error: err.message
//           });
//           console.error(`❌ Failed to send SMS to tutor for ${student.name}:`, err.message);
//         }
//       } else {
//         notificationLog.notifications.push({
//           type: 'tutor_sms',
//           recipient: 'Tutor',
//           status: 'skipped',
//           reason: tutor ? 'No tutor phone number' : 'Tutor not found'
//         });
//       }

//       notificationResults.push(notificationLog);
//     }

//     res.status(200).json({
//       success: true,
//       message: "✅ Students verified! Departure notifications sent to parents and tutors.",
//       verifiedCount: students.length,
//       verifiedTime,
//       notificationResults
//     });

//   } catch (error) {
//     console.error('Verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Verification failed',
//       error: error.message
//     });
//   }
// });



// index.js - COMPLETE CORRECTED VERSION
// ========== PART 1: Setup, Config, and Authentication ==========

const express = require("express");
const app = express();
const QRCode = require('qrcode');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const Student = require('./models/student');
const Tutor = require('./models/tutor');
const GatePass = require('./models/GatePass');

// Services
const connectDB = require('./connection');
const NotificationService = require('./services/notificationService');

// Routes
const securityRoutes = require('./routes/securityRoutes');

// ========== MIDDLEWARE SETUP ==========
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// ========== MULTER SETUP ==========
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

// ========== DATABASE CONNECTION ==========
connectDB().then(success => {
  if (success) {
    console.log('✅ Database initialization complete');
  } else {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

// ========== FAST2SMS CONFIG CHECK ==========
console.log('\n📱 SMS Configuration:');
if (process.env.FAST2SMS_API_KEY) {
  console.log('✅ Fast2SMS API Key configured');
  console.log('🚀 SMS notifications are ready');
} else {
  console.log('⚠️  Fast2SMS API Key missing - SMS will be simulated');
  console.log('📖 Get your API key from: https://www.fast2sms.com/dashboard/dev-api');
  console.log('💡 Add FAST2SMS_API_KEY to your .env file');
}
console.log('');

// ========== STATIC FILES ==========
app.use(express.static('public'));

// ========== SECURITY ROUTES ==========
app.use('/api/security', securityRoutes);

// ========== VALIDATION HELPERS ==========
const validateStudentRegistration = (data) => {
  const errors = [];
  if (!data.admNo || isNaN(data.admNo) || Number(data.admNo) <= 0) {
    errors.push('Valid admission number required');
  }
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Valid email address required');
  }
  if (!data.phone || data.phone.toString().length !== 10 || isNaN(data.phone)) {
    errors.push('Valid 10-digit phone number required');
  }
  if (!data.parent_No || data.parent_No.toString().length !== 10 || isNaN(data.parent_No)) {
    errors.push('Valid 10-digit parent phone number required');
  }
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!data.dept || data.dept.trim().length === 0) {
    errors.push('Department is required');
  }
  if (!data.sem || isNaN(data.sem) || Number(data.sem) < 1 || Number(data.sem) > 8) {
    errors.push('Semester must be between 1 and 8');
  }
  if (!data.tutorName || data.tutorName.trim().length === 0) {
    errors.push('Tutor name is required');
  }
  return errors;
};

const validateTutorRegistration = (data) => {
  const errors = [];
  if (!data.empId || data.empId.trim().length === 0) {
    errors.push('Employee ID is required');
  }
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Valid email address required');
  }
  if (!data.phone || data.phone.toString().length !== 10 || isNaN(data.phone)) {
    errors.push('Valid 10-digit phone number required');
  }
  if (!data.dept || data.dept.trim().length === 0) {
    errors.push('Department is required');
  }
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  return errors;
};

const sanitizeString = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
};

// ========== STUDENT AUTHENTICATION ==========

// Student registration
app.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { admNo, name, dept, sem, tutorName, phone, email, password, parent_No } = req.body;

    if (!admNo || !name || !dept || !sem || !tutorName || !phone || !email || !password || !parent_No) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    const validationErrors = validateStudentRegistration(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    const existingStudent = await Student.findOne({
      $or: [
        { admNo: Number(admNo) },
        { email: email.toLowerCase() }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({ 
        success: false,
        message: 'Student with this admission number or email already exists' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const student = new Student({
      admNo: Number(admNo),
      name: sanitizeString(name),
      dept: sanitizeString(dept),
      sem: Number(sem),
      tutorName: sanitizeString(tutorName),
      phone: Number(phone),
      email: email.toLowerCase().trim(),
      parent_No: Number(parent_No),
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: '✅ Registration successful',
      studentId: student._id,
      student: {
        _id: student._id,
        name: student.name,
        admNo: student.admNo,
        dept: student.dept,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Student with this admission number or email already exists' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        error: error.message 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Student login
app.post('/login', async (req, res) => {
  try {
    const { admNo, password } = req.body;

    if (!admNo || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Admission number and password required' 
      });
    }

    const student = await Student.findOne({ admNo: Number(admNo) }).select('+password');

    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    res.json({
      success: true,
      message: '✅ Login successful',
      student: {
        _id: student._id,
        name: student.name,
        admNo: student.admNo,
        dept: student.dept,
        email: student.email,
        parent_No: student.parent_No
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Get student by ID
app.get('/student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student', 
      error: error.message 
    });
  }
});

// Get student image
app.get('/student/image/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.image) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(student.image);
  } catch (err) {
    console.error('Error fetching student image:', err);
    res.status(500).send('Server error');
  }
});

// ========== TUTOR AUTHENTICATION ==========

// Tutor registration
app.post('/tutor/register', upload.single('image'), async (req, res) => {
  try {
    const { empId, name, dept, email, password, phone } = req.body;

    const validationErrors = validateTutorRegistration(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    const existingTutor = await Tutor.findOne({
      $or: [
        { empId: empId },
        { email: email.toLowerCase() }
      ]
    });

    if (existingTutor) {
      return res.status(400).json({ 
        success: false,
        message: 'Tutor with this employee ID or email already exists' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const tutor = new Tutor({
      empId: sanitizeString(empId),
      name: sanitizeString(name),
      dept: sanitizeString(dept),
      email: email.toLowerCase().trim(),
      phone: Number(phone),
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined,
      verified: false,
      status: 'pending'
    });

    await tutor.save();

    res.status(201).json({
      success: true,
      message: '✅ Tutor registered successfully. Awaiting admin verification'
    });
  } catch (error) {
    console.error('Tutor registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Tutor with this ID or email already exists' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Tutor registration failed', 
      error: error.message 
    });
  }
});

// Tutor login
app.post('/tutor/login', async (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Employee ID and password required' 
      });
    }

    const tutor = await Tutor.findOne({ empId: empId }).select('+password');

    if (!tutor || !(await bcrypt.compare(password, tutor.password))) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    if (!tutor.verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.' 
      });
    }

    res.json({
      success: true,
      message: '✅ Login successful',
      tutor: {
        _id: tutor._id,
        name: tutor.name,
        empId: tutor.empId,
        dept: tutor.dept,
        email: tutor.email
      }
    });
  } catch (error) {
    console.error('Tutor login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Get tutor by ID
app.get('/tutor/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id).select('-password');
    if (!tutor) {
      return res.status(404).json({ 
        success: false,
        message: 'Tutor not found' 
      });
    }
    res.json({
      success: true,
      tutor
    });
  } catch (error) {
    console.error('Error fetching tutor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tutor', 
      error: error.message 
    });
  }
});

// Get tutor image
app.get('/tutor/image/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor || !tutor.image) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(tutor.image);
  } catch (err) {
    console.error('Error fetching tutor image:', err);
    res.status(500).send('Server error');
  }
});

// ========== ADMIN AUTHENTICATION ==========

// Admin login
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password required' 
      });
    }

    // Simple admin login (in production, use JWT)
    if (username === 'admin' && password === '12345') {
      return res.json({
        success: true,
        message: '✅ Admin login successful',
        admin: { username: 'admin' }
      });
    }

    res.status(401).json({ 
      success: false,
      message: 'Invalid admin credentials' 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during admin login' 
    });
  }
});

// CONTINUE TO NEXT PART...
// ========== PART 2: Gate Pass Workflow Routes ==========

// ========== STEP 1: STUDENT SUBMITS GATE PASS FORM ==========

/**
 * POST /form-fill/:studentId
 * Student submits gate pass request form
 * Status: 'pending' (waiting for tutor approval)
 */
app.post('/form-fill/:id', async (req, res) => {
  const { id } = req.params;
  const { purpose, date, returnTime, groupMembers } = req.body;

  try {
    // Validate required fields
    if (!purpose || !date || !returnTime) {
      return res.status(400).json({
        success: false,
        message: 'Purpose, date, and return time are required'
      });
    }

    // Check if date is not in the past
    if (new Date(date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Date cannot be in the past'
      });
    }

    // Find main student
    const mainStudent = await Student.findById(id);
    if (!mainStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Create new gate pass (status: pending)
    const gatePass = new GatePass({
      studentId: mainStudent._id,
      purpose: purpose.trim(),
      date: new Date(date),
      returnTime: returnTime.trim(),
      groupMembers: (groupMembers || []).map(m => ({
        name: m.name?.trim(),
        admNo: Number(m.admNo || m.admissionNo),
        dept: m.dept?.trim()
      })),
      status: 'pending'
    });

    await gatePass.save();

    // Update main student
    mainStudent.groupId = gatePass._id;
    mainStudent.purpose = purpose.trim();
    mainStudent.date = new Date(date);
    mainStudent.returnTime = returnTime.trim();
    mainStudent.passStatus = 'pending';
    await mainStudent.save();

    // Update group members
    if (groupMembers && groupMembers.length > 0) {
      for (const member of groupMembers) {
        const admNo = member.admNo || member.admissionNo;
        if (admNo) {
          const existing = await Student.findOne({ admNo: Number(admNo) });
          if (existing) {
            existing.groupId = gatePass._id;
            existing.purpose = purpose.trim();
            existing.date = new Date(date);
            existing.returnTime = returnTime.trim();
            existing.passStatus = 'pending';
            await existing.save();
          }
        }
      }
    }

    // Send notification to tutor
    const tutor = await Tutor.findOne({ name: mainStudent.tutorName });
    if (tutor && tutor.phone) {
      try {
        await NotificationService.sendFormSubmissionNotification(
          tutor.phone.toString(),
          tutor.name,
          mainStudent.name,
          mainStudent.admNo,
          purpose,
          date
        );
        console.log(`✅ Form submission SMS sent to tutor (${tutor.phone})`);
      } catch (err) {
        console.warn('⚠️  Failed to send form submission SMS to tutor:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: '✅ Gate pass form submitted successfully. Awaiting tutor approval.',
      gatePass,
      student: mainStudent
    });
  } catch (err) {
    console.error('Form fill error:', err);
    return res.status(500).json({
      success: false,
      message: 'Form fill failed',
      error: err.message
    });
  }
});

// ========== STEP 2: TUTOR APPROVES GATE PASS ==========

/**
 * POST /tutor/gatepass/:id/approve
 * Tutor approves or rejects gate pass request
 * Status changes to: 'approved' or 'rejected'
 * Sends SMS to student's parent
 */
app.post('/tutor/gatepass/:id/approve', async (req, res) => {
  try {
    const { status, tutorId, reason } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (approved/rejected) is required'
      });
    }

    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: status === 'approved' ? tutorId : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectionReason: status === 'rejected' ? reason : null
      },
      { new: true }
    ).populate('studentId', 'name admNo dept parent_No');

    if (!updatedPass) {
      return res.status(404).json({
        success: false,
        message: 'Gate pass not found'
      });
    }

    // Update all students in group
    await Student.updateMany(
      { groupId: req.params.id },
      {
        passStatus: status,
        purpose: status === 'approved' ? updatedPass.purpose : null,
        date: status === 'approved' ? updatedPass.date : null,
        returnTime: status === 'approved' ? updatedPass.returnTime : null
      }
    );

    // Update main student
    if (updatedPass.studentId && updatedPass.studentId._id) {
      await Student.findByIdAndUpdate(
        updatedPass.studentId._id,
        {
          passStatus: status,
          purpose: status === 'approved' ? updatedPass.purpose : null,
          date: status === 'approved' ? updatedPass.date : null,
          returnTime: status === 'approved' ? updatedPass.returnTime : null
        }
      );
    }

    // Send SMS notification to parent
    if (updatedPass.studentId && updatedPass.studentId.parent_No) {
      try {
        if (status === 'approved') {
          await NotificationService.sendApprovalNotification(
            updatedPass.studentId.parent_No.toString(),
            updatedPass.studentId.name,
            updatedPass.studentId.admNo,
            updatedPass.purpose,
            updatedPass.date
          );
          console.log(`✅ Approval SMS sent to parent (${updatedPass.studentId.parent_No})`);
        } else {
          await NotificationService.sendRejectionNotification(
            updatedPass.studentId.parent_No.toString(),
            updatedPass.studentId.name,
            updatedPass.studentId.admNo,
            reason
          );
          console.log(`✅ Rejection SMS sent to parent (${updatedPass.studentId.parent_No})`);
        }
      } catch (err) {
        console.warn('⚠️  Failed to send SMS to parent:', err.message);
      }
    }

    res.json({
      success: true,
      message: `✅ Gate pass ${status} successfully. SMS sent to parent.`,
      gatePass: updatedPass
    });
  } catch (error) {
    console.error('Error updating gate pass:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gate pass',
      error: error.message
    });
  }
});

// ========== STEP 3: STUDENT GENERATES QR CODE ==========

/**
 * POST /generate-qr/:studentId
 * Student generates QR code after tutor approves
 * QR code contains link to verification page
 */
app.post("/generate-qr/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get gate pass to verify it's approved
    let gatePass = null;
    if (student.groupId) {
      gatePass = await GatePass.findById(student.groupId);
    }

    if (!gatePass || gatePass.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Gate pass must be approved before generating QR code"
      });
    }

    // Generate QR code URL (verification page)
    const verifyUrl = `${req.protocol}://${req.get('host')}/gatepass/${studentId}`;
    const qrImage = await QRCode.toDataURL(verifyUrl);

    res.json({
      success: true,
      message: "✅ QR code generated successfully",
      qrImage,
      studentData: {
        name: student.name,
        admNo: student.admNo,
        dept: student.dept,
        purpose: gatePass.purpose,
        date: gatePass.date,
        returnTime: gatePass.returnTime
      }
    });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({
      success: false,
      message: "QR generation failed",
      error: err.message
    });
  }
});

// ========== STEP 4: SECURITY SCANS QR & VERIFIES ==========

/**
 * POST /verify-students
 * Security scans QR code and verifies students
 * Sends SMS to parent and tutor with departure information
 * Status changes to: 'verified'
 */
app.post('/verify-students', async (req, res) => {
  const { studentIds } = req.body;

  try {
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid student IDs array required'
      });
    }

    // Mark students as verified and update gate pass status
    const verifiedTime = new Date().toLocaleTimeString('en-IN');

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { verified: true }
    );

    // Update gate passes to verified
    await GatePass.updateMany(
      { studentId: { $in: studentIds }, status: 'approved' },
      {
        status: 'verified',
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: 'Security Officer'
      }
    );

    // Fetch updated student details
    const students = await Student.find({ _id: { $in: studentIds } });
    const notificationResults = [];

    // Send SMS notifications for each verified student
    for (const student of students) {
      const notificationLog = {
        studentName: student.name,
        admNo: student.admNo,
        notifications: []
      };

      // Get tutor info
      let tutor = null;
      if (student.tutorName) {
        tutor = await Tutor.findOne({ name: student.tutorName });
      }

      // Get gate pass info
      let gatePass = null;
      if (student.groupId) {
        gatePass = await GatePass.findById(student.groupId);
      }
      if (!gatePass) {
        gatePass = await GatePass.findOne({ studentId: student._id });
      }

      const purpose = gatePass?.purpose || 'Not specified';
      const returnTime = gatePass?.returnTime || 'Not specified';

      // SEND SMS TO PARENT
      if (student.parent_No) {
        try {
          await NotificationService.sendVerifiedDepartureNotification(
            student.parent_No.toString(),
            student.name,
            student.admNo,
            student.dept,
            purpose,
            returnTime,
            verifiedTime
          );
          notificationLog.notifications.push({
            type: 'parent_sms',
            recipient: 'Parent',
            phone: student.parent_No,
            status: 'success',
            message: `Parent informed: ${student.name} left campus at ${verifiedTime}`
          });
          console.log(`✅ Departure SMS sent to parent (${student.parent_No}) for ${student.name}`);
        } catch (err) {
          notificationLog.notifications.push({
            type: 'parent_sms',
            recipient: 'Parent',
            phone: student.parent_No,
            status: 'failed',
            error: err.message
          });
          console.error(`❌ Failed to send SMS to parent for ${student.name}:`, err.message);
        }
      } else {
        notificationLog.notifications.push({
          type: 'parent_sms',
          recipient: 'Parent',
          status: 'skipped',
          reason: 'No parent phone number'
        });
      }

      // SEND SMS TO TUTOR
      if (tutor && tutor.phone) {
        try {
          await NotificationService.sendVerifiedDepartureNotification(
            tutor.phone.toString(),
            student.name,
            student.admNo,
            student.dept,
            purpose,
            returnTime,
            verifiedTime
          );
          notificationLog.notifications.push({
            type: 'tutor_sms',
            recipient: 'Tutor',
            phone: tutor.phone,
            status: 'success',
            message: `Tutor informed: ${student.name} left campus at ${verifiedTime}`
          });
          console.log(`✅ Departure SMS sent to tutor (${tutor.phone}) for ${student.name}`);
        } catch (err) {
          notificationLog.notifications.push({
            type: 'tutor_sms',
            recipient: 'Tutor',
            phone: tutor.phone,
            status: 'failed',
            error: err.message
          });
          console.error(`❌ Failed to send SMS to tutor for ${student.name}:`, err.message);
        }
      } else {
        notificationLog.notifications.push({
          type: 'tutor_sms',
          recipient: 'Tutor',
          status: 'skipped',
          reason: tutor ? 'No tutor phone number' : 'Tutor not found'
        });
      }

      notificationResults.push(notificationLog);
    }

    res.status(200).json({
      success: true,
      message: "✅ Students verified! Departure notifications sent to parents and tutors.",
      verifiedCount: students.length,
      verifiedTime,
      notificationResults
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// CONTINUE TO PART 3...
// ========== PART 3: Gate Pass Verification Page ==========

/**
 * GET /gatepass/:studentId
 * Displays verification page when QR code is scanned
 * Shows student details and allows security to verify
 */
app.get('/gatepass/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).send('<h2>❌ Student not found</h2>');
    }

    // Get gate pass details
    let gatePass = null;
    if (student.groupId) {
      gatePass = await GatePass.findById(student.groupId);
    }
    if (!gatePass) {
      gatePass = await GatePass.findOne({ studentId: student._id });
    }

    if (!gatePass) {
      return res.status(404).send('<h2>❌ Gate pass not found</h2>');
    }

    const isApproved = gatePass.status === 'approved';

    // Build students table
    const members = [];
    members.push({
      _id: student._id,
      name: student.name,
      admNo: student.admNo,
      dept: student.dept,
      sem: student.sem,
      image: student.image ? `data:image/jpeg;base64,${student.image.toString('base64')}` : null,
      verified: student.verified || false
    });

    for (const gm of gatePass.groupMembers || []) {
      const admNo = gm.admissionNo || gm.admNo;
      let memberDoc = null;
      if (admNo) {
        memberDoc = await Student.findOne({ admNo: Number(admNo) });
      }
      members.push({
        _id: memberDoc ? memberDoc._id : ('new-' + (admNo || gm.name)),
        name: gm.name || (memberDoc && memberDoc.name) || 'Unknown',
        admNo: admNo || (memberDoc && memberDoc.admNo) || '',
        dept: gm.dept || (memberDoc && memberDoc.dept) || '',
        sem: (memberDoc && memberDoc.sem) || gm.sem || '-',
        image: memberDoc && memberDoc.image ? `data:image/jpeg;base64,${memberDoc.image.toString('base64')}` : null,
        verified: (memberDoc && memberDoc.verified) || false
      });
    }

    const tableRows = members.map(m => `
      <tr>
        <td><img src="${m.image || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;"></td>
        <td>${m.name}</td>
        <td>${m.admNo}</td>
        <td>${m.dept}</td>
        <td>${m.sem}</td>
        <td>${gatePass.purpose || 'N/A'}</td>
        <td>${gatePass.date ? new Date(gatePass.date).toLocaleString() : 'N/A'}</td>
        <td>${gatePass.returnTime || 'N/A'}</td>
        <td>
          <input type="checkbox"
                 id="verify-${m._id}"
                 data-student-id="${m._id}"
                 ${m.verified ? 'checked disabled' : ''}
                 ${!isApproved ? 'disabled' : ''}
                 autocomplete="off">
        </td>
      </tr>
    `).join('');

    const approvalStatusHtml = isApproved ?
      '<p style="color: green; font-weight: bold;">✅ Gate Pass Approved - Ready to Verify</p>' :
      '<p style="color: orange; font-weight: bold;">⏳ Gate Pass Pending Approval</p>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gate Pass Verification - Security</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
          .container { background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 1200px; width: 100%; }
          h2 { color: #333; margin-bottom: 20px; text-align: center; }
          .status { padding: 15px; margin: 15px 0; border-radius: 8px; font-weight: bold; text-align: center; font-size: 16px; }
          .status.approved { background: #d4edda; color: #155724; border: 2px solid #28a745; }
          .status.pending { background: #fff3cd; color: #856404; border: 2px solid #ffc107; }
          .info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .info p { margin: 8px 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #667eea; color: white; font-weight: 600; }
          tr:hover { background: #f8f9fa; }
          img { border-radius: 4px; object-fit: cover;
                    }
          button { padding: 12px 24px; border: none; background: #28a745; color: white; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 15px; width: 100%; }
          button:disabled { background: #ccc; cursor: not-allowed; }
          button:hover:not(:disabled) { background: #218838; }
          .notification { padding: 15px; margin: 15px 0; border-radius: 8px; display: none; }
          .notification.show { display: block; }
          .notification.loading { background: #fff3cd; border: 2px solid #ffc107; color: #856404; }
          .notification.success { background: #d4edda; border: 2px solid #28a745; color: #155724; }
          .notification.error { background: #f8d7da; border: 2px solid #dc3545; color: #721c24; }
          .sms-status { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 14px; }
          .sms-item { display: flex; align-items: center; gap: 8px; margin: 5px 0; }
          .status-icon { font-size: 18px; }
          .divider { border: 1px solid #ddd; margin: 20px 0; }
          @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding: 15px; }
            table { font-size: 12px; }
            th, td { padding: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎫 GATE PASS VERIFICATION - SECURITY</h2>
          
          <div class="status ${isApproved ? 'approved' : 'pending'}">
            ${isApproved ? '✅ APPROVED - Ready to Verify' : '⏳ PENDING - Awaiting Tutor Approval'}
          </div>

          <div class="info">
            <p><strong>📋 Purpose:</strong> ${gatePass.purpose || 'N/A'}</p>
            <p><strong>📅 Date:</strong> ${gatePass.date ? new Date(gatePass.date).toLocaleDateString('en-IN') : 'N/A'}</p>
            <p><strong>⏰ Return Time:</strong> ${gatePass.returnTime || 'N/A'}</p>
          </div>

          <div id="notification" class="notification"></div>

          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th>Photo</th><th>Name</th><th>Adm No</th><th>Dept</th><th>Sem</th><th>Purpose</th><th>Date</th><th>Return</th><th>Verify ✓</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <button id="submitBtn" ${!isApproved ? 'disabled' : ''}>
            ${isApproved ? '✅ VERIFY & SEND SMS' : '⏳ Awaiting Approval'}
          </button>

          ${!isApproved ? '<p style="color:#dc3545;margin-top:10px;text-align:center"><strong>⚠️  Gate pass must be approved by tutor first</strong></p>' : ''}
        </div>

        <script>
          document.getElementById('submitBtn').addEventListener('click', async () => {
            const verifiedIds = Array.from(
              document.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')
            ).map(cb => cb.dataset.studentId);
            
            if (!verifiedIds.length) {
              alert('⚠️  Please select at least one student to verify');
              return;
            }

            const notification = document.getElementById('notification');
            const submitBtn = document.getElementById('submitBtn');
            
            notification.className = 'notification loading show';
            notification.innerHTML = '⏳ Verifying students and sending SMS...';
            submitBtn.disabled = true;

            try {
              const res = await fetch('/verify-students', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ studentIds: verifiedIds })
              });

              const data = await res.json();

              if (res.ok) {
                notification.className = 'notification success show';
                
                let html = '<strong>✅ Students verified successfully!</strong><br><strong style="font-size:14px">Notifications sent:</strong><br>';
                html += '<div class="sms-status">';
                
                data.notificationResults.forEach(result => {
                  html += '<div style="margin:10px 0;padding:10px;background:#fff;border-radius:4px;border-left:4px solid #667eea">';
                  html += '<strong>' + result.studentName + ' (' + result.admNo + ')</strong><br>';
                  
                  result.notifications.forEach(notif => {
                    const icon = notif.status === 'success' ? '✅' : notif.status === 'failed' ? '❌' : '⭕';
                    const status = notif.status === 'success' ? 'Sent' : 
                                   notif.status === 'failed' ? 'Failed' : 'Skipped';
                    html += '<div class="sms-item">';
                    html += '<span class="status-icon">' + icon + '</span>';
                    html += '<span>' + notif.recipient + ': ' + status + '</span>';
                    if (notif.phone) html += '<span style="color:#666;font-size:12px">(' + notif.phone + ')</span>';
                    html += '</div>';
                  });
                  
                  html += '</div>';
                });
                
                html += '</div>';
                notification.innerHTML = html;

                setTimeout(() => location.reload(), 4000);
              } else {
                throw new Error(data.message || 'Verification failed');
              }
            } catch (err) {
              notification.className = 'notification error show';
              notification.innerHTML = '❌ Error: ' + err.message;
              submitBtn.disabled = false;
            }
          });
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error('Gate pass verification error:', err);
    res.status(500).send('<h2>❌ Server Error</h2>');
  }
});
// ========== PART 4: Tutor and Admin Routes ==========

// ========== TUTOR ROUTES ==========

// Get students under a tutor
app.get('/tutor/:id/students', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const students = await Student.find({ tutorName: tutor.name }).select('-password');
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get pending passes for tutor (gate passes waiting for tutor approval)
app.get('/tutor/:id/pending-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);

    const passes = await GatePass.find({
      studentId: { $in: studentIds },
      status: 'pending'
    })
      .populate('studentId', 'name admNo dept sem parent_No')
      .sort({ createdAt: -1 });

    const formattedPasses = passes.map(pass => ({
      _id: pass._id,
      purpose: pass.purpose,
      date: pass.date,
      returnTime: pass.returnTime,
      groupMembers: pass.groupMembers,
      createdAt: pass.createdAt,
      studentName: pass.studentId?.name,
      studentAdmNo: pass.studentId?.admNo,
      studentDept: pass.studentId?.dept,
      studentSem: pass.studentId?.sem,
      studentId: pass.studentId?._id,
      status: pass.status
    }));

    res.json({
      success: true,
      count: formattedPasses.length,
      passes: formattedPasses
    });
  } catch (error) {
    console.error('Error fetching pending passes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get approved passes for tutor
app.get('/tutor/:id/approved-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);

    const passes = await GatePass.find({
      studentId: { $in: studentIds },
      status: { $in: ['approved', 'verified'] }
    })
      .populate('studentId', 'name admNo dept sem')
      .sort({ createdAt: -1 });

    const formattedPasses = passes.map(pass => ({
      _id: pass._id,
      purpose: pass.purpose,
      date: pass.date,
      returnTime: pass.returnTime,
      groupMembers: pass.groupMembers,
      createdAt: pass.createdAt,
      approvedAt: pass.approvedAt,
      verifiedAt: pass.verifiedAt,
      studentName: pass.studentId?.name,
      studentAdmNo: pass.studentId?.admNo,
      studentDept: pass.studentId?.dept,
      studentSem: pass.studentId?.sem,
      studentId: pass.studentId?._id,
      status: pass.status
    }));

    res.json({
      success: true,
      count: formattedPasses.length,
      passes: formattedPasses
    });
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ========== STUDENT APPROVED PASSES ==========

// Get approved passes for student dashboard
app.get('/student/approved-passes/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentRecord = await Student.findById(studentId);

    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const admNo = studentRecord.admNo;
    const passes = await GatePass.find({
      $or: [
        { studentId: studentId },
        { 'groupMembers.admNo': admNo },
        { 'groupMembers.admissionNo': admNo }
      ],
      status: { $in: ['approved', 'verified'] }
    })
      .populate('studentId', 'name admNo dept')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: passes.length,
      passes
    });
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved passes',
      error: error.message
    });
  }
});

// ========== ADMIN ROUTES ==========

// Get all students (admin dashboard)
app.get('/admin/students', async (req, res) => {
  try {
    const students = await Student.find({}).select('-password');
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get all tutors (admin dashboard)
app.get('/admin/tutors', async (req, res) => {
  try {
    const tutors = await Tutor.find({}).select('-password');
    res.json({
      success: true,
      count: tutors.length,
      tutors
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutors',
      error: error.message
    });
  }
});

// Get all gate passes (admin dashboard)
app.get('/admin/gate-passes', async (req, res) => {
  try {
    const passes = await Student.find({
      purpose: { $exists: true, $ne: null },
      date: { $exists: true, $ne: null }
    });
    res.json({
      success: true,
      count: passes.length,
      passes
    });
  } catch (error) {
    console.error('Error fetching gate passes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gate passes',
      error: error.message
    });
  }
});

// Get detailed gate passes
app.get('/admin/gate-passes-detailed', async (req, res) => {
  try {
    const passes = await GatePass.find({})
      .populate('studentId', 'name admNo dept tutorName parent_No phone')
      .sort({ date: -1 });

    const formattedPasses = passes.map(pass => ({
      _id: pass._id,
      admNo: pass.studentId?.admNo,
      name: pass.studentId?.name,
      dept: pass.studentId?.dept,
      tutorName: pass.studentId?.tutorName,
      parentPhone: pass.studentId?.parent_No,
      studentPhone: pass.studentId?.phone,
      purpose: pass.purpose,
      date: pass.date,
      returnTime: pass.returnTime,
      status: pass.status,
      verified: pass.verified,
      approvedAt: pass.approvedAt,
      verifiedAt: pass.verifiedAt,
      groupMembers: pass.groupMembers,
      createdAt: pass.createdAt
    }));

    res.json({
      success: true,
      count: formattedPasses.length,
      passes: formattedPasses
    });
  } catch (error) {
    console.error('Error fetching detailed gate passes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gate passes',
      error: error.message
    });
  }
});

// Delete student
app.delete('/admin/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.json({
      success: true,
      message: '✅ Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// Delete tutor
app.delete('/admin/tutors/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findByIdAndDelete(req.params.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }
    res.json({
      success: true,
      message: '✅ Tutor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tutor',
      error: error.message
    });
  }
});

// Delete gate pass
app.delete('/admin/gatepasses/:id', async (req, res) => {
  try {
    const gatePass = await GatePass.findByIdAndDelete(req.params.id);
    if (!gatePass) {
      return res.status(404).json({
        success: false,
        message: 'Gate pass not found'
      });
    }
    res.json({
      success: true,
      message: '✅ Gate pass deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gate pass',
      error: error.message
    });
  }
});

// Update gate pass status (admin)
app.put('/admin/gate-passes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'verified'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedPass) {
      return res.status(404).json({
        success: false,
        message: 'Gate pass not found'
      });
    }

    res.json({
      success: true,
      message: '✅ Gate pass updated successfully',
      gatePass: updatedPass
    });
  } catch (error) {
    console.error('Error updating gate pass status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gate pass',
      error: error.message
    });
  }
});

// Verify/approve tutor (admin approval)
app.put('/admin/tutors/:id/verify', async (req, res) => {
  try {
    const tutorId = req.params.id;
    const tutor = await Tutor.findById(tutorId);

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { verified: true, status: 'approved' },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: '✅ Tutor approved successfully',
      tutor: updatedTutor
    });
  } catch (error) {
    console.error('Error approving tutor:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving tutor',
      error: error.message
    });
  }
});

// ========== TEST SMS ENDPOINT ==========

app.post("/send-test-sms", async (req, res) => {
  try {
    console.log("📤 Testing Fast2SMS API...");
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Phone number and message are required",
        example: {
          to: "9876543210",
          message: "Your test message"
        }
      });
    }

    const response = await NotificationService.sendSMS(to, message);

    console.log("✅ SMS sent successfully");

    res.json({
      success: true,
      status: "✅ SMS sent successfully",
      details: response,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ SMS sending failed:", err.message);

    res.status(500).json({
      success: false,
      error: "SMS sending failed",
      message: err.message,
      help: "Check your Fast2SMS API key and account balance"
    });
  }
});

// ========== ERROR HANDLERS ==========

app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ========== EXPORT THE APP ==========
module.exports = app;