'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Property {
  id: string;
  code: string;
  title: string;
  description?: string;
  propertyType: string;
  commercialStatus: string;
  location: {
    country: string;
    city: string;
    address?: string;
  };
  feature: {
    bedrooms: number;
    bathrooms: number;
    isFurnished: boolean;
    petsAllowed: boolean;
  };
  rentalDetail: {
    monthlyRent: number;
    currency: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    isCover: boolean;
  }>;
  coverImageUrl?: string;
}

interface PropertyListResponse {
  data: Property[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterState {
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  country: string;
}

const INITIAL_FILTERS: FilterState = {
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  city: '',
  country: '',
};

async function getPublicProperties(filters: FilterState, page: number = 1): Promise<PropertyListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '12',
    ...(filters.propertyType && { propertyType: filters.propertyType }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.city && { city: filters.city }),
    ...(filters.country && { country: filters.country }),
  });

  const response = await fetch(`/api/public/properties?${params}`);
  if (!response.ok) throw new Error('Failed to fetch properties');
  return response.json();
}

export default function CatalogoPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const propertyTypes = [
    { value: '', label: 'Todos' },
    { value: 'apartment', label: 'Apartamento' },
    { value: 'house', label: 'Casa' },
    { value: 'studio', label: 'Estudio' },
    { value: 'office', label: 'Oficina' },
    { value: 'warehouse', label: 'Bodega' },
    { value: 'land', label: 'Terreno' },
    { value: 'other', label: 'Otro' },
  ];

  const fetchProperties = async (page: number = 1) => {
    setLoading(true);
    try {
      const data = await getPublicProperties(filters, page);
      setProperties(data.data);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getPublicProperties(INITIAL_FILTERS).then(
      (data) => {
        if (cancelled) return;
        setProperties(data.data);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching properties:', error);
        if (!cancelled) setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProperties(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProperties(page);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency === 'COP' ? 'COP' : 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      apartment: 'Apartamento',
      house: 'Casa',
      studio: 'Estudio',
      office: 'Oficina',
      warehouse: 'Bodega',
      land: 'Terreno',
      other: 'Otro',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="app-shell">
      <section className="panel panel--wide stagger">
        <div className="top-row">
          <div>
            <p className="kicker">Catálogo Público</p>
            <h1 className="title">Propiedades Disponibles</h1>
          </div>
          <Link 
            href="/login" 
            className="btn btn-ghost"
          >
            Iniciar Sesión
          </Link>
        </div>

        <p className="subtitle">
          Encuentra tu próximo hogar entre nuestras propiedades disponibles. Usa los filtros para refinar tu búsqueda.
        </p>

        <article className="income-column">
          <h2 className="section-title">Filtros de Búsqueda</h2>
          <div className="stack stack-lg">
            <div className="field">
              <label className="field-label" htmlFor="propertyType">
                Tipo de Propiedad
              </label>
              <select
                id="propertyType"
                className="field-input"
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="income-filters">
              <div className="field">
                <label className="field-label" htmlFor="minPrice">
                  Precio Mínimo
                </label>
                <input
                  id="minPrice"
                  className="field-input"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="maxPrice">
                  Precio Máximo
                </label>
                <input
                  id="maxPrice"
                  className="field-input"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="income-filters">
              <div className="field">
                <label className="field-label" htmlFor="city">
                  Ciudad
                </label>
                <input
                  id="city"
                  className="field-input"
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Ej: Cali"
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="country">
                  País
                </label>
                <input
                  id="country"
                  className="field-input"
                  type="text"
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  placeholder="Ej: Colombia"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="btn btn-primary"
            >
              Buscar Propiedades
            </button>
          </div>
        </article>

        <article className="income-column property-list-wrap">
          <h2 className="section-title">
            Resultados ({total > 0 ? `${properties.length} de ${total}` : '0'})
          </h2>
          
          {loading && <p className="alert alert-info">Cargando propiedades...</p>}
          
          {!loading && total === 0 && (
            <p className="alert alert-info">No se encontraron propiedades con los filtros seleccionados.</p>
          )}
          
          {!loading && total > 0 && (
            <div className="property-grid">
              {properties.map((property) => (
                <Link 
                  key={property.id} 
                  href={`/catalogo/${property.id}`}
                  className="property-card"
                >
                  <div className="property-card-image">
                    {property.coverImageUrl ? (
                      <img
                        src={property.coverImageUrl}
                        alt={property.title}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>Sin imagen</span>
                      </div>
                    )}
                    <div className="property-card-badge">
                      {getPropertyTypeLabel(property.propertyType)}
                    </div>
                  </div>
                  <div className="property-card-content">
                    <h3 className="property-card-title">{property.title}</h3>
                    <p className="property-card-location">
                      {property.location.city}, {property.location.country}
                    </p>
                    <div className="property-card-price">
                      {formatPrice(property.rentalDetail.monthlyRent, property.rentalDetail.currency)}
                    </div>
                    <div className="property-card-features">
                      <span>{property.feature.bedrooms} hab</span>
                      <span>•</span>
                      <span>{property.feature.bathrooms} baños</span>
                    </div>
                    <div className="property-card-tags">
                      {property.feature.isFurnished && (
                        <span className="property-tag">Amueblado</span>
                      )}
                      {property.feature.petsAllowed && (
                        <span className="property-tag">Mascotas</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              
              <div className="pagination-numbers">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      type="button"
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`pagination-number ${
                        currentPage === page ? 'active' : ''
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Siguiente →
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
