import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import mapboxgl, { Marker } from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '@env';
import { useSelector, useDispatch } from 'react-redux';

import {
  Platform,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Alert,
} from 'react-native';
import {
  getShapeSourceBounds,
  calculateZoomLevel,
  findTrailCenter,
  processShapeData,
  mapboxStyles,
  getLocation,
  isShapeDownloadable,
  isPoint,
  isPolygonOrMultiPolygon,
  multiPolygonBounds,
} from '../../utils/mapFunctions';
import MapButtonsOverlay from './MapButtonsOverlay';
import { saveFile } from '../../utils/fileSaver/fileSaver';
import * as DocumentPicker from 'expo-document-picker';
import togpx from 'togpx';
import { gpx as toGeoJSON } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import MapPreview from './MapPreview';
import useCustomStyles from '~/hooks/useCustomStyles';
import {
  getPolygonLayer,
  getUserLocationLayer,
  trailCapLayer,
  trailLayer,
} from './layers/Layers';

// import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const DESTINATION = 'destination';
const TRIP = 'trip';

const latlngStyle = {
  position: 'absolute',
  zIndex: 1,
  background: 'white',
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: 11,
  top: '97vh',
  left: '45%',
  zIndex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.40)',
};

const loadStyle = {
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: '10px',
  },
  map: {
    width: '100%',
    minHeight: '100vh', // Adjust the height to your needs
  },
  modal: {
    alignItems: 'center',
  },
};

