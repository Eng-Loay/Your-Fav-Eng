import { DEFAULT_MEMBERSHIP_TEMPLATE } from "@/lib/membership-pdf-shared"

export type FileMembershipTemplate = {
  id: string
  name: string
  nameAr?: string
  imageUrl?: string | null
  overlayFields?: string | null
  isDefault?: boolean
}

function defaultTemplate(): FileMembershipTemplate {
  return {
    id: "mtpl-dev",
    name: "IAGRCP Membership Certificate",
    nameAr: "شهادة عضوية IAGRCP",
    imageUrl: DEFAULT_MEMBERSHIP_TEMPLATE.imageUrl,
    overlayFields: DEFAULT_MEMBERSHIP_TEMPLATE.overlayFields,
    isDefault: true,
  }
}

/** Read-only defaults. Persistence lives in Prisma MembershipTemplate via the Express API. */
export function readMembershipTemplateFile(): FileMembershipTemplate {
  return defaultTemplate()
}

export function writeMembershipTemplateFile(
  patch: Partial<FileMembershipTemplate>
): FileMembershipTemplate {
  return {
    ...defaultTemplate(),
    ...patch,
    id: patch.id || "mtpl-dev",
    name: patch.name || defaultTemplate().name,
    isDefault: patch.isDefault ?? true,
  }
}
