// const OpenAI = require("openai");
// const { mysqlPool } = require("../config/db");
// const ChatLog = require("../models/ChatLog");

// // Initialize OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // --- NEW: concurrency limiter + retry wrapper + helper logging ---
// let concurrent = 0;
// const MAX_CONCURRENT = 3; // tune as needed

// async function callOpenAIWithRetry(payload, maxRetries = 3) {
//   let attempt = 0;
//   while (true) {
//     try {
//       return await openai.chat.completions.create(payload);
//     } catch (err) {
//       attempt++;
//       const status =
//         err?.response?.status || err?.status || err?.statusCode || null;
//       const data = err?.response?.data || err?.message || null;
//       console.warn(
//         `[OpenAI] attempt ${attempt} failed status=${status} data=${JSON.stringify(
//           data
//         )}`
//       );

//       // If we've exhausted retries, rethrow
//       if (attempt > maxRetries) {
//         throw err;
//       }

//       // Non-retriable client errors (4xx except 429) -> rethrow
//       if (status && status !== 429 && (status < 500 || status >= 600)) {
//         throw err;
//       }

//       // Exponential backoff
//       const backoff =
//         Math.pow(2, attempt) * 300 + Math.floor(Math.random() * 100);
//       console.log(`[OpenAI] retrying in ${backoff}ms...`);
//       await new Promise((r) => setTimeout(r, backoff));
//     }
//   }
// }
// // --- END NEW ---

// // Chat with AI assistant
// exports.chat = async (req, res, next) => {
//   try {
//     const { message, sessionId } = req.body;

//     if (!message || message.trim() === "") {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     // Get user's tasks for context
//     const [tasks] = await mysqlPool.query(
//       "SELECT id, title, description, completed, priority, due_date, category FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
//       [req.user.id]
//     );

//     // Get recent chat history
//     const recentMessages = await ChatLog.getRecentMessages(req.user.id, 10);

//     // Build context
//     const taskContext =
//       tasks.length > 0
//         ? `User's recent tasks:\n${tasks
//             .map(
//               (t) =>
//                 `- ${t.title} (${
//                   t.completed ? "completed" : "pending"
//                 }, priority: ${t.priority}${
//                   t.due_date ? `, due: ${t.due_date}` : ""
//                 })`
//             )
//             .join("\n")}`
//         : "User has no tasks yet.";

//     // Construct messages for OpenAI
//     const messages = [
//       {
//         role: "system",
//         content: `You are a helpful AI assistant for a task management application.
// Help users manage their tasks, provide suggestions, and answer questions about productivity.
// Be concise, friendly, and action-oriented.

// ${taskContext}

// Current date: ${new Date().toISOString().split("T")[0]}`,
//       },
//       ...recentMessages.map((msg) => ({
//         role: msg.role,
//         content: msg.content,
//       })),
//       {
//         role: "user",
//         content: message,
//       },
//     ];

//     // Auth check remains as before
//     if (!req.user) {
//       return res
//         .status(401)
//         .json({
//           error: "No authentication token provided",
//           message: "Please login to access this resource",
//         });
//     }

//     // Concurrency guard
//     if (concurrent >= MAX_CONCURRENT) {
//       console.warn("[/api/ai/chat] server busy, concurrent limit reached");
//       return res
//         .status(429)
//         .json({
//           error:
//             "Server busy - too many concurrent AI requests. Please try again in a moment.",
//         });
//     }

//     concurrent++;
//     try {
//       console.log("[/api/ai/chat] calling OpenAI...");
//       const payload = {
//         model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
//         messages,
//         temperature: 0.7,
//         max_tokens: 500,
//       };

//       const completion = await callOpenAIWithRetry(payload, 4);

//       // Log raw first choice for debugging
//       console.log(
//         "[/api/ai/chat] OpenAI first choice:",
//         JSON.stringify(completion?.choices?.[0] ?? {}, null, 2)
//       );

//       const aiResponse = completion.choices[0].message.content;

//       // Save conversation to MongoDB
//       const currentSessionId = sessionId || `session_${Date.now()}`;
//       await ChatLog.addMessage(req.user.id, currentSessionId, "user", message);
//       await ChatLog.addMessage(
//         req.user.id,
//         currentSessionId,
//         "assistant",
//         aiResponse
//       );

//       res.json({
//         message: aiResponse,
//         sessionId: currentSessionId,
//         usage: {
//           promptTokens: completion.usage?.prompt_tokens,
//           completionTokens: completion.usage?.completion_tokens,
//           totalTokens: completion.usage?.total_tokens,
//         },
//       });
//     } finally {
//       concurrent = Math.max(0, concurrent - 1);
//     }
//   } catch (error) {
//     // Enhanced error logging
//     console.error("[/api/ai/chat] caught error:", error);
//     console.error("status:", error?.response?.status || error?.status || null);
//     console.error(
//       "response.data:",
//       JSON.stringify(error?.response?.data || error?.message || null, null, 2)
//     );

