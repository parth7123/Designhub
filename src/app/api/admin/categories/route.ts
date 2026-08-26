import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { listings: true } },
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          include: {
            _count: { select: { listings: true } },
          },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { name, description, icon, parentId, displayOrder } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let parentSlugPrefix = '';
    if (parentId) {
      const parentCat = await db.category.findUnique({ where: { id: parentId } });
      if (parentCat) parentSlugPrefix = `${parentCat.slug}-`;
    }
    let slug = `${parentSlugPrefix}${baseSlug}`;

    const existingSlug = await db.category.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        description,
        icon: icon || 'Folder',
        parentId: parentId || null,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await req.json();

    // 1. Bulk Re-order Support (if items array is provided)
    if (Array.isArray(body.items)) {
      const updatePromises = body.items.map((item: { id: string; displayOrder: number }) =>
        db.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      );
      await Promise.all(updatePromises);
      return NextResponse.json({ success: true, message: 'Categories re-ordered successfully' });
    }

    // 2. Single Category / Subcategory Edit
    const { id, name, description, icon, parentId, displayOrder } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
    }

    const existingCat = await db.category.findUnique({ where: { id } });
    if (!existingCat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Update slug only if name changed
    let slug = existingCat.slug;
    if (name !== existingCat.name) {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      slug = baseSlug;
      const slugConflict = await db.category.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugConflict) {
        slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        icon: icon || existingCat.icon,
        parentId: parentId !== undefined ? (parentId || null) : existingCat.parentId,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : existingCat.displayOrder,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: true,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const authCheck = requireRole(session, ['ADMIN']);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await db.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { listings: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.listings > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${category.name}" because it contains ${category._count.listings} active listing(s). Please reassign or delete listings first.` },
        { status: 400 }
      );
    }

    for (const child of category.children) {
      const childListings = await db.listing.count({ where: { categoryId: child.id } });
      if (childListings > 0) {
        return NextResponse.json(
          { error: `Cannot delete parent category "${category.name}" because subcategory "${child.name}" has ${childListings} active listing(s).` },
          { status: 400 }
        );
      }
    }

    await db.category.deleteMany({ where: { parentId: id } });
    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
