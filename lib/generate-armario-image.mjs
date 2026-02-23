/**
 * Generate a single image with all PDF pages stacked vertically.
 * Uses @ikilabs/pdf-to-img to render the PDF and write the combined PNG.
 *
 * Export: generateArmarioImage(inputPdfPath, outputPath, options?)
 * Returns: Promise<string> — resolved with the written output path; throws on error.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { convertPdfFileToSingleImageFile } = require('@ikilabs/pdf-to-img');

/**
 * Generate a single image with all pages of a PDF stacked vertically.
 *
 * @param {string} inputPdfPath - Absolute path to the input PDF.
 * @param {string} outputPath - Absolute path to the output image file (e.g. .png).
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.viewportScale=2] - Scale factor for render quality (higher = larger file, better quality).
 * @param {number} [options.backgroundColor] - Background color in RGBA format (e.g. 0xffffffff for white).
 * @returns {Promise<string>} Resolves with the written output path.
 */
export async function generateArmarioImage(inputPdfPath, outputPath, options = {}) {
  const viewportScale = options.viewportScale ?? 2;
  const opts = { viewportScale };
  if (options.backgroundColor != null) {
    opts.backgroundColor = options.backgroundColor;
  }
  await convertPdfFileToSingleImageFile(inputPdfPath, outputPath, opts);
  return outputPath;
}
