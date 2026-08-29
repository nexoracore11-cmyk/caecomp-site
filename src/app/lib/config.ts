export const config = {
  endpoint: process.env.APPWRITE_ENDPOINT ?? "http://appwrite/v1",
  publicEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? process.env.APPWRITE_ENDPOINT ?? "",
  projectId: process.env.APPWRITE_PROJECT_ID ?? "caecomp",
  databaseId: process.env.APPWRITE_DATABASE_ID ?? "caecompdb",
  bucketId: process.env.APPWRITE_STORAGE_BUCKET_ID ?? "caecomp-media",
};
export const hasAppwrite = Boolean(process.env.APPWRITE_API_KEY && process.env.APPWRITE_PROJECT_ID);
