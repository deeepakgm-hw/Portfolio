const { query } = require('../config/db');

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await query.get('SELECT * FROM profile LIMIT 1');
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({
      ...profile,
      socials: profile.socials ? JSON.parse(profile.socials) : []
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, title, kicker, bio, manifesto, location, email, socials } = req.body;
    const socialsJson = Array.isArray(socials) ? JSON.stringify(socials) : undefined;

    await query.run(
      `UPDATE profile SET 
        name = COALESCE(?, name),
        title = COALESCE(?, title),
        kicker = COALESCE(?, kicker),
        bio = COALESCE(?, bio),
        manifesto = COALESCE(?, manifesto),
        location = COALESCE(?, location),
        email = COALESCE(?, email),
        socials = COALESCE(?, socials)
      WHERE id = 1`,
      [name, title, kicker, bio, manifesto, location, email, socialsJson]
    );

    const updated = await query.get('SELECT * FROM profile WHERE id = 1');
    res.json({
      ...updated,
      socials: updated.socials ? JSON.parse(updated.socials) : []
    });
  } catch (err) {
    next(err);
  }
};
