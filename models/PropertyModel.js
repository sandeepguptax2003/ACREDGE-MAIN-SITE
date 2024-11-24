const admin = require('firebase-admin');

class Property {
  constructor(data) {
    // Existing fields
    this.propertyListing = data.propertyListing;
    this.buildingType = data.buildingType;
    this.city = data.city;
    this.developerName = data.developerName;
    this.projectName = data.projectName;
    this.towerName = data.towerName;
    this.unitNumber = data.unitNumber;
    this.propertyType = data.propertyType;
    this.typology = data.typology;
    this.addOns = data.addOns;
    this.area = data.area;
    this.furnishType = data.furnishType;
    this.facing = data.facing;
    this.view = data.view;
    this.floor = data.floor;
    this.preRented = data.preRented;
    this.fieldForArea = data.fieldForArea;
    this.unit = data.unit;
    this.totalArea = data.totalArea;
    this.possessionStatus = data.possessionStatus;
    this.sellingPrice = data.sellingPrice;
    this.rentMonthlyPrice = data.rentMonthlyPrice;
    this.price = data.price;
    this.moreDetails = data.moreDetails;
    
    // New media fields
    this.images = data.images || [];
    this.videos = data.videos || [];
    
    // Metadata
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp();
    this.updatedBy = data.updatedBy || null;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp();
  }

  static collectionName = 'properties';

  static validate(data) {
    const errors = [];
    
    // Existing validation
    if (!data.propertyListing || !['Rent', 'Sale'].includes(data.propertyListing))
      errors.push('Invalid property listing type');
    
    if (!data.buildingType || !['Residential', 'Commercial'].includes(data.buildingType))
      errors.push('Invalid building type');

    // Media validation
    if (data.images && !Array.isArray(data.images)) {
      errors.push('Images must be an array');
    }
    
    if (data.videos && !Array.isArray(data.videos)) {
      errors.push('Videos must be an array');
    }

    // URL validation for existing media
    if (Array.isArray(data.images)) {
      data.images.forEach((url, index) => {
        if (url && !this.isValidUrl(url)) {
          errors.push(`Invalid URL format for image at index ${index}`);
        }
      });
    }

    if (Array.isArray(data.videos)) {
      data.videos.forEach((url, index) => {
        if (url && !this.isValidUrl(url)) {
          errors.push(`Invalid URL format for video at index ${index}`);
        }
      });
    }

    return errors;
  }

  static isValidUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  getFormType() {
    if (this.propertyListing === 'Sale' && this.buildingType === 'Residential')
      return 'residentialSell';
    if (this.propertyListing === 'Rent' && this.buildingType === 'Residential')
      return 'residentialRent';
    if (this.propertyListing === 'Sale' && this.buildingType === 'Commercial')
      return 'commercialSell';
    if (this.propertyListing === 'Rent' && this.buildingType === 'Commercial')
      return 'commercialRent';
    return null;
  }

  toFirestore() {
    const formType = this.getFormType();
    const baseData = {
      propertyListing: this.propertyListing,
      buildingType: this.buildingType,
      city: this.city,
      developerName: this.developerName,
      projectName: this.projectName,
      towerName: this.towerName,
      unitNumber: this.unitNumber,
      images: this.images,
      videos: this.videos,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };

    switch (formType) {
      case 'residentialSell':
        return {
          ...baseData,
          propertyType: this.propertyType,
          typology: this.typology,
          addOns: this.addOns,
          area: this.area,
          furnishType: this.furnishType,
          facing: this.facing,
          view: this.view,
          sellingPrice: this.sellingPrice,
          moreDetails: this.moreDetails,
          possessionStatus: this.possessionStatus
        };

      case 'residentialRent':
        return {
          ...baseData,
          propertyType: this.propertyType,
          typology: this.typology,
          addOns: this.addOns,
          area: this.area,
          furnishType: this.furnishType,
          facing: this.facing,
          view: this.view,
          rentMonthlyPrice: this.rentMonthlyPrice
        };

      case 'commercialSell':
        return {
          ...baseData,
          propertyType: this.propertyType,
          floor: this.floor,
          facing: this.facing,
          preRented: this.preRented,
          fieldForArea: this.fieldForArea,
          unit: this.unit,
          price: this.price,
          possessionStatus: this.possessionStatus
        };

      case 'commercialRent':
        return {
          ...baseData,
          propertyType: this.propertyType,
          floor: this.floor,
          facing: this.facing,
          totalArea: this.totalArea,
          unit: this.unit,
          rentMonthlyPrice: this.rentMonthlyPrice,
          possessionStatus: this.possessionStatus
        };

      default:
        return baseData;
    }
  }
}

module.exports = Property;