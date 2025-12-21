// Color name to hex code mapping (fallback if not in DB)
const colorNameToHex: Record<string, string> = {
  // Vietnamese colors
  'Đen': '#000000',
  'Trắng': '#FFFFFF',
  'Đỏ': '#EF4444',
  'Xanh': '#3B82F6',
  'Xanh lá': '#10B981',
  'Xanh dương': '#3B82F6',
  'Xanh navy': '#1e3a8a',
  'Vàng': '#F59E0B',
  'Tím': '#8B5CF6',
  'Hồng': '#EC4899',
  'Xám': '#6B7280',
  'Nâu': '#92400E',
  'Cam': '#F97316',
  'Be': '#FEF3C7',
  'Kem': '#FFFBEB',
  'Hồng phớt': 'rgb(250, 218, 221)', 
  
  // English colors
  'Black': '#000000',
  'White': '#FFFFFF',
  'Red': '#EF4444',
  'Blue': '#3B82F6',
  'Green': '#10B981',
  'Yellow': '#F59E0B',
  'Purple': '#8B5CF6',
  'Pink': '#EC4899',
  'Gray': '#6B7280',
  'Grey': '#6B7280',
  'Brown': '#92400E',
  'Orange': '#F97316',
  'Navy': '#1e3a8a',
  'Beige': '#FEF3C7',
  'Cream': '#FFFBEB',
  'Pink blush': 'rgb(250, 218, 221)',
};

/**
 * Normalize Vietnamese text by removing diacritics
 */
function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Get hex code for a color name
 * @param colorName - Color name (e.g., "Đen", "Black", "Den")
 * @param colorHex - Hex code from database (if available, but ignore if it's the fallback gray)
 * @returns Hex code string
 */
export function getColorHex(colorName: string, colorHex?: string): string {
  // If database has hex code and it's not the fallback gray, use it
  if (colorHex && colorHex !== '#CCCCCC' && colorHex !== 'rgb(204, 204, 204)') {
    return colorHex;
  }
  
  if (!colorName) {
    return '#CCCCCC';
  }
  
  const trimmedName = colorName.trim();
  
  // Try exact match first
  if (colorNameToHex[trimmedName]) {
    return colorNameToHex[trimmedName];
  }
  
  // Try case-insensitive match
  const lowerName = trimmedName.toLowerCase();
  for (const [key, value] of Object.entries(colorNameToHex)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Try match without Vietnamese diacritics (e.g., "Den" -> "Đen")
  const normalizedName = removeVietnameseDiacritics(trimmedName).toLowerCase();
  for (const [key, value] of Object.entries(colorNameToHex)) {
    const normalizedKey = removeVietnameseDiacritics(key).toLowerCase();
    if (normalizedName === normalizedKey) {
      return value;
    }
  }
  
  // Default fallback
  return '#CCCCCC';
}

/**
 * Get color name variations for matching
 */
export function normalizeColorName(colorName: string): string {
  return colorName.trim().toLowerCase();
}

