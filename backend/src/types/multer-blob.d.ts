export {};

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        blobUrl?: string;
        blobPathname?: string;
      }
    }
  }
}
