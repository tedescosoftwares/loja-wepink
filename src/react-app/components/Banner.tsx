import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner as BannerType } from '@/shared/types';

export default function Banner() {
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading) {
    return (
       <div className="relative mx-4 md:mx-0 overflow-hidden group w-full
          aspect-[4/5] max-h-[520px]
          md:aspect-[2000/651] md:max-h-[620px]
          bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
       />


    );
  }

  if (banners.length === 0) {
    return (
       <div className="relative mx-4 md:mx-0 overflow-hidden w-full
        aspect-[4/5] max-h-[520px]
        md:aspect-[2000/651] md:max-h-[620px]
        bg-gradient-to-r from-indigo-500 to-purple-600"
       />



    );
  }

  return (
     <div className="
      relative md:mx-0 overflow-hidden group w-full
      aspect-[4/5] max-h-[520px]
      md:aspect-[2000/651] md:max-h-[620px]
      mt-0 md:mt-0
     ">

      {banners.map((banner, index) => {
        const desktopSrc = banner.image_url ?? banner.image_mobile_url ?? undefined;
        const mobileSrc = banner.image_mobile_url ?? undefined;

        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="relative h-full">
              {desktopSrc ? (
                <>
                  {/* Mobile (se existir image_mobile_url) */}
                  {mobileSrc && (
                    <img
                      src={mobileSrc}
                      alt={banner.title}
                      className="w-full h-full object-cover block md:hidden"
                    />
                  )}

                  {/* Desktop (fallback quando não tem mobile) */}
                  <img
                    src={desktopSrc}
                    alt={banner.title}
                    className={`w-full h-full object-cover ${mobileSrc ? "hidden md:block" : "block"
                      }`}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
              )}
            </div>
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-1.5 md:p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-gray-800" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-1.5 md:p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-gray-800" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 md:space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
