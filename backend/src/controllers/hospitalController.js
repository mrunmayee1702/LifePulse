const { HospitalProfile, VERIFICATION_STATUSES } = require('../models/HospitalProfile');
const { BloodRequest, URGENCY_LEVELS, REQUEST_STATUSES } = require('../models/BloodRequest');
const { DonorProfile, ELIGIBILITY_STATUS } = require('../models/DonorProfile');
const { DonorConsent } = require('../models/DonorConsent');
const DonationRecord = require('../models/DonationRecord');
const { BLOOD_GROUPS, User } = require('../models/User');
const { findMatchesForBloodRequest } = require('../services/matchingService');
const { getCompatibleDonorGroups, isBloodCompatible } = require('../utils/bloodCompatibility');
const { calculateDistanceKm } = require('../utils/distanceCalculator');
const notificationService = require('../services/notificationService');
const { NOTIFICATION_TYPES } = require('../models/Notification');
const { sendError, sendSuccess } = require('../utils/apiError');

/**
 * Helper to ensure a HospitalProfile document exists for the user.
 * Includes E11000 duplicate key exception handling for concurrent requests.
 */
async function getOrCreateHospitalProfile(userId, userHospitalName, userPhone) {
  let profile = await HospitalProfile.findOne({ userId });
  if (!profile) {
    try {
      profile = new HospitalProfile({
        userId,
        hospitalName: userHospitalName || 'City Hospital Center',
        phone: userPhone || '+91 98765 00000',
        isVerified: false,
      });
      await profile.save();
    } catch (err) {
      if (err.code === 11000) {
        // Handle parallel execution race condition
        profile = await HospitalProfile.findOne({ userId });
      } else {
        throw err;
      }
    }
  }
  return profile;
}

/**
 * @desc    Get Hospital Profile
 * @route   GET /api/hospital/profile
 * @access  Private (HOSPITAL)
 */
