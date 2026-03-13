/**
 * Lightweight item shape used by all master-data pickers.
 * Every picker (dispatcher, driver, unit, brokerage) returns this shape.
 */
export interface PickerItem {
  id: string;
  label: string;
}

/** Driver reference — lightweight for picker use. */
export interface DriverDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
}

/** Unit (truck) reference — lightweight for picker use. */
export interface UnitDto {
  id: string;
  unitNumber: string;
  vin: string | null;
  make: string | null;
  year: number | null;
  createdAt: string;
}

/** Brokerage reference — lightweight for picker use. */
export interface BrokerageDto {
  id: string;
  name: string;
  mcNumber: string | null;
  createdAt: string;
}
