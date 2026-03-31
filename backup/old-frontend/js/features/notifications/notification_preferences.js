/**
 * NotificationPreferences - Manages notification preferences for users and pets
 * 
 * This class provides a clean interface for managing notification settings,
 * quiet hours, and notification types per user/pet combination.
 */
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export class NotificationPreferences {
  /**
   * Create a new NotificationPreferences instance
   * @param {Object} db - Firestore database instance
   * @param {string} userId - User ID
   * @param {string} petId - Pet UUID
   */
  constructor(db, userId, petId) {
    this.db = db;
    this.userId = userId;
    this.petId = petId;
    this.docId = `${userId}_${petId}`;
  }

  /**
   * Get notification preferences for this user/pet
   * @returns {Promise<Object>} Notification preferences
   */
  async getPreferences() {
    try {
      const docRef = doc(this.db, "notification_preferences", this.docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Return default preferences
        return {
          userId: this.userId,
          petId: this.petId,
          preferences: {
            checkins: true,
            daily: false,
            weekly: false,
            emergency: true
          },
          quietHours: {
            start: "22:00",
            end: "08:00",
            timezone: "Europe/Copenhagen"
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - New preferences to set
   * @returns {Promise<void>}
   */
  async updatePreferences(preferences) {
    try {
      const currentPrefs = await this.getPreferences();
      const updatedPrefs = {
        ...currentPrefs,
        ...preferences,
        updatedAt: new Date()
      };

      await setDoc(doc(this.db, "notification_preferences", this.docId), updatedPrefs);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update specific preference type
   * @param {string} type - Preference type (checkins, daily, weekly, emergency)
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<void>}
   */
  async updatePreferenceType(type, enabled) {
    try {
      const prefs = await this.getPreferences();
      prefs.preferences[type] = enabled;
      prefs.updatedAt = new Date();

      await setDoc(doc(this.db, "notification_preferences", this.docId), prefs);
    } catch (error) {
      console.error('Error updating preference type:', error);
      throw error;
    }
  }

  /**
   * Update quiet hours
   * @param {string} start - Start time (HH:MM format)
   * @param {string} end - End time (HH:MM format)
   * @param {string} timezone - Timezone (e.g., "Europe/Copenhagen")
   * @returns {Promise<void>}
   */
  async updateQuietHours(start, end, timezone = "Europe/Copenhagen") {
    try {
      const prefs = await this.getPreferences();
      prefs.quietHours = {
        start,
        end,
        timezone
      };
      prefs.updatedAt = new Date();

      await setDoc(doc(this.db, "notification_preferences", this.docId), prefs);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      throw error;
    }
  }

  /**
   * Check if current time is within quiet hours
   * @returns {Promise<boolean>} True if currently in quiet hours
   */
  async isQuietHours() {
    try {
      const prefs = await this.getPreferences();
      const { start, end, timezone } = prefs.quietHours;
      
      const now = new Date();
      const userTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
      const currentTime = userTime.getHours() * 60 + userTime.getMinutes();
      
      const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
      const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
      
      if (startMinutes > endMinutes) {
        // Quiet hours span midnight
        return currentTime >= startMinutes || currentTime <= endMinutes;
      } else {
        return currentTime >= startMinutes && currentTime <= endMinutes;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false; // Default to not quiet hours on error
    }
  }

  /**
   * Check if a specific notification type is enabled
   * @param {string} type - Notification type to check
   * @returns {Promise<boolean>} True if enabled
   */
  async isEnabled(type) {
    try {
      const prefs = await this.getPreferences();
      return prefs.preferences[type] === true;
    } catch (error) {
      console.error('Error checking notification type:', error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Get all enabled notification types
   * @returns {Promise<Array>} Array of enabled notification types
   */
  async getEnabledTypes() {
    try {
      const prefs = await this.getPreferences();
      return Object.keys(prefs.preferences).filter(type => prefs.preferences[type]);
    } catch (error) {
      console.error('Error getting enabled types:', error);
      return [];
    }
  }

  /**
   * Reset preferences to defaults
   * @returns {Promise<void>}
   */
  async resetToDefaults() {
    try {
      const defaultPrefs = {
        userId: this.userId,
        petId: this.petId,
        preferences: {
          checkins: true,
          daily: false,
          weekly: false,
          emergency: true
        },
        quietHours: {
          start: "22:00",
          end: "08:00",
          timezone: "Europe/Copenhagen"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(this.db, "notification_preferences", this.docId), defaultPrefs);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }

  /**
   * Delete preferences document
   * @returns {Promise<void>}
   */
  async delete() {
    try {
      await deleteDoc(doc(this.db, "notification_preferences", this.docId));
    } catch (error) {
      console.error('Error deleting preferences:', error);
      throw error;
    }
  }
} 