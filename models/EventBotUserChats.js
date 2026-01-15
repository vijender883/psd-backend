// models/EventBotUserChats.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  message_source: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  chat_time: {
    type: Date,
    default: Date.now,
  },
});

const EventBotUserChatsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    chats: [ChatMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventBotUserChats", EventBotUserChatsSchema);
