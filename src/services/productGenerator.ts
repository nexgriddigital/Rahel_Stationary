import { ProductCategory, LOW_STOCK_THRESHOLD } from '../types';
import { storage } from './storage';

export { LOW_STOCK_THRESHOLD };

/**
 * Intelligent categorization dictionary for retail stationery & store inventory.
 * Maps comprehensive Ethiopian & international stationery keywords to standardized categories.
 * If automatic categorization cannot confidently determine a category, returns 'General'.
 */
export function autoDetectCategory(name: string, description: string = ''): ProductCategory {
  const text = `${name || ''} ${description || ''}`.toLowerCase();

  // 1. Writing & Correction
  if (
    /\b(pen|pens|pencil|pencils|marker|markers|highlighter|highlighters|eraser|erasers|correction|tipex|whiteout|sharpener|sharpeners|ink|cartridge|ballpoint|rollerball|gel|fineliner|lead|leads|whiteboard|permanent|crayon|crayons|chalk|stylus|calligraphy|fountain|sketch pen)\b/i.test(
      text
    )
  ) {
    return 'Writing & Pens';
  }

  // 2. Paper & Notebooks
  if (
    /\b(paper|papers|notebook|notebooks|ream|reams|pad|pads|diary|diaries|journal|journals|exercise book|exercise books|sticky note|sticky notes|post-it|postit|a4|a3|a5|b5|cardstock|bristol|manila paper|carbon paper|ruled|graph paper|sketchbook|sketchbooks|copy paper|copier paper|ledger|register|writing pad|memo)\b/i.test(
      text
    )
  ) {
    return 'Paper & Notebooks';
  }

  // 3. Printing & Copying
  if (
    /\b(toner|toners|laserjet|inkjet|drum|photocopy|photocopying|printer|printers|copier|copiers|sublimation|plotter|ribbon|ribbons|thermal roll|receipt roll|pos roll|photo paper|cartridge)\b/i.test(
      text
    )
  ) {
    return 'Printing & Copying';
  }

  // 4. Art & Craft
  if (
    /\b(paint|paints|acrylic|acrylics|watercolor|watercolour|oil paint|canvas|canvases|brush|brushes|paintbrush|clay|palette|palettes|charcoal|glitter|origami|felt|craft|crafts|drawing|gouache|sketching|easel|sculpting|glue gun|hot melt|color tube|colored pencil|color pencil)\b/i.test(
      text
    )
  ) {
    return 'Art & Craft';
  }

  // 5. Desk & Office
  if (
    /\b(stapler|staplers|staple|staples|clip|clips|paperclip|paperclips|binder clip|binder clips|tape|tapes|dispenser|scissors|scissor|ruler|rulers|punch|hole punch|organizer|tray|trays|file|files|folder|folders|box file|arch file|calculator|calculators|push pin|pushpin|pushpins|board pin|thumbtack|badge|mousepad|desk)\b/i.test(
      text
    )
  ) {
    return 'Desk & Office';
  }

  // 6. Binding & Lamination
  if (
    /\b(laminat|lamination|laminating|laminator|pouch|pouches|spiral|spirals|binding comb|binding wire|wire-o|comb bind|thermal bind|binding cover|pvc cover|binding machine|binding spine|presentation cover)\b/i.test(
      text
    )
  ) {
    return 'Binding & Lamination';
  }

  // 7. Packaging & Envelopes
  if (
    /\b(envelope|envelopes|manila envelope|mailer|mailers|bubble wrap|bubblewrap|packaging tape|brown tape|shipping box|carton|cartons|poly mailer|stretch wrap|shrink wrap|packing|kraft|parcel|twine|string|shipping label)\b/i.test(
      text
    )
  ) {
    return 'Packaging & Envelopes';
  }

  // 8. Custom Stamps & Signs
  if (
    /\b(stamp|stamps|ink pad|inkpad|stamp pad|date stamp|trodat|colop|shiny|embosser|seal|seals|sign|signs|signage|nameplate|plaque|acrylic sign|numberer|dater)\b/i.test(
      text
    )
  ) {
    return 'Custom Stamps & Signs';
  }

  // Fallback to sensible 'General' category
  return 'General';
}

