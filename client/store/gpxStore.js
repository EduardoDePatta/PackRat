import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '../constants/api';

export const convertGeoJSONToGPX = createAsyncThunk(
  'gpx/convertGeoJSONToGPX',
  async (geoJSON, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${api}/gpx/geojson`, { geoJSON });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const gpxSlice = createSlice({
  name: 'gpx',
  initialState: {
    gpxData: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetGpxData: (state) => {
      state.gpxData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(convertGeoJSONToGPX.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertGeoJSONToGPX.fulfilled, (state, action) => {
        state.gpxData = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(convertGeoJSONToGPX.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetGpxData } = gpxSlice.actions;

export default gpxSlice.reducer;