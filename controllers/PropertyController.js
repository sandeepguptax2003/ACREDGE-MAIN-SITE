const Property = require('../models/PropertyModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles } = require('../utils/FilesUpload');

// Function to create a new property with associated files
exports.createProperty = async (req, res) => {
  try {
    const propertyData = req.body;
    const files = req.files;

    // Create a Firestore document to get ID first
    const docRef = await db.collection(Property.collectionName).add({
      createdBy: req.user.phoneNumber,
      createdOn: new Date(),
    });

    // Handle image uploads if present
    if (files?.images && Array.isArray(files.images)) {
      try {
        propertyData.images = await uploadMultipleFiles(files.images, 'propertyImages', docRef.id);
      } catch (error) {
        console.error('Error uploading images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    // Handle video uploads if present
    if (files?.videos && Array.isArray(files.videos)) {
      try {
        propertyData.videos = await uploadMultipleFiles(files.videos, 'propertyVideos', docRef.id);
      } catch (error) {
        console.error('Error uploading videos:', error);
        if (propertyData.images) await deleteMultipleFiles(propertyData.images);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading videos. ' + error.message });
      }
    }

    if (files?.documents && Array.isArray(files.documents)) {
      try {
        propertyData.documents = await uploadMultipleFiles(files.documents, 'propertyDocuments', docRef.id);
        console.log('Uploaded documents:', propertyData.documents); // Debug log
      } catch (error) {
        console.error('Error uploading documents:', error);
        if (propertyData.images) await deleteMultipleFiles(propertyData.images);
        if (propertyData.videos) await deleteMultipleFiles(propertyData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading documents. ' + error.message });
      }
    }

    // Add metadata
    propertyData.createdBy = req.user.phoneNumber;
    propertyData.createdOn = new Date();
    propertyData.images = propertyData.images || [];
    propertyData.videos = propertyData.videos || [];
    propertyData.documents = propertyData.documents || [];

    // Create property instance and validate
    const property = new Property(propertyData);
    const errors = Property.validate(propertyData);
    
    if (errors.length > 0) {
      // Clean up uploaded files if validation fails
      if (propertyData.images?.length) await deleteMultipleFiles(propertyData.images);
      if (propertyData.videos?.length) await deleteMultipleFiles(propertyData.videos);
      if (propertyData.documents?.length) await deleteMultipleFiles(propertyData.documents);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    // Remove undefined values from the property data
    const cleanPropertyData = Object.fromEntries(
      Object.entries(property.toFirestore()).filter(([_, value]) => value !== undefined)
    );

    // Update the document with cleaned property data
    await docRef.update(cleanPropertyData);

    res.status(201).json({
      message: 'Property added successfully',
      data: { id: docRef.id, ...cleanPropertyData }
    });
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: 'Failed to add property' });
  }
};

// Function to get all properties
exports.getProperties = async (req, res) => {
  try {
    const snapshot = await db.collection(Property.collectionName).get();
    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(properties);
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
};

// Function to get a single property by ID
exports.getProperty = async (req, res) => {
  try {
    const propertyDoc = await db.collection(Property.collectionName)
      .doc(req.params.id)
      .get();

    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.status(200).json({
      id: propertyDoc.id,
      ...propertyDoc.data()
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({ error: 'Failed to get property' });
  }
};

// Function to update a property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };
    const files = req.files || {};

    // Get existing property
    const propertyDoc = await db.collection(Property.collectionName).doc(id).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({ message: 'Property not found' });
    }
    const existingData = propertyDoc.data();

    // Initialize media arrays
    updatedData.images = Array.isArray(updatedData.images) ? updatedData.images : [];
    updatedData.videos = Array.isArray(updatedData.videos) ? updatedData.videos : [];
    updatedData.documents = Array.isArray(updatedData.documents) ? updatedData.documents : [];

    // Track files to delete
    let filesToDelete = {
      images: [],
      videos: [],
      documents: []
    };

    // Handle file updates
    try {
      // Handle images
      if (files.images) {
        if (updatedData.deleteImages) {
          const deleteImages = Array.isArray(updatedData.deleteImages)
            ? updatedData.deleteImages
            : JSON.parse(updatedData.deleteImages);
          filesToDelete.images = deleteImages;
          updatedData.images = (existingData.images || []).filter(
            url => !deleteImages.includes(url)
          );
        } else {
          updatedData.images = existingData.images || [];
        }

        const newImages = await uploadMultipleFiles(
          Array.isArray(files.images) ? files.images : [files.images],
          'propertyImages',
          id
        );
        updatedData.images = [...updatedData.images, ...newImages];
      } else {
        updatedData.images = existingData.images || [];
      }

      // Handle videos
      if (files.videos) {
        if (updatedData.deleteVideos) {
          const deleteVideos = Array.isArray(updatedData.deleteVideos)
            ? updatedData.deleteVideos
            : JSON.parse(updatedData.deleteVideos);
          filesToDelete.videos = deleteVideos;
          updatedData.videos = (existingData.videos || []).filter(
            url => !deleteVideos.includes(url)
          );
        } else {
          updatedData.videos = existingData.videos || [];
        }

        const newVideos = await uploadMultipleFiles(
          Array.isArray(files.videos) ? files.videos : [files.videos],
          'propertyVideos',
          id
        );
        updatedData.videos = [...updatedData.videos, ...newVideos];
      } else {
        updatedData.videos = existingData.videos || [];
      }

      // Handle documents
      if (files.documents) {
        if (updatedData.deleteDocuments) {
          const deleteDocuments = Array.isArray(updatedData.deleteDocuments)
            ? updatedData.deleteDocuments
            : JSON.parse(updatedData.deleteDocuments);
          filesToDelete.documents = deleteDocuments;
          updatedData.documents = (existingData.documents || []).filter(
            url => !deleteDocuments.includes(url)
          );
        } else {
          updatedData.documents = existingData.documents || [];
        }

        const newDocuments = await uploadMultipleFiles(
          Array.isArray(files.documents) ? files.documents : [files.documents],
          'propertyDocuments',
          id
        );
        updatedData.documents = [...updatedData.documents, ...newDocuments];
      } else {
        updatedData.documents = existingData.documents || [];
      }

    } catch (error) {
      console.error('Error handling files:', error);
      return res.status(400).json({ error: 'Error handling files. ' + error.message });
    }

    // Merge and validate data
    const mergedData = {
      ...existingData,
      ...updatedData,
      updatedBy: req.user.phoneNumber,
      updatedOn: new Date()
    };

    const property = new Property(mergedData);
    const errors = Property.validate(mergedData);
    
    if (errors.length > 0) {
      // Clean up any newly uploaded files
      await deleteMultipleFiles([
        ...filesToDelete.images, 
        ...filesToDelete.videos,
        ...filesToDelete.documents
      ]);
      return res.status(400).json({ errors });
    }

    // Clean the data by removing undefined values
    const propertyData = property.toFirestore();
    const cleanPropertyData = Object.fromEntries(
      Object.entries(propertyData).filter(([_, value]) => value !== undefined)
    );

    // If moreDetails exists but is undefined, set it to null
    if ('moreDetails' in propertyData && propertyData.moreDetails === undefined) {
      cleanPropertyData.moreDetails = null;
    }

    // Update in Firestore
    await db.collection(Property.collectionName).doc(id).update(cleanPropertyData);

    // Clean up deleted files
    await deleteMultipleFiles([
      ...filesToDelete.images, 
      ...filesToDelete.videos,
      ...filesToDelete.documents
    ]);

    res.status(200).json({
      message: 'Property updated successfully',
      data: cleanPropertyData
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
};