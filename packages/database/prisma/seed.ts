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
    "Admin",
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
  const modules = [
    "tenant",
    "user",
    "role",
    "permission",
    "workflow",
    "brand",
    "product",
    "order",
    "purchase_order",
    "creative_artwork",
    "vendor_assignment",
    "vendor",
    "sla_rule",
    "dashboard",
    "alert",
    "system_admin",
    "audit_log",
    "notification",
    "business_model",
  ];

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

  // Step C2: Create default workflow modules (admin-managed, expandable later)
  const workflowModules = [
    {
      name: "brand_onboarding",
      description: "Brand registration & approval flow",
    },
    {
      name: "brand_order",
      description: "Brand order approval flow",
    },
    {
      name: "vendor_onboarding",
      description: "Vendor registration & approval flow",
    },
    {
      name: "purchase_order",
      description: "Purchase order approval flow",
    },
    {
      name: "creative_artwork",
      description: "Artwork design & approval flow",
    },
  ];

  for (const wm of workflowModules) {
    await prisma.workflowModule.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: wm.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...wm,
      },
    });
  }

  const adminRole = await prisma.role.findFirst({
    where: { name: "Admin" },
  });

  // Pehla Admin USER create karo
  const passwordHash = await bcrypt.hash("Admin@123", 10); // temporary password

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "admin@colorjet.com" },
    },
    update: { passwordHash }, // ← ab update bhi hoga
    create: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      fullName: "Admin",
      email: "admin@colorjet.com",
      passwordHash,
      isAdmin: true,
    },
  });

  // Brand account for brand portal testing
  const brandPasswordHash = await bcrypt.hash("Brand@123", 10);
  const existingProfile = await prisma.businessProfile.findUnique({
    where: { panNumber: "ABCDE1234F" },
  });
  const brandProfile =
    existingProfile ??
    (await prisma.businessProfile.create({
      data: {
        legalName: "Sharma Prints Pvt Ltd",
        businessType: "PRIVATE_LIMITED",
        panNumber: "ABCDE1234F",
        gstNumber: "GSTIN123456789",
        addressLine1: "123 Industrial Area",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isVerified: true,
      },
    }));

  const existingBrand = await prisma.brand.findFirst({
    where: { email: "rahul@sharmaprints.com" },
  });
  const brand =
    existingBrand ??
    (await prisma.brand.create({
      data: {
        id: "brand-seed-1",
        tenantId: tenant.id,
        businessProfileId: brandProfile.id,
        brandName: "Sharma Prints",
        contactPersonName: "Rahul Sharma",
        email: "brand@sharmaprints.com",
        phone: "9876543210",
        passwordHash: brandPasswordHash,
        approvalStatus: "APPROVED",
        isActive: true,
      },
    }));

  // Product category + sample products with region rates
  const category = await prisma.productCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Banners" } },
    update: {},
    create: { tenantId: tenant.id, name: "Banners" },
  });

  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@colorjet.com" },
  });

  const products = [
    { name: "Vinyl Banner", sku: "VB-001", unit: "sq.ft", rate: 45 },
    { name: "Flex Banner", sku: "FB-001", unit: "sq.ft", rate: 30 },
    { name: "Standee", sku: "ST-001", unit: "piece", rate: 250 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
      update: {},
      create: {
        tenantId: tenant.id,
        categoryId: category.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
      },
    });
    await prisma.productRegionRate.upsert({
      where: {
        productId_region: { productId: product.id, region: "PAN_INDIA" },
      },
      update: { rate: p.rate },
      create: { productId: product.id, region: "PAN_INDIA", rate: p.rate },
    });
    await prisma.brandProductRate.upsert({
      where: { brandId_productId: { brandId: brand.id, productId: product.id } },
      update: {},
      create: {
        tenantId: tenant.id,
        brandId: brand.id,
        productId: product.id,
        region: "PAN_INDIA",
        assignedById: adminUser!.id,
      },
    });
    await prisma.vendorRegionRate.upsert({
      where: {
        productId_region: { productId: product.id, region: "PAN_INDIA" },
      },
      update: { rate: p.rate * 0.7 },
      create: {
        productId: product.id,
        region: "PAN_INDIA",
        rate: p.rate * 0.7,
      },
    });
  }

  // Sample Purchase Order for the brand
  await prisma.purchaseOrder.upsert({
    where: {
      tenantId_poNumber: { tenantId: tenant.id, poNumber: "PO-COLORJET-2026-001" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      brandId: brand.id,
      poNumber: "PO-COLORJET-2026-001",
      totalBudget: 500000,
      createdById: adminUser!.id,
    },
  });

  // Vendor onboarding workflow rule (0 steps → manual approval flow, F-4 fix)
  await prisma.workflowRule.upsert({
    where: {
      tenantId_module: { tenantId: tenant.id, module: "vendor_onboarding" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Vendor Onboarding Approval",
      module: "vendor_onboarding",
      description: "Vendor registration approval",
      isActive: true,
    },
  });

  // Vendor account for vendor portal testing
  const vendorPasswordHash = await bcrypt.hash("Vendor@123", 10);
  const existingVendorProfile = await prisma.businessProfile.findUnique({
    where: { panNumber: "VPROPAN0001" },
  });
  const vendorProfile =
    existingVendorProfile ??
    (await prisma.businessProfile.create({
      data: {
        legalName: "PrintPro Solutions Pvt Ltd",
        businessType: "PRIVATE_LIMITED",
        panNumber: "VPROPAN0001",
        addressLine1: "456 Industrial Estate",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    }));
  await prisma.vendor.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "vendor@printpro.com" },
    },
    update: { passwordHash: vendorPasswordHash },
    create: {
      tenantId: tenant.id,
      businessProfileId: vendorProfile.id,
      vendorName: "PrintPro Solutions",
      contactPersonName: "Vikram Patel",
      email: "vendor@printpro.com",
      phone: "9812345670",
      passwordHash: vendorPasswordHash,
      approvalStatus: "APPROVED",
      isActive: true,
    },
  });

  console.log(
    "Seed completed ✅ — Admin: admin@colorjet.com / Admin@123, Brand: rahul@sharmaprints.com / Brand@123, Vendor: vendor@printpro.com / Vendor@123",
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
