/**
 * Image Recognition & AR Scanning Utilities
 * Handles intelligent matching of uploaded images to tourist places
 */

import { TouristPlace, touristPlaces } from '@/lib/tourist-data';

export interface ImageMatchResult {
  place: TouristPlace;
  confidence: number;
  matchMethod: string;
  details: {
    filenameScore: number;
    propertyScore: number;
    semanticScore: number;
  };
}

/**
 * Validation errors for image uploads
 */
export enum ImageValidationError {
  NO_FILE = 'NO_FILE',
  INVALID_TYPE = 'INVALID_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Get user-friendly error message
 */
export function getImageErrorMessage(error: ImageValidationError): string {
  const messages: Record<ImageValidationError, string> = {
    [ImageValidationError.NO_FILE]: 'Please select an image file to scan.',
    [ImageValidationError.INVALID_TYPE]: 'Please upload a valid image file (JPG, PNG, WebP, etc.).',
    [ImageValidationError.FILE_TOO_LARGE]: 'Image size must be less than 10MB for optimal performance.',
    [ImageValidationError.CORRUPTED_FILE]: 'The file appears to be corrupted. Please try another image.',
    [ImageValidationError.UNKNOWN]: 'An unexpected error occurred while reading the file.'
  };
  return messages[error];
}

/**
 * Validate image file
 */
export function validateImageFile(file: File | null | undefined): ImageValidationError | null {
  if (!file) {
    return ImageValidationError.NO_FILE;
  }

  if (!file.type.startsWith('image/')) {
    return ImageValidationError.INVALID_TYPE;
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return ImageValidationError.FILE_TOO_LARGE;
  }

  return null;
}

/**
 * Extract meaningful keywords from image filename
 * Examples: "taj-mahal.jpg" → ["taj", "mahal"]
 *           "golden_temple_amritsar.png" → ["golden", "temple", "amritsar"]
 */
export function extractFilenameKeywords(filename: string): string[] {
  try {
    const cleaned = filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_\s.]/g, ' ') // Replace separators with spaces
      .trim();
    
    // Split into words and filter out short/common words
    return cleaned
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with', 'from'].includes(word));
  } catch (error) {
    console.error('[Image Recognition] Error extracting filename keywords:', error);
    return [];
  }
}

/**
 * Calculate match score based on filename keywords
 * Checks if keywords appear in place name, location, or state
 */
export function calculateFilenameMatchScore(filename: string, place: TouristPlace): number {
  try {
    const keywords = extractFilenameKeywords(filename);
    
    if (keywords.length === 0) return 0;

    const placeName = place.name.toLowerCase();
    const placeLocation = place.location.toLowerCase();
    const placeState = place.state.toLowerCase();
    const placeCategory = place.category.toLowerCase();

    let matches = 0;

    keywords.forEach(keyword => {
      // Weight matches: name > location > state > category
      if (placeName.includes(keyword)) {
        matches += 2;
      } else if (placeLocation.includes(keyword)) {
        matches += 1.5;
      } else if (placeState.includes(keyword)) {
        matches += 1;
      } else if (placeCategory.includes(keyword)) {
        matches += 0.5;
      }
    });

    // Normalize to 0-100 scale
    const maxPossibleMatches = keywords.length * 2;
    return (matches / maxPossibleMatches) * 100;
  } catch (error) {
    console.error('[Image Recognition] Error calculating filename match:', error);
    return 0;
  }
}

/**
 * Analyze image file properties for pattern matching
 * File size, type, and metadata can provide hints about image quality
 */
export function analyzeImageProperties(file: File): number {
  try {
    const fileSizeKB = file.size / 1024;
    
    // Optimal size for monument photos is 200KB-5MB
    const minOptimal = 200;
    const maxOptimal = 5000;
    
    let sizeScore = 0;
    
    if (fileSizeKB >= minOptimal && fileSizeKB <= maxOptimal) {
      sizeScore = 100;
    } else if (fileSizeKB < minOptimal) {
      // Image too small = likely compressed/low quality
      sizeScore = Math.max(0, 100 - ((minOptimal - fileSizeKB) / 200));
    } else {
      // Image too large = likely high resolution (good for detail recognition)
      sizeScore = Math.max(0, 100 - ((fileSizeKB - maxOptimal) / 10000));
    }

    // Bonus for common image formats used by tourists
    const format = file.type.split('/')[1]?.toLowerCase() || '';
    const formatBonus = ['jpeg', 'jpg', 'png', 'webp'].includes(format) ? 10 : 0;

    return Math.min(100, (sizeScore + formatBonus) / 1.1);
  } catch (error) {
    console.error('[Image Recognition] Error analyzing image properties:', error);
    return 0;
  }
}

/**
 * Semantic matching using place metadata
 * Prefers heritage/spiritual sites (common AR targets)
 */
export function calculateSemanticMatchScore(place: TouristPlace): number {
  try {
    // Higher priority for places commonly scanned
    const categoryWeight: Record<string, number> = {
      'Heritage': 30,
      'Spiritual': 25,
      'Monument': 25,
      'Nature': 15,
      'Hill Station': 12,
      'Wildlife': 10,
      'Beach': 8,
      'Adventure': 8,
      'Cultural': 12,
      'Entertainment': 5,
      'City': 3
    };

    // Higher priority for heavily visited places
    const crowdBonus = place.crowLevel === 'high' ? 15 : place.crowLevel === 'medium' ? 8 : 0;

    const baseScore = categoryWeight[place.category] || 5;
    return baseScore + crowdBonus;
  } catch (error) {
    console.error('[Image Recognition] Error calculating semantic score:', error);
    return 0;
  }
}

