const { DonorProfile, ELIGIBILITY_STATUS } = require('../models/DonorProfile');
const { BloodRequest } = require('../models/BloodRequest');
const HospitalProfile = require('../models/HospitalProfile');
const { DonorConsent } = require('../models/DonorConsent');
const DonationRecord = require('../models/DonationRecord');
const { User } = require('../models/User');
const { isBloodCompatible } = require('../utils/bloodCompatibility');
const { calculateDistanceKm } = require('../utils/distanceCalculator');
const notificationService = require('../services/notificationService');
const { NOTIFICATION_TYPES } = require('../models/Notification');
const { sendError, sendSuccess } = require('../utils/apiError');

/**
 * Helper to ensure a DonorProfile document exists for the user
 */
async function getOrCreateDonorProfile(userId, userBloodGroup) {
  let profile = await DonorProfile.findOne({ user: userId });
  if (!profile) {
    profile = new DonorProfile({
      user: userId,
      bloodGroup: userBloodGroup || 'O+',
      isAvailable: true,
      eligibilityStatus: ELIGIBILITY_STATUS.ELIGIBLE,
    });
    await profile.save();
  }
  return profile;
}

/**
 * Helper to format relative time (e.g. '15 mins ago', '2 hours ago')
 */
function getRelativeTime(date) {
  if (!date) return 'Recently';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * @desc    Get Current Donor Profile & Dashboard Metrics
 * @route   GET /api/donor/profile
 * @access  Private (DONOR)
 */
const getProfile = async (req, res) => {
  try {
    const profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);
    
    // Count completed donation records
    const donationCount = await DonationRecord.countDocuments({ donor: req.user._id, status: 'COMPLETED' });

    // Response object
    const donorData = {
      user: req.user.toSafeObject(),
      profile: {
        isAvailable: profile.isAvailable,
        address: profile.address,
        locationCoordinates: profile.locationCoordinates,
        preferredRadiusKm: profile.preferredRadiusKm,
        eligibilityStatus: profile.eligibilityStatus,
        lastDonationDate: profile.lastDonationDate,
        nextEligibleDate: profile.nextEligibleDate,
        emergencyContact: profile.emergencyContact,
        totalDonationsCount: Math.max(profile.totalDonationsCount, donationCount),
        livesSavedCount: Math.max(profile.livesSavedCount, donationCount * 3),
      },
    };

    return sendSuccess(res, 200, 'Donor profile retrieved successfully', donorData);
  } catch (error) {
    console.error('[Get Donor Profile Error]:', error);
    return sendError(res, 500, 'Failed to fetch donor profile.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Update Donor Profile Information
 * @route   PUT /api/donor/profile
 * @access  Private (DONOR)
 */
const updateProfile = async (req, res) => {
  try {
    const { address, locationCoordinates, preferredRadiusKm, emergencyContact, eligibilityStatus } = req.body;

    let profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);

    if (address) {
      profile.address = {
        street: address.street !== undefined ? address.street : profile.address.street,
        city: address.city !== undefined ? address.city : profile.address.city,
        state: address.state !== undefined ? address.state : profile.address.state,
        zipCode: address.zipCode !== undefined ? address.zipCode : profile.address.zipCode,
      };
    }

    if (locationCoordinates) {
      profile.locationCoordinates = {
        latitude: typeof locationCoordinates.latitude === 'number' ? locationCoordinates.latitude : profile.locationCoordinates?.latitude,
        longitude: typeof locationCoordinates.longitude === 'number' ? locationCoordinates.longitude : profile.locationCoordinates?.longitude,
      };
    }

    if (preferredRadiusKm && typeof preferredRadiusKm === 'number') {
      profile.preferredRadiusKm = Math.min(Math.max(preferredRadiusKm, 5), 100);
    }

    if (emergencyContact) {
      profile.emergencyContact = {
        name: emergencyContact.name !== undefined ? emergencyContact.name : profile.emergencyContact.name,
        phone: emergencyContact.phone !== undefined ? emergencyContact.phone : profile.emergencyContact.phone,
        relation: emergencyContact.relation !== undefined ? emergencyContact.relation : profile.emergencyContact.relation,
      };
    }

    if (eligibilityStatus && Object.values(ELIGIBILITY_STATUS).includes(eligibilityStatus)) {
      profile.eligibilityStatus = eligibilityStatus;
    }

    await profile.save();

    return sendSuccess(res, 200, 'Donor profile updated successfully', {
      profile: {
        isAvailable: profile.isAvailable,
        address: profile.address,
        locationCoordinates: profile.locationCoordinates,
        preferredRadiusKm: profile.preferredRadiusKm,
        eligibilityStatus: profile.eligibilityStatus,
        lastDonationDate: profile.lastDonationDate,
        emergencyContact: profile.emergencyContact,
      },
    });
  } catch (error) {
    console.error('[Update Donor Profile Error]:', error);
    return sendError(res, 500, 'Failed to update profile.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Toggle Availability Status (isAvailable)
 * @route   PATCH /api/donor/availability
 * @access  Private (DONOR)
 */
const toggleAvailability = async (req, res) => {
  try {
    const profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);
    
    // Explicit value or flip current
    if (typeof req.body.isAvailable === 'boolean') {
      profile.isAvailable = req.body.isAvailable;
    } else {
      profile.isAvailable = !profile.isAvailable;
    }

    await profile.save();

    return sendSuccess(
      res,
      200,
      `Availability status updated to ${profile.isAvailable ? 'AVAILABLE' : 'STANDBY'}`,
      {
        isAvailable: profile.isAvailable,
      }
    );
  } catch (error) {
    console.error('[Toggle Availability Error]:', error);
    return sendError(res, 500, 'Failed to update availability status.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get Donor Donation History Logs
 * @route   GET /api/donor/history
 * @access  Private (DONOR)
 */
const getDonationHistory = async (req, res) => {
  try {
    let records = await DonationRecord.find({ donor: req.user._id }).sort({ donationDate: -1 });

    // Seed mock initial history record if empty for new donor preview
    if (records.length === 0) {
      const mockRecord = new DonationRecord({
        donor: req.user._id,
        hospitalName: 'St. Jude Memorial Hospital',
        bloodGroup: req.user.bloodGroup || 'O+',
        unitsDonated: 1,
        donationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        location: 'Emergency Care Unit - Ward 4',
        status: 'COMPLETED',
      });
      await mockRecord.save();
      records = [mockRecord];

      // Update donor profile stats
      const profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);
      profile.totalDonationsCount = 1;
      profile.livesSavedCount = 3;
      profile.lastDonationDate = mockRecord.donationDate;
      await profile.save();
    }

    return sendSuccess(res, 200, 'Donation history retrieved successfully', {
      history: records,
    });
  } catch (error) {
    console.error('[Get Donation History Error]:', error);
    return sendError(res, 500, 'Failed to fetch donation history.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get Incoming Compatible Blood Donation Requests (Live MongoDB Query)
 * @route   GET /api/donor/requests
 * @access  Private (DONOR)
 */
const getIncomingRequests = async (req, res) => {
  try {
    const donorGroup = req.user.bloodGroup || 'O+';
    const profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);

    // 1. Donor status gate: If unavailable or ineligible, return zero requests
    if (!profile.isAvailable || profile.eligibilityStatus !== ELIGIBILITY_STATUS.ELIGIBLE) {
      return sendSuccess(res, 200, 'Incoming requests retrieved successfully', {
        requests: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
      });
    }

    // 2. Query ALL open or partially fulfilled requests where remainingUnits > 0
    const openRequests = await BloodRequest.find({
      status: { $in: ['OPEN', 'PARTIALLY_FULFILLED'] },
    })
      .populate({
        path: 'hospitalId',
        select: 'hospitalName locationCoordinates address phone',
      })
      .sort({ createdAt: -1 });

    // Fetch all existing consent records for THIS SPECIFIC logged-in donor
    const donorConsents = await DonorConsent.find({ donorId: req.user._id });
    const consentStatusMap = new Map();
    donorConsents.forEach((c) => {
      if (c.bloodRequestId) {
        consentStatusMap.set(c.bloodRequestId.toString(), c.status);
      }
    });

    // Fetch existing donation records for THIS SPECIFIC logged-in donor
    const donorDonations = await DonationRecord.find({ donor: req.user._id });
    const donorFulfillmentMap = new Map();
    donorDonations.forEach((dr) => {
      if (dr.bloodRequestId) {
        donorFulfillmentMap.set(dr.bloodRequestId.toString(), dr);
      }
    });

    const donorCoords = profile.locationCoordinates || null;
    const compatibleRequests = [];

    // 3. Stage 5 Eligibility & Compatibility Evaluation across ALL candidates
    for (const reqDoc of openRequests) {
      // Exclude if request is already fully fulfilled (safety check)
      if (reqDoc.unitsFulfilled >= reqDoc.unitsRequired) {
        continue;
      }

      if (!isBloodCompatible(donorGroup, reqDoc.bloodGroup)) {
        continue;
      }

      const hospProfile = reqDoc.hospitalId;
      const hospCoords = hospProfile?.locationCoordinates || null;
      const approxDistanceKm = calculateDistanceKm(hospCoords, donorCoords);

      // Distance filtering: Only exclude if explicitly set radius < 50 km and distance is calculated
      if (
        approxDistanceKm !== null &&
        profile.preferredRadiusKm &&
        profile.preferredRadiusKm < 50 &&
        approxDistanceKm > profile.preferredRadiusKm
      ) {
        continue;
      }

      const unitsRequired = reqDoc.unitsRequired;
      const unitsFulfilled = reqDoc.unitsFulfilled;
      const remainingUnits = Math.max(unitsRequired - unitsFulfilled, 0);
      const unitsNeeded = remainingUnits > 0 ? remainingUnits : 1;
      const cityState = reqDoc.location?.city ? `${reqDoc.location.city}, ${reqDoc.location.state || ''}` : 'Local Area';

      const isFulfilledForThisDonor = donorFulfillmentMap.has(reqDoc._id.toString());
      let existingConsentStatus = consentStatusMap.get(reqDoc._id.toString()) || 'NONE';

      if (isFulfilledForThisDonor) {
        existingConsentStatus = 'FULFILLED';
      }

      compatibleRequests.push({
        id: reqDoc._id.toString(),
        hospitalName: reqDoc.hospitalName || hospProfile?.hospitalName || 'Verified Healthcare Institution',
        urgency: reqDoc.urgency,
        bloodGroup: reqDoc.bloodGroup,
        unitsRequired,
        unitsFulfilled,
        remainingUnits,
        unitsNeeded,
        status: reqDoc.status, // OPEN or PARTIALLY_FULFILLED
        distanceKm: approxDistanceKm,
        postedTimeAgo: getRelativeTime(reqDoc.createdAt),
        locationAddress: cityState,
        consentStatus: existingConsentStatus,
        isFulfilledForDonor: isFulfilledForThisDonor,
        contactUnlocked: existingConsentStatus === 'ACCEPTED' || existingConsentStatus === 'FULFILLED',
        notes: reqDoc.reason,
        requiredDate: reqDoc.requiredDate,
        createdAt: reqDoc.createdAt,
      });
    }

    // 4. Apply User Search & Filtering on Compatible Set
    let filtered = compatibleRequests;
    const { search, urgency, bloodGroup, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.hospitalName.toLowerCase().includes(s) ||
          r.locationAddress.toLowerCase().includes(s) ||
          r.notes?.toLowerCase().includes(s)
      );
    }

    if (urgency && urgency.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((r) => r.urgency === urgency.toUpperCase());
    }

    if (bloodGroup && bloodGroup.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((r) => r.bloodGroup === bloodGroup.toUpperCase());
    }

    // 5. Apply Controlled Whitelisted Sorting
    const isAsc = String(sortOrder).toLowerCase() === 'asc';
    filtered.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return isAsc ? a.distanceKm - b.distanceKm : b.distanceKm - a.distanceKm;
      }
      if (sortBy === 'urgency') {
        const uWeights = { CRITICAL: 4, URGENT: 3, HIGH: 2, NORMAL: 1 };
        const wA = uWeights[a.urgency] || 0;
        const wB = uWeights[b.urgency] || 0;
        return isAsc ? wA - wB : wB - wA;
      }
      if (sortBy === 'requiredDate') {
        return isAsc ? new Date(a.requiredDate) - new Date(b.requiredDate) : new Date(b.requiredDate) - new Date(a.requiredDate);
      }
      // Default: createdAt
      return isAsc ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 6. PAGINATE LAST
    const total = filtered.length;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const totalPages = Math.ceil(total / l) || 1;
    const startIndex = (p - 1) * l;
    const paginatedRequests = filtered.slice(startIndex, startIndex + l);

    return sendSuccess(res, 200, 'Incoming requests retrieved successfully', {
      requests: paginatedRequests,
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
    console.error('[Get Incoming Requests Error]:', error);
    return sendError(res, 500, 'Failed to fetch blood requests.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Accept Blood Request & Grant Contact Sharing Consent (Stage 6)
 * @route   POST /api/donor/requests/:requestId/accept
 * @access  Private (DONOR)
 */
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const profile = await getOrCreateDonorProfile(req.user._id, req.user.bloodGroup);

    // 1. Availability & Eligibility Check
    if (!profile.isAvailable) {
      return sendError(res, 400, 'You must be available to accept blood requests.', 'DONOR_UNAVAILABLE');
    }
    if (profile.eligibilityStatus !== ELIGIBILITY_STATUS.ELIGIBLE) {
      return sendError(res, 400, 'You must be eligible to accept blood requests.', 'DONOR_INELIGIBLE');
    }

    // 2. Validate BloodRequest existence & status
    const requestDoc = await BloodRequest.findById(requestId);
    if (!requestDoc) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }
    if (requestDoc.status === 'FULFILLED' || requestDoc.unitsFulfilled >= requestDoc.unitsRequired) {
      return sendError(
        res,
        400,
        'This blood request is already fully fulfilled.',
        'INVALID_REQUEST_STATUS'
      );
    }
    if (requestDoc.status === 'CANCELLED') {
      return sendError(
        res,
        400,
        'Cannot accept a cancelled blood request.',
        'INVALID_REQUEST_STATUS'
      );
    }

    // 3. RBC Blood Group Compatibility Check
    if (!isBloodCompatible(req.user.bloodGroup, requestDoc.bloodGroup)) {
      return sendError(
        res,
        400,
        `Your blood group (${req.user.bloodGroup}) is not compatible with request blood group (${requestDoc.bloodGroup}).`,
        'BLOOD_INCOMPATIBLE'
      );
    }

    // 4. Create or Update DonorConsent document
    const now = new Date();
    const consentDoc = await DonorConsent.findOneAndUpdate(
      { bloodRequestId: requestDoc._id, donorId: req.user._id },
      {
        $set: {
          hospitalId: requestDoc.hospitalId,
          status: 'ACCEPTED',
          consentGivenAt: now,
          contactUnlockedAt: now,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Stage 8 Notification Dispatches
    (async () => {
      try {
        const hospProf = await HospitalProfile.findById(requestDoc.hospitalId);
        if (hospProf && hospProf.userId) {
          // 1. Notify Hospital about Donor Acceptance & Unlocked Contact
          await notificationService.createNotification({
            recipientId: hospProf.userId,
            recipientRole: 'HOSPITAL',
            type: NOTIFICATION_TYPES.DONOR_ACCEPTED,
            title: 'Donor Accepted Request',
            message: `A compatible ${req.user.bloodGroup} donor accepted your request (Ref: ${requestDoc.patientReference}).`,
            relatedEntityType: 'BloodRequest',
            relatedEntityId: requestDoc._id,
            idempotencyKey: `DONOR_ACCEPTED_${requestDoc._id}_${req.user._id}`,
          });

          await notificationService.createNotification({
            recipientId: hospProf.userId,
            recipientRole: 'HOSPITAL',
            type: NOTIFICATION_TYPES.CONSENT_RECEIVED,
            title: 'Donor Contact Unlocked',
            message: `Donor contact details unlocked for blood request (Ref: ${requestDoc.patientReference}).`,
            relatedEntityType: 'DonorConsent',
            relatedEntityId: consentDoc._id,
            idempotencyKey: `CONSENT_RECEIVED_${consentDoc._id}`,
          });
        }

        // 2. Notify Donor confirmation
        await notificationService.createNotification({
          recipientId: req.user._id,
          recipientRole: 'DONOR',
          type: NOTIFICATION_TYPES.DONOR_ACCEPTED,
          title: 'Request Accepted',
          message: `You accepted the blood request for ${requestDoc.hospitalName}. Your contact info was shared.`,
          relatedEntityType: 'BloodRequest',
          relatedEntityId: requestDoc._id,
          idempotencyKey: `DONOR_CONFIRM_${requestDoc._id}_${req.user._id}`,
        });
      } catch (notifErr) {
        console.error('[Accept Request Notification Error]:', notifErr);
      }
    })();

    return sendSuccess(res, 200, 'Consent granted. Contact details shared with hospital.', {
      consent: {
        id: consentDoc._id,
        bloodRequestId: consentDoc.bloodRequestId,
        status: consentDoc.status,
        consentGivenAt: consentDoc.consentGivenAt,
        contactUnlocked: true,
      },
    });
  } catch (error) {
    console.error('[Accept Request Consent Error]:', error);
    return sendError(res, 500, 'Failed to record donor consent.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Decline Blood Request (Stage 6)
 * @route   POST /api/donor/requests/:requestId/decline
 * @access  Private (DONOR)
 */
const declineRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestDoc = await BloodRequest.findById(requestId);
    if (!requestDoc) {
      return sendError(res, 404, 'Blood request not found.', 'REQUEST_NOT_FOUND');
    }

    const consentDoc = await DonorConsent.findOneAndUpdate(
      { bloodRequestId: requestDoc._id, donorId: req.user._id },
      {
        $set: {
          hospitalId: requestDoc.hospitalId,
          status: 'DECLINED',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sendSuccess(res, 200, 'Blood request declined', {
      consent: {
        id: consentDoc._id,
        bloodRequestId: consentDoc.bloodRequestId,
        status: consentDoc.status,
        contactUnlocked: false,
      },
    });
  } catch (error) {
    console.error('[Decline Request Error]:', error);
    return sendError(res, 500, 'Failed to decline request.', 'SERVER_ERROR');
  }
};

/**
 * @desc    Get All Consents Granted by Authenticated Donor (Stage 6)
 * @route   GET /api/donor/consents
 * @access  Private (DONOR)
 */
const getDonorConsents = async (req, res) => {
  try {
    const consents = await DonorConsent.find({ donorId: req.user._id })
      .populate('bloodRequestId')
      .populate('hospitalId', 'hospitalName phone address')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, 'Donor consent records retrieved', {
      consents,
    });
  } catch (error) {
    console.error('[Get Donor Consents Error]:', error);
    return sendError(res, 500, 'Failed to fetch donor consents.', 'SERVER_ERROR');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  toggleAvailability,
  getDonationHistory,
  getIncomingRequests,
  acceptRequest,
  declineRequest,
  getDonorConsents,
};