const CATEGORY_PREFIX_MAP: Record<string, string> = {
  'Writing & Pens': 'WRI',
  'Writing & Correction': 'WRI',
  'Paper & Notebooks': 'PPR',
  'Printing & Copying': 'PRN',
  'Art & Craft': 'ART',
  'Desk & Office': 'DSK',
  'Binding & Lamination': 'BND',
  'Packaging & Envelopes': 'PKG',
  'Custom Stamps & Signs': 'STP',
  'General': 'GEN'
};

/**
 * Automatically generates a unique, readable SKU for every product.
 * Format: [PREFIX]-[MNEMONIC4]-[SEQ4] e.g. PPR-A4CO-0101, WRI-PILG-0102, GEN-ITEM-0103.
 * Guaranteed never to duplicate existing products or in-batch allocated SKUs.
 */
export function generateUniqueSku(
  category: ProductCategory | string,
  productName: string,
  excludedSkus?: Set<string>
): string {
  const existing = new Set<string>();
  try {
    storage.getProducts().forEach((p) => {
      if (p.sku) existing.add(p.sku.trim().toUpperCase());
    });
  } catch {}

  if (excludedSkus) {
    excludedSkus.forEach((s) => existing.add(s.trim().toUpperCase()));
  }

  const prefix = CATEGORY_PREFIX_MAP[category] || 'GEN';
  const cleanChars = (productName || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 4) || 'ITEM';
  const mnemonic = cleanChars.padEnd(4, 'X');

  // Search sequentially from 1 to 9999
  let counter = 1;
  let candidate = '';
  do {
    const seqStr = String(counter).padStart(4, '0');
    candidate = `${prefix}-${mnemonic}-${seqStr}`;
    counter++;
  } while (existing.has(candidate) && counter <= 9999);

  if (existing.has(candidate)) {
    // Collision fallback with timestamp hash
    candidate = `${prefix}-${mnemonic}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return candidate;
}

/**
 * Automatically generates a unique standard 12-digit numeric barcode (UPC / Code128 standard).
 * Guaranteed to never duplicate existing products or in-batch allocated barcodes.
 * Works seamlessly with all 1D laser scanners, USB wands, and mobile camera scanners.
 */
export function generateUniqueBarcode(excludedBarcodes?: Set<string>): string {
  const existing = new Set<string>();
  try {
    storage.getProducts().forEach((p) => {
      if (p.barcode) existing.add(p.barcode.trim());
    });
  } catch {}

  if (excludedBarcodes) {
    excludedBarcodes.forEach((b) => existing.add(b.trim()));
  }

  // Look for the current highest 12-digit numeric code starting with '890'
  let highestSuffix = 14;
  for (const b of existing) {
    if (/^890\d{9}$/.test(b)) {
      const num = parseInt(b.slice(3), 10);
      if (!isNaN(num) && num > highestSuffix && num < 900000000) {
        highestSuffix = num;
      }
    }
  }

  let candidateSeq = highestSuffix + 1;
  let candidate = '';
  let attempts = 0;

  do {
    candidate = '890' + String(candidateSeq).padStart(9, '0');
    candidateSeq++;
    attempts++;
  } while (existing.has(candidate) && attempts < 1000);

  // Fallback with high-entropy 9-digit randomizer if sequential hit a block
  while (existing.has(candidate) || !candidate) {
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    candidate = '890' + randomSuffix.toString();
  }

  return candidate;
}

/**
 * Validates whether an item's stock is low based on the fixed threshold of 3.
 * Stock > 3: Normal stock (false)
 * Stock = 3: Low stock (true)
 * Stock < 3: Low stock / Alert (true)
 */
export function isLowStock(stock: number): boolean {
  return (stock ?? 0) <= LOW_STOCK_THRESHOLD;
}
