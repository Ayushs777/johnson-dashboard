const Installation = require('../models/Installation');
const Customer = require('../models/Customer');

// @desc    Get all installations
// @route   GET /api/installations
// @access  Private
const getInstallations = async (req, res, next) => {
  try {
    const { search, status, liftType, customerId, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { installationId: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { technician: { $regex: search, $options: 'i' } },
        { projectManager: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (liftType && liftType !== 'All') {
      query.liftType = liftType;
    }

    if (customerId) {
      query.customer = customerId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const installations = await Installation.find(query)
      .populate('customer', 'customerId customerName contactPerson city state phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Installation.countDocuments(query);

    res.json({
      success: true,
      data: installations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get installation by ID
// @route   GET /api/installations/:id
// @access  Private
const getInstallationById = async (req, res, next) => {
  try {
    const installation = await Installation.findById(req.params.id).populate('customer');
    if (!installation) {
      return res.status(404).json({ success: false, message: 'Installation record not found' });
    }
    res.json({ success: true, data: installation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create installation
// @route   POST /api/installations
// @access  Private (Admin, Manager, Employee)
const createInstallation = async (req, res, next) => {
  try {
    const {
      installationId,
      customer,
      projectName,
      location,
      liftType,
      liftCapacity,
      numberOfFloors,
      installationDate,
      status,
      technician,
      projectManager,
      remarks,
    } = req.body;

    if (!installationId || !customer || !projectName || !location) {
      return res.status(400).json({ success: false, message: 'Please fill in required fields (Installation ID, Customer, Project Name, Location)' });
    }

    const existing = await Installation.findOne({ installationId: installationId.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Installation ID already exists' });
    }

    const installation = await Installation.create({
      installationId: installationId.trim(),
      customer,
      projectName: projectName.trim(),
      location: location.trim(),
      liftType: liftType || 'Passenger',
      liftCapacity: liftCapacity || '8 Persons / 544 kg',
      numberOfFloors: Number(numberOfFloors) || 4,
      installationDate: installationDate || new Date(),
      status: status || 'Planned',
      technician: technician || 'Unassigned',
      projectManager: projectManager || 'Unassigned',
      remarks: remarks || '',
    });

    const populated = await Installation.findById(installation._id).populate('customer');

    res.status(201).json({
      success: true,
      message: 'Installation created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update installation
// @route   PUT /api/installations/:id
// @access  Private (Admin, Manager, Employee)
const updateInstallation = async (req, res, next) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ success: false, message: 'Installation not found' });
    }

    Object.assign(installation, req.body);
    await installation.save();

    const populated = await Installation.findById(installation._id).populate('customer');

    res.json({
      success: true,
      message: 'Installation updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete installation
// @route   DELETE /api/installations/:id
// @access  Private (Admin, Manager)
const deleteInstallation = async (req, res, next) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) {
      return res.status(404).json({ success: false, message: 'Installation not found' });
    }

    await Installation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Installation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInstallations,
  getInstallationById,
  createInstallation,
  updateInstallation,
  deleteInstallation,
};
