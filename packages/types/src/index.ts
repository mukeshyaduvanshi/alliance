export * from "./enums";
export * from "./api/common";
export * from "./api/auth";
export * from "./api/user";
export * from "./api/role";
export * from "./api/workflow";
export * from "./api/order";
export * from "./api/brand";
export * from "./api/vendor";
export * from "./api/audit";
export * from "./api/notification";
export * from "./api/monitoring";
export * from "./api/system";

export type PortalType = "admin" | "manager" | "brand" | "vendor" | "developer";

export type PortalUser =
  | { type: "internal"; userId: string }
  | { type: "brand"; brandId: string }
  | { type: "vendor"; vendorId: string };
