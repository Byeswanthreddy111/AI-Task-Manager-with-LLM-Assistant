const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatLogSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
chatLogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
chatLogSchema.index({ userId: 1, createdAt: -1 });
chatLogSchema.index({ sessionId: 1 });

// Static method to get recent chat history
chatLogSchema.statics.getRecentMessages = async function (userId, limit = 10) {
  const recentSessions = await this.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(1)
    .select("messages");

  if (recentSessions.length === 0) return [];

  const allMessages = recentSessions[0].messages || [];
  return allMessages.slice(-limit);
};

// Static method to create or update chat session
chatLogSchema.statics.addMessage = async function (
  userId,
  sessionId,
  role,
  content
) {
  const message = { role, content, timestamp: new Date() };

  let chatLog = await this.findOne({ userId, sessionId });

  if (!chatLog) {
    chatLog = new this({
      userId,
      sessionId,
      messages: [message],
    });
  } else {
    chatLog.messages.push(message);
    chatLog.updatedAt = new Date();
  }

  await chatLog.save();
  return chatLog;
};

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

module.exports = ChatLog;