//     // handle 429 (rate limit)
//     const status = error?.response?.status || error?.status || 500;
//     if (status === 429) {
//       return res.status(429).json({
//         error:
//           error?.response?.data?.error?.message ||
//           "AI service rate limit exceeded. Please try again in a moment.",
//       });
//     }

//     if (status === 401) {
//       console.error("OpenAI API authentication failed. Check your API key.");
//       return res.status(500).json({
//         error: "AI service configuration error. Please contact support.",
//       });
//     }

//     next(error);
//   }
// };

// // Get task suggestions based on user input
// exports.getTaskSuggestions = async (req, res, next) => {
//   try {
//     const { input } = req.body;

//     if (!input || input.trim() === "") {
//       return res.status(400).json({ error: "Input is required" });
//     }

//     const payload = {
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: `You are a task breakdown expert. Given a goal or project, break it down into 3-5 specific, actionable tasks.
// Format each task as:
// - Task title (brief, action-oriented)

// Be concise and practical.`,
//         },
//         {
//           role: "user",
//           content: `Break down this goal into specific tasks: ${input}`,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 300,
//     };

//     // Use retry wrapper
//     const completion = await callOpenAIWithRetry(payload, 3);

//     const suggestions = completion.choices[0].message.content;

//     res.json({ suggestions });
//   } catch (error) {
//     console.error(
//       "[/api/ai/getTaskSuggestions] error:",
//       error?.response?.status,
//       error?.response?.data || error?.message
//     );
//     if (error?.response?.status === 429) {
//       return res
//         .status(429)
//         .json({ error: "Too many requests. Please try again in a moment." });
//     }
//     next(error);
//   }
// };

// // Analyze tasks and provide insights
// exports.analyzeProductivity = async (req, res, next) => {
//   try {
//     // Get user's task statistics
//     const [stats] = await mysqlPool.query(
//       `SELECT
//         COUNT(*) as total_tasks,
//         SUM(completed) as completed_tasks,
//         SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks,
//         SUM(CASE WHEN due_date < CURDATE() AND completed = 0 THEN 1 ELSE 0 END) as overdue_tasks,
//         AVG(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completion_rate
//       FROM tasks
//       WHERE user_id = ?`,
//       [req.user.id]
//     );

//     // Get recent activity
//     const [recentActivity] = await mysqlPool.query(
//       `SELECT action, created_at
//        FROM activity_log
//        WHERE user_id = ?
//        ORDER BY created_at DESC
//        LIMIT 50`,
//       [req.user.id]
//     );

//     const stat = stats[0];
//     const completionRate = (stat.completion_rate * 100).toFixed(1);

//     // Create analysis prompt
//     const analysisPrompt = `Analyze this user's productivity:
// - Total tasks: ${stat.total_tasks}
// - Completed: ${stat.completed_tasks}
// - Pending: ${stat.pending_tasks}
// - Overdue: ${stat.overdue_tasks}
// - Completion rate: ${completionRate}%
// - Recent activities: ${recentActivity.length} actions in recent history

// Provide 3-4 brief, actionable insights to improve productivity. Be encouraging and specific.`;

//     const payload = {
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a productivity coach. Provide brief, encouraging, actionable advice.",
//         },
//         {
//           role: "user",
//           content: analysisPrompt,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 400,
//     };

//     // Use retry wrapper
//     const completion = await callOpenAIWithRetry(payload, 3);

//     const insights = completion.choices[0].message.content;

//     res.json({
//       statistics: stat,
//       insights,
//       completionRate: parseFloat(completionRate),
//     });
//   } catch (error) {
//     console.error(
//       "[/api/ai/analyzeProductivity] error:",
//       error?.response?.status,
//       error?.response?.data || error?.message
//     );
//     next(error);
//   }
// };

// // Get chat history
// exports.getChatHistory = async (req, res, next) => {
//   try {
//     const { limit = 5 } = req.query;

//     const chatSessions = await ChatLog.find({ userId: req.user.id })
//       .sort({ updatedAt: -1 })
//       .limit(parseInt(limit));

//     res.json({ sessions: chatSessions });
//   } catch (error) {
//     next(error);
//   }
// };

// // Clear chat history
// exports.clearChatHistory = async (req, res, next) => {
//   try {
//     const { sessionId } = req.params;

//     if (sessionId) {
//       // Delete specific session
//       await ChatLog.deleteOne({ userId: req.user.id, sessionId });
//       res.json({ message: "Chat session deleted" });
//     } else {
//       // Delete all sessions for user
//       await ChatLog.deleteMany({ userId: req.user.id });
//       res.json({ message: "All chat history cleared" });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// // Smart task categorization
// exports.categorizeTask = async (req, res, next) => {
//   try {
//     const { title, description } = req.body;

