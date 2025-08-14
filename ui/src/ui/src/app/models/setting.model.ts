/**
 * Defines the data structure for an application setting.
 * This interface is used as a contract throughout the application.
 */
export interface Setting {
  id: string;
  name: string;
  logo: string;
  color: string;
  isApplied: boolean;
  isDeleted: boolean;
}
