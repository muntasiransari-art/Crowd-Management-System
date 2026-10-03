// Export all models from a single entry point
export { default as User } from "./user.model";
export type { IUser, UserRole, RoleData } from "./user.model";

export { default as Venue } from "./venue.model";
export type { IVenue, IZone, IGate } from "./venue.model";

export { default as Slot } from "./slot.model";
export type { ISlot, SlotStatus } from "./slot.model";

export { default as Booking } from "./booking.model";
export type { IBooking, BookingStatus } from "./booking.model";

export { default as PriorityRequest } from "./priority-request.model";
export type {
  IPriorityRequest,
  PriorityType,
  PriorityStatus,
} from "./priority-request.model";

export { default as SOS } from "./sos.model";
export type { ISOS, SOSType, SOSPriority, SOSStatus } from "./sos.model";

export { default as Notification } from "./notification.model";
export type { INotification, NotificationType } from "./notification.model";
