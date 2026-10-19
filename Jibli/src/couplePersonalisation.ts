export type CouplePhotoField = "partnerPhoto1" | "partnerPhoto2" | "couplePhoto";
export const coupleDesignKey = (image: string) => image.startsWith("/invitations/") ? image.split("/").pop()?.replace(/\.[^.]+$/, "") || "" : "";
export const couplePhotoDesigns = new Set(["illustrated-photo", "childhood-love", "photo-frame", "garden-couple", "intimate-vows"]);
export const hasCouplePhotos = (image: string) => couplePhotoDesigns.has(coupleDesignKey(image));
export const couplePhotoFields = (image: string): CouplePhotoField[] => coupleDesignKey(image)==="intimate-vows" ? ["couplePhoto"] : ["partnerPhoto1", "partnerPhoto2"];

export const couplePhotoDetails = (details: Record<string,string>, field: CouplePhotoField, topAligned=false) => ({
  birthdayPhoto: details[field] || "",
  birthdayPhotoX: details[`${field}X`] ?? "50",
  birthdayPhotoY: details[`${field}Y`] ?? (topAligned?"0":"50"),
  birthdayPhotoZoom: details[`${field}Zoom`] ?? "1",
});