const getProfile = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(
      req.user._id,
      req.user.hospitalName,
      req.user.phone
    );

    // Compute real statistics
    const requests = await BloodRequest.find({ hospitalId: profile._id });
    const activeCount = requests.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_FULFILLED').length;
    const totalCount = requests.length;
    const unitsRequested = requests.reduce((acc, r) => acc + r.unitsRequired, 0);
    const unitsFulfilled = requests.reduce((acc, r) => acc + r.unitsFulfilled, 0);

    return sendSuccess(res, 200, 'Hospital profile retrieved successfully', {
      user: req.user.toSafeObject(),
      profile,
      stats: {
        activeRequests: activeCount,
        totalRequests: totalCount,
        unitsRequested,
        unitsFulfilled,
      },
    });
  } catch (error) {
    console.error('[Get Hospital Profile Error]:', error);
    return sendError(res, 500, 'Failed to fetch hospital profile.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Update Hospital Profile (isVerified is read-only for hospitals)
 * @route   PUT /api/hospital/profile
 * @access  Private (HOSPITAL)
 */
const updateProfile = async (req, res) => {
  try {
    const { hospitalName, registrationNumber, phone, emergencyContact, address, locationCoordinates, devSetVerified } = req.body;

    let profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    if (hospitalName) profile.hospitalName = hospitalName.trim();
    if (registrationNumber !== undefined) profile.registrationNumber = registrationNumber.trim();
    if (phone) profile.phone = phone.trim();

    if (emergencyContact) {
      profile.emergencyContact = {
        name: emergencyContact.name !== undefined ? emergencyContact.name.trim() : profile.emergencyContact.name,
        phone: emergencyContact.phone !== undefined ? emergencyContact.phone.trim() : profile.emergencyContact.phone,
        email: emergencyContact.email !== undefined ? emergencyContact.email.trim() : profile.emergencyContact.email,
      };
    }

    if (address) {
      profile.address = {
        street: address.street !== undefined ? address.street.trim() : profile.address.street,
        city: address.city !== undefined ? address.city.trim() : profile.address.city,
        state: address.state !== undefined ? address.state.trim() : profile.address.state,
        zipCode: address.zipCode !== undefined ? address.zipCode.trim() : profile.address.zipCode,
      };
    }

    if (locationCoordinates) {
      profile.locationCoordinates = {
        latitude: typeof locationCoordinates.latitude === 'number' ? locationCoordinates.latitude : profile.locationCoordinates?.latitude,
        longitude: typeof locationCoordinates.longitude === 'number' ? locationCoordinates.longitude : profile.locationCoordinates?.longitude,
      };
    }

    // Controlled dev flag to enable verification testing during dev
    if (process.env.NODE_ENV !== 'production' && typeof devSetVerified === 'boolean') {
      profile.isVerified = devSetVerified;
    }

    await profile.save();

    return sendSuccess(res, 200, 'Hospital profile updated successfully', {
      profile,
    });
  } catch (error) {
    console.error('[Update Hospital Profile Error]:', error);
    return sendError(res, 500, 'Failed to update hospital profile.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Create Blood Request (Gated by isVerified === true)
 * @route   POST /api/hospital/requests
 * @access  Private (HOSPITAL - Verified Only)
 */
const createBloodRequest = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    // VERIFICATION GATE FOR CREATION ONLY
    if (!profile.isVerified || profile.verificationStatus !== 'VERIFIED') {
      const isRejected = profile.verificationStatus === 'REJECTED';
      const errorMsg = isRejected
        ? `Your hospital verification was rejected.${profile.verificationNotes ? ` Reason: ${profile.verificationNotes}` : ''}`
        : 'Your hospital account must be verified before creating blood requests.';
      return sendError(
        res,
        403,
        errorMsg,
        isRejected ? 'HOSPITAL_REJECTED' : 'HOSPITAL_UNVERIFIED'
      );
    }

    const { bloodGroup, unitsRequired, urgency, requiredDate, reason, patientReference, city, state } = req.body;

    // Field Validations
    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup)) {
      return sendError(res, 400, 'Valid blood group is required.', 'VALIDATION_ERROR');
    }
    if (!unitsRequired || typeof unitsRequired !== 'number' || unitsRequired < 1 || unitsRequired > 20) {
      return sendError(res, 400, 'Units required must be between 1 and 20.', 'VALIDATION_ERROR');
    }
    if (!urgency || !URGENCY_LEVELS.includes(urgency)) {
      return sendError(res, 400, 'Urgency must be CRITICAL, URGENT, HIGH, or NORMAL.', 'VALIDATION_ERROR');
    }
    if (!requiredDate) {
      return sendError(res, 400, 'Required date is required.', 'VALIDATION_ERROR');
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return sendError(res, 400, 'Reason for blood request is required.', 'VALIDATION_ERROR');
    }
    if (!patientReference || typeof patientReference !== 'string' || !patientReference.trim()) {
      return sendError(res, 400, 'Non-identifying patient reference (e.g. PT-2026-001) is required.', 'VALIDATION_ERROR');
    }
    if (!city || !state) {
      return sendError(res, 400, 'City and state locations are required.', 'VALIDATION_ERROR');
    }

    const newRequest = new BloodRequest({
      hospitalId: profile._id,
      hospitalName: profile.hospitalName,
      bloodGroup,
      unitsRequired: Math.floor(unitsRequired),
      unitsFulfilled: 0,
      urgency,
      requiredDate: new Date(requiredDate),
      reason: reason.trim(),
      patientReference: patientReference.trim(),
      location: { city: city.trim(), state: state.trim() },
      status: 'OPEN',
    });

    await newRequest.save();

    // Stage 8 Notification Triggers (Async Background Notification Dispatch)
    (async () => {
      try {
        // 1. Find matched donors via Stage 5 Smart Matching Engine
        const matchResult = await findMatchesForBloodRequest(newRequest, profile);
        const matches = matchResult.matches || [];
        for (const m of matches) {
          if (m.donorId) {
            await notificationService.createNotification({
              recipientId: m.donorId,
              recipientRole: 'DONOR',
              type: NOTIFICATION_TYPES.BLOOD_REQUEST_MATCH,
              title: `New ${newRequest.bloodGroup} Blood Request`,
              message: `${profile.hospitalName} created a new emergency ${newRequest.bloodGroup} request (${newRequest.unitsRequired} units) near ${newRequest.location.city}.`,
              relatedEntityType: 'BloodRequest',
              relatedEntityId: newRequest._id,
              idempotencyKey: `BLOOD_REQUEST_MATCH_${newRequest._id}_${m.donorId}`,
            });
          }
        }

        // 2. If Critical Urgency, notify System Admins
        if (newRequest.urgency === 'CRITICAL') {
          await notificationService.notifyAdmins({
            type: NOTIFICATION_TYPES.CRITICAL_REQUEST,
            title: 'Critical Emergency Blood Request',
            message: `Critical ${newRequest.bloodGroup} blood request posted by ${profile.hospitalName} (${newRequest.location.city}).`,
            relatedEntityType: 'BloodRequest',
            relatedEntityId: newRequest._id,
            idempotencyKey: `CRITICAL_REQUEST_${newRequest._id}`,
          });
        }
      } catch (notifErr) {
        console.error('[Create Request Notification Error]:', notifErr);
      }
    })();

    return sendSuccess(res, 201, 'Blood request created successfully', {
      request: newRequest,
    });
  } catch (error) {
    console.error('[Create Blood Request Error]:', error);
    return sendError(res, 500, 'Failed to create blood request.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get All Blood Requests for Authenticated Hospital (With Active / Fulfilled Filters & Accepted Donors Count)
 * @route   GET /api/hospital/requests
 * @access  Private (HOSPITAL)
 */
const getBloodRequests = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    if (!profile) {
      return sendSuccess(res, 200, 'Hospital blood requests retrieved', {
        requests: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
      });
    }

    const { search, status, urgency, bloodGroup, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

    const query = { hospitalId: profile._id };

    if (status && status.toUpperCase() !== 'ALL') {
      const st = status.toUpperCase();
      if (st === 'ACTIVE') {
        query.status = { $in: ['OPEN', 'PARTIALLY_FULFILLED'] };
      } else {
        query.status = st;
      }
    }
    if (urgency && urgency.toUpperCase() !== 'ALL') {
      query.urgency = urgency.toUpperCase();
    }
    if (bloodGroup && bloodGroup.toUpperCase() !== 'ALL') {
      query.bloodGroup = bloodGroup.toUpperCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      query.$or = [
        { patientReference: regex },
        { reason: regex },
        { 'location.city': regex },
      ];
    }

    const ALLOWED_SORTS = ['createdAt', 'requiredDate', 'urgency', 'unitsRequired', 'unitsFulfilled', 'status'];
    const sortField = ALLOWED_SORTS.includes(sortBy) ? sortBy : 'createdAt';
    const isAsc = String(sortOrder).toLowerCase() === 'asc';
    const sortObj = { [sortField]: isAsc ? 1 : -1 };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (p - 1) * l;

    const [requests, total] = await Promise.all([
      BloodRequest.find(query).sort(sortObj).skip(skip).limit(l),
      BloodRequest.countDocuments(query),
    ]);

    // Fetch accepted consents count for each request
    const requestIds = requests.map((r) => r._id);
    const acceptedConsents = await DonorConsent.find({
      bloodRequestId: { $in: requestIds },
      status: 'ACCEPTED',
    });

    const acceptedCountMap = new Map();
    acceptedConsents.forEach((c) => {
      const rid = c.bloodRequestId.toString();
      acceptedCountMap.set(rid, (acceptedCountMap.get(rid) || 0) + 1);
    });

    const enrichedRequests = requests.map((r) => {
      const doc = r.toObject();
      doc.acceptedDonorsCount = acceptedCountMap.get(r._id.toString()) || 0;
      doc.remainingUnits = Math.max(r.unitsRequired - r.unitsFulfilled, 0);
      return doc;
    });

    const totalPages = Math.ceil(total / l) || 1;

    return sendSuccess(res, 200, 'Hospital blood requests retrieved', {
      requests: enrichedRequests,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages,
        hasNext: p < totalPages,
        hasPrevious: p > 1,
      },
    });
  } catch (error) {
    console.error('[Get Blood Requests Error]:', error);
    return sendError(res, 500, 'Failed to fetch blood requests.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get Single Blood Request by ID (Ownership Checked)
 * @route   GET /api/hospital/requests/:id
 * @access  Private (HOSPITAL)
 */
const getBloodRequestById = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    if (request.hospitalId.toString() !== profile._id.toString()) {
      return sendError(res, 403, 'Forbidden: You do not have permission to view this request.', 'AUTH_FORBIDDEN');
    }

    // Fetch accepted consents for this request
    const acceptedConsents = await DonorConsent.find({
      bloodRequestId: request._id,
      status: 'ACCEPTED',
    }).populate('donorId', 'name email phone bloodGroup');

    // Fetch existing donation records for this request
    const donationRecords = await DonationRecord.find({ bloodRequestId: request._id });

    const fulfilledDonorMap = new Map();
    donationRecords.forEach((dr) => {
      fulfilledDonorMap.set(dr.donor.toString(), dr);
    });

    const acceptedDonors = acceptedConsents.map((c) => {
      const donorUser = c.donorId;
      const dr = fulfilledDonorMap.get(donorUser._id.toString());
      return {
        donorId: donorUser._id,
        name: donorUser.name,
        email: donorUser.email,
        phone: donorUser.phone,
        bloodGroup: donorUser.bloodGroup,
        consentGivenAt: c.consentGivenAt,
        isFulfilled: !!dr,
        unitsDonated: dr ? dr.unitsDonated : 0,
        fulfillmentDate: dr ? dr.donationDate : null,
      };
    });

    const doc = request.toObject();
    doc.acceptedDonors = acceptedDonors;
    doc.acceptedDonorsCount = acceptedDonors.length;
    doc.remainingUnits = Math.max(request.unitsRequired - request.unitsFulfilled, 0);

    return sendSuccess(res, 200, 'Blood request details retrieved', {
      request: doc,
    });
  } catch (error) {
    console.error('[Get Request Details Error]:', error);
    return sendError(res, 500, 'Failed to fetch request details.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get Smart Donor Matches for a Specific Blood Request (Stage 5)
 * @route   GET /api/hospital/requests/:id/matches
 * @access  Private (HOSPITAL - Ownership Checked)
 */
const getBloodRequestMatches = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    if (request.hospitalId.toString() !== profile._id.toString()) {
      return sendError(res, 403, 'Forbidden: You do not have permission to access matches for this request.', 'AUTH_FORBIDDEN');
    }

    if (request.status === 'FULFILLED' || request.status === 'CANCELLED') {
      return sendError(
        res,
        400,
        `Matching is unavailable for ${request.status.toLowerCase()} requests.`,
        'INVALID_REQUEST_STATUS'
      );
    }

    const matchResults = await findMatchesForBloodRequest(request, profile);

    return sendSuccess(res, 200, 'Smart donor matches calculated successfully', matchResults);
  } catch (error) {
    console.error('[Get Blood Request Matches Error]:', error);
    return sendError(res, 500, 'Failed to calculate donor matches.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get All Compatible Available Donors across network
 * @route   GET /api/hospital/available-donors
 * @access  Private (HOSPITAL)
 */
const getAvailableDonors = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);
    const hospitalCoords = profile.locationCoordinates || null;

    const candidateProfiles = await DonorProfile.find({
      isAvailable: true,
      eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE,
    }).populate({
      path: 'user',
      select: 'name email role phone bloodGroup isActive',
      match: { role: 'DONOR', isActive: true },
    });

    const availableDonors = [];
    for (const dp of candidateProfiles) {
      if (!dp.user) continue;

      const approxDistanceKm = calculateDistanceKm(hospitalCoords, dp.locationCoordinates);
      availableDonors.push({
        donorId: dp.user._id,
        name: dp.user.name,
        bloodGroup: dp.bloodGroup || dp.user.bloodGroup,
        isAvailable: dp.isAvailable,
        eligibilityStatus: dp.eligibilityStatus,
        city: dp.address?.city || 'Local Area',
        approxDistanceKm: approxDistanceKm !== null ? approxDistanceKm : 3.5,
        totalDonationsCount: dp.totalDonationsCount || 0,
        lastDonationDate: dp.lastDonationDate,
      });
    }

    return sendSuccess(res, 200, 'Available compatible donors retrieved', {
      donors: availableDonors,
    });
  } catch (error) {
    console.error('[Get Available Donors Error]:', error);
    return sendError(res, 500, 'Failed to fetch available donors.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get All Donors Who Have Accepted Requests for This Hospital (Stage 6 Accepted Donors)
 * @route   GET /api/hospital/accepted-donors
 * @access  Private (HOSPITAL)
 */
const getAcceptedDonors = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    const consents = await DonorConsent.find({
      hospitalId: profile._id,
      status: 'ACCEPTED',
    })
      .populate({
        path: 'bloodRequestId',
        select: 'patientReference bloodGroup unitsRequired unitsFulfilled urgency status createdAt requiredDate',
      })
      .populate({
        path: 'donorId',
        select: 'name email phone bloodGroup',
      })
      .sort({ updatedAt: -1 });

    const consentIds = consents.map((c) => c.bloodRequestId?._id).filter(Boolean);
    const donationRecords = await DonationRecord.find({ bloodRequestId: { $in: consentIds } });

    const fulfillmentMap = new Map();
    donationRecords.forEach((dr) => {
      const key = `${dr.bloodRequestId.toString()}_${dr.donor.toString()}`;
      fulfillmentMap.set(key, dr);
    });

    const hospitalCoords = profile.locationCoordinates || null;

    const acceptedDonors = [];
    for (const c of consents) {
      if (!c.donorId || !c.bloodRequestId) continue;

      const dp = await DonorProfile.findOne({ user: c.donorId._id });
      const donorCoords = dp?.locationCoordinates || null;
      const approxDistanceKm = calculateDistanceKm(hospitalCoords, donorCoords);

      const fKey = `${c.bloodRequestId._id.toString()}_${c.donorId._id.toString()}`;
      const dr = fulfillmentMap.get(fKey);

      acceptedDonors.push({
        consentId: c._id,
        donorId: c.donorId._id,
        name: c.donorId.name,
        email: c.donorId.email,
        phone: c.donorId.phone,
        bloodGroup: c.donorId.bloodGroup || dp?.bloodGroup,
        consentGivenAt: c.consentGivenAt,
        requestId: c.bloodRequestId._id,
        patientReference: c.bloodRequestId.patientReference,
        requestBloodGroup: c.bloodRequestId.bloodGroup,
        unitsRequired: c.bloodRequestId.unitsRequired,
        unitsFulfilled: c.bloodRequestId.unitsFulfilled,
        requestStatus: c.bloodRequestId.status,
        approxDistanceKm: approxDistanceKm !== null ? approxDistanceKm : 2.5,
        isFulfilled: !!dr,
        unitsDonated: dr ? dr.unitsDonated : 0,
        fulfillmentDate: dr ? dr.donationDate : null,
      });
    }

    return sendSuccess(res, 200, 'Accepted donors retrieved successfully', {
      acceptedDonors,
    });
  } catch (error) {
    console.error('[Get Accepted Donors Error]:', error);
    return sendError(res, 500, 'Failed to fetch accepted donors.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Record Blood Received & Perform Actual Fulfillment (Stage 7 & 8)
 * @route   POST /api/hospital/requests/:id/fulfill
 * @access  Private (HOSPITAL - Ownership Checked)
 */
const recordFulfillment = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);
    const { id: requestId } = req.params;
    const { donorId, unitsReceived = 1 } = req.body;

    if (!donorId) {
      return sendError(res, 400, 'Donor ID is required to record fulfillment.', 'VALIDATION_ERROR');
    }

    const unitsNum = Number(unitsReceived);
    if (!unitsNum || unitsNum < 1 || unitsNum > 10) {
      return sendError(res, 400, 'Units received must be between 1 and 10.', 'VALIDATION_ERROR');
    }

    // 1. Validate Blood Request & Ownership
    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    if (request.hospitalId.toString() !== profile._id.toString()) {
      return sendError(res, 403, 'Forbidden: You do not have permission to modify this request.', 'AUTH_FORBIDDEN');
    }

    if (request.status === 'FULFILLED' || request.unitsFulfilled >= request.unitsRequired) {
      return sendError(
        res,
        400,
        'Cannot record additional fulfillment for a fully fulfilled request.',
        'INVALID_REQUEST_STATUS'
      );
    }

    if (request.status === 'CANCELLED') {
      return sendError(
        res,
        400,
        'Cannot record fulfillment for a cancelled blood request.',
        'INVALID_REQUEST_STATUS'
      );
    }

    const remainingUnits = Math.max(request.unitsRequired - request.unitsFulfilled, 0);
    if (unitsNum > remainingUnits) {
      return sendError(
        res,
        400,
        `Units received (${unitsNum}) exceeds remaining units required (${remainingUnits}).`,
        'VALIDATION_ERROR'
      );
    }

    // 2. Validate Donor Consent Acceptance
    const consentDoc = await DonorConsent.findOne({
      bloodRequestId: request._id,
      donorId,
      status: 'ACCEPTED',
    });

    if (!consentDoc) {
      return sendError(
        res,
        400,
        'Selected donor has not accepted this blood request.',
        'CONSENT_REQUIRED'
      );
    }

    // 3. Prevent Duplicate Fulfillment for same donor & request
    const existingDonation = await DonationRecord.findOne({
      bloodRequestId: request._id,
      donor: donorId,
    });

    if (existingDonation) {
      return sendError(
        res,
        400,
        'Blood fulfillment has already been recorded for this donor on this request.',
        'DUPLICATE_FULFILLMENT'
      );
    }

    // 4. Fetch Donor User & Profile
    const donorUser = await User.findById(donorId);
    if (!donorUser) {
      return sendError(res, 404, 'Donor user account not found.', 'USER_NOT_FOUND');
    }

    let donorProfile = await DonorProfile.findOne({ user: donorId });
    if (!donorProfile) {
      donorProfile = new DonorProfile({
        user: donorId,
        bloodGroup: donorUser.bloodGroup || request.bloodGroup,
        isAvailable: true,
        eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE,
      });
    }

    // 5. Create DonationRecord Document
    const now = new Date();
    const donationRecord = new DonationRecord({
      donor: donorId,
      hospitalId: profile._id,
      bloodRequestId: request._id,
      hospitalName: profile.hospitalName,
      bloodGroup: donorUser.bloodGroup || request.bloodGroup,
      unitsDonated: unitsNum,
      donationDate: now,
      location: request.location?.city ? `${request.location.city}, ${request.location.state}` : profile.address?.city || 'Main Hospital',
      status: 'COMPLETED',
    });

    await donationRecord.save();

    // 6. Update BloodRequest unitsFulfilled (pre-save hook auto updates status to FULFILLED or PARTIALLY_FULFILLED)
    request.unitsFulfilled += unitsNum;
    await request.save();

    // 7. Update DonorProfile stats
    donorProfile.totalDonationsCount = (donorProfile.totalDonationsCount || 0) + 1;
    donorProfile.livesSavedCount = (donorProfile.livesSavedCount || 0) + unitsNum * 3;
    donorProfile.lastDonationDate = now;
    await donorProfile.save();

    // 8. Stage 8 Notification Dispatch to Donor
    (async () => {
      try {
        await notificationService.createNotification({
          recipientId: donorId,
          recipientRole: 'DONOR',
          type: NOTIFICATION_TYPES.DONOR_ACCEPTED,
          title: '❤️ Blood Donation Received & Fulfilled',
          message: `Thank you! ${profile.hospitalName} confirmed receipt of your ${unitsNum} unit(s) of ${donorUser.bloodGroup || request.bloodGroup} blood donation.`,
          relatedEntityType: 'BloodRequest',
          relatedEntityId: request._id,
          idempotencyKey: `FULFILLMENT_${request._id}_${donorId}`,
        });
      } catch (notifErr) {
        console.error('[Fulfillment Notification Error]:', notifErr);
      }
    })();

    return sendSuccess(res, 200, 'Blood donation recorded and fulfillment updated successfully', {
      request,
      donationRecord,
      unitsFulfilled: request.unitsFulfilled,
      remainingUnits: Math.max(request.unitsRequired - request.unitsFulfilled, 0),
      status: request.status,
    });
  } catch (error) {
    console.error('[Record Fulfillment Error]:', error);
    return sendError(res, 500, 'Failed to record blood fulfillment.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Update Blood Request (fulfillment / details with ownership check)
 * @route   PATCH /api/hospital/requests/:id
 * @access  Private (HOSPITAL)
 */
const updateBloodRequest = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    if (request.hospitalId.toString() !== profile._id.toString()) {
      return sendError(res, 403, 'Forbidden: You do not have permission to modify this request.', 'AUTH_FORBIDDEN');
    }

    if (request.status === 'FULFILLED' || request.unitsFulfilled >= request.unitsRequired) {
      return sendError(res, 400, 'Cannot modify a fully fulfilled blood request.', 'INVALID_REQUEST_STATUS');
    }

    const { unitsFulfilled, status, reason, urgency, requiredDate } = req.body;

    if (unitsFulfilled !== undefined) {
      if (typeof unitsFulfilled !== 'number' || unitsFulfilled < 0) {
        return sendError(res, 400, 'Units fulfilled cannot be negative.', 'VALIDATION_ERROR');
      }
      if (unitsFulfilled > request.unitsRequired) {
        return sendError(res, 400, `Units fulfilled (${unitsFulfilled}) cannot exceed units required (${request.unitsRequired}).`, 'VALIDATION_ERROR');
      }
      request.unitsFulfilled = Math.floor(unitsFulfilled);
    }

    if (status && REQUEST_STATUSES.includes(status)) {
      request.status = status;
    }

    if (reason && typeof reason === 'string') request.reason = reason.trim();
    if (urgency && URGENCY_LEVELS.includes(urgency)) request.urgency = urgency;
    if (requiredDate) request.requiredDate = new Date(requiredDate);

    await request.save();

    return sendSuccess(res, 200, 'Blood request updated successfully', {
      request,
    });
  } catch (error) {
    console.error('[Update Blood Request Error]:', error);
    return sendError(res, 500, 'Failed to update blood request.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Cancel Blood Request (Ownership Checked - Cannot Cancel Fulfilled Requests)
 * @route   DELETE /api/hospital/requests/:id
 * @access  Private (HOSPITAL)
 */
const cancelBloodRequest = async (req, res) => {
  try {
    const profile = await getOrCreateHospitalProfile(req.user._id, req.user.hospitalName, req.user.phone);

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    if (request.hospitalId.toString() !== profile._id.toString()) {
      return sendError(res, 403, 'Forbidden: You do not have permission to cancel this request.', 'AUTH_FORBIDDEN');
    }

    // DISALLOW CANCELING FULLY FULFILLED REQUESTS
    if (request.status === 'FULFILLED' || request.unitsFulfilled >= request.unitsRequired) {
      return sendError(
        res,
        400,
        'Cannot cancel a fully fulfilled blood request.',
        'INVALID_REQUEST_STATUS'
      );
    }

    request.status = 'CANCELLED';
    await request.save();

    return sendSuccess(res, 200, 'Blood request cancelled successfully', {
      request,
    });
  } catch (error) {
    console.error('[Cancel Blood Request Error]:', error);
    return sendError(res, 500, 'Failed to cancel blood request.', 'SERVER_ERROR');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createBloodRequest,
  getBloodRequests,
  getBloodRequestById,
  getBloodRequestMatches,
  getAvailableDonors,
  getAcceptedDonors,
  recordFulfillment,
  updateBloodRequest,
  cancelBloodRequest,
};
