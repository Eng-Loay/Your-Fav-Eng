import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { DEFAULT_MEMBERSHIP_TEMPLATE } from "@/lib/membership-pdf-shared"

export type FileMembershipTemplate = {
  id: string
  name: string
  nameAr?: string
  imageUrl?: string | null
  overlayFields?: string | null
  isDefault?: boolean
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "membership-template.json")

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

export function readMembershipTemplateFile(): FileMembershipTemplate {
  try {
    if (!existsSync(DATA_FILE)) return defaultTemplate()
    const raw = readFileSync(DATA_FILE, "utf8")
    const parsed = JSON.parse(raw) as Partial<FileMembershipTemplate>
    const base = defaultTemplate()
    return {
      ...base,
      ...parsed,
      id: parsed.id || base.id,
      name: parsed.name || base.name,
      overlayFields: parsed.overlayFields ?? base.overlayFields,
    }
  } catch {
    return defaultTemplate()
  }
}

export function writeMembershipTemplateFile(
  patch: Partial<FileMembershipTemplate>
): FileMembershipTemplate {
  const current = readMembershipTemplateFile()
  const next: FileMembershipTemplate = {
    ...current,
    ...patch,
    id: patch.id || current.id || "mtpl-dev",
    name: patch.name || current.name,
    overlayFields: patch.overlayFields ?? current.overlayFields,
    isDefault: patch.isDefault ?? current.isDefault ?? true,
  }

  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), "utf8")
  return next
}
