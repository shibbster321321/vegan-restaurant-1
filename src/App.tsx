{/* Previous App.tsx content with updated API_URL */}
import React, { useState, useMemo, useEffect } from 'react';
import { Utensils, Home } from 'lucide-react';
import { Restaurant, CuisineType, ViewMode } from './types';
import { RestaurantCard } from './components/RestaurantCard';
import { AddRestaurantForm } from './components/AddRestaurantForm';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { ViewToggle } from './components/ViewToggle';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';

// Update this URL when you deploy your backend
const API_URL = 'https://your-backend-url.onrender.com/api';

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('All');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  // Fetch restaurants from the server
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/restaurants`);
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      const data = await response.json();
      setRestaurants(data);
      setError(null);
    } catch (err) {
      setError('Failed to load restaurants. Please try again later.');
      console.error('Error fetching restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRestaurant = async (newRestaurant: Omit<Restaurant, 'id' | 'timestamp'>) => {
    try {
      const restaurantData = {
        ...newRestaurant,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      const response = await fetch(`${API_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      if (!response.ok) throw new Error('Failed to add restaurant');
      
      setRestaurants([restaurantData, ...restaurants]);
      setError(null);
    } catch (err) {
      setError('Failed to add restaurant. Please try again.');
      console.error('Error adding restaurant:', err);
    }
  };

  const handleUpdateRestaurant = async (id: string, updatedData: Omit<Restaurant, 'id' | 'timestamp'>) => {
    try {
      const restaurantData = {
        ...updatedData,
        timestamp: Date.now(),
      };

      const response = await fetch(`${API_URL}/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      if (!response.ok) throw new Error('Failed to update restaurant');

      setRestaurants(
        restaurants.map((restaurant) =>
          restaurant.id === id
            ? { ...restaurant, ...restaurantData }
            : restaurant
        )
      );
      setError(null);
    } catch (err) {
      setError('Failed to update restaurant. Please try again.');
      console.error('Error updating restaurant:', err);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete restaurant');

      setRestaurants(restaurants.filter((restaurant) => restaurant.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete restaurant. Please try again.');
      console.error('Error deleting restaurant:', err);
    }
  };

  const filteredAndSortedRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;
        const matchesPrice = priceFilter === 'all' || restaurant.priceRange === priceFilter;
        return matchesSearch && matchesCuisine && matchesPrice;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.timestamp - a.timestamp;
          case 'oldest':
            return a.timestamp - b.timestamp;
          case 'rating':
            return b.rating - a.rating;
          case 'price-asc':
            return a.priceRange.length - b.priceRange.length;
          case 'price-desc':
            return b.priceRange.length - a.priceRange.length;
          default:
            return 0;
        }
      });
  }, [restaurants, searchTerm, selectedCuisine, priceFilter, sortBy]);

  const Header = () => (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Wall</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdminView && (
              <button
                onClick={() => setIsAdminView(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            )}
            {!isAdminView && (
              <button
                onClick={() => setIsAdminView(true)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  if (isAdminView) {
    if (!isAuthenticated) {
      return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <AdminPanel
          restaurants={restaurants}
          onAdd={handleAddRestaurant}
          onUpdate={handleUpdateRestaurant}
          onDelete={handleDeleteRestaurant}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Find a Vegan Restaurant near you
          </h2>
          <p className="text-xl text-gray-600">
            Add any restaurant suggestions that you have
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <AddRestaurantForm onAdd={handleAddRestaurant} />
        
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCuisine={selectedCuisine}
          onCuisineChange={setSelectedCuisine}
          priceFilter={priceFilter}
          onPriceFilterChange={setPriceFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading restaurants...</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
            
            {filteredAndSortedRestaurants.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {restaurants.length === 0
                    ? "No restaurants added yet. Be the first to recommend one!"
                    : "No restaurants match your filters."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <MapView
            restaurants={filteredAndSortedRestaurants}
            selectedRestaurant={selectedRestaurant}
            onRestaurantSelect={setSelectedRestaurant}
          />
        )}
      </main>
    </div>
  );
}