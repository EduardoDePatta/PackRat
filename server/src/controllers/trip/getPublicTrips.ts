import { getPublicTripsService } from "../../services/trip/getPublicTripService.ts";

/**
 * Retrieves public trips based on the given query parameter.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The public trips as a JSON response.
 */
export const getPublicTrips = async (req, res) => {
  try {
    const { queryBy } = req.query;

    const publicTrips = await getPublicTripsService(queryBy);

    res.status(200).json(publicTrips);
  } catch (error) {
    console.error(error);
    res.status(404).json({ msg: "Trips cannot be found" });
  }
};