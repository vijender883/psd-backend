const mongoose = require("mongoose");

const EventBotRegisteredUsersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    linkedinUrl: {
      type: String,
      required: true,
    },
    additional_details: {
      type: String,
      required: true,
    },
    checkin_status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EventBotRegisteredUsers",
  EventBotRegisteredUsersSchema
);
