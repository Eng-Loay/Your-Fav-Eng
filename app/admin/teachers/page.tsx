"use client"

import { GraduationCap } from "lucide-react"
import RoleUsersManager from "@/components/admin/users/role-users-manager"

export default function AdminTeachersPage() {
  return (
    <RoleUsersManager
      role="teacher"
      icon={GraduationCap}
      titleAr="المعلمون"
      titleEn="Teachers"
      descAr="إدارة حسابات المعلمين"
      descEn="Manage teacher accounts"
    />
  )
}