//     if (!title) {
//       return res.status(400).json({ error: "Task title is required" });
//     }

//     const payload = {
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a task categorization system. Given a task title and description, suggest ONE appropriate category from these options: Work, Personal, Shopping, Health, Learning, Home, Finance, or Other. Respond with only the category name.",
//         },
//         {
//           role: "user",
//           content: `Title: ${title}\nDescription: ${
//             description || "No description"
//           }`,
//         },
//       ],
//       temperature: 0.3,
//       max_tokens: 20,
//     };

//     const completion = await callOpenAIWithRetry(payload, 3);

//     const suggestedCategory = completion.choices[0].message.content.trim();

//     res.json({ category: suggestedCategory });
//   } catch (error) {
//     console.error(
//       "[/api/ai/categorizeTask] error:",
//       error?.response?.status,
//       error?.response?.data || error?.message
//     );
//     next(error);
//   }
// };

// // Suggest priority based on task details
// exports.suggestPriority = async (req, res, next) => {
//   try {
//     const { title, description, due_date } = req.body;

//     if (!title) {
//       return res.status(400).json({ error: "Task title is required" });
//     }

//     const daysUntilDue = due_date
//       ? Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24))
//       : null;

//     const payload = {
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content:
//             'You are a priority assessment system. Analyze the task and respond with ONLY one word: "high", "medium", or "low".',
//         },
//         {
//           role: "user",
//           content: `Task: ${title}
// Description: ${description || "No description"}
// ${daysUntilDue !== null ? `Days until due: ${daysUntilDue}` : "No due date"}

// Suggest priority level.`,
//         },
//       ],
//       temperature: 0.3,
//       max_tokens: 10,
//     };

//     const completion = await callOpenAIWithRetry(payload, 3);

//     const priority = completion.choices[0].message.content.trim().toLowerCase();

//     res.json({
//       priority: ["low", "medium", "high"].includes(priority)
//         ? priority
//         : "medium",
//     });
//   } catch (error) {
//     console.error(
//       "[/api/ai/suggestPriority] error:",
//       error?.response?.status,
//       error?.response?.data || error?.message
//     );
//     next(error);
//   }
// };

const OpenAI = require("openai");
const { mysqlPool } = require("../config/db");
const ChatLog = require("../models/ChatLog");

// Initialize AI client based on provider
let aiClient;
let aiProvider = process.env.AI_PROVIDER || "openai";

if (aiProvider === "groq") {
  // Groq API (FREE)
  aiClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  console.log("✅ Using Groq AI (FREE)");
} else {
  // OpenAI (Paid)
  aiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("✅ Using OpenAI");
}

// Get model based on provider
const getModel = () => {
  if (aiProvider === "groq") {
    return "llama-3.1-8b-instant"; // Fast and free
    // Other options: 'mixtral-8x7b-32768', 'gemma-7b-it'
  }
  return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
};

