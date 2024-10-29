export interface Pos {
  top: number;
  left: number;
}

export interface Margins {
  right: number;
  bottom: number;
  top: number;
  left: number;
}

export function doOverlap(margin1: Margins, margin2: Margins) {
  if (margin1.right <= margin2.left || margin2.right <= margin1.left) {
    return false;
  }

  // Check if one rectangle is above the other
  if (margin1.bottom <= margin2.top || margin2.bottom <= margin1.top) {
    return false;
  }

  return true;
}
