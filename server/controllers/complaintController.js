const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const { search, priority, status, complaintType, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { liftId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignedTechnician: { $regex: search, $options: 'i' } },
      ];
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (complaintType && complaintType !== 'All') {
      query.complaintType = complaintType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const complaints = await Complaint.find(query)
      .populate('customer', 'customerId customerName contactPerson phone city')
      .populate('installation', 'installationId projectName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      data: complaints,
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

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customer')
      .populate('installation');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }
    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private (Admin, Manager, Employee)
const createComplaint = async (req, res, next) => {
  try {
    const {
      complaintId,
      customer,
      installation,
      liftId,
      location,
      complaintType,
      description,
      priority,
      assignedTechnician,
      createdDate,
      status,
    } = req.body;

    if (!complaintId || !customer || !liftId || !location || !description) {
      return res.status(400).json({ success: false, message: 'Please fill in required complaint fields (Complaint ID, Customer, Lift ID, Location, Description)' });
    }

    const existing = await Complaint.findOne({ complaintId: complaintId.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Complaint ID already exists' });
    }

    const complaint = await Complaint.create({
      complaintId: complaintId.trim(),
      customer,
      installation: installation || undefined,
      liftId: liftId.trim(),
      location: location.trim(),
      complaintType: complaintType || 'Breakdown',
      description: description.trim(),
      priority: priority || 'Medium',
      assignedTechnician: assignedTechnician || 'Unassigned',
      createdDate: createdDate || new Date(),
      status: status || 'Open',
    });

    // Create a notification if priority is Critical or High
    if (priority === 'Critical' || priority === 'High') {
      await Notification.create({
        title: `High Priority Complaint: ${complaint.complaintId}`,
        message: `${complaint.priority} priority complaint created for Lift ${complaint.liftId} at ${complaint.location}`,
        type: priority === 'Critical' ? 'error' : 'warning',
      });
    }

    const populated = await Complaint.findById(complaint._id)
      .populate('customer')
      .populate('installation');

    res.status(201).json({
      success: true,
      message: 'Complaint logged successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private (Admin, Manager, Employee)
const updateComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.body.status === 'Resolved' || req.body.status === 'Closed') {
      if (!complaint.resolutionDate) {
        req.body.resolutionDate = new Date();
      }
    }

    Object.assign(complaint, req.body);
    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('customer')
      .populate('installation');

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin, Manager)
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};
