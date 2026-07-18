import { PermissionAction, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Step A: Create a default Tenant (ColorJet itself)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "colorjet" },
    update: {},
    create: {
      name: "ColorJet",
      slug: "colorjet",
      subdomain: "colorjet",
    },
  });

  // Step B: Create default system roles
  const roleName = [
    "Super Admin",
    "Business Head",
    "Operation Head",
    "Operation Manager",
    "KAM",
  ];

  for (const name of roleName) {
    await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: {
        tenantId: tenant.id,
        name,
        isSystemRole: true,
      },
    });
  }
  // Step C: Create base permissions (module-wise, expand lated per modules)
  const modules = ["tenant", "user", "role", "permission"];
  const actions = Object.values(PermissionAction);

  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: {
          module,
          action,
          label: `${action} ${module}`,
        },
      });
    }
  }

  const superAdminRole = await prisma.role.findFirst({
    where: { name: "Super Admin" },
  });

  // Pehla Super Admin USER create karo
  const passwordHash = await bcrypt.hash("Admin@123", 10); // temporary password

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "admin@colorjet.com" },
    },
    update: { passwordHash }, // ← ab update bhi hoga
    create: {
      tenantId: tenant.id,
      roleId: superAdminRole.id,
      fullName: "Super Admin",
      email: "admin@colorjet.com",
      passwordHash,
      isSuperAdmin: true,
    },
  });

  console.log(
    "Seed completed ✅ — Super Admin: admin@colorjet.com / Admin@123",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
