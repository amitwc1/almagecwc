const express = require('express');
const router = express.Router();
const { getAllAlumni, getAlumniById, updateProfile } = require('../controllers/alumniController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema, searchAlumniSchema } = require('../validators/alumniValidator');

router.get('/', validate(searchAlumniSchema), getAllAlumni);
router.get('/:id', getAlumniById);
router.put('/update', auth, validate(updateProfileSchema), updateProfile);

module.exports = router;
