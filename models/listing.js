"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');

var ListingSchema = new Schema({

  code: {type: String, required: false},
  name: {type: String, required: true},
  s_name: {type: String, required: false},
  description: {type: String, required: false},
  logo: {type: String, required: false},
  type: {type: String, required: false},
  website: {type: String, required: false},
  email: {type: String, required: false},
  administrator: {type: String, required: false},
  contact: {type: String, required: false},
  fax: {type: String, required: false},
  phone: {type: String, required: false},
  altPhone: {type: String, required: false},
  primaryContact: {
    title: {type: String, required: false},
    firstName: {type: String, required: false},
    lastName: {type: String, required: false},
  },
  altContact: {
    title: {type: String, required: false},
    firstName: {type: String, required: false},
    lastName: {type: String, required: false},
  },
  address: {
    addressLine1: {type: String, required: false},
    addressLine2: {type: String, required: false},
    suite: {type: String, required: false},
    city: {type: String, required: false},
    state: {type: String, required: false},
    zip: {type: String, required: false},
    zip4: {type: String, required: false},
    county: {type: String, required: false},
    fullAddress: {type: String, required: false}
  },
  license: {
    legalStatus: {type: String, required: false},
    legalId: {type: String, required: false},
    startDate: {type: Date, required: false, default: Date.now},
    endDate: {type: Date, required: false, default: Date.now}
  },
  ageLimit: {
    minAge: {type: Number, required: false},
    maxAge: {type: Number, required: false},
    minAgeUnit: {type: String, required: false},
    maxAgeUnit: {type: String, required: false}
  },
  ageGroup: {type: String, required: false},
  openHours: {
    sunday: {type: String, required: false},
    monday: {type: String, required: false},
    tuesday: {type: String, required: false},
    wednesday: {type: String, required: false},
    thursday: {type: String, required: false},
    friday: {type: String, required: false},
    saturday: {type: String, required: false}
  },
  closeHours: {
    sunday: {type: String, required: false},
    monday: {type: String, required: false},
    tuesday: {type: String, required: false},
    wednesday: {type: String, required: false},
    thursday: {type: String, required: false},
    friday: {type: String, required: false},
    saturday: {type: String, required: false}
  },
  operatingHours: [
      {
        day: {type: String, required: false},
        closed: {type: Boolean, required: false},
        sched: [{
          close: {type:String, required: false},
          open: {type:String, required: false}
        }]
      }
  ],
  providerType: {type: String, required: false},
  overAllRatings: {type: Number, required: false},
  avgSafetyRatings: {type: Number, required: false, default: 0},
  avgFacilitiesRatings: {type: Number, required: false, default: 0},
  avgStaffRatings: {type: Number, required: false, default: 0},
  avgEducationRatings: {type: Number, required: false, default: 0},
  avgOverAllRatings: {type: Number, required: false, default: 0},
  cost: {type: String, required: false},
  faithbased: {type: String, required: false},
  publicSchool: {type: String, required: false},
  religiousExempt: {type: String, required: false},
  accredited: {type: String, required: false},
  headstart: {type: String, required: false},
  weekend: {type: String, required: false},
  nightcare: {type: String, required: false},
  halfday: {type: String, required: false},
  schoolyearonly: {type: String, required: false},
  openyearround: {type: String, required: false},
  dropins: {type: String, required: false},
  beforeschool: {type: String, required: false},
  afterschool: {type: String, required: false},
  meals: {type: String, required: false},
  parttime: {type: String, required: false},
  transportation: {type: String, required: false},
  totalReviews: {type: Number, required: false, default: 0},
  owner_id: {
    type: Schema.Types.Mixed, required: false
  },
  staff: {
    firstName: {type: String, required: false},
    lastName: {type: String, required: false},
    email: {type: String, required: false},
    mobileNum: {type: String, required: false},
    contactNum: {type: String, required: false},
    workNum: {type: String, required: false},
    role: {type: String, required: false}
  },
  status: {type: String, required: false},
  goldSeal: {type: String, required: false},
  vpk: {type: String, required: false},
  schoolReadiness: {type: String, required: false},
  history: {type: Array, required: false},
  infantcare: {type: String, required: false},
  circuit: {type: String, required: false},
  uid: {type: String, required: false},
  alt_uid: {type: String, required: false},
  program: {type: String, required: false},
  director: {type: String, required: false},
  capacity: {type: Number, required: false},
  origination_date: {type: Date, required: false},
  accrediting_agency: {type: String, required: false},
  special_notes: {type: String, required: false},
  flag: {type: String, required: false},
  displayAddress: {type: String, required: false},
  displayPhone: {type: String, required: false},
  updated_by: {type: String, required: false},
  fullday: {type: String, required: false},
  food: {type: String, required: false},
  source: {type: String, required: false},
  curriculum: {type: Array, required: false},
  accreditations: {type: Array, required: false},
  classes: {type: Array, required: false},
  inspections: {type: Array, required: false},
  inspection_url: {type: String, required: false},
  questions: {type: Array, required: false},
  dateFounded: {type: Date, required: false},
  modifiedDate: {type: Date, required: false, default: Date.now},
  createDate: {type: Date, required: false, default: Date.now},
  importDate: {type: Date, required: false},
  goldSealAccreditation: {
    name: {type: String, required: false},
    agency: {type: String, required: false},
    effectiveDate: {type: Date, required: false},
    expirationDate: {type: Date, required: false},
    status: {type: String, required: false}
  },
  managed: {type: String, required: false},
  imported: {type: String, required: false},
  testdata: {type: String, required: false},
  location: {
      type: {type: String, required: false, default: "Point"},
      coordinates :[Number]
  }
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

ListingSchema.pre('save', function(next) {
  this.s_name = this.name.trim().toLowerCase();
  next();
});

ListingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Listing', ListingSchema);
