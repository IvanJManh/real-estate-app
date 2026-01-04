import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import 'react-tabs/style/react-tabs.css';
import propertiesData from './properties.json';
import './App.css';

// --- Helper Components ---

const SearchForm = ({ filters, setFilters, clearFilters }) => {
  return (
    <form className="search-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label>Type</label>
        <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
          <option value="any">Any</option>
          <option value="House">House</option>
          <option value="Flat">Flat</option>
        </select>
      </div>
      <div className="form-group">
        <label>Min Price</label>
        <input type="number" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} placeholder="0" />
      </div>
      <div className="form-group">
        <label>Max Price</label>
        <input type="number" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} placeholder="Max" />
      </div>
      <div className="form-group">
        <label>Min Beds</label>
        <select value={filters.minBeds} onChange={e => setFilters({...filters, minBeds: e.target.value})}>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
      </div>
      <div className="form-group">
        <label>Date Added (After)</label>
        <DatePicker selected={filters.dateAfter} onChange={date => setFilters({...filters, dateAfter: date})} />
      </div>
      <div className="form-group">
        <label>Postcode Area</label>
        <input type="text" value={filters.postcode} onChange={e => setFilters({...filters, postcode: e.target.value})} placeholder="e.g. BR1" />
      </div>
      <button className="btn btn-danger" onClick={clearFilters} style={{alignSelf: 'flex-end'}}>Clear</button>
    </form>
  );
};

const PropertyCard = ({ property, addToFavorites }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("propertyId", property.id);
  };

  return (
    <div className="property-card" draggable onDragStart={handleDragStart}>
      <img src={property.images[0]} alt={property.type} className="card-img" />
      <div className="card-content">
        <h3 className="price">£{property.price.toLocaleString()}</h3>
        <h4>{property.bedrooms} bed {property.type} for sale</h4>
        <p><em>{property.location}</em></p>
        <p>{property.description}</p>
        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <Link to={`/property/${property.id}`} className="btn">View Details</Link>
            <button onClick={() => addToFavorites(property)} className="btn btn-fav">❤ Save</button>
        </div>
      </div>
    </div>
  );
};

