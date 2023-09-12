import { UserFavoritesNotFoundError } from '../../helpers/errors';
import { responseHandler } from '../../helpers/responseHandler';
import { getUserFavoritesService } from '../../services/favorite/favorite.service';
import * as validator from '@packrat/packages';
import User from '../../models/userModel';
import { authorizedProcedure } from '../../middleware/authorizedProcedure';

/**
 * Retrieves the favorite items of a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Array} An array of favorite items belonging to the user.
 */
export const getUserFavorites = async (req, res, next) => {
  const { userId } = req.params;
  const favorites = await getUserFavoritesService(userId, next);
  if (!favorites) next(UserFavoritesNotFoundError);
  res.locals.data = favorites;
  responseHandler(res);
};


export function getUserFavoritesRoute() {
  return authorizedProcedure.input(validator.getUserById).query(async (opts) => {
    const { userId } = opts.input;
    const user = await User.findById({ _id: userId }).populate('favorites')
    return user.favorites;
  });
};