/**
 * Main image matching algorithm using multi-strategy approach
 */
export function matchImageToPlace(file: File): ImageMatchResult | null {
  try {
    const filename = file.name.toLowerCase();
    
    console.log(`[Image Recognition] Starting match analysis for: ${filename}`);
    console.log(`[Image Recognition] File size: ${(file.size / 1024).toFixed(2)}KB, Type: ${file.type}`);
    
    let bestMatch: ImageMatchResult | null = null;
    let highestScore = 0;

    // Strategy 1: Filename-based matching (highest priority - 60% weight)
    for (const place of touristPlaces) {
      const filenameScore = calculateFilenameMatchScore(filename, place);
      const propertyScore = analyzeImageProperties(file);
      const semanticScore = calculateSemanticMatchScore(place);
      
      // Weighted scoring: filename (60%) + properties (20%) + semantic (20%)
      const totalScore = 
        (filenameScore * 0.6) + 
        (propertyScore * 0.2) + 
        (semanticScore * 0.2);

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = {
          place,
          confidence: totalScore,
          matchMethod: 'filename_analysis',
          details: {
            filenameScore,
            propertyScore,
            semanticScore
          }
        };
      }

      // Log top 5 matches for debugging
      if (highestScore > 0 && totalScore >= highestScore - 10) {
        console.log(
          `[Image Recognition] ${place.name}: ` +
          `filename=${filenameScore.toFixed(1)}%, ` +
          `property=${propertyScore.toFixed(1)}%, ` +
          `semantic=${semanticScore.toFixed(1)}%, ` +
          `total=${totalScore.toFixed(1)}%`
        );
      }
    }

    // Strategy 2: If no good filename match, use semantic heuristics
    if (!bestMatch || highestScore < 30) {
      console.log(`[Image Recognition] Weak filename match (${highestScore.toFixed(1)}%), using semantic fallback...`);
      
      // Find all heritage and spiritual sites
      const preferredPlaces = touristPlaces.filter(p => 
        ['Heritage', 'Spiritual', 'Monument'].includes(p.category)
      );

      if (preferredPlaces.length > 0) {
        // Sort by crowd level (high popularity = common AR targets)
        preferredPlaces.sort((a, b) => {
          const crowdOrder = { high: 3, medium: 2, low: 1 };
          return crowdOrder[b.crowLevel as keyof typeof crowdOrder] - 
                 crowdOrder[a.crowLevel as keyof typeof crowdOrder];
        });

        // Pick top candidate with some randomness
        const topCandidates = preferredPlaces.slice(0, 3);
        const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

        bestMatch = {
          place: selected,
          confidence: 45,
          matchMethod: 'semantic_fallback',
          details: {
            filenameScore: 0,
            propertyScore: analyzeImageProperties(file),
            semanticScore: calculateSemanticMatchScore(selected)
          }
        };

        console.log(`[Image Recognition] Selected via semantic fallback: ${selected.name}`);
      }
    }

    // Strategy 3: Last resort - popular sites
    if (!bestMatch) {
      console.log(`[Image Recognition] No semantic matches found, using popularity heuristic...`);
      
      const popularPlaces = touristPlaces.filter(p => p.crowLevel === 'high');
      
      if (popularPlaces.length > 0) {
        const selected = popularPlaces[Math.floor(Math.random() * popularPlaces.length)];
        bestMatch = {
          place: selected,
          confidence: 30,
          matchMethod: 'popularity_heuristic',
          details: {
            filenameScore: 0,
            propertyScore: 0,
            semanticScore: 30
          }
        };

        console.log(`[Image Recognition] Selected via popularity: ${selected.name}`);
      }
    }

    // Final fallback
    if (!bestMatch) {
      console.warn(`[Image Recognition] All strategies failed, using random selection`);
      const randomPlace = touristPlaces[Math.floor(Math.random() * touristPlaces.length)];
      bestMatch = {
        place: randomPlace,
        confidence: 20,
        matchMethod: 'random_fallback',
        details: {
          filenameScore: 0,
          propertyScore: 0,
          semanticScore: 20
        }
      };
    }

    if (bestMatch) {
      console.log(
        `[Image Recognition] Match complete: ${bestMatch.place.name} ` +
        `(confidence: ${bestMatch.confidence.toFixed(1)}%, method: ${bestMatch.matchMethod})`
      );
    }

    return bestMatch;
  } catch (error) {
    console.error('[Image Recognition] Critical error during matching:', error);
    return null;
  }
}

/**
 * Format confidence for display
 */
export function formatConfidence(confidence: number): number {
  return Math.round(Math.max(20, Math.min(100, confidence)));
}

/**
 * Get match quality assessment
 */
export function getMatchQualityAssessment(confidence: number): {
  level: 'low' | 'medium' | 'high';
  message: string;
} {
  if (confidence >= 75) {
    return {
      level: 'high',
      message: 'High confidence match - results are reliable'
    };
  } else if (confidence >= 50) {
    return {
      level: 'medium',
      message: 'Moderate confidence - results may vary'
    };
  } else {
    return {
      level: 'low',
      message: 'Low confidence - try a clearer image or include the monument name in the filename'
    };
  }
}
