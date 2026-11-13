import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { API_PATHS } from '../config/constants';
import { postLogin, getLogout, postSession, deleteSession, getMe } from '../controllers/auth';
import { loginRateLimiter } from '../middleware/auth-rate-limit';
import { verifyUser } from '../services/auth';

const router = Router();

passport.use(new LocalStrategy((username, password, callback) => {
  const user = verifyUser(username, password);
  if (!user) {
    callback(null, false, { message: 'Incorrect username or password.' });
    return undefined;
  }
  callback(null, user);
}));

router.post(API_PATHS.LOGIN, loginRateLimiter, postLogin);
router.get(API_PATHS.LOGOUT, getLogout);

router.post(API_PATHS.SESSION, loginRateLimiter, postSession);
router.delete(API_PATHS.SESSION, deleteSession);
router.get(API_PATHS.AUTH_ME, getMe);

export default router;
