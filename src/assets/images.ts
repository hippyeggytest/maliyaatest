//  This file provides a centralized place to manage image URLs for the application

// School related images
export const schoolImages = {
  classroom: "https://images.unsplash.com/photo-1503676382389-4809596d5290?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  graduates: "https://images.unsplash.com/photo-1462536943532-57a629f6cc60?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  vintage: "https://images.unsplash.com/photo-1578593139939-cccb1e98698c?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  lockers: "https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  staircase: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBjbGFzc3Jvb20lMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MjY0NzE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  building: "https://images.unsplash.com/photo-1472377723522-4768db9c41ce?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBidWlsZGluZyUyMGNsYXNzcm9vbSUyMGVkdWNhdGlvbnxlbnwwfHx8fDE3NDYyMDM5NDJ8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  modern: "https://images.unsplash.com/photo-1494475673543-6a6a27143fc8?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMG1pZGRsZSUyMGVhc3QlMjBhcmFiaWMlMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MDIyMzY0fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  defaultSchool: "https://images.unsplash.com/photo-1508062878650-88b52897f298?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidWlsZGluZyUyMGFyYWJpYyUyMGVkdWNhdGlvbiUyMG1pZGRsZSUyMGVhc3QlMjBjbGFzc3Jvb218ZW58MHx8fHwxNzQ2MDIxMzg2fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
};

// Fallback and placeholder images
export const fallbackImages = {
  avatar: "https://images.unsplash.com/photo-1501349800519-48093d60bde0?ixlib=rb-4.0.3&fit=fillmax&h=600&w=800",
  placeholder: "https://via.placeholder.com/800x600?text=No+Image"
};

// Function to get an image with fallback
export const getImageWithFallback = (url: string | undefined, fallback: string = fallbackImages.placeholder): string => {
  return url || fallback;
};
 