const FavoritesSidebar = ({ favorites, removeFavorite, clearFavorites }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const propertyId = e.dataTransfer.getData("propertyId");
    // This logic relies on passing a function down, 
    // but React events bubble. We handle add in parent usually, 
    // but here we trigger a custom event or check props.
    // For simplicity in this architecture, we assume the parent passed a handler exposed to window or context,
    // OR we dispatch a custom event.
    // BETTER APPROACH: Pass the handler from App.js to here.
    // Since we need to look up the ID, we will trigger an event the App listens to, or pass the full add function.
    window.dispatchEvent(new CustomEvent('dropProperty', { detail: { id: propertyId } }));
  };

  return (
    <aside 
      className={`favorites-sidebar ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3>Saved Properties</h3>
      {favorites.length === 0 ? <p>Drag properties here to save.</p> : (
        <>
          <button onClick={clearFavorites} className="btn btn-danger" style={{width:'100%', marginBottom:'10px'}}>Clear All</button>
          {favorites.map(fav => (
            <div key={fav.id} className="fav-item" draggable onDragStart={(e) => e.dataTransfer.setData("removeId", fav.id)}>
              <div>
                <strong>£{fav.price.toLocaleString()}</strong><br/>
                <small>{fav.location}</small>
              </div>
              <button onClick={() => removeFavorite(fav.id)} className="btn-danger">X</button>
            </div>
          ))}
          <small style={{display:'block', marginTop:'10px', color:'#666'}}>Drag out or click X to remove.</small>
        </>
      )}
    </aside>
  );
};

// --- Pages ---

const SearchPage = ({ properties, filters, setFilters, clearFilters, addToFavorites, favorites, removeFavorite, clearFavoritesList }) => {
  // Filter Logic
  const filteredProperties = properties.filter(p => {
    const matchType = filters.type === 'any' || p.type === filters.type;
    const matchPrice = (!filters.minPrice || p.price >= filters.minPrice) && (!filters.maxPrice || p.price <= filters.maxPrice);
    const matchBeds = p.bedrooms >= filters.minBeds;
    const matchPostcode = p.postcode.toLowerCase().includes(filters.postcode.toLowerCase());
    const matchDate = !filters.dateAfter || new Date(p.dateAdded) >= filters.dateAfter;
    
    return matchType && matchPrice && matchBeds && matchPostcode && matchDate;
  });

  return (
    <div className="app-container">
      <SearchForm filters={filters} setFilters={setFilters} clearFilters={clearFilters} />
      <div className="property-list">
        {filteredProperties.length > 0 ? (
            filteredProperties.map(p => (
                <PropertyCard key={p.id} property={p} addToFavorites={addToFavorites} />
            ))
        ) : <p>No results found matching your criteria.</p>}
      </div>
      <FavoritesSidebar favorites={favorites} removeFavorite={removeFavorite} clearFavorites={clearFavoritesList} />
    </div>
  );
};

const PropertyDetails = ({ properties, addToFavorites }) => {
  const { id } = useParams();
  const property = properties.find(p => p.id === id);
  const [mainImg, setMainImg] = useState(property ? property.images[0] : '');

  if (!property) return <div>Property not found</div>;

  return (
    <div className="app-container">
      <div style={{gridColumn: '1 / -1'}}>
        <Link to="/" className="btn" style={{marginBottom: '20px'}}>← Back to Search</Link>
        
        <div className="details-container">
          <div className="gallery">
            <div className="gallery-main">
              <img src={mainImg} alt="Main view" />
            </div>
            <div className="gallery-thumbs">
              {property.images.map((img, idx) => (
                <img key={idx} src={img} alt="thumb" onClick={() => setMainImg(img)} />
              ))}
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'20px'}}>
            <div>
                <h2>{property.location}</h2>
                <h3 className="price">£{property.price.toLocaleString()}</h3>
            </div>
            <button onClick={() => addToFavorites(property)} className="btn btn-fav">❤ Save to Favorites</button>
          </div>

          <Tabs className="react-tabs" style={{marginTop: '20px'}}>
            <TabList>
              <Tab>Description</Tab>
              <Tab>Floor Plan</Tab>
              <Tab>Map</Tab>
            </TabList>

            <TabPanel>
              <p>{property.longDescription}</p>
              <p><strong>Added on:</strong> {property.dateAdded}</p>
            </TabPanel>
            <TabPanel>
              <img src={property.floorPlan} alt="Floor Plan" style={{maxWidth: '100%'}} />
            </TabPanel>
            <TabPanel>
              <iframe 
                title="map"
                width="100%" 
                height="400" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={property.map}>
              </iframe>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [properties] = useState(propertiesData);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    type: 'any',
    minPrice: '',
    maxPrice: '',
    minBeds: 0,
    dateAfter: null,
    postcode: ''
  });

  const addToFavorites = (property) => {
    if (!favorites.find(f => f.id === property.id)) {
      setFavorites([...favorites, property]);
    } else {
      alert("Property already in favorites!");
    }
  };

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const clearFavorites = () => setFavorites([]);

  const clearFilters = () => {
    setFilters({
        type: 'any',
        minPrice: '',
        maxPrice: '',
        minBeds: 0,
        dateAfter: null,
        postcode: ''
    });
  };

  // Event Listener for Drag and Drop from Child Component
  useEffect(() => {
    const handleDropEvent = (e) => {
        const propToAdd = properties.find(p => p.id === e.detail.id);
        if (propToAdd) addToFavorites(propToAdd);
    };
    
    // Logic for removing by dragging OUT of list (using document drop)
    const handleGlobalDrop = (e) => {
        const removeId = e.dataTransfer.getData("removeId");
        if(removeId) {
            removeFavorite(removeId);
        }
    }

    window.addEventListener('dropProperty', handleDropEvent);
    // Note: Global drop for removal is tricky in React without a specific drop zone, 
    // implemented here as a concept for the "Drag out" requirement.
    document.addEventListener('drop', handleGlobalDrop); 
    document.addEventListener('dragover', (e) => e.preventDefault()); // Allow drop anywhere

    return () => {
        window.removeEventListener('dropProperty', handleDropEvent);
        document.removeEventListener('drop', handleGlobalDrop);
    };
  });
  
  return (
    <>
      <header>
        <h1>EstateFinder</h1>
      </header>

      <Routes>
        <Route path="/" element={
          <SearchPage 
            properties={properties} 
            filters={filters} 
            setFilters={setFilters} 
            clearFilters={clearFilters}
            addToFavorites={addToFavorites}
            favorites={favorites}
            removeFavorite={removeFavorite}
            clearFavoritesList={clearFavorites}
          />
        } />

        <Route path="/property/:id" element={
          <PropertyDetails 
            properties={properties} 
            addToFavorites={addToFavorites} 
          />
        } />
      </Routes>
    </>
  );
}

export default App;