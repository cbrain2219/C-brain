import {
  COMPLAINT_ATTACHMENT_MIME_TYPES,
  MAX_COMPLAINT_ATTACHMENT_COUNT,
  MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES,
} from "../../../constants/complaint";

export {
  COMPLAINT_ATTACHMENT_ACCEPT,
  MAX_COMPLAINT_ATTACHMENT_COUNT,
  MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES,
} from "../../../constants/complaint";

const BYTES_IN_KILOBYTE = 1024;
const BYTES_IN_MEGABYTE = BYTES_IN_KILOBYTE * 1024;

export type ComplaintAttachmentFile = Pick<
  File,
  "lastModified" | "name" | "size" | "type"
>;

export type ComplaintAttachmentDisplayFile = {
  id: string;
  name: string;
  sizeLabel: string;
};

export function formatAttachmentFileSize(size: number) {
  if (size >= BYTES_IN_MEGABYTE) {
    return `${Math.max(1, Math.round(size / BYTES_IN_MEGABYTE))}MB`;
  }

  if (size >= BYTES_IN_KILOBYTE) {
    return `${Math.max(1, Math.round(size / BYTES_IN_KILOBYTE))}KB`;
  }

  return `${Math.max(0, size)}B`;
}

export function getDisplayAttachmentFiles(
  files: ComplaintAttachmentFile[],
): ComplaintAttachmentDisplayFile[] {
  return getAcceptedAttachmentFiles(files).map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    name: file.name,
    sizeLabel: formatAttachmentFileSize(file.size),
  }));
}

export function getAcceptedAttachmentFiles<T extends ComplaintAttachmentFile>(
  files: T[],
) {
  return files
    .filter(
      (file) =>
        file.size <= MAX_COMPLAINT_ATTACHMENT_SIZE_BYTES &&
        COMPLAINT_ATTACHMENT_MIME_TYPES.includes(
          file.type as (typeof COMPLAINT_ATTACHMENT_MIME_TYPES)[number],
        ),
    )
    .slice(0, MAX_COMPLAINT_ATTACHMENT_COUNT);
}
