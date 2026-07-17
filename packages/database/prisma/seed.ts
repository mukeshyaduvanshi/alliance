import { PermissionAction, PrismaClient } from "@prisma/client";

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
  console.log("Seed completed ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
