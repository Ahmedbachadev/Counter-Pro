/**
 * Counter Pro - Centralized Branding Configuration
 * 
 * This file contains all references to branding assets stored in /public/assets/.
 * Using these constants ensures consistency across the application and makes
 * future brand updates as simple as replacing the files in the public directory.
 */

export const BRANDING = {
  logos: {
    /** 
     * Primary full color logo (text + mark). 
     * Best for light backgrounds or standard navbars.
     */
    primary: 'assets/primarylogo.png',
    
    /** 
     * Primary monochrome logo (text + mark). 
     * Best for dark backgrounds like the footer.
     */
    primaryMonochrome: 'assets/primarymonochromelogo.png',
    
    /** 
     * Compact square logo (mark only).
     * Best for small spaces, avatars, or square badges on light backgrounds.
     */
    iconSquare: 'assets/icon.png',
    
    /** 
     * Compact monochrome square logo (mark only).
     * Best for dark backgrounds or subtle placements.
     */
    iconSquareMonochrome: 'assets/iconmonochrome.png',
    
    /**
     * Browser / PWA / Apple Touch Icon.
     * Used primarily in HTML metadata.
     */
    appIcon: 'assets/appicon.png',
  },
  
  meta: {
    companyName: 'Counter Pro',
    description: 'Modern cloud-based Point of Sale platform for retail stores, restaurants, pharmacies, and growing businesses.',
    year: new Date().getFullYear(),
    socials: {
      facebook: '#',
      instagram: '#',
      linkedin: '#',
      github: '#'
    }
  }
};
