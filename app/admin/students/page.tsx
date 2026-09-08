"use client"

import { School } from "lucide-react"
import RoleUsersManager from "@/components/admin/users/role-users-manager"

export default function AdminStudentsPage() {
  return (
    <RoleUsersManager
      role="student"
      icon={School}
      titleAr="الطلاب"
      titleEn="Students"
      descAr="إدارة حسابات الطلاب"
      descEn="Manage student accounts"
    />
  )
}
