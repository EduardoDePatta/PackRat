import { PackNotFoundError } from '../../helpers/errors';
import { responseHandler } from '../../helpers/responseHandler';
import { getPacksService } from '../../services/pack/pack.service';
import { buildMessage } from '../../helpers/buildMessage';
import * as validator from '@packrat/packages';
import { authorizedProcedure } from '../../middleware/authorizedProcedure';
/**
 * Retrieves packs associated with a specific owner.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @return {Promise} - Array of packs.
 */
export const getPacks = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const { queryBy } = req.query;

    const packs = await getPacksService(ownerId, queryBy);

    res.locals.data = packs;

    const message = 'Packs retrieved successfully';
    responseHandler(res, message);
  } catch (error) {
    next(PackNotFoundError);
  }
};

export function getPacksRoute() {
  return authorizedProcedure.input(validator.getPacks).query(async (opts) => {
    const { ownerId, queryBy } = opts.input;
    const packs = await getPacksService(ownerId, queryBy);
    return { packs, message: 'Packs retrieved successfully' };
  });
}
