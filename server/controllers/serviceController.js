const ServiceRecord = require('../models/ServiceRecord');

// @desc    Get all service records
// @route   GET /api/services
// @access  Private
const getServices = async (req, res, next) => {
  try {
    const { search, status, serviceType, technician, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { serviceId: { $regex: search, $options: 'i' } },
        { liftId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { technician: { $regex: search, $options: 'i' } },
        { issue: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (serviceType && serviceType !== 'All') {
      query.serviceType = serviceType;
    }

    if (technician && technician !== 'All') {
      query.technician = { $regex: technician, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const services = await ServiceRecord.find(query)
      .populate('customer', 'customerId customerName contactPerson phone city')
      .populate('installation', 'installationId projectName liftType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ServiceRecord.countDocuments(query);

    res.json({
      success: true,
      data: services,
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

// @desc    Get single service record
// @route   GET /api/services/:id
// @access  Private
const getServiceById = async (req, res, next) => {
  try {
    const service = await ServiceRecord.findById(req.params.id)
      .populate('customer')
      .populate('installation');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc    Create service record
// @route   POST /api/services
// @access  Private (Admin, Manager, Employee)
const createService = async (req, res, next) => {
  try {
    const {
      serviceId,
      customer,
      installation,
      liftId,
      location,
      serviceType,
      technician,
      serviceDate,
      nextServiceDate,
      issue,
      resolution,
      status,
      remarks,
    } = req.body;

    if (!serviceId || !customer || !liftId || !location || !technician) {
      return res.status(400).json({ success: false, message: 'Please fill in required fields (Service ID, Customer, Lift ID, Location, Technician)' });
    }

    const existing = await ServiceRecord.findOne({ serviceId: serviceId.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Service ID already exists' });
    }

    const serviceRecord = await ServiceRecord.create({
      serviceId: serviceId.trim(),
      customer,
      installation: installation || undefined,
      liftId: liftId.trim(),
      location: location.trim(),
      serviceType: serviceType || 'Preventive',
      technician: technician.trim(),
      serviceDate: serviceDate || new Date(),
      nextServiceDate: nextServiceDate || null,
      issue: issue || 'Routine Maintenance',
      resolution: resolution || '',
      status: status || 'Pending',
      remarks: remarks || '',
    });

    const populated = await ServiceRecord.findById(serviceRecord._id)
      .populate('customer')
      .populate('installation');

    res.status(201).json({
      success: true,
      message: 'Service record created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service record
// @route   PUT /api/services/:id
// @access  Private (Admin, Manager, Employee)
const updateService = async (req, res, next) => {
  try {
    const service = await ServiceRecord.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    Object.assign(service, req.body);
    await service.save();

    const populated = await ServiceRecord.findById(service._id)
      .populate('customer')
      .populate('installation');

    res.json({
      success: true,
      message: 'Service record updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service record
// @route   DELETE /api/services/:id
// @access  Private (Admin, Manager)
const deleteService = async (req, res, next) => {
  try {
    const service = await ServiceRecord.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    await ServiceRecord.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
