const LocalBusiness = require("../models/localBusinessModel");
const { lookupZip } = require("../utils/zipHelper");

// Validate business data
const validateBusinessData = (data) => {
  const errors = [];
  if (!data.name || data.name.trim() === "") errors.push("Name is required");
  if (!data.type || data.type.trim() === "") errors.push("Type is required");
  if (!data.address || data.address.trim() === "")
    errors.push("Address is required");
  if (data.phone && !/^\d{3}-\d{3}-\d{4}$/.test(data.phone)) {
    errors.push("Phone must be in format XXX-XXX-XXXX");
  }
  return errors;
};

const LocalBusinessController = {
  // POST /local-businesses - Create a new business recommendation
  createBusiness: async (req, res) => {
    try {
      const { name, type, address, phone, hours, links, description } =
        req.body;
      const owner_id = req.user.id;

      console.log(
        `[POST /local-businesses] user=${owner_id} body=`,
        req.body,
      );

      // Validate
      const errors = validateBusinessData({ name, type, address, phone });
      if (errors.length > 0) {
        console.error(`[POST /local-businesses] validation errors=`, errors);
        return res.status(400).json({ message: errors.join(", ") });
      }

      // Get coordinates from address using zipHelper
      // For now, use provided coordinates or default to 0,0
      const lat = req.body.lat || 0;
      const lng = req.body.lng || 0;

      const businessData = {
        owner_id,
        name: name.trim(),
        type: type.trim(),
        address: address.trim(),
        phone: phone || null,
        hours: hours || null,
        links: links || null,
        description: description || null,
        lat,
        lng,
      };

      const [business] = await LocalBusiness.create(businessData);
      console.log(`[POST /local-businesses] created business_id=`, business.id);

      res.status(201).json(business);
    } catch (error) {
      console.error(`[POST /local-businesses] error=`, error);
      res.status(500).json({ message: "Error creating business" });
    }
  },

  // GET /local-businesses/:id - Get business details
  getBusiness: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[GET /local-businesses/:id] id=${id}`);

      const business = await LocalBusiness.findById(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.status(200).json(business);
    } catch (error) {
      console.error(`[GET /local-businesses/:id] error=`, error);
      res.status(500).json({ message: "Error fetching business" });
    }
  },

  // GET /local-businesses - List all businesses (paginated)
  listBusinesses: async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const pageLimit = Math.min(Number(limit), 100);
      const pageOffset = Number(offset);

      console.log(
        `[GET /local-businesses] limit=${pageLimit} offset=${pageOffset}`,
      );

      const countResult = await LocalBusiness.countAll();
      const total = countResult?.count || 0;

      const businesses = await LocalBusiness.findAll(pageLimit, pageOffset);

      res.status(200).json({
        businesses,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
          total,
          pages: Math.ceil(total / pageLimit),
        },
      });
    } catch (error) {
      console.error(`[GET /local-businesses] error=`, error);
      res.status(500).json({ message: "Error fetching businesses" });
    }
  },

  // GET /local-businesses/search - Search by location (zip + radius)
  searchByLocation: async (req, res) => {
    try {
      const { zip, radius, limit = 20, offset = 0 } = req.query;
      console.log(
        `[GET /local-businesses/search] zip=${zip} radius=${radius}`,
      );

      if (!zip) {
        return res
          .status(400)
          .json({ message: "ZIP code is required for search" });
      }

      const maxDistance = radius ? Number(radius) : 10;
      const pageLimit = Math.min(Number(limit), 100);
      const pageOffset = Number(offset);

      const countResult = await LocalBusiness.countByLocation(zip, maxDistance);
      const total = countResult?.count || 0;

      const businesses = await LocalBusiness.findByLocation(
        zip,
        maxDistance,
        pageLimit,
        pageOffset,
      );

      res.status(200).json({
        businesses,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
          total,
          pages: Math.ceil(total / pageLimit),
        },
      });
    } catch (error) {
      console.error(`[GET /local-businesses/search] error=`, error);
      res.status(500).json({
        message: error.message || "Error searching businesses",
      });
    }
  },

  // GET /local-businesses/type/:type - Search by type
  searchByType: async (req, res) => {
    try {
      const { type } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      console.log(`[GET /local-businesses/type/:type] type=${type}`);

      const pageLimit = Math.min(Number(limit), 100);
      const pageOffset = Number(offset);

      const businesses = await LocalBusiness.findByType(
        type,
        pageLimit,
        pageOffset,
      );

      res.status(200).json({
        businesses,
        pagination: {
          limit: pageLimit,
          offset: pageOffset,
        },
      });
    } catch (error) {
      console.error(`[GET /local-businesses/type/:type] error=`, error);
      res.status(500).json({ message: "Error searching businesses by type" });
    }
  },

  // PATCH /local-businesses/:id - Update business
  updateBusiness: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user_id = req.user.id;

      console.log(
        `[PATCH /local-businesses/:id] id=${id} user=${user_id} body=`,
        updates,
      );

      const business = await LocalBusiness.findById(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Verify ownership
      if (business.owner_id !== user_id) {
        console.error(
          `[PATCH /local-businesses/:id] unauthorized user=${user_id} owner=${business.owner_id}`,
        );
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [updatedBusiness] = await LocalBusiness.update(id, updates);
      console.log(`[PATCH /local-businesses/:id] updated id=${id}`);

      res.status(200).json(updatedBusiness);
    } catch (error) {
      console.error(`[PATCH /local-businesses/:id] error=`, error);
      res.status(500).json({ message: "Error updating business" });
    }
  },

  // DELETE /local-businesses/:id - Delete business
  deleteBusiness: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      console.log(`[DELETE /local-businesses/:id] id=${id} user=${user_id}`);

      const business = await LocalBusiness.findById(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Verify ownership
      if (business.owner_id !== user_id) {
        console.error(
          `[DELETE /local-businesses/:id] unauthorized user=${user_id} owner=${business.owner_id}`,
        );
        return res.status(403).json({ message: "Unauthorized" });
      }

      await LocalBusiness.delete(id);
      console.log(`[DELETE /local-businesses/:id] deleted id=${id}`);

      res.status(200).json({ message: "Business deleted successfully" });
    } catch (error) {
      console.error(`[DELETE /local-businesses/:id] error=`, error);
      res.status(500).json({ message: "Error deleting business" });
    }
  },

  // GET /local-businesses/owner/:userId - Get user's businesses
  getUserBusinesses: async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[GET /local-businesses/owner/:userId] userId=${userId}`);

      const businesses = await LocalBusiness.findByOwner(userId);

      res.status(200).json(businesses);
    } catch (error) {
      console.error(`[GET /local-businesses/owner/:userId] error=`, error);
      res.status(500).json({ message: "Error fetching user businesses" });
    }
  },
};

module.exports = LocalBusinessController;
