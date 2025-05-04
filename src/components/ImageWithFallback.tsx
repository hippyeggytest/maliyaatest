import  { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

const ImageWithFallback = ({ 
  src, 
  alt, 
  fallbackSrc = 'https://images.unsplash.com/photo-1501349800519-48093d60bde0?ixlib=rb-4.0.3&fit=fillmax&h=600&w=800', 
  className = ''
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

export default ImageWithFallback;
 