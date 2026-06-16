import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { StaffManagementClient } from "@/components/ppc/staff-management-client";
import {
  listStaffInvites,
  listStaffUsers,
} from "@/lib/db/queries/staff-invites";

export default async function AdminStaffPage() {
  const [staffUsers, invites] = await Promise.all([
    listStaffUsers(),
    listStaffInvites(),
  ]);

  return (
    <div className="grid gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Staff" }]} />
      <PageHeader
        title="Staff access"
        description="Invite admins and instructors into PPC"
      />
      <StaffManagementClient
        staffUsers={staffUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        }))}
        invites={invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          invitedByName: invite.invitedByName,
          status: invite.status,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

