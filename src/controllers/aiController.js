// GET /api/ai/free-model — All logged-in users
exports.freeModel = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `🤖 Free AI Model Response for ${req.user.email} (Role: ${req.user.role})`,
    data: { model: 'gpt-free-v1', output: 'Hello! This is a basic AI response.' },
  });
};

// POST /api/ai/premium-model — Premium_User and Admin only
exports.premiumModel = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `⭐ Premium AI Model Response for ${req.user.email} (Role: ${req.user.role})`,
    data: { model: 'gpt-premium-v4', output: 'Advanced AI response with full capabilities.' },
  });
};

// DELETE /api/ai/purge-cache — Admin only
exports.purgeCache = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `🗑️ Cache purged by Admin: ${req.user.email}`,
    data: { purgedAt: new Date().toISOString() },
  });
};