// Chat with AI assistant
exports.chat = async (req, res, next) => {
  try {
    console.log("=".repeat(50));
    console.log("🤖 AI CHAT REQUEST RECEIVED");
    console.log("Provider:", aiProvider);
    console.log("User ID:", req.user.id);
    console.log("Message:", req.body.message);
    console.log("=".repeat(50));

    const { message, sessionId } = req.body;

    if (!message || message.trim() === "") {
      console.log("❌ Empty message error");
      return res.status(400).json({ error: "Message is required" });
    }

    // Get user's tasks for context
    console.log("📊 Fetching user tasks...");
    const [tasks] = await mysqlPool.query(
      "SELECT id, title, description, completed, priority, due_date, category FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    console.log("✅ Found", tasks.length, "tasks");

    // Get recent chat history
    console.log("💬 Fetching chat history...");
    const recentMessages = await ChatLog.getRecentMessages(req.user.id, 10);
    console.log("✅ Found", recentMessages.length, "previous messages");

    // Build context
    const taskContext =
      tasks.length > 0
        ? `User's recent tasks:\n${tasks
            .map(
              (t) =>
                `- ${t.title} (${
                  t.completed ? "completed" : "pending"
                }, priority: ${t.priority}${
                  t.due_date ? `, due: ${t.due_date}` : ""
                })`
            )
            .join("\n")}`
        : "User has no tasks yet.";

    // Construct messages
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant for a task management application. 
Help users manage their tasks, provide suggestions, and answer questions about productivity.
Be concise, friendly, and action-oriented.

${taskContext}

Current date: ${new Date().toISOString().split("T")[0]}`,
      },
      ...recentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // Call AI API
    console.log("🔄 Calling AI API...");
    console.log("Model:", getModel());

    const completion = await aiClient.chat.completions.create({
      model: getModel(),
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log("✅ AI responded successfully!");
    const aiResponse = completion.choices[0].message.content;
    console.log("Response preview:", aiResponse.substring(0, 100) + "...");

    // Save conversation to MongoDB
    console.log("💾 Saving to MongoDB...");
    const currentSessionId = sessionId || `session_${Date.now()}`;
    await ChatLog.addMessage(req.user.id, currentSessionId, "user", message);
    await ChatLog.addMessage(
      req.user.id,
      currentSessionId,
      "assistant",
      aiResponse
    );
    console.log("✅ Saved to MongoDB");

    console.log("🎉 Sending response to frontend");
    res.json({
      message: aiResponse,
      sessionId: currentSessionId,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      },
    });
    console.log("=".repeat(50));
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ AI CHAT ERROR");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Full error:", error);
    console.error("=".repeat(50));

    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again in a moment.",
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        error: "AI service authentication failed. Check API key.",
      });
    }

    next(error);
  }
};

// Get task suggestions
exports.getTaskSuggestions = async (req, res, next) => {
  try {
    const { input } = req.body;

    if (!input || input.trim() === "") {
      return res.status(400).json({ error: "Input is required" });
    }

    const completion = await aiClient.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: `You are a task breakdown expert. Given a goal or project, break it down into 3-5 specific, actionable tasks.
Format each task as:
- Task title (brief, action-oriented)

Be concise and practical.`,
        },
        {
          role: "user",
          content: `Break down this goal into specific tasks: ${input}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const suggestions = completion.choices[0].message.content;

    res.json({ suggestions });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({
        error: "Too many requests. Please try again in a moment.",
      });
    }
    next(error);
  }
};

// Analyze tasks and provide insights
exports.analyzeProductivity = async (req, res, next) => {
  try {
    // Get user's task statistics
    const [stats] = await mysqlPool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(completed) as completed_tasks,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND completed = 0 THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completion_rate
      FROM tasks 
      WHERE user_id = ?`,
      [req.user.id]
    );

    const stat = stats[0];
    const completionRate = (stat.completion_rate * 100).toFixed(1);

    const analysisPrompt = `Analyze this user's productivity:
- Total tasks: ${stat.total_tasks}
- Completed: ${stat.completed_tasks}
- Pending: ${stat.pending_tasks}
- Overdue: ${stat.overdue_tasks}
- Completion rate: ${completionRate}%

Provide 3-4 brief, actionable insights to improve productivity. Be encouraging and specific.`;

    const completion = await aiClient.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a productivity coach. Provide brief, encouraging, actionable advice.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const insights = completion.choices[0].message.content;

    res.json({
      statistics: stat,
      insights,
      completionRate: parseFloat(completionRate),
    });
  } catch (error) {
    next(error);
  }
};

// Get chat history
exports.getChatHistory = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const chatSessions = await ChatLog.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    res.json({ sessions: chatSessions });
  } catch (error) {
    next(error);
  }
};

// Clear chat history
exports.clearChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (sessionId) {
      await ChatLog.deleteOne({ userId: req.user.id, sessionId });
      res.json({ message: "Chat session deleted" });
    } else {
      await ChatLog.deleteMany({ userId: req.user.id });
      res.json({ message: "All chat history cleared" });
    }
  } catch (error) {
    next(error);
  }
};

// Smart task categorization
exports.categorizeTask = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const completion = await aiClient.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a task categorization system. Given a task title and description, suggest ONE appropriate category from these options: Work, Personal, Shopping, Health, Learning, Home, Finance, or Other. Respond with only the category name.",
        },
        {
          role: "user",
          content: `Title: ${title}\nDescription: ${
            description || "No description"
          }`,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    const suggestedCategory = completion.choices[0].message.content.trim();

    res.json({ category: suggestedCategory });
  } catch (error) {
    next(error);
  }
};

// Suggest priority based on task details
exports.suggestPriority = async (req, res, next) => {
  try {
    const { title, description, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const daysUntilDue = due_date
      ? Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    const completion = await aiClient.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content:
            'You are a priority assessment system. Analyze the task and respond with ONLY one word: "high", "medium", or "low".',
        },
        {
          role: "user",
          content: `Task: ${title}
Description: ${description || "No description"}
${daysUntilDue !== null ? `Days until due: ${daysUntilDue}` : "No due date"}

Suggest priority level.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const priority = completion.choices[0].message.content.trim().toLowerCase();

    res.json({
      priority: ["low", "medium", "high"].includes(priority)
        ? priority
        : "medium",
    });
  } catch (error) {
    next(error);
  }
};
