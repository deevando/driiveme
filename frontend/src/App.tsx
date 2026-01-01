import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import { useStore } from './store';
import type { Offer } from './types';
import { differenceInMinutes, format } from 'date-fns';

const CITIES = ['Todas', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Alicante'];

function App() {
  const {
    offers, addOffer, setOffers, setLoading,
    priorityOrigin, setPriorityOrigin,
    showOnlyPriority, setShowOnlyPriority
  } = useStore();
  const [selectedCity, setSelectedCity] = useState<string>('Todas');

  useEffect(() => {
    // Sync local state with store
    if (priorityOrigin) setSelectedCity(priorityOrigin);
  }, [priorityOrigin]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    setPriorityOrigin(city === 'Todas' ? null : city);
    // If resetting to all, disable exclusive mode
    if (city === 'Todas') setShowOnlyPriority(false);
  };

  const filteredOffers = showOnlyPriority && priorityOrigin
    ? offers.filter(o => o.fromCity.toLowerCase().includes(priorityOrigin.toLowerCase()))
    : offers;

  useEffect(() => {
    // 1. Initial Load
    async function fetchOffers() {
      setLoading(true);
      try {
        const response = await fetch('http://192.168.1.180:3000/api/offers');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched offers:', data);
        setOffers(data);
      } catch (err) {
        console.error('Failed to fetch offers', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();

    // 2. Socket Listeners
    function onConnect() {
      console.log('Connected to WebSocket');
    }

    function onNewOffer(offer: Offer) {
      console.log('New offer received:', offer);
      addOffer(offer);

      // Check Priority
      const isPriority = priorityOrigin && offer.fromCity.toLowerCase().includes(priorityOrigin.toLowerCase());

      try {
        const audioFile = isPriority ? '/alert.mp3' : '/alert.mp3';
        const audio = new Audio(audioFile);
        audio.play().catch(e => console.log('Audio play blocked/failed', e));
      } catch (e) { console.error('Audio error', e); }

      try {
        if (Notification.permission === 'granted') {
          const title = isPriority ? `🔥 ¡PRIORIDAD! ${offer.fromCity} -> ${offer.toCity}` : `Nueva Oferta: ${offer.fromCity} -> ${offer.toCity}`;
          new Notification(title, {
            body: `${offer.vehicle} - ${offer.price}€`,
          });
        }
      } catch (e) { console.error('Notification error', e); }
    }

    socket.on('connect', onConnect);
    socket.on('new_offer', onNewOffer);

    return () => {
      socket.off('connect', onConnect);
      socket.off('new_offer', onNewOffer);
    };
  }, [addOffer, setOffers, setLoading, priorityOrigin]);

  const requestNotification = () => {
    Notification.requestPermission();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-500 flex items-center gap-2">
            <span>Driiveme Ofertas YA</span>
            <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">LIVE</span>
          </h1>
          <p className="text-gray-400 text-sm">Monitor de ofertas en tiempo real</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Prioridad Origen:</label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none text-white h-10"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
              <option value="custom">Otro...</option>
            </select>
          </div>

          {priorityOrigin && (
            <div className="flex flex-col">
              <label className="text-xs text-transparent mb-1">.</label>
              <button
                onClick={() => setShowOnlyPriority(!showOnlyPriority)}
                className={`px-3 py-2 rounded text-sm h-10 border transition flex items-center gap-2
                     ${showOnlyPriority
                    ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}
                   `}
              >
                {showOnlyPriority ? '✅ Solo Prioridad' : '👁️ Ver Todas'}
              </button>
            </div>
          )}

          <button
            onClick={requestNotification}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition h-10 mt-auto"
          >
            🔔 Alertas
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feed Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex justify-between items-center">
            {showOnlyPriority ? `Ofertas desde ${priorityOrigin}` : 'Últimas Ofertas'}
            <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded-full">{filteredOffers.length}</span>
          </h2>

          <div className="flex flex-col gap-6 h-[calc(100vh-200px)] overflow-y-auto pr-2 pt-4 custom-scrollbar">
            {filteredOffers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {showOnlyPriority
                  ? `No hay ofertas prioritarias desde ${priorityOrigin} todavía.`
                  : 'Esperando ofertas...'}
              </div>
            ) : (
              filteredOffers.map(offer => (
                <OfferCard key={offer.id} offer={offer} isPriority={!!(priorityOrigin && offer.fromCity.toLowerCase().includes(priorityOrigin.toLowerCase()))} />
              ))
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="hidden lg:block bg-gray-800 rounded-xl h-[calc(100vh-150px)] p-4 border border-gray-700">
          <div className="h-full w-full bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 flex-col gap-4">
            <div className="text-6xl">🗺️</div>
            <span>Mapa de Ofertas (Próximamente)</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function OfferCard({ offer, isPriority }: { offer: Offer, isPriority: boolean }) {
  const isNew = differenceInMinutes(new Date(), new Date(offer.detectedAt)) < 5;

  const handleOpen = () => {
    const text = `Oferta Driiveme: ${offer.fromCity} -> ${offer.toCity} (${offer.vehicle}) - ${offer.link}`;
    navigator.clipboard.writeText(text);
    window.open(offer.link, '_blank');
  };

  return (
    <div className={`bg-gray-800 p-4 rounded-xl border shadow-sm transition relative group animate-in slide-in-from-top-2 duration-300
      ${isPriority ? 'border-amber-500 bg-amber-900/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-gray-700 hover:border-blue-500'}
    `}>
      {isPriority && (
        <div className="absolute -top-3 left-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
          🔥 PRIORIDAD
        </div>
      )}

      {isNew && (
        <span className="absolute top-2 right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
          NUEVA
        </span>
      )}

      <div className="flex justify-between items-start mt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-xs uppercase tracking-wider">{offer.vehicle}</span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-400 text-xs">{format(new Date(offer.detectedAt), 'HH:mm:ss')}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">
            {offer.fromCity} <span className="text-gray-500">→</span> {offer.toCity}
          </h3>
          <div className="mt-2 text-sm text-gray-300">
            {offer.pickupDate && (
              <div>Salida: {format(new Date(offer.pickupDate), 'dd/MM/yyyy')}</div>
            )}
            <div className="font-mono text-green-400 mt-1">
              {offer.price !== undefined ? `${offer.price}€` : 'Gratis'}
            </div>
            {offer.distance && (
              <div className="text-xs text-gray-500 mt-1">{offer.distance} km</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end">
        <button
          onClick={handleOpen}
          className={`font-bold px-4 py-2 rounded-lg transition w-full text-center shadow-lg
            ${isPriority
              ? 'bg-amber-500 hover:bg-amber-400 text-black '
              : 'bg-white hover:bg-gray-200 text-black'}
          `}
        >
          {isPriority ? '¡RESERVAR AHORA!' : 'Abrir para Reservar'}
        </button>
      </div>
    </div>
  );
}

export default App;
