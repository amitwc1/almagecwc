const express = require('express');
const router = express.Router();
const { getAllJobs, createJob, deleteJob, applyJob, getJobApplications } = require('../controllers/jobController');
const { auth, role } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createJobSchema, jobQuerySchema } = require('../validators/jobValidator');

router.get('/', validate(jobQuerySchema), getAllJobs);
router.post('/', auth, role('alumni', 'admin', 'recruiter'), validate(createJobSchema), createJob);
router.post('/:id/apply', auth, applyJob);
router.get('/:id/applications', auth, getJobApplications);
router.delete('/:id', auth, deleteJob);

module.exports = router;
