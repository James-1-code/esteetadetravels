const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Force Wasabi mode for Vercel (Wasabi env vars configured)
const wasabi = require('../services/wasabi');
const uploadFile = wasabi.uploadFile;
const getSignedDownloadUrl = wasabi.getSignedDownloadUrl;
const deleteFile = wasabi.deleteFile;


/*
|--------------------------------------------------------------------------
| Multer Setup (Memory Storage for Wasabi, Disk for local fallback)
|--------------------------------------------------------------------------
*/

let storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});


/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

const isUUID = (str) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const sanitizeFileName = (name) => {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};


/*
|--------------------------------------------------------------------------
| POST /api/uploads
| Upload Files
|--------------------------------------------------------------------------
*/

router.post(
  '/',
  authenticate,
  upload.array('files', 5),
  asyncHandler(async (req, res) => {

    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const { applicationId } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Upload files in parallel (MUCH faster)
    |--------------------------------------------------------------------------
    */

    const uploadPromises = req.files.map(async (file) => {

      const cleanName = sanitizeFileName(file.originalname);
      const storageKey = `${req.user.id}/${uuidv4()}-${cleanName}`;

      let fileUrl;
      let savedPath;

      /*
        | Upload to Wasabi (forced)
        |---
        */
        const wasabiResult = await uploadFile(
          file.buffer,
          storageKey,
          file.mimetype
        );
        fileUrl = await getSignedDownloadUrl(wasabiResult.key, 3600);
        savedPath = wasabiResult.key;

      /*
      |--------------------------------------------------------------------------
      | Save in DB
      |--------------------------------------------------------------------------
      */

const result = await query(
        `
        INSERT INTO documents
        ("application_id", "user_id", filename, original_name, mime_type, size, path)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          applicationId || null,
          req.user.id,
          savedPath,
          file.originalname,
          file.mimetype,
          file.size,
          savedPath
        ]
      );

      return {
        id: result.rows[0].id,
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        wasabiKey: savedPath
      };

    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });

  })
);



/*
|--------------------------------------------------------------------------
| GET /api/uploads/my-files
| MUST come before /:id routes
|--------------------------------------------------------------------------
*/

router.get(
  '/my-files',
  authenticate,
  asyncHandler(async (req, res) => {

    const result = await query(
      `
      SELECT d.*, a.type_label as application_type
      FROM documents d
      LEFT JOIN applications a
      ON d.application_id = a.id
      WHERE d.user_id = $1
      ORDER BY d.uploaded_at DESC
      `,
      [req.user.id]
    );

    const files = await Promise.all(
      result.rows.map(async (file) => {

        let url = null;

        try {
          url = await getSignedDownloadUrl(file.path, 3600);
        } catch (err) {
          console.error('URL generation error', err);
        }

        return {
          id: file.id,
          filename: file.original_name,
          originalName: file.original_name,
          mimeType: file.mime_type,
          size: file.size,
          applicationId: file.application_id,
          applicationType: file.application_type,
          uploadedAt: file.uploaded_at,
          url
        };

      })
    );

    res.json({
      success: true,
      data: { files }
    });

  })
);



/*
|--------------------------------------------------------------------------
| GET /api/uploads/:id/download
|--------------------------------------------------------------------------
*/

router.get(
  '/:id/download',
  authenticate,
  asyncHandler(async (req, res) => {

    const { id } = req.params;

    let result;

    /*
    |--------------------------------------------------------------------------
    | Lookup logic
    |--------------------------------------------------------------------------
    */

    if (isUUID(id)) {

      result = await query(
        `SELECT * FROM documents WHERE id = $1`,
        [id]
      );

    } else {

      result = await query(
        `
        SELECT * FROM documents
        WHERE original_name = $1
        OR filename LIKE $2
        `,
        [id, `%${id}%`]
      );

    }

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const doc = result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    */

    if (
      req.user.role !== 'admin' &&
      req.user.id !== doc.user_id
    ) {

      if (doc.application_id) {

        const app = await query(
          `SELECT client_id FROM applications WHERE id=$1`,
          [doc.application_id]
        );

        if (
          app.rows.length === 0 ||
          app.rows[0].client_id !== req.user.id
        ) {
          throw new AppError('Access denied', 403);
        }

      } else {
        throw new AppError('Access denied', 403);
      }

    }

    /*
    |--------------------------------------------------------------------------
    | Generate Signed URL or local path
    |--------------------------------------------------------------------------
    */

    let downloadUrl = await getSignedDownloadUrl(doc.path, 3600);

    res.json({
      success: true,
      data: {
        url: downloadUrl,
        filename: doc.original_name,
        expiresIn: 3600
      }
    });

  })
);



/*
|--------------------------------------------------------------------------
| DELETE /api/uploads/:id
|--------------------------------------------------------------------------
*/

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {

    const { id } = req.params;

    let result;

    if (isUUID(id)) {

      result = await query(
        `SELECT * FROM documents WHERE id=$1`,
        [id]
      );

    } else {

      result = await query(
        `SELECT * FROM documents WHERE original_name=$1`,
        [id]
      );

    }

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404);
    }

    const doc = result.rows[0];

    if (
      req.user.role !== 'admin' &&
      req.user.id !== doc.user_id
    ) {
      throw new AppError('Access denied', 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete from Wasabi
    |--------------------------------------------------------------------------
    */

    try {
      await deleteFile(doc.path);
    } catch (err) {
      console.error('Wasabi delete error', err);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete from DB
    |--------------------------------------------------------------------------
    */

    await query(
      `DELETE FROM documents WHERE id=$1`,
      [doc.id]
    );

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  })
);



// @route   PUT /api/uploads/link-documents
// @desc    Link documents to an application
// @access  Private
router.put(
  '/link-documents',
  authenticate,
  asyncHandler(async (req, res) => {
    const { documentIds, applicationId } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new AppError('Document IDs are required', 400);
    }

    if (!applicationId) {
      throw new AppError('Application ID is required', 400);
    }

    // Verify the user has access to this application
    const appResult = await query(
      'SELECT client_id FROM applications WHERE id = $1',
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      throw new AppError('Application not found', 404);
    }

    const app = appResult.rows[0];
    
    // Only the client who owns the app or admin/agent can link documents
    if (req.user.role === 'client' && app.client_id !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    // Update all documents to link them to the application
    for (const docId of documentIds) {
      await query(
        'UPDATE documents SET application_id = $1 WHERE id = $2 AND user_id = $3',
        [applicationId, docId, req.user.id]
      );
    }

    res.json({
      success: true,
      message: `${documentIds.length} document(s) linked to application`,
    });
  })
);

module.exports = router;
