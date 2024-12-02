const algolia = require('algoliasearch');

class SearchService {
  constructor() {
    try {
      if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_KEY) {
        console.error('Missing Algolia credentials in environment variables');
        this.client = null;
        this.propertyIndex = null;
        return;
      }

      // Initialize the client
      this.client = algolia(
        process.env.ALGOLIA_APP_ID,
        process.env.ALGOLIA_ADMIN_KEY
      );

      // Initialize the index
      this.propertyIndex = this.client.initIndex('properties');

      // Configure the index settings
      this.initializeIndices().catch(error => {
        console.error('Error initializing indices:', error);
      });
    } catch (error) {
      console.error('Error initializing Algolia:', error);
      this.client = null;
      this.propertyIndex = null;
    }
  }

  async initializeIndices() {
    if (!this.propertyIndex) return;

    await this.propertyIndex.setSettings({
      searchableAttributes: [
        'propertyListing',
        'buildingType',
        'city',
        'developerName',
        'projectName',
        'towerName',
        'propertyType',
        'typology',
        'amenities'
      ],
      attributesForFaceting: [
        'propertyListing',
        'buildingType',
        'city',
        'propertyType',
        'typology',
        'furnishType',
        'possessionStatus'
      ],
      customRanking: ['desc(createdOn)']
    });
  }

  async indexProperty(propertyId, propertyData) {
    if (!this.propertyIndex) {
      console.warn('Search service not initialized, skipping indexing');
      return;
    }

    try {
      const searchableProperty = {
        objectID: propertyId,
        ...propertyData,
        _tags: this._generateTags(propertyData)
      };

      await this.propertyIndex.saveObject(searchableProperty);
    } catch (error) {
      console.error('Error indexing property:', error);
    }
  }

  async searchProperties({
    query = '',
    filters = {},
    page = 0,
    hitsPerPage = 20
  }) {
    if (!this.propertyIndex) {
      return { hits: [], nbHits: 0, page: 0 };
    }

    try {
      const filterString = this._buildFilterString(filters);
      
      const searchParams = {
        filters: filterString,
        page,
        hitsPerPage,
        getRankingInfo: true
      };

      return await this.propertyIndex.search(query, searchParams);
    } catch (error) {
      console.error('Error searching properties:', error);
      return { hits: [], nbHits: 0, page: 0 };
    }
  }

  _buildFilterString(filters) {
    const filterParts = [];

    if (filters.priceRange) {
      filterParts.push(`price >= ${filters.priceRange.min} AND price <= ${filters.priceRange.max}`);
    }

    if (filters.propertyType) {
      filterParts.push(`propertyType:'${filters.propertyType}'`);
    }

    if (filters.city) {
      filterParts.push(`city:'${filters.city}'`);
    }

    if (filters.propertyListing) {
      filterParts.push(`propertyListing:'${filters.propertyListing}'`);
    }

    return filterParts.join(' AND ');
  }

  _generateTags(propertyData) {
    const tags = [];
    
    if (propertyData.amenities) {
      tags.push(...propertyData.amenities);
    }
    
    if (propertyData.typology) {
      tags.push(propertyData.typology);
    }

    if (propertyData.buildingType) {
      tags.push(propertyData.buildingType);
    }

    return tags;
  }

  async deleteProperty(propertyId) {
    if (!this.propertyIndex) return;

    try {
      await this.propertyIndex.deleteObject(propertyId);
    } catch (error) {
      console.error('Error deleting property from index:', error);
    }
  }

  async updateProperty(propertyId, updates) {
    if (!this.propertyIndex) return;

    try {
      const object = {
        objectID: propertyId,
        ...updates
      };
      await this.propertyIndex.partialUpdateObject(object);
    } catch (error) {
      console.error('Error updating property in index:', error);
    }
  }
}

module.exports = new SearchService();