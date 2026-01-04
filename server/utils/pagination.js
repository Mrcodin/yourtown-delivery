/**
 * Pagination Utility
 * Provides consistent pagination across all API endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query parameters
 * @returns {Object} Pagination parameters
 */
exports.getPaginationParams = (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50; // Default 50 items per page
    const maxLimit = 200; // Maximum items per page

    // Ensure limit doesn't exceed maximum
    const finalLimit = Math.min(limit, maxLimit);
    
    // Calculate skip value
    const skip = (page - 1) * finalLimit;

    return {
        page,
        limit: finalLimit,
        skip
    };
};

/**
 * Build paginated response
 * @param {Array} data - Data array
 * @param {Number} total - Total count of documents
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {String} baseUrl - Base URL for pagination links
 * @param {Object} query - Original query parameters
 * @returns {Object} Paginated response
 */
exports.buildPaginatedResponse = (data, total, page, limit, baseUrl = '', query = {}) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Build query string for links (excluding page)
    const queryParams = { ...query };
    delete queryParams.page;
    delete queryParams.limit;
    
    const queryString = Object.keys(queryParams)
        .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
    
    const baseLink = baseUrl + (queryString ? `?${queryString}&` : '?');

    return {
        success: true,
        data,
        pagination: {
            total,
            count: data.length,
            page,
            pages: totalPages,
            limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
        },
        links: {
            self: `${baseLink}page=${page}&limit=${limit}`,
            first: `${baseLink}page=1&limit=${limit}`,
            last: `${baseLink}page=${totalPages}&limit=${limit}`,
            next: hasNextPage ? `${baseLink}page=${page + 1}&limit=${limit}` : null,
            prev: hasPrevPage ? `${baseLink}page=${page - 1}&limit=${limit}` : null,
        }
    };
};

/**
 * Apply pagination to Mongoose query
 * @param {Object} query - Mongoose query object
 * @param {Number} skip - Number of documents to skip
 * @param {Number} limit - Number of documents to return
 * @returns {Object} Query with pagination applied
 */
exports.applyPagination = (query, skip, limit) => {
    return query.skip(skip).limit(limit);
};

/**
 * Get total count for a query
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @returns {Promise<Number>} Total count
 */
exports.getCount = async (Model, filter) => {
    return await Model.countDocuments(filter);
};
