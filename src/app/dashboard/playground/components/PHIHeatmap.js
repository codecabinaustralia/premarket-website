'use client';

import { useEffect, useRef, useState } from 'react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_VERSION = '3.18.0';
const AUSTRALIA_CENTER = [134.0, -28.0];
const INITIAL_ZOOM = 4;

function getColorStops(metric) {
  if (metric === 'sdb') {
    return [
      [0, '#ef4444'],
      [25, '#f97316'],
      [45, '#eab308'],
      [50, '#22c55e'],
      [55, '#eab308'],
      [75, '#f97316'],
      [100, '#ef4444'],
    ];
  }
  return [
    [0, '#ef4444'],
    [20, '#f97316'],
    [40, '#eab308'],
    [60, '#84cc16'],
    [80, '#22c55e'],
    [100, '#10b981'],
  ];
}

/** Load mapbox-gl from CDN (bypasses webpack bundling issues with workers) */
function loadMapboxGL() {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) {
      resolve(window.mapboxgl);
      return;
    }

    // CSS
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }

    // JS
    if (document.getElementById('mapbox-gl-js')) {
      // Script tag exists but mapboxgl not ready yet - wait for it
      const check = setInterval(() => {
        if (window.mapboxgl) {
          clearInterval(check);
          resolve(window.mapboxgl);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); reject(new Error('mapbox-gl load timeout')); }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'mapbox-gl-js';
    script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;
    script.onload = () => {
      if (window.mapboxgl) resolve(window.mapboxgl);
      else reject(new Error('mapbox-gl loaded but not available on window'));
    };
    script.onerror = () => reject(new Error('Failed to load mapbox-gl script'));
    document.head.appendChild(script);
  });
}

