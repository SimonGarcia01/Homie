'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/public/properties/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Propiedad no encontrada o no disponible');
          } else {
            setError('Error al cargar la propiedad');
          }
          return;
        }
        
        const data: Property = await response.json();
        setProperty(data);
        setSelectedImage(data.coverImageUrl || data.images[0]?.imageUrl || '');
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Error al cargar la propiedad');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [params.id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Propiedad no encontrada</h1>
          <p className="text-gray-600 mb-6">{error || 'La propiedad que buscas no existe o no está disponible.'}</p>
          <Link 
            href="/catalogo" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/catalogo" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Volver al catálogo
            </Link>
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Main Image */}
              <div className="relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={property.title}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Sin imagen principal</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  {getPropertyTypeLabel(property.propertyType)}
                </div>
              </div>

              {/* Image Gallery */}
              {property.images.length > 1 && (
                <div className="p-4 border-t">
                  <div className="grid grid-cols-4 gap-2">
                    {property.images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(image.imageUrl)}
                        className={`relative rounded overflow-hidden border-2 transition-all ${
                          selectedImage === image.imageUrl
                            ? 'border-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.imageUrl}
                          alt={property.title}
                          className="w-full h-20 object-cover"
                        />
                        {image.isCover && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                            Portada
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            {/* Price and Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(property.rentalDetail.monthlyRent, property.rentalDetail.currency)}
                </div>
                <div className="text-sm text-gray-600">Precio mensual</div>
                <div className="mt-4 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Disponible
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Información Principal</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Código:</span>
                  <p className="font-medium">{property.code}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <p className="font-medium">{getPropertyTypeLabel(property.propertyType)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ubicación:</span>
                  <p className="font-medium">
                    {property.location.address && `${property.location.address}, `}
                    {property.location.city}, {property.location.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Características</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Habitaciones:</span>
                  <p className="font-medium text-lg">{property.feature.bedrooms}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Baños:</span>
                  <p className="font-medium text-lg">{property.feature.bathrooms}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {property.feature.isFurnished && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Amueblado
                  </div>
                )}
                {property.feature.petsAllowed && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mascotas permitidas
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Descripción</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Contact CTA */}
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">¿Interesado en esta propiedad?</h3>
              <p className="text-gray-600 mb-4">Inicia sesión para contactar al propietario o solicitar más información.</p>
              <Link 
                href="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
