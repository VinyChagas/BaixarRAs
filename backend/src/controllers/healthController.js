/**
 * Controller de health check
 */

export function health(req, res) {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