export default function PHIHeatmap({ geojson, metric, onSuburbClick, loading, flyToLocation, selectedMarker }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const markerRef = useRef(null);
  const resizeObserver = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const onSuburbClickRef = useRef(onSuburbClick);

  useEffect(() => { onSuburbClickRef.current = onSuburbClick; }, [onSuburbClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError('NEXT_PUBLIC_MAPBOX_TOKEN not set');
      return;
    }

    let cancelled = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !mapContainer.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const m = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: AUSTRALIA_CENTER,
          zoom: INITIAL_ZOOM,
          minZoom: 3,
          maxZoom: 15,
          attributionControl: false,
        });

        m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

        popup.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '260px',
          className: 'phi-popup',
        });

        m.on('load', () => {
          if (cancelled) return;

          m.resize();

          m.addSource('suburbs', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          m.addLayer({
            id: 'suburb-heat',
            type: 'heatmap',
            source: 'suburbs',
            maxzoom: 9,
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 100, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 9, 2],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 15, 9, 30],
              'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 9, 0],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)',
                0.2, '#7c3aed',
                0.4, '#f97316',
                0.6, '#eab308',
                0.8, '#22c55e',
                1, '#10b981',
              ],
            },
          });

          m.addLayer({
            id: 'suburb-circles',
            type: 'circle',
            source: 'suburbs',
            minzoom: 7,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 6, 12, 14],
              'circle-color': [
                'interpolate', ['linear'], ['get', 'value'],
                0, '#ef4444',
                20, '#f97316',
                40, '#eab308',
                60, '#84cc16',
                80, '#22c55e',
                100, '#10b981',
              ],
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.85],
              'circle-stroke-width': 1,
              'circle-stroke-color': 'rgba(255,255,255,0.2)',
            },
          });

          m.addLayer({
            id: 'suburb-labels',
            type: 'symbol',
            source: 'suburbs',
            minzoom: 9,
            layout: {
              'text-field': ['concat', ['to-string', ['get', 'value']]],
              'text-size': 10,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-allow-overlap': false,
            },
            paint: { 'text-color': '#ffffff' },
          });

          setMapReady(true);
        });

        m.on('mouseenter', 'suburb-circles', (e) => {
          if (!e.features?.length) return;
          m.getCanvas().style.cursor = 'pointer';
          const f = e.features[0];
          const props = f.properties;
          const phi = typeof props.phi === 'string' ? JSON.parse(props.phi) : props.phi || {};

          popup.current
            .setLngLat(f.geometry.coordinates)
            .setHTML(`
              <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #e2e8f0; background: #1e293b; padding: 8px 10px; border-radius: 6px; border: 1px solid #334155;">
                <div style="font-weight: 700; margin-bottom: 4px;">${props.suburb || 'Unknown'}, ${props.state || ''}</div>
                <div style="color: #94a3b8; font-size: 10px;">${props.propertyCount || 0} properties</div>
                <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px;">
                  <span style="color: #64748b;">BDI</span><span style="text-align: right;">${phi.bdi ?? '—'}</span>
                  <span style="color: #64748b;">SMI</span><span style="text-align: right;">${phi.smi ?? '—'}</span>
                  <span style="color: #64748b;">PVI</span><span style="text-align: right;">${phi.pvi ?? '—'}</span>
                  <span style="color: #64748b;">MHI</span><span style="text-align: right;">${phi.mhi ?? '—'}</span>
                </div>
              </div>
            `)
            .addTo(m);
        });

        m.on('mouseleave', 'suburb-circles', () => {
          m.getCanvas().style.cursor = '';
          popup.current.remove();
        });

        m.on('click', 'suburb-circles', (e) => {
          if (!e.features?.length) return;
          const f = e.features[0];
          const props = f.properties;
          const coords = f.geometry.coordinates;
          const phi = typeof props.phi === 'string' ? JSON.parse(props.phi) : props.phi || {};
          if (onSuburbClickRef.current) {
            onSuburbClickRef.current({
              suburb: props.suburb,
              state: props.state,
              postcode: props.postcode,
              propertyCount: props.propertyCount,
              buyerScore: props.buyerScore,
              sellerScore: props.sellerScore,
              phi,
              lng: coords[0],
              lat: coords[1],
            });
          }
        });

        m.on('error', (e) => console.error('Mapbox error:', e.error));

        map.current = m;

        // Resize observer to keep map in sync with container
        resizeObserver.current = new ResizeObserver(() => {
          if (map.current) map.current.resize();
        });
        resizeObserver.current.observe(mapContainer.current);
      })
      .catch((err) => {
        console.error('Failed to load mapbox-gl:', err);
        if (!cancelled) setMapError(err.message);
      });

    return () => {
      cancelled = true;
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
        resizeObserver.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const source = map.current.getSource('suburbs');
    if (!source) return;
    source.setData(geojson?.features?.length ? geojson : { type: 'FeatureCollection', features: [] });
  }, [geojson, mapReady]);

  // Update colors on metric change
  useEffect(() => {
    if (!mapReady || !map.current) return;
    const colorStops = getColorStops(metric);
    const colorExpr = ['interpolate', ['linear'], ['get', 'value']];
    for (const [val, color] of colorStops) colorExpr.push(val, color);
    try { map.current.setPaintProperty('suburb-circles', 'circle-color', colorExpr); } catch {}
  }, [metric, mapReady]);

  // Fly to location
  useEffect(() => {
    if (!mapReady || !map.current || !flyToLocation) return;
    map.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: flyToLocation.zoom || 12,
      duration: 1500,
    });
  }, [flyToLocation, mapReady]);

  // Selected marker
  useEffect(() => {
    if (!mapReady || !map.current) return;

    // Remove previous marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (!selectedMarker) return;

    // Need mapboxgl from window since we loaded via CDN
    const mapboxgl = window.mapboxgl;
    if (!mapboxgl) return;

    const el = document.createElement('div');
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#f97316';
    el.style.border = '2px solid #fff';
    el.style.boxShadow = '0 0 8px rgba(249,115,22,0.6)';

    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([selectedMarker.lng, selectedMarker.lat])
      .addTo(map.current);
  }, [selectedMarker, mapReady]);

  if (mapError) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 300 }} className="flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
        <div className="text-center">
          <p className="text-xs text-red-400 font-mono mb-1">Map failed to load</p>
          <p className="text-[10px] text-slate-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 300 }}>
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '0.5rem', overflow: 'hidden' }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
        </div>
      )}
    </div>
  );
}
