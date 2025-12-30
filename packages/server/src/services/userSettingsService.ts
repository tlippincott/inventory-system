import { userSettingsModel } from '../models/userSettings.js';
import { updateUserSettingsSchema } from '@invoice-system/shared';
import type {
  UserSettings,
  UpdateUserSettingsDTO,
} from '@invoice-system/shared';

class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const userSettingsService = {
  /**
   * Get user settings (ensures record exists via findOrCreate)
   */
  async getUserSettings(): Promise<UserSettings> {
    return await userSettingsModel.findOrCreate();
  },

  /**
   * Update user settings with validation
   * Prevents nextInvoiceNumber updates
   */
  async updateUserSettings(data: unknown): Promise<UserSettings> {
    // CRITICAL: Prevent nextInvoiceNumber manipulation
    // This field is managed automatically by invoice generation
    if (data && typeof data === 'object' && 'nextInvoiceNumber' in data) {
      throw new BadRequestError(
        'nextInvoiceNumber cannot be updated directly. It is managed automatically by invoice generation.'
      );
    }

    // Validate input data
    const validatedData = updateUserSettingsSchema.parse(data) as UpdateUserSettingsDTO;

    // Validate business name is not empty if provided
    if (validatedData.businessName !== undefined && validatedData.businessName.trim() === '') {
      throw new BadRequestError('businessName cannot be empty');
    }

    // Update settings
    return await userSettingsModel.update(validatedData);
  },
};