const WebMap = ({ shape: shapeProp }) => {
  useEffect(() => {
    // temporary solution to fix mapbox-gl-js missing css error
    if (Platform.OS === 'web') {
      // inject mapbox css into head
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // inject mapbox js into head
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.0/mapbox-gl.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  //TODO fix usestate hell and convert to typescript
  const [shape, setShape] = useState(shapeProp);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-77.0369);
  const [lat, setLat] = useState(38.9072);
  // consts
  const dw = Dimensions.get('screen').width;
  const dh = Dimensions.get('screen').height;
  const fullMapDiemention = useMemo(() => ({ width: dw, height: 360 }), [dw]);
  const previewMapDiemension = { width: dw * 0.9, height: 220 };

  const [zoomLevel, setZoomLevel] = useState(10);
  const [trailCenterPoint, setTrailCenterPoint] = useState(null);
  const zoomLevelRef = useRef(10);
  const trailCenterPointRef = useRef(null);

  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [mapStyle, setMapStyle] = useState(mapboxStyles[0].style);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [userLng, setUserLng] = useState(null);
  const [userLat, setUserLat] = useState(null);
  const [markerCoordinates, setMarkerCoordinates] = useState(null);

  // download variables
  const dispatch = useDispatch();
  const [downloadable, setDownloadable] = useState(false);
  const styles = useCustomStyles(loadStyles);

  useEffect(() => {
    // update the shape state when a new shapeProp gets passed
    if (shapeProp !== shape) setShape(shapeProp);
  }, [shapeProp]);

  useEffect(() => {
    if (shape?.features[0]?.geometry?.coordinates?.length >= 1) {
      let bounds = getShapeSourceBounds(shape);
      bounds = bounds[0].concat(bounds[1]);

      const mapDim = fullMapDiemention;

      const latZoom = calculateZoomLevel(bounds, mapDim);
      const trailCenter = findTrailCenter(shape);

      zoomLevelRef.current = latZoom;
      trailCenterPointRef.current = trailCenter;

      setDownloadable(isShapeDownloadable(shape));
    }
  }, [shape, fullMapDiemention]);

  useEffect(() => {
    if (!mapFullscreen && !isPolygonOrMultiPolygon(shape)) return;
    if (!lng || !lat) return;

    const center =
      trailCenterPointRef.current &&
      !isNaN(trailCenterPointRef.current[0]) &&
      !isNaN(trailCenterPointRef.current[1])
        ? trailCenterPointRef.current
        : [lng, lat];
    const zoom = zoomLevelRef.current ? zoomLevelRef.current : zoomLevel;

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom,
        interactive: mapFullscreen,
      });

      mapInstance.on('load', () => {
        if (isPoint(shape)) {
          addPoints(mapInstance);
        } else if (isPolygonOrMultiPolygon(shape)) {
          addPolygons(mapInstance);
        } else {
          addTrailLayer(mapInstance);
        }

        if (mapFullscreen && showUserLocation) {
          const userLocationLayer = getUserLocationLayer(lng, lat);
          mapInstance.addLayer(userLocationLayer);
        }

        mapInstance.on('move', () => {
          const { lng, lat } = mapInstance.getCenter();
          setLng(lng.toFixed(4));
          setLat(lat.toFixed(4));
          setZoomLevel(mapInstance.getZoom().toFixed(2));
        });

        map.current = mapInstance;
      });
    } catch (error) {
      console.error(error);
    }
  }, [mapFullscreen]);

  useEffect(() => {
    if (map.current && isPoint(shape)) {
      addPoints(map.current);
    } else if (map.current && shape.features[0].geometry.type !== 'Point') {
      removeTrailLayer(map.current);
      addTrailLayer(map.current);
      map.current.setCenter(trailCenterPointRef.current);
      map.current.setZoom(zoomLevelRef.current);
    }
  }, [shape]);

  const removeLayerAndSource = (mapInstance, type) => {
    if (mapInstance.getLayer(type)) {
      mapInstance.removeLayer(type);
    }

    if (mapInstance.getSource(type)) {
      mapInstance.removeSource(type);
    }
  };

  /**
   * Removes the existing source and layers for the trail-cap and trail from the map instance.
   *
   * @param {object} mapInstance - The map instance to remove the layers and source from.
   */
  const removeTrailLayer = (mapInstance) => {
    // Remove existing source and layers if they exist
    removeLayerAndSource(mapInstance, 'trail-cap');
    removeLayerAndSource(mapInstance, 'trail');
  };

  /**
   * Adds a trail layer to the given map instance.
   *
   * @param {Object} mapInstance - The map instance to add the trail layer to.
   */
  const addTrailLayer = (mapInstance) => {
    const processedShape = processShapeData(shape);
    // Add new source and layers
    mapInstance.addSource('trail', {
      type: 'geojson',
      data: processedShape || shape,
    });
    mapInstance.addLayer(trailLayer);
    mapInstance.addLayer(trailCapLayer);
  };

  const setMarkerStyle = (marker) => {
    marker.getElement().style.width = '28px';
    marker.getElement().style.height = '40px';
  };

  const setMarkerListeners = (marker, markerCoordinates) => {
    marker.getElement().addEventListener('click', () => {
      setMarkerCoordinates(markerCoordinates);
    });
    marker.getElement().addEventListener('dbclick', () => {
      window.open(
        `https://maps.google.com?q=${markerCoordinates.lat},${markerCoordinates.lng}`,
      );
    });
  };

  const createDefaultMarker = (mapInstance, pointLatLong) => {
    const [lng, lat] = pointLatLong;
    return new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapInstance);
  };

  /**
   * Adds points to the map instance.
   *
   * @param {type} mapInstance - The map instance to add points to.
   * @return {type} None
   */
  const addPoints = (mapInstance) => {
    if (mapInstance) {
      const pointLatLong = shape?.features[0]?.geometry?.coordinates;
      if (pointLatLong && !isNaN(pointLatLong[0]) && !isNaN(pointLatLong[1])) {
        // TODO create a marker class with its own methods
        const marker = createDefaultMarker(mapInstance, pointLatLong);
        MapUtils.setMarkerStyle(marker);
        setMarkerStyle(marker);
        setMarkerListeners(marker, { lng, lat });
        mapInstance.setCenter(pointLatLong);
      } else {
        console.error('Invalid coordinates.');
      }
    }
  };

  /**
   * Adds polygons to the map instance.
   *
   * @param {object} mapInstance - The map instance to add the polygons to.
   */
  const addPolygons = (mapInstance) => {
    if (mapInstance) {
      const { features } = shape;
      const polygonLayer = getPolygonLayer(features[0]);
      mapInstance.addLayer(polygonLayer);
      mapInstance.setCenter(multiPolygonBounds(features[0]));
    }
  };
  /**
   * Fetches the GPX download and handles the download process.
   * This function sets the state of 'downloading' to true and then tries to fetch the GPX data
   * using the provided shape and options. After receiving the GPX data, it calls the 'handleGpxDownload'
   * function to handle the download. If there is an error during the process, it logs the error to the console.
   *
   * @return {Promise<void>} A promise that resolves when the GPX download is complete.
   */
  const fetchGpxDownload = async () => {
    setDownloading(true);

    try {
      const options = {
        creator: 'PackRat', // Hardcoded creator option
        metadata: {
          name: shape.name || '', // Extract name from geoJSON (if available)
          desc: shape.description || '', // Extract description from geoJSON (if available)
        },
        //   featureTitle: (properties) => properties.name || "", // Extract feature title from properties (if available)
        //   featureDescription: (properties) => properties.description || "", // Extract feature description from properties (if available)
      };
      const gpx = togpx(shape, options);
      await handleGpxDownload(gpx);
      setDownloading(false);
    } catch (error) {
      console.log('error', error);
      setDownloading(false);
    }
  };

  /**
   * Enables full screen mode.
   *
   * @return {void}
   */
  const enableFullScreen = () => {
    setMapFullscreen(true);
    setShowModal(true);
  };

  /**
   * Disable full screen.
   *
   * @return {undefined} No return value.
   */
  const disableFullScreen = () => {
    setMapFullscreen(false);
    setShowModal(false);
  };

  const setMapboxStyle = useCallback(
    (style) => {
      if (map.current) {
        // Step 1: remove sources, layers, etc.
        removeTrailLayer(map.current);

        // Step 2: change the style
        map.current.setStyle(style);

        // Step 3: add the sources, layers, etc. back once the style has loaded
        if (isPoint(shape)) {
          map.current.on('style.load', () => addPoints(map.current));
        } else if (isPolygonOrMultiPolygon) {
          // Add Polygon
        } else {
          map.current.on('style.load', () => {
            addTrailLayer(map.current);
          });
        }
      }
    },
    [addTrailLayer, removeTrailLayer],
  );

  /**
   * Updates the map style and mapbox style to the specified style.
   *
   * @param {style} style - The style to set for the map and mapbox.
   * @return {void} This function does not return a value.
   */
  const handleChangeMapStyle = (style) => {
    setMapStyle(style);
    setMapboxStyle(style);
  };

  const openMaps = () => {
    const pointLatLong = shape?.features[0]?.geometry?.coordinates;
    const { type } = shape.features[0].geometry;
    if (type !== 'Point') {
      const [latlng] = pointLatLong;
      window.open(`https://maps.google.com?q=${latlng[1]},${latlng[0]}`);
    } else {
      const [lng, lat] = pointLatLong;
      window.open(`https://maps.google.com?q=${lat},${lng}`);
    }

    // console.log()
    // if(type !== 'Point') {

    // } else {
    //   window.open(`https://maps.google.com?q=${lat},${lng}`);
    // }
  };

  /**
   * Handles the download of a GPX file.
   *
   * @param {Object} gpxData - The GPX data to be downloaded.
   * @param {string} [filename="trail"] - The name of the file to be downloaded.
   * @param {string} [extension="gpx"] - The extension of the file to be downloaded.
   * @return {Promise<void>} - A promise that resolves when the download is complete.
   */
  const handleGpxDownload = async (
    gpxData,
    filename = shape?.features[0]?.properties?.name ?? 'trail',
    extension = 'gpx',
  ) => {
    if (gpxData) {
      const type = 'application/gpx+xml';
      await saveFile(gpxData, filename, extension, type);
    }
  };

  /**
   * Fetches the user's location and updates the map accordingly.
   *
   * @return {Promise<void>} A Promise that resolves when the location is fetched and the map is updated.
   */
  const fetchLocation = async () => {
    try {
      const location = await getLocation();

      if (location) {
        const { latitude, longitude } = location.coords;
        setUserLng(longitude);
        setUserLat(latitude);
        setShowUserLocation(true);

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
          });

          // Remove existing user location layer if it exists
          removeLayerAndSource(map.current, 'user-location');
          const userLocationLayer = getUserLocationLayer(userLng, userLat);

          // Add new user location layer
          map.current.addLayer(userLocationLayer);
        }
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const element = (
    <View style={[styles.container, { height: showModal ? '100%' : '400px' }]}>
      {!isNaN(lat) && !isNaN(lng) ? (
        <div style={latlngStyle}>
          Latitude: {lat}, Longitude: {lng}
        </div>
      ) : null}
      {showModal || isPolygonOrMultiPolygon(shape) ? (
        <View
          key="map"
          ref={mapContainer}
          style={{
            ...styles.map,
            height: isPolygonOrMultiPolygon(shape) ? 200 : '100vh',
          }}
        />
      ) : (
        <MapPreview shape={shape} />
      )}
      <MapButtonsOverlay
        mapFullscreen={mapFullscreen}
        enableFullScreen={enableFullScreen}
        disableFullScreen={disableFullScreen}
        handleChangeMapStyle={handleChangeMapStyle}
        fetchLocation={fetchLocation}
        styles={styles}
        downloadable={downloadable}
        downloading={downloading}
        navigateToMaps={openMaps}
        onDownload={fetchGpxDownload}
        handleGpxUpload={async () => {
          console.log('clikedd');
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/gpx+xml',
            });
            if (result.type === 'success') {
              const base64Gpx = result.uri.split(',')[1];
              const gpxString = atob(base64Gpx);
              const parsedGpx = new DOMParser().parseFromString(gpxString);
              const geojson = toGeoJSON(parsedGpx);
              setShape(geojson);
            }
          } catch (err) {
            Alert.alert('An error occurred');
          }
        }}
        shape={shape}
      />
    </View>
  );

  return showModal ? (
    <Modal animationType={'fade'} transparent={false} visible={true}>
      {element}
    </Modal>
  ) : (
    element
  );
};

const loadStyles = () => loadStyle;

export default WebMap;
