const Customer = require('../models/Customer');

// @desc    Get all customers with filter, search, pagination
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const { search, amcStatus, serviceStatus, city, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { customerId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
      ];
    }

    if (amcStatus && amcStatus !== 'All') {
      query.amcStatus = amcStatus;
    }

    if (serviceStatus && serviceStatus !== 'All') {
      query.serviceStatus = serviceStatus;
    }

    if (city && city !== 'All') {
      query.city = city;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const customers = await Customer.find(query)
      .populate('createdBy', 'name email userId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
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

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name email userId');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (Admin, Manager, Employee)
const createCustomer = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      numberOfLifts,
      installationDate,
      amcStatus,
      serviceStatus,
      remarks,
    } = req.body;

    if (!customerId || !customerName || !contactPerson || !phone || !email || !address || !city || !state) {
      return res.status(400).json({ success: false, message: 'Please provide all required customer fields' });
    }

    const existingCustomer = await Customer.findOne({ customerId: customerId.trim() });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer ID already exists' });
    }

    const customer = await Customer.create({
      customerId: customerId.trim(),
      customerName: customerName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      numberOfLifts: Number(numberOfLifts) || 1,
      installationDate: installationDate || new Date(),
      amcStatus: amcStatus || 'Active',
      serviceStatus: serviceStatus || 'Operational',
      remarks: remarks || '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin, Manager, Employee)
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin, Manager)
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
