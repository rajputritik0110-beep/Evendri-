const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer"); 
const path = require("path");
require("dotenv").config(); // ✅ Load .env file

const app = express();

app.use(cors());
app.use(bodyParser.json()); 

// ✅ Nodemailer transporter (reusable)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS  // app password from .env
  },
});

// ✅ Contact Form API
app.post("/send", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    // Mail to Admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Query: ${subject}`,
      text: `From: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
    });

    // Confirmation Mail to Client
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We received your query!",
      text: `Hello ${name},\n\nThank you for reaching out. We’ll get back to you soon.\n\nRegards,\nEVENDRI Team`,
    });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("❌ Contact Error:", error);
    res.status(500).json({ success: false, message: "Error sending email" });
  }
});

// ✅ File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

const upload = multer({ storage });

// ✅ Apply Form API with File Uploads
// ✅ Apply Form API with File Uploads
app.post(
  "/apply",
  upload.fields([{ name: "resume" }, { name: "photo" }, { name: "certifications" }]),
  async (req, res) => {
    const data = req.body; // text fields
    const files = req.files; // uploaded files

    console.log("Apply Form Data:", data);
    console.log("Uploaded Files:", files);

    if (!data.email) {
      return res.status(400).json({ success: false, message: "Candidate email is required" });
    }

    try {
      // ✅ Build HTML summary for admin
      const adminMessage = `
        <h2>New Job Application Received</h2>
        <p><b>Candidate Name:</b> ${data.fullName}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Gender:</b> ${data.gender}</p>
        <p><b>Location:</b> ${data.location}</p>
        <p><b>Date of Birth:</b> ${data.dob}</p>
        <p><b>Qualification:</b> ${data.qualification}</p>
        <p><b>Total Experience:</b> ${data.experience} months</p>
        <hr>
        <p><b>Father’s Name:</b> ${data.fatherName || ""}</p>
        <p><b>Mother’s Name:</b> ${data.motherName || ""}</p>
        <p><b>Current / Last Company:</b> ${data.company || ""}</p>
        <p><b>Job Title:</b> ${data.jobTitle || ""}</p>
        <p><b>Skills:</b> ${data.skills || ""}</p>
        <p><b>Work Preference:</b> ${data.workPreference || ""}</p>
        <p><b>Expected CTC:</b> ${data.expectedCTC || ""}</p>
        <p><b>Notice Period:</b> ${data.noticePeriod || ""}</p>
        <p><b>Preferred Joining Date:</b> ${data.joiningDate || ""}</p>
        <p><b>Reason to Join:</b> ${data.reason || ""}</p>
        <p><b>Source:</b> ${data.source || ""}</p>
      `;

      // ✅ Send mail to Admin with attachments
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "New Job Application",
        html: adminMessage,
        attachments: [
          files?.resume ? { filename: files.resume[0].originalname, path: files.resume[0].path } : null,
          files?.photo ? { filename: files.photo[0].originalname, path: files.photo[0].path } : null,
        ].filter(Boolean),
      });

      // ✅ Confirmation mail to Candidate
      const candidateMessage = `
        <h3>Dear ${data.fullName},</h3>
        <p>Thank you for applying at <b>EVENDRI</b>. We have received your application successfully.</p>
        <p>Here is a summary of your submission:</p>
        <ul>
          <li><b>Name:</b> ${data.fullName}</li>
          <li><b>Email:</b> ${data.email}</li>
          <li><b>Phone:</b> ${data.phone}</li>
          <li><b>Applied For:</b> ${data.jobTitle || "Not specified"}</li>
        </ul>
        <p>Our team will review your application and get back to you soon.</p>
        <p>Regards,<br>EVENDRI Team</p>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: "Application Submitted Successfully - EVENDRI",
        html: candidateMessage,
      });

      res.json({ success: true, message: "Application submitted successfully" });
    } catch (error) {
      console.error("❌ Apply Error:", error);
      res.status(500).json({ success: false, message: "Error " });
    }
  }
);



const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
